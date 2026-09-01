import type { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { env } from "../config/env";

const REFRESH_COOKIE = "refreshToken";
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

export function setRefreshTokenCookie(
  c: Context,
  token: string,
): void {
  setCookie(c, REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/api/v1/auth",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export function clearRefreshTokenCookie(c: Context): void {
  deleteCookie(c, REFRESH_COOKIE, {
    path: "/api/v1/auth",
  });
}