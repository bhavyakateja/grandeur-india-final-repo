import { Hono } from "hono";
import { Scalar } from "@scalar/hono-api-reference";
import { openApiDocument } from "./openapi";

export const swaggerRouter = new Hono();

swaggerRouter.get("/openapi.json", (c) => c.json(openApiDocument));
swaggerRouter.get("/docs", Scalar({
  url: "/openapi.json",
  pageTitle: "grandeur India API Reference",
}));
