import { createMiddleware } from "hono/factory";

import { verifyAccessToken } from "../shared/jwt";
import { UnauthorizedException } from "../exceptions/UnauthorizedException";

import type { AppVariables } from "../types/hono";

export const authMiddleware = createMiddleware<{
  Variables: AppVariables;
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    throw new UnauthorizedException("Authorization header is missing");
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedException("Invalid authorization header");
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verifyAccessToken(token);

    c.set("user", {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    await next();
  } catch {
    throw new UnauthorizedException("Invalid or expired token");
  }
});