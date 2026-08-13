import type { Context, Next } from "hono";
import xss from "xss";

function clean(value: unknown): unknown {
  if (typeof value === "string") return xss(value);

  if (Array.isArray(value)) {
    return value.map(clean);
  }

  if (value && typeof value === "object") {
    const obj: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(value)) {
      obj[k] = clean(v);
    }

    return obj;
  }

  return value;
}

export async function sanitizeMiddleware(
  c: Context,
  next: Next
) {
  if (
    c.req.header("content-type")?.includes("application/json")
  ) {
    const body = await c.req.json().catch(() => null);

    if (body) {
      c.set("sanitizedBody", clean(body));
    }
  }

  await next();
}