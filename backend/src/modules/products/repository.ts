import { prisma } from "../../db/prisma";
import { Prisma } from "../../generated/prisma/client";
import type { ProductQuery } from "./schema";

const productInclude = {
    images: true,
    category: true,
} satisfies Prisma.ProductInclude;

export async function create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({
        data,
        include: productInclude
    });
}

export async function findById(id: string) {
    return prisma.product.findUnique({
        where: { id },
        include: productInclude
    });
}

export async function findBySlug(slug: string) {
    return prisma.product.findUnique({
        where: { slug },
    });
}

export async function findAll(query: ProductQuery) {
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
                [sort.substring(1)]: Prisma.SortOrder.desc,
            }
            : {
                [sort]: Prisma.SortOrder.asc,
            };

    const [products, total] =
        await prisma.$transaction([
            prisma.product.findMany({
                where,
                include: productInclude,
                orderBy,
                skip: (page - 1) * limit,
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

export async function update(
    id: string,
    data: Prisma.ProductUpdateInput
) {
    return prisma.product.update({
        where: { id },
        data,
        include: productInclude
    });
}

export async function remove(id: string) {
    return prisma.product.delete({
        where: { id },
    });
}