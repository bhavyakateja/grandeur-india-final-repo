import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export function successResponse<T>(
  c: Context,
  data: T,
  message = "Success",
  status = 200
) {
  return c.json(
    {
      success: true,
      message,
      data,
    },
    status as ContentfulStatusCode
  );
}

export function errorResponse(
  c: Context,
  message: string,
  status = 500
) {
  return c.json(
    {
      success: false,
      message,
    },
    status as ContentfulStatusCode
  );
}
