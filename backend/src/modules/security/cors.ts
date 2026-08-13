import { cors } from "hono/cors";

export const corsMiddleware = cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:5173",
    process.env.FRONTEND_URL ?? "",
    process.env.ADMIN_FRONTEND_URL ?? "",
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
