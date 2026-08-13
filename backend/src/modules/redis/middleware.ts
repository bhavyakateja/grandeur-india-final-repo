import type { Context, Next } from "hono";

import * as cacheService from "./service";

function cacheMiddleware(
    keyGenerator: (c: Context) => string,
    ttl = 300
) {
    return async (
        c: Context,
        next: Next
    ) => {

        if (c.req.method !== "GET") {
            return next();
        }

        const key =
            keyGenerator(c);

        const cached =
            await cacheService.get(key);

        if (cached !== null) {
            return c.json(cached);
        }

        await next();

        const contentType = c.res.headers.get("content-type") ?? "";
        const cacheControl = c.res.headers.get("cache-control") ?? "";

        if (c.res.ok && contentType.includes("application/json") && !cacheControl.includes("no-store")) {
            try {
                const data = await c.res.clone().json() as unknown;

                await cacheService.set(
                    key,
                    data,
                    ttl
                );
            } catch {
                // A response can be labelled JSON but contain an empty or malformed body.
                // Skipping cache population keeps the API response unaffected.
            }

        }
    };
}

// A callable cache middleware with invalidation methods for write-side services.
export const cache = Object.assign(cacheMiddleware, cacheService);
