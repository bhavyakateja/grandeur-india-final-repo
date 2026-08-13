import { createMiddleware } from "hono/factory";
import { httpRequestDurationSeconds, httpRequestsTotal } from "./metrics";

const normalizeRoute = (route: string): string => route
  .replace(/\/[0-9]+(?=\/|$)/g, "/:id")
  .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}(?=\/|$)/gi, "/:id");

const getErrorStatus = (value: unknown): number | undefined => {
  if (value === null || typeof value !== "object" || !("statusCode" in value)) {
    return undefined;
  }

  const statusCode = value.statusCode;
  return typeof statusCode === "number" && Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 599
    ? statusCode
    : undefined;
};

export const metricsMiddleware = createMiddleware(async (c, next) => {
  const startedAt = performance.now();
  let thrownError: unknown;

  try {
    await next();
  } catch (error) {
    thrownError = error;
    throw error;
  } finally {
    // Route templates bound cardinality; raw request paths would create one series per ID.
    const route = normalizeRoute(c.req.routePath || c.req.path);
    const status = getErrorStatus(thrownError) ?? c.res.status;
    const labels = { method: c.req.method, route, status: String(status) };
    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, (performance.now() - startedAt) / 1000);
  }
});
