import type { Context } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";

import { env } from "../config/env";

const isProduction = env.NODE_ENV === "production";

const REFRESH_COOKIE = "refreshToken";

export function setRefreshTokenCookie(
  c: Context,
  token: string
) {
  setCookie(c, REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "Lax",
    path: "/api/v1/auth",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearRefreshTokenCookie(c: Context) {
  deleteCookie(c, REFRESH_COOKIE, {
    path: "/api/v1/auth",
  });
}