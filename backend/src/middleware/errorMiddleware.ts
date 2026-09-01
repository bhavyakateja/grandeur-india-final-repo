import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import type { Context } from "hono";
import { AppError } from "../exceptions/AppError";
import { logger } from "../config/logger";

export const errorHandler = (err: Error, c: Context) => {
  logger.error(
    {
      requestId: c.get("requestId"),
      correlationId: c.get("correlationId"),
      err,
      method: c.req.method,
      path: c.req.path,
    },
    "Request failed",
  );

  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        message: err.message,
      },
      err.statusCode as any,
    );
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        message: "Validation failed",
        errors: err.issues,
      },
      400,
    );
  }

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return c.json(
    {
      success: false,
      message: "Internal Server Error",
    },
    500,
  );
};