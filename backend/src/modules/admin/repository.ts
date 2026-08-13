
import { Prisma, type OrderStatus, type Role } from "../../generated/prisma/client";
import { prisma } from "../../db/prisma";
import type { OrderListQuery, UserListQuery } from "./schema";

function dateRange(from?: Date, to?: Date) {
  if (!from && !to) return undefined;

  return {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
}

export async function findUsers(query: UserListQuery) {
  const { page, limit, search, role, isActive } = query;
  const where: Prisma.UserWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(role ? { role: role as Role } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isVerified: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      addresses: true,
      _count: {
        select: {
          orders: true,
          reviews: true,
          wishlists: true,
        },
      },
    },
  });
}

export async function findOrders(query: OrderListQuery) {
  const { page, limit, status, search, from, to } = query;
  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { fullName: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(from || to ? { createdAt: dateRange(from, to) } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export function findOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              images: {
                where: { isPrimary: true },
                select: { url: true },
                take: 1,
              },
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  return prisma.order.update({
    where: { id },
    data: { status },
    include: {
      items: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function dashboardKpis() {
  const [users, products, orders, pendingOrders, revenue] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({
      where: {
        paymentStatus: "PAID",
        status: { not: "CANCELLED" },
      },
      _sum: { total: true },
    }),
  ]);

  return {
    totalCustomers: users,
    totalProducts: products,
    totalOrders: orders,
    pendingOrders,
    totalRevenue: Number(revenue._sum.total ?? 0),
  };
}

export function recentOrders(limit = 10) {
  return prisma.order.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      total: true,
      createdAt: true,
      fullName: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function topSellingProducts(from?: Date, to?: Date, limit = 10) {
  const range = Prisma.sql`
    ${from ? Prisma.sql`AND o."createdAt" >= ${from}` : Prisma.empty}
    ${to ? Prisma.sql`AND o."createdAt" <= ${to}` : Prisma.empty}
  `;

  return prisma.$queryRaw<
    Array<{
      productId: string;
      productName: string;
      quantitySold: number;
      revenue: number;
    }>
  >(Prisma.sql`
    SELECT
      oi."productId" AS "productId",
      MAX(oi."productName") AS "productName",
      SUM(oi."quantity")::int AS "quantitySold",
      SUM(oi."price" * oi."quantity")::numeric AS "revenue"
    FROM "OrderItem" oi
    INNER JOIN "Order" o ON o."id" = oi."orderId"
    WHERE o."paymentStatus" = 'PAID'
      AND o."status" <> 'CANCELLED'
      ${range}
    GROUP BY oi."productId"
    ORDER BY SUM(oi."quantity") DESC
    LIMIT ${limit}
  `);
}

export async function salesByDay(from: Date, to: Date) {
  return prisma.$queryRaw<
    Array<{
      date: Date;
      orders: number;
      revenue: number;
    }>
  >(Prisma.sql`
    SELECT
      DATE(o."createdAt") AS "date",
      COUNT(*)::int AS "orders",
      COALESCE(SUM(o."total"), 0)::numeric AS "revenue"
    FROM "Order" o
    WHERE o."paymentStatus" = 'PAID'
      AND o."status" <> 'CANCELLED'
      AND o."createdAt" >= ${from}
      AND o."createdAt" <= ${to}
    GROUP BY DATE(o."createdAt")
    ORDER BY DATE(o."createdAt") ASC
  `);
}

export async function orderStatusCounts() {
  return prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
    orderBy: { status: "asc" },
  });
}


export async function updateUser(id: string, data: import("./schema").UpdateUserInput) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true, name: true, email: true, role: true, avatar: true,
      isVerified: true, isActive: true, lastLoginAt: true, createdAt: true, updatedAt: true,
      _count: { select: { orders: true, reviews: true, wishlists: true } },
    },
  });
}

export function deactivateUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: {
      id: true, name: true, email: true, role: true, avatar: true,
      isVerified: true, isActive: true, lastLoginAt: true, createdAt: true, updatedAt: true,
    },
  });
}

export async function findReviews(query: import("./schema").ReviewListQuery) {
  const { page, limit, status, search } = query;
  const where: Prisma.ReviewWhereInput = {
    ...(status ? { status } : {}),
    ...(search ? {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { comment: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { product: { name: { contains: search, mode: "insensitive" } } },
      ],
    } : {}),
  };
  const [data, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
        images: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export function findReviewById(id: string) {
  return prisma.review.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } }, product: { select: { id: true, name: true } }, images: true },
  });
}

export function setReviewStatus(id: string, status: import("../../generated/prisma/client").ReviewStatus) {
  return prisma.review.update({ where: { id }, data: { status }, include: { user: { select: { id: true, name: true, email: true } }, product: { select: { id: true, name: true } }, images: true } });
}

export function deleteReview(id: string) {
  return prisma.review.delete({ where: { id } });
}

export function findProductById(id: string) {
  return prisma.product.findUnique({ where: { id }, include: { images: true, category: true } });
}

export function findProductImage(productId: string, imageId: string) {
  return prisma.productImage.findFirst({ where: { id: imageId, productId } });
}

export async function attachProductImage(productId: string, data: { url: string; publicId: string; isPrimary: boolean }) {
  return prisma.$transaction(async (tx) => {
    if (data.isPrimary) await tx.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
    return tx.productImage.create({ data: { productId, url: data.url, publicId: data.publicId, isPrimary: data.isPrimary } });
  });
}

export async function setPrimaryProductImage(productId: string, imageId: string) {
  return prisma.$transaction(async (tx) => {
    const image = await tx.productImage.findFirst({ where: { id: imageId, productId } });
    if (!image) return null;
    await tx.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
    return tx.productImage.update({ where: { id: imageId }, data: { isPrimary: true } });
  });
}

export async function deleteProductImage(productId: string, imageId: string) {
  return prisma.$transaction(async (tx) => {
    const image = await tx.productImage.findFirst({ where: { id: imageId, productId } });
    if (!image) return null;
    await tx.productImage.delete({ where: { id: imageId } });
    if (image.isPrimary) {
      const replacement = await tx.productImage.findFirst({ where: { productId }, orderBy: { createdAt: "asc" } });
      if (replacement) await tx.productImage.update({ where: { id: replacement.id }, data: { isPrimary: true } });
    }
    return image;
  });
}

export async function findPayments(query: import("./schema").PaymentListQuery) {
  const { page, limit, status, provider, search } = query;
  const where: Prisma.PaymentWhereInput = {
    ...(status ? { status } : {}),
    ...(provider ? { provider } : {}),
    ...(search ? {
      OR: [
        { providerOrderId: { contains: search, mode: "insensitive" } },
        { providerPaymentId: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ],
    } : {}),
  };
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);
  const orderIds = payments.map((p) => p.id);
  const orders = await prisma.order.findMany({ where: { paymentId: { in: orderIds } }, select: { id: true, orderNumber: true, status: true, paymentStatus: true, paymentId: true } });
  const orderByPayment = new Map(orders.map((o) => [o.paymentId!, o]));
  return {
    data: payments.map((payment) => ({ ...payment, order: orderByPayment.get(payment.id) ?? null })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export function findPaymentForRefund(id: string) {
  return prisma.payment.findUnique({ where: { id }, include: { user: { select: { id: true, name: true, email: true } } } });
}

export function findOrderByPaymentId(paymentId: string) {
  return prisma.order.findFirst({ where: { paymentId }, include: { items: true } });
}

export async function markRefunded(paymentId: string, orderId: string | undefined, cancelOrder: boolean) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({ where: { id: paymentId }, data: { status: "REFUNDED" } });
    if (orderId) {
      const order = await tx.order.update({ where: { id: orderId }, data: { paymentStatus: "REFUNDED", ...(cancelOrder ? { status: "CANCELLED" } : {}) }, include: { items: true } });
      if (cancelOrder) {
        for (const item of order.items) {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
      }
      return { payment, order };
    }
    return { payment, order: null };
  });
}
