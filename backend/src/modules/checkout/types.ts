import { Prisma } from "../../generated/prisma/client";

export interface CheckoutItem {
  productId: string;

  name: string;

  quantity: number;

  unitPrice: Prisma.Decimal;

  total: Prisma.Decimal;
}

export interface CheckoutResponse {
  addressId: string;

  couponCode?: string;

  items: CheckoutItem[];

  subtotal: Prisma.Decimal;

  discount: Prisma.Decimal;

  shipping: Prisma.Decimal;

  tax: Prisma.Decimal;

  total: Prisma.Decimal;
}
