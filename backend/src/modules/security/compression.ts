import type { MiddlewareHandler } from "hono";

export const compressionMiddleware: MiddlewareHandler = async (
  _c,
  next
) => {
  await next();
};