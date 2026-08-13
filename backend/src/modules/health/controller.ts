import { Hono } from "hono";
import * as service from "./service";

export const healthController = new Hono();

healthController.get("/health", async (c) => {
  const health = await service.readiness();
  return c.json(health, health.status === "healthy" ? 200 : 503);
});

healthController.get("/ready", async (c) => {
  const health = await service.readiness();
  return c.json(health, health.status === "healthy" ? 200 : 503);
});

healthController.get("/live", (c) => c.json(service.liveness()));
