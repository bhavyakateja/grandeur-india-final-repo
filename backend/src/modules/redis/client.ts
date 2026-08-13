import Redis from "ioredis";
import { logger } from "../logger";

export const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT ?? 6379),
    password:
        process.env.REDIS_PASSWORD || undefined,

    maxRetriesPerRequest: null,

    lazyConnect: true,
});

redis.on("connect", () => {
    logger.info("Redis Connected");
});

redis.on("error", (err) => {
    logger.error({ error: err }, "Redis connection error");
});
