import { createMiddleware } from "hono/factory";
import type { Role } from "../generated/prisma/enums";
import type { AppVariables } from "../types/hono";
import { UnauthorizedException } from "../exceptions/UnauthorizedException";

export function roleMiddleware(...roles: Role[]) {
  return createMiddleware<{
    Variables: AppVariables;
  }>(async (c, next) => {
    const user = c.get("user");

    if (!user) {
      throw new UnauthorizedException("Authentication required");
    }

    if (!roles.includes(user.role)) {
      throw new UnauthorizedException(
        "You are not authorized to access this resource",
      );
    }

    await next();
  });
}