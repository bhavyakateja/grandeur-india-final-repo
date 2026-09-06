import * as repository from "./repository";
import { Prisma } from "../../generated/prisma/client";
import { NotFoundException } from "../../exceptions/NotFoundException";
import {
    cache,
    CacheKeys,
} from "../redis";
import type {
    CreateProductInput,
    UpdateProductInput,
    ProductQuery,
} from "./schema";

function createSlug(
    name: string,
) {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "");
}

import type {
    FeaturedProduct,
    FeaturedProductBadge,
} from "./types";

/**
 * --------------------------------------------------------------------------
 * Product cache invalidation
 * --------------------------------------------------------------------------
 */
async function invalidateProductCaches(
    options: {
        productId?: string;
        categoryIds?: string[];
    } = {},
) {
    const tasks: Promise<unknown>[] = [
        cache.remove(
            CacheKeys.productCatalogue(),
        ),
        cache.clearPattern(
            "products:*",
        ),
    ];

    if (options.productId) {
        tasks.push(
            cache.remove(
                CacheKeys.product(
                    options.productId,
                ),
            ),
        );
    }

    if (
        options.categoryIds &&
        options.categoryIds.length > 0
    ) {
        const uniqueCategoryIds = [
            ...new Set(
                options.categoryIds,
            ),
        ];

        for (const categoryId of uniqueCategoryIds) {
            tasks.push(
                cache.remove(
                    CacheKeys.category(
                        categoryId,
                    ),
                ),
            );
        }
    }

    await Promise.all(tasks);
}

/**
 * --------------------------------------------------------------------------
 * Create product
 * --------------------------------------------------------------------------
 */
export async function create(
    data: CreateProductInput,
) {
    const slug = createSlug(
        data.name,
    );

    const product =
        await repository.create({
            name: data.name,
            slug,
            description:
                data.description,
            price:
                new Prisma.Decimal(
                    data.price,
                ),
            stock: data.stock,
            status: data.status,
            category: {
                connect: {
                    id: data.categoryId,
                },
            },
        });

    await invalidateProductCaches({
        categoryIds: [
            data.categoryId,
        ],
    });

    return product;
}

/**
 * --------------------------------------------------------------------------
 * Storefront catalogue
 * --------------------------------------------------------------------------
 */
export async function getCatalogue() {
    return repository.findCatalogue();
}

/**
 * --------------------------------------------------------------------------
 * Homepage featured products
 * --------------------------------------------------------------------------
 *
 * Preferred compositions:
 *
 *   3 Bestsellers + 3 New Arrivals
 *   4 Bestsellers + 2 New Arrivals
 *   2 Bestsellers + 4 New Arrivals
 *
 * The composition is selected randomly from the compositions that are
 * actually possible.
 *
 * Fallbacks:
 *
 *   no bestsellers -> up to 6 new arrivals
 *   no new arrivals -> up to 6 bestsellers
 *   insufficient data -> return every unique available product up to 6
 *
 * The function NEVER duplicates a product.
 */
export async function getFeaturedProducts(): Promise<
    FeaturedProduct[]
> {
    const [
        bestsellerRows,
        newArrivals,
    ] = await Promise.all([
        repository.findBestsellerProductIds(
            12,
        ),
        repository.findNewArrivalProducts(
            12,
        ),
    ]);

    const bestsellerIds =
        bestsellerRows.map(
            (row) => row.productId,
        );

    /**
     * Fetch active bestseller products.
     */
    const bestsellerProducts =
        await repository.findActiveProductsByIds(
            bestsellerIds,
        );

    /**
     * Restore bestseller ranking because
     * findMany({ where: { id: { in: [...] } } })
     * does not guarantee the order of the IDs.
     */
    const bestsellerMap =
        new Map(
            bestsellerProducts.map(
                (product) => [
                    product.id,
                    product,
                ],
            ),
        );

    const orderedBestsellers =
        bestsellerIds
            .map((id) =>
                bestsellerMap.get(id),
            )
            .filter(
                (
                    product,
                ): product is NonNullable<
                    typeof product
                > => Boolean(product),
            );

    /**
     * Prevent duplicates.
     *
     * A product can technically be both:
     * - a bestseller
     * - a new arrival
     *
     * It must only appear once on the homepage.
     */
    const bestsellerIdSet =
        new Set(
            orderedBestsellers.map(
                (product) =>
                    product.id,
            ),
        );

    const filteredNewArrivals =
        newArrivals.filter(
            (product) =>
                !bestsellerIdSet.has(
                    product.id,
                ),
        );

    /**
     * If there are no bestsellers,
     * use up to 6 new arrivals.
     */
    if (
        orderedBestsellers.length ===
        0
    ) {
        return filteredNewArrivals
            .slice(0, 6)
            .map((product) => ({
                product,
                badge: "New" satisfies FeaturedProductBadge,
            }));
    }

    /**
     * If there are no new arrivals,
     * use up to 6 bestsellers.
     */
    if (
        filteredNewArrivals.length ===
        0
    ) {
        return orderedBestsellers
            .slice(0, 6)
            .map((product) => ({
                product,
                badge:
                    "Bestseller" satisfies FeaturedProductBadge,
            }));
    }

    /**
     * We have both groups.
     *
     * Pick one of the requested compositions:
     *
     * 3 Bestseller + 3 New
     * 4 Bestseller + 2 New
     * 2 Bestseller + 4 New
     *
     * Only choose a composition that can actually
     * be fulfilled.
     */
    const compositions = [
        {
            bestsellers: 3,
            newArrivals: 3,
        },
        {
            bestsellers: 4,
            newArrivals: 2,
        },
        {
            bestsellers: 2,
            newArrivals: 4,
        },
    ].filter(
        (composition) =>
            orderedBestsellers.length >=
                composition.bestsellers &&
            filteredNewArrivals.length >=
                composition.newArrivals,
    );

    if (compositions.length > 0) {
        const composition =
            compositions[
                Math.floor(
                    Math.random() *
                        compositions.length,
                )
            ];

        if (composition) {
            const selectedBestsellers =
                orderedBestsellers.slice(
                    0,
                    composition.bestsellers,
                );

            const selectedNewArrivals =
                filteredNewArrivals.slice(
                    0,
                    composition.newArrivals,
                );

            /**
             * Interleave the two groups so the
             * homepage does not visually become:
             *
             * Bestseller
             * Bestseller
             * Bestseller
             * New
             * New
             * New
             *
             * Instead we mix them.
             */
            const selected: FeaturedProduct[] =
                [];

            const maxLength =
                Math.max(
                    selectedBestsellers.length,
                    selectedNewArrivals.length,
                );

            for (
                let i = 0;
                i < maxLength;
                i++
            ) {
                const bestseller =
                    selectedBestsellers[i];

                if (bestseller) {
                    selected.push({
                        product:
                            bestseller,
                        badge:
                            "Bestseller",
                    });
                }

                const newArrival =
                    selectedNewArrivals[i];

                if (newArrival) {
                    selected.push({
                        product:
                            newArrival,
                        badge: "New",
                    });
                }
            }

            return selected.slice(
                0,
                6,
            );
        }
    }

    /**
     * Edge case:
     *
     * Both groups exist, but none of the requested
     * 3/3, 4/2 or 2/4 combinations can be fulfilled.
     *
     * Combine everything uniquely and cap at 6.
     */
    const fallback: FeaturedProduct[] =
        [
            ...orderedBestsellers.map(
                (product) => ({
                    product,
                    badge:
                        "Bestseller" as const,
                }),
            ),

            ...filteredNewArrivals.map(
                (product) => ({
                    product,
                    badge:
                        "New" as const,
                }),
            ),
        ];

    return fallback.slice(0, 6);
}

/**
 * --------------------------------------------------------------------------
 * Existing paginated product API
 * --------------------------------------------------------------------------
 */
export async function getAll(
    query: ProductQuery,
) {
    const {
        products,
        total,
    } =
        await repository.findAll(
            query,
        );

    return {
        items: products,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages:
                Math.ceil(
                    total /
                        query.limit,
                ),
        },
    };
}

/**
 * --------------------------------------------------------------------------
 * Product detail
 * --------------------------------------------------------------------------
 */
export async function getById(
    id: string,
) {
    const product =
        await repository.findById(
            id,
        );

    if (!product) {
        throw new NotFoundException(
            "Product not found",
        );
    }

    return product;
}

/**
 * --------------------------------------------------------------------------
 * Update product
 * --------------------------------------------------------------------------
 */
export async function update(
    id: string,
    data: UpdateProductInput,
) {
    /**
     * We need the existing category so that if the category changes,
     * both the old and new category caches can be invalidated.
     */
    const existing =
        await getById(id);

    const updateData:
        Prisma.ProductUpdateInput =
        {};

    if (data.name) {
        updateData.name =
            data.name;

        updateData.slug =
            createSlug(
                data.name,
            );
    }

    if (
        data.description !==
        undefined
    ) {
        updateData.description =
            data.description;
    }

    if (
        data.price !==
        undefined
    ) {
        updateData.price =
            new Prisma.Decimal(
                data.price,
            );
    }

    if (
        data.stock !==
        undefined
    ) {
        updateData.stock =
            data.stock;
    }

    if (
        data.status !==
        undefined
    ) {
        updateData.status =
            data.status;
    }

    if (data.categoryId) {
        updateData.category = {
            connect: {
                id:
                    data.categoryId,
            },
        };
    }

    const product =
        await repository.update(
            id,
            updateData,
        );

    const categoryIds = [
        existing.categoryId,
    ];

    if (
        data.categoryId &&
        data.categoryId !==
            existing.categoryId
    ) {
        categoryIds.push(
            data.categoryId,
        );
    }

    await invalidateProductCaches({
        productId: id,
        categoryIds,
    });

    return product;
}

/**
 * --------------------------------------------------------------------------
 * Delete product
 * --------------------------------------------------------------------------
 */
export async function remove(
    id: string,
) {
    const product =
        await getById(id);

    await repository.remove(
        id,
    );

    await invalidateProductCaches({
        productId: id,
        categoryIds: [
            product.categoryId,
        ],
    });
}