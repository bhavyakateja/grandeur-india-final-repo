import type { User } from "../../generated/prisma/client";

import * as authRepository from "./repository";

import { ConflictException } from "../../exceptions/ConflictException";
import { UnauthorizedException } from "../../exceptions/UnauthorizedException";
import { NotFoundException } from "../../exceptions/NotFoundException";

import { hashPassword, verifyPassword } from "../../shared/password";
import { sha256 } from "../../shared/hash";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../shared/jwt";

import { logger } from "../../config/logger";

import type {
  AuthResponse,
  AuthUser,
  JwtPayload,
  TokenPair,
} from "./types";

import type {
  LoginInput,
  SignupInput,
} from "./schema";

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
};

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    isVerified: user.isVerified,
    isActive: user.isActive,
  };
}

function buildJwtPayload(
  user: User,
): JwtPayload {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
}

async function issueTokenPair(
  user: User,
  meta?: RequestMeta,
): Promise<TokenPair> {
  const payload = buildJwtPayload(user);

  const [accessToken, refreshToken] =
    await Promise.all([
      generateAccessToken(payload),
      generateRefreshToken(payload),
    ]);

  await authRepository.saveRefreshToken(
    user.id,
    sha256(refreshToken),
    meta?.userAgent,
    meta?.ipAddress,
  );

  return {
    accessToken,
    refreshToken,
  };
}

async function authenticate(
  data: LoginInput,
  meta?: RequestMeta,
): Promise<AuthResponse> {
  const user =
    await authRepository.findByEmail(data.email);

  if (!user) {
    throw new UnauthorizedException(
      "Invalid email or password",
    );
  }

  const valid = await verifyPassword(
    user.password,
    data.password,
  );

  if (!valid) {
    throw new UnauthorizedException(
      "Invalid email or password",
    );
  }

  if (!user.isActive) {
    throw new UnauthorizedException(
      "Account has been deactivated",
    );
  }

  await authRepository.updateLastLogin(user.id);

  const tokens = await issueTokenPair(
    user,
    meta,
  );

  logger.info(
    {
      userId: user.id,
      role: user.role,
    },
    "User logged in",
  );

  return {
    user: toAuthUser(user),
    tokens,
  };
}

export async function signup(
  data: SignupInput,
  meta?: RequestMeta,
): Promise<AuthResponse> {
  const existingUser =
    await authRepository.findByEmail(data.email);

  if (existingUser) {
    throw new ConflictException(
      "Email already exists",
    );
  }

  const hashedPassword =
    await hashPassword(data.password);

  const user =
    await authRepository.createUser({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: "USER",
    });

  const tokens = await issueTokenPair(
    user,
    meta,
  );

  logger.info(
    {
      userId: user.id,
    },
    "User registered",
  );

  return {
    user: toAuthUser(user),
    tokens,
  };
}

export function login(
  data: LoginInput,
  meta?: RequestMeta,
) {
  return authenticate(data, meta);
}

export async function refresh(
  refreshToken: string,
  meta?: RequestMeta,
) {
  let payload: JwtPayload;

  try {
    payload =
      await verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedException(
      "Invalid or expired refresh token",
    );
  }

  const tokenHash = sha256(refreshToken);

  const storedToken =
    await authRepository.findRefreshToken(
      tokenHash,
    );

  if (
    !storedToken ||
    storedToken.revokedAt ||
    storedToken.expiresAt <= new Date()
  ) {
    throw new UnauthorizedException(
      "Refresh token is invalid or expired",
    );
  }

  const user =
    await authRepository.findById(
      payload.userId,
    );

  if (!user || !user.isActive) {
    throw new UnauthorizedException(
      "User account is unavailable",
    );
  }

  await authRepository.revokeRefreshToken(
    tokenHash,
  );

  const tokens = await issueTokenPair(
    user,
    meta,
  );

  return {
    user: toAuthUser(user),
    tokens,
  };
}

export async function logout(
  refreshToken?: string,
) {
  if (!refreshToken) {
    return;
  }

  try {
    await authRepository.revokeRefreshToken(
      sha256(refreshToken),
    );
  } catch {
    // Logout is intentionally idempotent.
  }
}

export async function me(userId: string) {
  const user =
    await authRepository.getProfile(userId);

  if (!user) {
    throw new NotFoundException(
      "User not found",
    );
  }

  return user;
}