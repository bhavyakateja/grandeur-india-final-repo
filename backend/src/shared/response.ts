import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export function successResponse<T>(
  c: Context,
  data: T,
  message = "Success",
  status: ContentfulStatusCode = 200,
) {
  return c.json(
    {
      success: true,
      message,
      data,
    },
    status,
  );
}