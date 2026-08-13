import { Prisma } from "../generated/prisma/client";

interface PricingInput {
  subtotal: Prisma.Decimal;
  discount?: Prisma.Decimal;
  shipping?: Prisma.Decimal;
  tax?: Prisma.Decimal;
}

export function calculatePricing({
  subtotal,
  discount = new Prisma.Decimal(0),
  shipping = new Prisma.Decimal(0),
  tax = new Prisma.Decimal(0),
}: PricingInput) {
  const total = subtotal
    .minus(discount)
    .plus(shipping)
    .plus(tax);

  return {
    subtotal,
    discount,
    shipping,
    tax,
    total,
  };
}