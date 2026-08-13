import type { User } from "../../generated/prisma/client";
import type { AuthResponse, JwtPayload } from "./types";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../../shared/jwt";

export function buildJwtPayload(user: User): JwtPayload {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
}

export async function buildAuthResponse(
  user: User
): Promise<AuthResponse> {
  const payload = buildJwtPayload(user);

  const accessToken = await generateAccessToken(payload);

  const refreshToken = await generateRefreshToken(payload);

  const { password, ...safeUser } = user;

  return {
    user: safeUser,
    tokens: {
      accessToken,
      refreshToken,
    },
  };
}