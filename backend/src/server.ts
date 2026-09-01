import { serve } from "@hono/node-server";
import app from "./app";
import { logger } from "./config/logger";
import { env } from "./config/env";

serve(
  {
    fetch: app.fetch,
    port: Number(env.PORT)
  },
  (info) => {
    logger.info({ port: info.port }, "HTTP server started");
  }
);
