import { Hono } from "hono";
import { registry } from "./registry";

export const metricsRouter = new Hono();

metricsRouter.get("/", async (c) => {
  c.header("Content-Type", registry.contentType);
  return c.body(await registry.metrics());
});
