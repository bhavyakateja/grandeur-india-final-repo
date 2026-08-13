import { redis } from "./client";
import { logger } from "../../config/logger";
import { cacheOperationDurationSeconds, cacheOperationsTotal } from "../metrics";

const cacheNamespace = process.env.CACHE_NAMESPACE ?? "ecommerce";
const cacheVersion = process.env.CACHE_VERSION ?? "v1";
const cachePrefix = `${cacheNamespace}:${cacheVersion}:`;

const observeCacheOperation = (operation: string, startedAt: number, result: "hit" | "miss" | "success" | "error") => {
    cacheOperationsTotal.inc({ operation, result });
    cacheOperationDurationSeconds.observe({ operation }, (performance.now() - startedAt) / 1_000);
};

export const getCacheKey = (key: string): string => `${cachePrefix}${key}`;

const getCachePattern = (pattern: string): string => `${cachePrefix}${pattern}`;

export async function get<T>(
    key: string
) {
    const startedAt = performance.now();
    const cacheKey = getCacheKey(key);
    let value: string | null;
    try {
        value = await redis.get(cacheKey);
    } catch (error) {
        logger.warn({ error, key: cacheKey }, "Redis read failed; bypassing cache");
        observeCacheOperation("get", startedAt, "error");
        return null;
    }

    if (!value) {
        observeCacheOperation("get", startedAt, "miss");
        return null;
    }

    try {
        const parsed = JSON.parse(value) as T;
        observeCacheOperation("get", startedAt, "hit");
        return parsed;
    } catch (error) {
        logger.warn({ error, key }, "Redis cached value could not be parsed");
        observeCacheOperation("get", startedAt, "error");
        return null;
    }
}

export async function set(
    key: string,
    value: unknown,
    ttl = 300
) {
    const startedAt = performance.now();
    const cacheKey = getCacheKey(key);
    try {
        await redis.set(cacheKey, JSON.stringify(value), "EX", ttl);
        observeCacheOperation("set", startedAt, "success");
    } catch (error) {
        logger.warn({ error, key: cacheKey }, "Redis write failed; bypassing cache");
        observeCacheOperation("set", startedAt, "error");
    }
}

export async function remove(
    key: string
) {
    const startedAt = performance.now();
    const cacheKey = getCacheKey(key);
    try {
        await redis.unlink(cacheKey);
        observeCacheOperation("remove", startedAt, "success");
    } catch (error) {
        logger.warn({ error, key: cacheKey }, "Redis invalidation failed");
        observeCacheOperation("remove", startedAt, "error");
    }
}

export async function exists(
    key: string
) {
    const startedAt = performance.now();
    const cacheKey = getCacheKey(key);
    try {
        const result = await redis.exists(cacheKey);
        observeCacheOperation("exists", startedAt, result > 0 ? "hit" : "miss");
        return result;
    } catch (error) {
        logger.warn({ error, key: cacheKey }, "Redis availability check failed");
        observeCacheOperation("exists", startedAt, "error");
        return 0;
    }
}

export async function clearPattern(
    pattern: string
) {
    const startedAt = performance.now();
    const cachePattern = getCachePattern(pattern);
    let invalidatedKeys = 0;
    try {
        let cursor = "0";
        do {
            const [nextCursor, keys] = await redis.scan(cursor, "MATCH", cachePattern, "COUNT", 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                invalidatedKeys += await redis.unlink(...keys);
            }
        } while (cursor !== "0");
        observeCacheOperation("clear_pattern", startedAt, "success");
        logger.debug({ pattern: cachePattern, invalidatedKeys }, "Redis cache pattern invalidated");
        return invalidatedKeys;
    } catch (error) {
        logger.warn({ error, pattern: cachePattern }, "Redis pattern invalidation failed");
        observeCacheOperation("clear_pattern", startedAt, "error");
        return 0;
    }
}
