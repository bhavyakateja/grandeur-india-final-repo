import pino, { type Logger, type LoggerOptions } from "pino";

const isDevelopment = process.env.NODE_ENV === "development";
const level = process.env.LOG_LEVEL ?? (isDevelopment ? "debug" : "info");

const options: LoggerOptions = {
  level,
  base: {
    service: "ecommerce-backend",
    environment: process.env.NODE_ENV ?? "development",
  },
  redact: {
    censor: "[REDACTED]",
    paths: [
      "password",
      "confirmPassword",
      "currentPassword",
      "newPassword",
      "token",
      "accessToken",
      "refreshToken",
      "authorization",
      "headers.authorization",
      "headers.cookie",
      "cookie",
      "apiKey",
      "apiSecret",
      "secret",
      "card.number",
      "card.cvv",
      "*.password",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "*.authorization",
      "*.secret",
    ],
  },
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
};

if (isDevelopment) {
  options.transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      singleLine: true,
      translateTime: "SYS:standard",
    },
  };
}

export const logger: Logger = pino(options);

export const createLogger = (bindings: Record<string, string | number | boolean | undefined>): Logger =>
  logger.child(bindings);
