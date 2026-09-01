import Redis from "ioredis";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

export const redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,

    maxRetriesPerRequest: 3,

    lazyConnect: true,
});

redis.on("connect", () => {
    logger.info("Redis connected");
});

redis.on("error", (err) => {
    logger.error({ error: err }, "Redis connection error");
});
