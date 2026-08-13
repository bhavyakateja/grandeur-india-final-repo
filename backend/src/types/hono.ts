import type { Role } from "../generated/prisma/enums";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export type AppVariables = {
  user: AuthUser;
  requestId: string;
  correlationId: string;
};

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
    requestId: string;
    correlationId: string;
  }
}