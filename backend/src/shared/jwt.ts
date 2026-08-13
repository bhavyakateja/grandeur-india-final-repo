import { SignJWT, jwtVerify, type JWTPayload } from "jose";

import { env } from "../config/env";
import type { JwtPayload } from "../modules/auth/types";

const accessSecret = new TextEncoder().encode(env.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export async function generateAccessToken(
  payload: JwtPayload
): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(accessSecret);
}

export async function generateRefreshToken(
  payload: JwtPayload
): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(refreshSecret);
}

export async function verifyAccessToken(
  token: string
): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, accessSecret);

  return payload as JWTPayload & JwtPayload;
}

export async function verifyRefreshToken(
  token: string
): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, refreshSecret);

  return payload as JWTPayload & JwtPayload;
}