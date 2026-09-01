import { cors } from "hono/cors";
import { env } from "../../config/env";

export const corsMiddleware = cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:5173",
    env.FRONTEND_URL ?? "",
    env.ADMIN_FRONTEND_URL ?? "",
  ].filter(Boolean),
  credentials: true,
  allowMethods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ],
  allowHeaders: [
    "Content-Type",
    "Authorization",
  ],
});
