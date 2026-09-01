import type { Prisma } from "../../generated/prisma/client";

export interface CheckoutAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface CheckoutItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  total: Prisma.Decimal;
}

export interface CheckoutResponse {
  address: CheckoutAddress;
  couponCode?: string;
  items: CheckoutItem[];
  subtotal: Prisma.Decimal;
  discount: Prisma.Decimal;
  shipping: Prisma.Decimal;
  tax: Prisma.Decimal;
  total: Prisma.Decimal;
}