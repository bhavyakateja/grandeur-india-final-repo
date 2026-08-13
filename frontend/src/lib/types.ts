export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";

export interface ProductImage {
  id: string;
  url: string;
  publicId: string;
  isPrimary: boolean;
  createdAt: string;
  productId: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  products?: Product[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  stock: number;
  status: ProductStatus;
  categoryId: string;
  category?: Category;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: ProductStatus;
  sort?: "createdAt" | "-createdAt" | "price" | "-price" | "name" | "-name";
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  priceAtAddition: number | string;
  createdAt: string;
  product: Product;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: string;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  price: number | string;
  quantity: number;
  createdAt: string;
  product?: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number | string;
  shippingCharge: number | string;
  tax: number | string;
  discount: number | string;
  total: number | string;
  paymentId: string | null;
  razorpayOrderId: string | null;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewUser { id: string; name: string; avatar?: string | null; }
export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: { id?: string; url: string }[];
  createdAt: string;
  updatedAt: string;
  user?: ReviewUser;
}

export interface ProductRating { average: number; count: number; }

export interface CheckoutItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number | string;
  total: number | string;
}

export interface CheckoutResponse {
  addressId: string;
  couponCode?: string;
  items: CheckoutItem[];
  subtotal: number | string;
  discount: number | string;
  shipping: number | string;
  tax: number | string;
  total: number | string;
}

export interface CreatePaymentResponse {
  paymentId: string;
  provider: "RAZORPAY" | "STRIPE";
  providerOrderId: string;
  amount: number | string;
  currency: string;
  key?: string;
}

export interface ApplyCouponResponse {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number | string;
  discount: number | string;
  subtotal: number | string;
  total: number | string;
}

export interface ApiMessage { success: boolean; message: string; }
