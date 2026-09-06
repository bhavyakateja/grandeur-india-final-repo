import { Hono } from "hono";
import * as controller from "./controller";

import { authMiddleware } from "../../middleware/authMiddleware";
import { roleMiddleware } from "../../middleware/roleMiddleware";

import {
    cache,
    CacheKeys,
} from "../redis";

const router = new Hono();

/**
 * --------------------------------------------------------------------------
 * Homepage featured products
 * --------------------------------------------------------------------------
 *
 * Cached independently from the complete storefront catalogue.
 *
 * The homepage only needs up to 6 products, so there is no reason to
 * download the complete catalogue just to build the featured section.
 */
router.get(
    "/featured",
    cache(
        () =>
            CacheKeys.productFeatured(),
        600,
    ),
    controller.getFeatured,
);

/**
 * --------------------------------------------------------------------------
 * Storefront catalogue
 * --------------------------------------------------------------------------
 *
 * Cached independently from the paginated/admin products endpoint.
 *
 * The frontend performs:
 * - search
 * - filtering
 * - sorting
 * - pagination
 *
 * locally.
 */
router.get(
    "/catalogue",
    cache(
        () =>
            CacheKeys.productCatalogue(),
        600,
    ),
    controller.getCatalogue,
);

/**
 * --------------------------------------------------------------------------
 * Existing paginated products endpoint
 * --------------------------------------------------------------------------
 *
 * Keep this for:
 * - admin
 * - API consumers
 * - server-side pagination
 * - server-side search/filtering/sorting
 */
router.get(
    "/",
    cache((c) => {
        const query =
            new URL(c.req.url)
                .searchParams;

        const page = Number(
            query.get("page") ?? 1,
        );

        const limit = Number(
            query.get("limit") ?? 20,
        );

        const normalizedQuery =
            [
                ...query.entries(),
            ]
                .sort(
                    ([a], [b]) =>
                        a.localeCompare(b),
                )
                .map(
                    ([key, value]) =>
                        `${key}=${value}`,
                )
                .join("&");

        return CacheKeys.products(
            page,
            limit,
            normalizedQuery,
        );
    }),
    controller.getAll,
);

/**
 * --------------------------------------------------------------------------
 * Product detail
 * --------------------------------------------------------------------------
 */
router.get(
    "/:id",
    cache(
        (c) =>
            CacheKeys.product(
                c.req.param("id") ?? "",
            ),
    ),
    controller.getById,
);

/**
 * --------------------------------------------------------------------------
 * Admin writes
 * --------------------------------------------------------------------------
 */
router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN"),
    controller.create,
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    controller.update,
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    controller.remove,
);

export default router;