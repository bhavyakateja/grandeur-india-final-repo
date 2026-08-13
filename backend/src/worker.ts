// Run this process independently from the HTTP API in production.
import { workers } from "./modules/queue/workers";
import { createLogger } from "./modules/logger";

const workerLogger = createLogger({ component: "worker" });
let shuttingDown = false;

const shutdown = async (signal: string): Promise<void> => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  workerLogger.info({ signal }, "Worker shutdown started");
  await Promise.all(workers.map((worker) => worker.close()));
  workerLogger.info({ signal }, "Worker shutdown completed");
};

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

workerLogger.info({ queues: workers.map((worker) => worker.name) }, "Queue worker process started");
