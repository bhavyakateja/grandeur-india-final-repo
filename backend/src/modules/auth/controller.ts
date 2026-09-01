import type { Context } from "hono";
import { getCookie } from "hono/cookie";

import * as authService from "./service";
import { loginSchema, signupSchema } from "./schema";

import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from "../../shared/cookie";

function requestMeta(c: Context) {
  return {
    userAgent: c.req.header("User-Agent"),
    ipAddress:
      c.req
        .header("X-Forwarded-For")
        ?.split(",")[0]
        ?.trim() ??
      c.req.header("X-Real-IP"),
  };
}

export async function signup(c: Context) {
  const data = signupSchema.parse(await c.req.json());

  const response = await authService.signup(
    data,
    requestMeta(c),
  );

  setRefreshTokenCookie(
    c,
    response.tokens.refreshToken,
  );

  return c.json(
    {
      user: response.user,
      accessToken: response.tokens.accessToken,
    },
    201,
  );
}

export async function login(c: Context) {
  const data = loginSchema.parse(await c.req.json());

  const response = await authService.login(
    data,
    requestMeta(c),
  );

  setRefreshTokenCookie(
    c,
    response.tokens.refreshToken,
  );

  return c.json({
    user: response.user,
    accessToken: response.tokens.accessToken,
  });
}

export async function refresh(c: Context) {
  const refreshToken = getCookie(c, "refreshToken");

  if (!refreshToken) {
    return c.json(
      {
        success: false,
        message: "Refresh token is missing",
      },
      401,
    );
  }

  const response = await authService.refresh(
    refreshToken,
    requestMeta(c),
  );

  setRefreshTokenCookie(
    c,
    response.tokens.refreshToken,
  );

  return c.json({
    user: response.user,
    accessToken: response.tokens.accessToken,
  });
}

export async function logout(c: Context) {
  const refreshToken = getCookie(c, "refreshToken");

  await authService.logout(refreshToken);

  clearRefreshTokenCookie(c);

  return c.json({
    success: true,
    message: "Logged out successfully",
  });
}

export async function me(c: Context) {
  const user = c.get("user");

  const profile = await authService.me(user.id);

  return c.json(profile);
}

export { default as authRouter } from "./routes";