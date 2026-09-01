import { createMiddleware } from "hono/factory";
import type { AppVariables } from "../types/hono";

const MAX_IDENTIFIER_LENGTH = 128;
const IDENTIFIER_PATTERN = /^[a-zA-Z0-9._-]+$/;

function getTrustedIdentifier(
  value: string | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value.length > MAX_IDENTIFIER_LENGTH) {
    return undefined;
  }

  if (!IDENTIFIER_PATTERN.test(value)) {
    return undefined;
  }

  return value;
}

export const requestId = createMiddleware<{
  Variables: AppVariables;
}>(async (c, next) => {
  const incomingRequestId = getTrustedIdentifier(
    c.req.header("x-request-id"),
  );

  const incomingCorrelationId = getTrustedIdentifier(
    c.req.header("x-correlation-id"),
  );

  const requestIdValue =
    incomingRequestId ?? crypto.randomUUID();

  const correlationId =
    incomingCorrelationId ?? requestIdValue;

  c.set("requestId", requestIdValue);
  c.set("correlationId", correlationId);

  c.header("x-request-id", requestIdValue);
  c.header("x-correlation-id", correlationId);

  await next();
});