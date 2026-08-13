import { serve } from "@hono/node-server";
import app from "./app";
import { logger } from "./modules/logger";

serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT) || 3000,
  },
  (info) => {
    logger.info({ port: info.port }, "HTTP server started");
  }
);
