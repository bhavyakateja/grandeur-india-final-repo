import { apiRequest, uploadFile } from "@/lib/api";

export type Role = "USER" | "ADMIN" | "SUPER_ADMIN";
export type ProductStatus = "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";
export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentProvider = "RAZORPAY" | "STRIPE";

export interface Category { id: string; name: string; slug: string; isActive: boolean; products?: Product[] }
export interface ProductImage { id: string; url: string; publicId: string; isPrimary: boolean; createdAt: string; productId: string }
export interface Product {
  id: string; name: string; slug: string; description: string; price: number | string; stock: number;
  status: ProductStatus; createdAt: string; updatedAt: string; categoryId: string; category: Category; images: ProductImage[];
}
export interface ProductInput { name: string; description: string; price: number; stock: number; categoryId: string; status?: ProductStatus }
export interface AdminUser {
  id: string; name: string; email: string; role: Role; avatar: string | null; isVerified: boolean; isActive: boolean;
  lastLoginAt: string | null; createdAt: string; updatedAt?: string; _count?: { orders: number; reviews: number; wishlists: number };
  addresses?: Array<Record<string, unknown>>;
}
export interface AdminOrderItem { id: string; orderId: string; productId: string; productName: string; quantity: number; price: number | string; subtotal?: number | string }
export interface AdminOrder {
  id: string; orderNumber: string; status: OrderStatus; paymentStatus: PaymentStatus; payment?: Record<string, unknown> | null;
  total: number | string; subtotal?: number | string; shippingCharge?: number | string; shipping?: number | string;
  tax?: number | string; discount?: number | string; createdAt: string; updatedAt?: string; fullName: string; phone?: string;
  addressLine1?: string; addressLine2?: string; city?: string; state?: string; postalCode?: string; country?: string;
  user: { id: string; name: string; email: string }; items: AdminOrderItem[];
}
export interface Paginated<T> { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }
export interface DashboardData {
  kpis: { totalCustomers: number; totalProducts: number; totalOrders: number; pendingOrders: number; totalRevenue: number };
  recentOrders: AdminOrder[]; orderStatusCounts: Array<{ status: string; count: number }>;
  topSellingProducts: Array<{ productId: string; productName: string; quantitySold: number; revenue: number }>;
}
export interface AnalyticsData extends Omit<DashboardData, "recentOrders"> {
  range: { from: string; to: string }; salesByDay: Array<{ date: string; orders: number; revenue: number }>;
}
export interface InventoryResponse { id: string; stock: number; status?: ProductStatus; [key: string]: unknown }
export interface Review {
  id: string; rating: number; title: string | null; comment: string | null; status: ReviewStatus;
  createdAt: string; updatedAt?: string; user: { id: string; name: string; email: string };
  product: { id: string; name: string }; images: Array<{ id: string; url: string }>;
}
export interface Coupon {
  id: string; code: string; description?: string | null; type: "PERCENTAGE" | "FIXED"; value: number | string;
  minimumOrderAmount?: number | string | null; maximumDiscount?: number | string | null; usageLimit?: number | null;
  usedCount: number; startsAt?: string | null; expiresAt?: string | null; isActive: boolean; createdAt: string; updatedAt: string;
}
export interface Payment {
  id: string; userId: string; provider: PaymentProvider; providerOrderId?: string | null; providerPaymentId?: string | null;
  amount: number | string; currency: string; status: PaymentStatus; createdAt: string; updatedAt: string;
  user: { id: string; name: string; email: string }; order?: { id: string; orderNumber: string; status: OrderStatus; paymentStatus: PaymentStatus } | null;
}
export interface NotificationResult { success: boolean }

function query(params: Record<string, string | number | boolean | undefined>) {
  const s = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") s.set(key, String(value));
  return s.toString();
}

export const adminApi = {
  dashboard: () => apiRequest<DashboardData>("/admin/dashboard"),
  analytics: (from?: string, to?: string) => apiRequest<AnalyticsData>(`/admin/analytics?${query({ from, to })}`),

  users: (params: { page?: number; limit?: number; search?: string; role?: Role; isActive?: boolean }) =>
    apiRequest<Paginated<AdminUser>>(`/admin/users?${query(params)}`),
  user: (id: string) => apiRequest<AdminUser>(`/admin/users/${id}`),
  updateUser: (id: string, input: Partial<Pick<AdminUser, "name" | "email" | "role" | "isActive" | "isVerified">>) =>
    apiRequest<AdminUser>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteUser: (id: string) => apiRequest<AdminUser>(`/admin/users/${id}`, { method: "DELETE" }),

  orders: (params: { page?: number; limit?: number; search?: string; status?: OrderStatus; from?: string; to?: string }) =>
    apiRequest<Paginated<AdminOrder>>(`/admin/orders?${query(params)}`),
  order: (id: string) => apiRequest<AdminOrder>(`/admin/orders/${id}`),
  updateOrderStatus: (id: string, status: OrderStatus) =>
    apiRequest<AdminOrder>(`/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  products: async (params: { page?: number; limit?: number; search?: string; category?: string; status?: ProductStatus; sort?: string }) => {
    const response = await apiRequest<{ items: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/products?${query(params)}`);
    return { products: response.items, total: response.pagination.total, pagination: response.pagination };
  },
  product: (id: string) => apiRequest<Product>(`/products/${id}`),
  createProduct: (input: ProductInput) => apiRequest<Product>("/products", { method: "POST", body: JSON.stringify(input) }),
  updateProduct: (id: string, input: Partial<ProductInput>) => apiRequest<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteProduct: (id: string) => apiRequest<{ success: boolean; message: string }>(`/products/${id}`, { method: "DELETE" }),
  uploadProductImage: (file: File) => uploadFile<{ url: string; publicId: string }>(file, "products"),
  attachProductImage: (productId: string, input: { url: string; publicId: string; isPrimary?: boolean }) =>
    apiRequest<ProductImage>(`/admin/products/${productId}/images`, { method: "POST", body: JSON.stringify(input) }),
  setPrimaryProductImage: (productId: string, imageId: string) =>
    apiRequest<ProductImage>(`/admin/products/${productId}/images/${imageId}`, { method: "PATCH", body: JSON.stringify({ isPrimary: true }) }),
  deleteProductImage: (productId: string, imageId: string) =>
    apiRequest<{ success: boolean }>(`/admin/products/${productId}/images/${imageId}`, { method: "DELETE" }),

  categories: (search?: string) => apiRequest<Category[]>(`/categories${search ? `?${query({ search })}` : ""}`),
  category: (id: string) => apiRequest<Category>(`/categories/${id}`),
  createCategory: (input: { name: string; isActive?: boolean }) => apiRequest<Category>("/categories", { method: "POST", body: JSON.stringify(input) }),
  updateCategory: (id: string, input: { name?: string; isActive?: boolean }) => apiRequest<Category>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteCategory: (id: string) => apiRequest<{ success: boolean; message: string }>(`/categories/${id}`, { method: "DELETE" }),

  inventory: (productId: string) => apiRequest<InventoryResponse>(`/inventory/${productId}`),
  setStock: (productId: string, stock: number) => apiRequest<InventoryResponse>(`/inventory/${productId}`, { method: "PATCH", body: JSON.stringify({ stock }) }),

  reviews: (params: { page?: number; limit?: number; status?: ReviewStatus; search?: string }) =>
    apiRequest<Paginated<Review>>(`/admin/reviews?${query(params)}`),
  updateReviewStatus: (id: string, status: ReviewStatus) =>
    apiRequest<Review>(`/admin/reviews/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteReview: (id: string) => apiRequest<{ success: boolean }>(`/admin/reviews/${id}`, { method: "DELETE" }),

  coupons: () => apiRequest<Coupon[]>("/coupons"),
  createCoupon: (input: Partial<Coupon> & { code: string; type: "PERCENTAGE" | "FIXED"; value: number }) =>
    apiRequest<Coupon>("/coupons", { method: "POST", body: JSON.stringify(input) }),
  updateCoupon: (id: string, input: Partial<Coupon>) =>
    apiRequest<Coupon>(`/coupons/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteCoupon: (id: string) => apiRequest<{ success: boolean }>(`/coupons/${id}`, { method: "DELETE" }),

  payments: (params: { page?: number; limit?: number; status?: PaymentStatus; provider?: PaymentProvider; search?: string }) =>
    apiRequest<Paginated<Payment>>(`/admin/payments?${query(params)}`),
  refundPayment: (id: string, reason?: string) =>
    apiRequest<{ success: boolean; alreadyRefunded: boolean; payment: Payment; order?: AdminOrder | null }>(`/admin/payments/${id}/refund`, { method: "POST", body: JSON.stringify({ reason }) }),

  sendEmail: (to: string, subject: string, message: string) =>
    apiRequest<NotificationResult>("/notifications/email", { method: "POST", body: JSON.stringify({ to, subject, message }) }),
  sendSms: (to: string, message: string) =>
    apiRequest<NotificationResult>("/notifications/sms", { method: "POST", body: JSON.stringify({ to, message }) }),
  sendPush: (to: string, message: string) =>
    apiRequest<NotificationResult>("/notifications/push", { method: "POST", body: JSON.stringify({ to, message }) }),
};
