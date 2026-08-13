import type { Context, Next } from "hono";

export async function securityHeaders(
  c: Context,
  next: Next
) {
  await next();

  c.header("X-Frame-Options", "DENY");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "strict-origin");
  c.header("Permissions-Policy", "geolocation=()");
}