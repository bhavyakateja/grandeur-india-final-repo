import { Hono } from "hono";

import * as controller from "./controller";

import { authMiddleware } from "../../middleware/authMiddleware";
import { roleMiddleware } from "../../middleware/roleMiddleware";
import { cache, CacheKeys } from "../redis";

const router = new Hono();

router.get("/", cache((c) => {
  const query = new URL(c.req.url).searchParams;
  const page = Number(query.get("page") ?? 1);
  const limit = Number(query.get("limit") ?? 20);
  return CacheKeys.products(page, limit, [...query.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("&"));
}), controller.getAll);

router.get("/:id", cache((c) => CacheKeys.product(c.req.param("id") ?? "")), controller.getById);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  controller.create
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  controller.update
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  controller.remove
);

export default router;
