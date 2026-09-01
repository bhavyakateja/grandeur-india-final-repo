import { createMiddleware } from "hono/factory";
import type { AppVariables } from "../types/hono";
import { logger } from "../config/logger";

export const requestLogger = createMiddleware<{
  Variables: AppVariables;
}>(async (c, next) => {
  const startedAt = performance.now();

  try {
    await next();
  } finally {
    const durationMs = Math.round(
      performance.now() - startedAt,
    );

    const user = c.get("user");

    const logData = {
      requestId: c.get("requestId"),
      correlationId: c.get("correlationId"),
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs,
      user: user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
          }
        : undefined,
    };

    if (c.res.status >= 500) {
      logger.error(logData, "HTTP request failed");
    } else {
      logger.info(logData, "HTTP request completed");
    }
  }
});