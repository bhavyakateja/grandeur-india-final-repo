import { Hono } from "hono";
import { errorHandler } from "./middleware/errorMiddleware";
import routes from "./routes";
import { loggerMiddleware, requestId } from "./modules/logger";
import {
    metricsRouter
} from "./modules/metrics";
import { metricsMiddleware } from "./modules/metrics";
import { healthRouter } from "./modules/health";
import { swaggerRouter } from "./modules/swagger";
import { queueDashboard } from "./modules/queue";
import {
  corsMiddleware,
  compressionMiddleware,
  helmetMiddleware,
  securityHeaders,
  sanitizeMiddleware,
} from "./modules/security";

const app = new Hono();

app.onError(errorHandler);

app.use("*", requestId);
app.use("*", loggerMiddleware);
app.use("*", metricsMiddleware);
app.use("*", corsMiddleware);

app.use("*", compressionMiddleware);

app.use("*", securityHeaders);

app.use("*", sanitizeMiddleware);

app.route("/", healthRouter);
app.route("/", swaggerRouter);

app.route(
    "/metrics",
    metricsRouter
);

app.route("/api/v1", routes);

app.route(
    "/admin/queues",
    queueDashboard.registerPlugin()
);

export default app;
