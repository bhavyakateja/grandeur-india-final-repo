import * as authRepository from "./repository";
import { ConflictException } from "../../exceptions/ConflictException";
import { UnauthorizedException } from "../../exceptions/UnauthorizedException";
import { NotFoundException } from "../../exceptions/NotFoundException";
import { hashPassword, verifyPassword } from "../../shared/password";
import { sha256 } from "../../shared/hash";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../shared/jwt";
import { buildJwtPayload } from "./utils";
import { logger } from "../logger";
import { usersRegistered } from "../metrics";

import type { LoginInput, SignupInput } from "./schema";
import type { AuthResponse, AuthUser, TokenPair } from "./types";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function toAuthUser(user: any): AuthUser {
  const { password: _password, ...safeUser } = user;
  return safeUser as AuthUser;
}

async function issueTokenPair(user: any, meta?: { userAgent?: string; ipAddress?: string }): Promise<TokenPair> {
  const payload = buildJwtPayload(user);
  const accessToken = await generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(payload);

  await authRepository.saveRefreshToken(
    user.id,
    sha256(refreshToken),
    meta?.userAgent,
    meta?.ipAddress,
  );

  return { accessToken, refreshToken };
}

async function authenticate(data: LoginInput, meta?: { userAgent?: string; ipAddress?: string }) {
  const user = await authRepository.findByEmail(data.email);

  if (!user) {
    throw new UnauthorizedException("Invalid email or password");
  }

  const isPasswordValid = await verifyPassword(user.password, data.password);

  if (!isPasswordValid) {
    throw new UnauthorizedException("Invalid email or password");
  }

  if (!user.isActive) {
    throw new UnauthorizedException("Account has been deactivated");
  }

  await authRepository.updateLastLogin(user.id);
  const tokens = await issueTokenPair(user, meta);
  logger.info({ email: user.email, role: user.role }, "User Login");

  return { user: toAuthUser(user), tokens };
}

export async function signup(data: SignupInput, meta?: { userAgent?: string; ipAddress?: string }): Promise<AuthResponse> {
  const existingUser = await authRepository.findByEmail(data.email);

  if (existingUser) {
    throw new ConflictException("Email already exists");
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await authRepository.createUser({
    name: data.name,
    email: data.email,
    password: hashedPassword,
  });

  const tokens = await issueTokenPair(user, meta);
  logger.info({ email: user.email }, "User Registered");
  usersRegistered.inc();

  return { user: toAuthUser(user), tokens };
}

export async function login(data: LoginInput, meta?: { userAgent?: string; ipAddress?: string }): Promise<AuthResponse> {
  return authenticate(data, meta);
}

export async function refresh(refreshToken: string, meta?: { userAgent?: string; ipAddress?: string }) {
  let payload;

  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedException("Invalid or expired refresh token");
  }

  const storedToken = await authRepository.findRefreshToken(sha256(refreshToken));

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt <= new Date()) {
    throw new UnauthorizedException("Refresh token is invalid or expired");
  }

  const user = await authRepository.findById(payload.userId);

  if (!user || !user.isActive) {
    throw new UnauthorizedException("User account is unavailable");
  }

  await authRepository.revokeRefreshToken(storedToken.tokenHash);
  const tokens = await issueTokenPair(user, meta);

  return { user: toAuthUser(user), tokens };
}

export async function logout(refreshToken?: string) {
  if (!refreshToken) return;

  try {
    await authRepository.revokeRefreshToken(sha256(refreshToken));
  } catch {
    // Logout remains idempotent even when the token is already revoked/expired.
  }
}

export async function me(userId: string) {
  const user = await authRepository.getProfile(userId);

  if (!user) {
    throw new NotFoundException("User not found");
  }

  return user;
}
