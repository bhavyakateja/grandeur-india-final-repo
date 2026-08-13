import cloudinary from "../../config/cloudinary";
import Redis from "ioredis";
import { createLogger } from "../logger";
import { getEmailQueue } from "../queue/queues";
import * as repository from "./repository";
import type { DependencyHealth, DependencyName, HealthResponse, LivenessResponse } from "./types";

const healthLogger = createLogger({ component: "health" });
const configuredTimeoutMs = Number(process.env.HEALTH_CHECK_TIMEOUT_MS ?? 2_000);
const timeoutMs = Number.isSafeInteger(configuredTimeoutMs) && configuredTimeoutMs > 0
  ? configuredTimeoutMs
  : 2_000;

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
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT ?? 6_379),
    password: process.env.REDIS_PASSWORD || undefined,
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
      await cloudinary.api.ping();
    }),
  ]);
  const bullmq = redisHealth.status === "healthy"
    ? await checkDependency("bullmq", async () => {
        const queue = getEmailQueue();
        await queue.waitUntilReady();
        await queue.getJobCounts("waiting", "active", "delayed");
      })
    : { status: "unhealthy" as const, latencyMs: 0 };

  const checks = { postgresql, redis: redisHealth, bullmq, cloudinary: cloudinaryHealth };
  const isHealthy = Object.values(checks).every((check) => check.status === "healthy");

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
