import cloudinary from "../../config/cloudinary";
import Redis from "ioredis";
import { env } from "../../config/env";
import { createLogger } from "../../config/logger";
import * as repository from "./repository";
import type { DependencyHealth, DependencyName, HealthResponse, LivenessResponse } from "./types";

const healthLogger = createLogger({ component: "health" });
const timeoutMs = env.HEALTH_CHECK_TIMEOUT_MS;

const withTimeout = async <T>(operation: Promise<T>, dependency: DependencyName): Promise<T> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${dependency} health check timed out`)), timeoutMs);
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};

const checkDependency = async (
  dependency: DependencyName,
  operation: () => Promise<unknown>,
): Promise<DependencyHealth> => {
  const startedAt = performance.now();

  try {
    await withTimeout(operation(), dependency);
    return { status: "healthy", latencyMs: Math.round(performance.now() - startedAt) };
  } catch (error) {
    healthLogger.warn({ dependency, error }, "Dependency health check failed");
    return { status: "unhealthy", latencyMs: Math.round(performance.now() - startedAt) };
  }
};

const checkRedis = async (): Promise<void> => {
  const client = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 0,
    connectTimeout: timeoutMs,
    retryStrategy: () => null,
  });
  client.on("error", () => undefined);

  try {
    await client.connect();
    await client.ping();
  } finally {
    client.disconnect();
  }
};

export async function readiness(): Promise<HealthResponse> {
  const [postgresql, redisHealth, cloudinaryHealth] = await Promise.all([
    checkDependency("postgresql", repository.checkPostgreSql),
    checkDependency("redis", checkRedis),
    checkDependency("cloudinary", async () => {
      try {
        await cloudinary.api.ping();
      } catch (err) {
        if (env.NODE_ENV !== "production") {
          return;
        }
        throw err;
      }
    }),
  ]);

  const checks = {
    postgresql,
    redis: redisHealth,
    cloudinary: cloudinaryHealth,
  };
  const isHealthy = Object.entries(checks).every(([name, check]) => {
    if (name === "cloudinary" && env.NODE_ENV !== "production") return true;
    return check.status === "healthy";
  });

  return {
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    checks,
  };
}

export function liveness(): LivenessResponse {
  return {
    status: "healthy",
    timestamp: new Date().toISOString(),
  };
}
