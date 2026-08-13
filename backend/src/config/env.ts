import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    PORT: z.string(),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(8),
    JWT_REFRESH_SECRET: z.string().min(8),
    FRONTEND_URL: z.string().url().optional(),
    ADMIN_FRONTEND_URL: z.string().url().optional(),
    NODE_ENV: z.enum([
      "development",
      "production",
      "test",
    ]),
    CLOUDINARY_CLOUD_NAME: z.string(),
    CLOUDINARY_API_KEY: z.string(),
    CLOUDINARY_API_SECRET: z.string(),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
    LOG_REQUEST_BODY: z.enum(["true", "false"]).default("false"),
    LOG_REQUEST_BODY_MAX_BYTES: z.coerce.number().int().positive().max(65_536).default(4_096),
    CACHE_NAMESPACE: z.string().min(1).max(64).default("ecommerce"),
    CACHE_VERSION: z.string().min(1).max(64).default("v1"),
    QUEUE_ATTEMPTS: z.coerce.number().int().positive().max(10).default(3),
    QUEUE_RETRY_DELAY_MS: z.coerce.number().int().positive().max(60_000).default(1_000),
    HEALTH_CHECK_TIMEOUT_MS: z.coerce.number().int().positive().max(30_000).default(2_000),
  },

  runtimeEnv: process.env,
});
