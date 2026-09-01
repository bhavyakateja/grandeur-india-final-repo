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

    RAZORPAY_KEY_ID: z.string().min(1),
    RAZORPAY_KEY_SECRET: z.string().min(1),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(1),

    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),

    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z.string().email(),
    RESEND_ADMIN_EMAIL: z.string().email(),

    // ─── Redis ───────────────────────────────────────────────
    REDIS_HOST: z.string().min(1).default("localhost"),
    REDIS_PORT: z.coerce.number().int().positive().max(65535).default(6379),
    REDIS_PASSWORD: z.string().optional(),

    // ─── Logging ─────────────────────────────────────────────
    LOG_LEVEL: z
      .enum([
        "fatal",
        "error",
        "warn",
        "info",
        "debug",
        "trace",
        "silent",
      ])
      .default("info"),

    LOG_REQUEST_BODY: z
      .enum(["true", "false"])
      .default("false"),

    LOG_REQUEST_BODY_MAX_BYTES: z
      .coerce
      .number()
      .int()
      .positive()
      .max(65_536)
      .default(4_096),

    // ─── Cache ───────────────────────────────────────────────
    CACHE_NAMESPACE: z
      .string()
      .min(1)
      .max(64)
      .default("ecommerce"),

    CACHE_VERSION: z
      .string()
      .min(1)
      .max(64)
      .default("v1"),

    // ─── Health checks ───────────────────────────────────────
    HEALTH_CHECK_TIMEOUT_MS: z
      .coerce
      .number()
      .int()
      .positive()
      .max(30_000)
      .default(2_000),
  },

  runtimeEnv: process.env,
});