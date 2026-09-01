import type { JWTPayload } from "jose";
import type { Role } from "../../generated/prisma/enums";

export interface JwtPayload extends JWTPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  isVerified: boolean;
  isActive: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: TokenPair;
}