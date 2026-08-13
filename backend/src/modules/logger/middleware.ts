import { createMiddleware } from "hono/factory";
import { logger } from "./logger";
import type { AppVariables } from "../../types/hono";

const configuredRequestBodyLimit = Number(process.env.LOG_REQUEST_BODY_MAX_BYTES ?? 4_096);
const MAX_REQUEST_BODY_BYTES = Number.isSafeInteger(configuredRequestBodyLimit) && configuredRequestBodyLimit > 0
  ? configuredRequestBodyLimit
  : 4_096;
const shouldLogRequestBody = process.env.LOG_REQUEST_BODY === "true";

const sensitiveFields = new Set([
  "password",
  "confirmpassword",
  "currentpassword",
  "newpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "secret",
  "apikey",
  "apisecret",
  "passwordhash",
  "cookie",
  "cvv",
  "cardnumber",
]);

const sanitizeBody = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitizeBody);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        sensitiveFields.has(key.toLowerCase()) ? "[REDACTED]" : sanitizeBody(nestedValue),
      ]),
    );
  }

  return value;
};

const readRequestBody = async (contentType: string | undefined, request: Request): Promise<unknown> => {
  if (!shouldLogRequestBody || !contentType?.includes("application/json")) {
    return undefined;
  }

  try {
    const body = await request.clone().text();
    if (body.length === 0) {
      return undefined;
    }
    if (body.length > MAX_REQUEST_BODY_BYTES) {
      return { omitted: "body exceeds configured size limit" };
    }

    return sanitizeBody(JSON.parse(body) as unknown);
  } catch {
    return { omitted: "body could not be safely logged" };
  }
};

export const loggerMiddleware = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const startedAt = performance.now();
  const requestBody = readRequestBody(c.req.header("content-type"), c.req.raw);
  await next();
  const durationMs = Math.round(performance.now() - startedAt);
  const user = c.get("user");
  const log = c.res.status >= 500 ? logger.error.bind(logger) : logger.info.bind(logger);

  log({
    requestId: c.get("requestId"),
    correlationId: c.get("correlationId"),
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs,
    requestBody: await requestBody,
    user: user
      ? { id: user.id, email: user.email, role: user.role }
      : undefined,
  }, "HTTP request completed");
});
