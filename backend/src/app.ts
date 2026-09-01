import { Hono } from "hono";
import { errorHandler } from "./middleware/errorMiddleware";
import routes from "./routes";
import { requestId } from "./middleware/requestId";
import { requestLogger } from "./middleware/requestLogger";
import { healthRouter } from "./modules/health";
import { swaggerRouter } from "./modules/swagger";
import {
  corsMiddleware,
  compressionMiddleware,
  securityHeaders,
  sanitizeMiddleware,
} from "./modules/security";

const app = new Hono();

app.onError(errorHandler);

app.use("*", requestId);
app.use("*", requestLogger);
app.use("*", corsMiddleware);

app.use("*", compressionMiddleware);

app.use("*", securityHeaders);

app.use("*", sanitizeMiddleware);

app.route("/", healthRouter);
app.route("/", swaggerRouter);

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

app.get("/uploads/*", (c) => {
  const relPath = c.req.path.replace(/^\/uploads\//, "");
  const fullPath = join(process.cwd(), "public", "uploads", relPath);
  if (!existsSync(fullPath)) {
    return c.notFound();
  }
  const fileData = readFileSync(fullPath);
  const ext = fullPath.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
  };
  return c.body(fileData, 200, {
    "Content-Type": mimeMap[ext || ""] || "application/octet-stream",
    "Cache-Control": "public, max-age=86400",
  });
});

app.route("/api/v1", routes);

export default app;