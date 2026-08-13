import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

import { AppError } from "../exceptions/AppError";
import type { Context } from "hono";
import { logger } from "../modules/logger";

export const errorHandler = (err: Error, c: Context) => {
  logger.error({
    requestId: c.get("requestId"),
    correlationId: c.get("correlationId"),
    error: err,
    method: c.req.method,
    path: c.req.path,
  }, "Request failed");

  if (err instanceof AppError) {
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
      }),
      {
        status: err.statusCode,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  if (err instanceof ZodError) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Validation failed",
        errors: err.issues,
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return new Response(
    JSON.stringify({
      success: false,
      message: "Internal Server Error",
    }),
    {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
