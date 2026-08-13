// import { beforeEach } from "vitest";
// import { prisma } from "../src/db/prisma";

// console.log(process.env.PORT);
// console.log(process.env.DATABASE_URL);

// beforeEach(async () => {
//   await prisma.$transaction([
//     prisma.refreshToken.deleteMany(),
//     prisma.payment.deleteMany(),
//     prisma.orderItem.deleteMany(),
//     prisma.order.deleteMany(),
//     prisma.cartItem.deleteMany(),
//     prisma.wishlist.deleteMany(),
//     prisma.review.deleteMany(),
//     prisma.productImage.deleteMany(),
//     prisma.product.deleteMany(),
//     prisma.category.deleteMany(),
//     prisma.address.deleteMany(),
//     prisma.coupon.deleteMany(),
//     prisma.user.deleteMany(),
//   ]);
// });

import { config } from "dotenv";
config({ path: ".env.test" });

import { beforeEach } from "vitest";

beforeEach(async () => {
  // Temporarily disable database cleanup.
});