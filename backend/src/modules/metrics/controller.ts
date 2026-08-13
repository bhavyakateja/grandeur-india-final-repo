import { Hono } from "hono";

import { registry } from "./registry";

export const metricsController =
    new Hono();

metricsController.get(
    "/",
    async (c) => {

        c.header(
            "Content-Type",
            registry.contentType
        );

        return c.body(
            await registry.metrics()
        );

    }
);