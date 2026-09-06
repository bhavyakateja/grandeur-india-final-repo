import { prisma } from "../../db/prisma";
import { Prisma } from "../../generated/prisma/client";
import type { ProductQuery } from "./schema";

/**
 * Full product payload.
 *
 * Used by:
 * - admin product operations
 * - product detail
 * - mutations where the complete product representation is useful
 */
const productInclude = {
    images: true,
    category: true,
} satisfies Prisma.ProductInclude;

/**
 * --------------------------------------------------------------------------
 * Storefront catalogue projection
 * --------------------------------------------------------------------------
 *
 * The product grid only needs the primary image and the fields required
 * for client-side browsing.
 */
const catalogueSelect = {
    id: true,
    name: true,
    slug: true,
    description: true,
    price: true,
    stock: true,
    status: true,
    categoryId: true,
    createdAt: true,
    updatedAt: true,
    images: {
        where: {
            isPrimary: true,
        },
        select: {
            id: true,
            url: true,
            publicId: true,
            isPrimary: true,
            createdAt: true,
            productId: true,
        },
        take: 1,
    },
    category: {
        select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            isActive: true,
        },
    },
} satisfies Prisma.ProductSelect;

/**
 * --------------------------------------------------------------------------
 * Create product
 * --------------------------------------------------------------------------
 */
export async function create(
    data: Prisma.ProductCreateInput,
) {
    return prisma.product.create({
        data,
        include: productInclude,
    });
}

/**
 * --------------------------------------------------------------------------
 * Find product by ID
 * --------------------------------------------------------------------------
 */
export async function findById(
    id: string,
) {
    return prisma.product.findUnique({
        where: {
            id,
        },
        include: productInclude,
    });
}

/**
 * --------------------------------------------------------------------------
 * Find product by slug
 * --------------------------------------------------------------------------
 */
export async function findBySlug(
    slug: string,
) {
    return prisma.product.findUnique({
        where: {
            slug,
        },
    });
}

/**
 * --------------------------------------------------------------------------
 * Storefront catalogue
 * --------------------------------------------------------------------------
 *
 * Returns the complete ACTIVE catalogue in one query.
 *
 * ProductBrowser uses this endpoint for:
 * - search
 * - category filtering
 * - price filtering
 * - availability filtering
 * - sorting
 * - pagination
 *
 * All of those operations happen on the client.
 */
export async function findCatalogue() {
    return prisma.product.findMany({
        where: {
            status: "ACTIVE",
        },
        select: catalogueSelect,
        orderBy: {
            createdAt: "desc",
        },
    });
}

/**
 * --------------------------------------------------------------------------
 * Homepage featured products
 * --------------------------------------------------------------------------
 *
 * Returns the data required to build the homepage's dynamic:
 *
 * - Bestsellers
 * - New arrivals
 *
 * Bestseller ranking is based on the quantity of products sold through
 * non-cancelled, paid orders.
 *
 * New arrivals are the newest ACTIVE products.
 *
 * The service layer decides the final 6-product composition.
 */

/**
 * Get product IDs ranked by quantity sold.
 *
 * Only products belonging to paid, non-cancelled orders contribute.
 */
export async function findBestsellerProductIds(
    limit = 6,
) {
    const grouped = await prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
            order: {
                status: {
                    not: "CANCELLED",
                },
                paymentStatus: "PAID",
            },
        },
        _sum: {
            quantity: true,
        },
        orderBy: {
            _sum: {
                quantity: "desc",
            },
        },
        take: limit,
    });

    return grouped
        .map((item) => ({
            productId: item.productId,
            quantitySold: item._sum.quantity ?? 0,
        }))
        .filter((item) => item.quantitySold > 0);
}

/**
 * Get the newest ACTIVE products.
 *
 * We fetch more than six because the service may need additional products
 * when removing overlap with the bestseller list.
 */
export async function findNewArrivalProducts(
    limit = 12,
) {
    return prisma.product.findMany({
        where: {
            status: "ACTIVE",
        },
        select: catalogueSelect,
        orderBy: {
            createdAt: "desc",
        },
        take: limit,
    });
}

/**
 * Fetch active products for a list of IDs.
 *
 * Prisma does not guarantee that findMany({ id: { in: [...] } }) returns
 * records in the same order as the supplied IDs, so ordering is restored
 * by the service layer.
 */
export async function findActiveProductsByIds(
    ids: string[],
) {
    if (ids.length === 0) {
        return [];
    }

    return prisma.product.findMany({
        where: {
            id: {
                in: ids,
            },
            status: "ACTIVE",
        },
        select: catalogueSelect,
    });
}

/**
 * --------------------------------------------------------------------------
 * Existing server-side product query
 * --------------------------------------------------------------------------
 *
 * Keep this for:
 * - admin
 * - API consumers
 * - server-side pagination
 * - server-side search/filtering/sorting
 */
export async function findAll(
    query: ProductQuery,
) {
    const {
        page,
        limit,
        search,
        category,
        status,
        sort,
    } = query;

    const where: Prisma.ProductWhereInput = {};

    if (search) {
        where.OR = [
            {
                name: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            {
                description: {
                    contains: search,
                    mode: "insensitive",
                },
            },
        ];
    }

    if (category) {
        where.category = {
            is: {
                slug: category,
            },
        };
    }

    if (status) {
        where.status = status;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
        sort.startsWith("-")
            ? {
                  [sort.substring(1)]:
                      Prisma.SortOrder.desc,
              }
            : {
                  [sort]:
                      Prisma.SortOrder.asc,
              };

    const [products, total] =
        await prisma.$transaction([
            prisma.product.findMany({
                where,
                include: productInclude,
                orderBy,
                skip:
                    (page - 1) *
                    limit,
                take: limit,
            }),

            prisma.product.count({
                where,
            }),
        ]);

    return {
        products,
        total,
    };
}

/**
 * --------------------------------------------------------------------------
 * Update product
 * --------------------------------------------------------------------------
 */
export async function update(
    id: string,
    data: Prisma.ProductUpdateInput,
) {
    return prisma.product.update({
        where: {
            id,
        },
        data,
        include: productInclude,
    });
}

/**
 * --------------------------------------------------------------------------
 * Delete product
 * --------------------------------------------------------------------------
 */
export async function remove(
    id: string,
) {
    return prisma.product.delete({
        where: {
            id,
        },
    });
}