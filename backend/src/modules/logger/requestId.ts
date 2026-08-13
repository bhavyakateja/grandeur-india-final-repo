import { createMiddleware } from "hono/factory";
import type { AppVariables } from "../../types/hono";

const MAX_IDENTIFIER_LENGTH = 128;
const identifierPattern = /^[a-zA-Z0-9._-]+$/;

const getTrustedIdentifier = (value: string | undefined): string | undefined => {
  if (!value || value.length > MAX_IDENTIFIER_LENGTH || !identifierPattern.test(value)) {
    return undefined;
  }

  return value;
};

export const requestId = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const requestId = getTrustedIdentifier(c.req.header("x-request-id")) ?? crypto.randomUUID();
  const correlationId = getTrustedIdentifier(c.req.header("x-correlation-id")) ?? requestId;

  c.set("requestId", requestId);
  c.set("correlationId", correlationId);
  c.header("x-request-id", requestId);
  c.header("x-correlation-id", correlationId);
  await next();
});
