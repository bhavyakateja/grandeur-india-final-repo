import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import type {
  Address,
  ApiMessage,
  ApplyCouponResponse,
  Cart,
  CartItem,
  Category,
  CheckoutResponse,
  CreatePaymentResponse,
  Order,
  Product,
  ProductListResponse,
  ProductQueryParams,
  Review,
  WishlistItem,
  StoreSettings,
} from "@/lib/types";
import { apiRequest, asArray } from "@/lib/api";

export const API_KEYS = {
  products: (params?: ProductQueryParams) => ["products", params] as const,
  product: (id: string) => ["product", id] as const,

  categories: () => ["categories"] as const,
  category: (id: string) => ["category", id] as const,

  cart: () => ["cart"] as const,

  wishlist: () => ["wishlist"] as const,

  addresses: () => ["addresses"] as const,

  orders: () => ["orders"] as const,
  order: (id: string) => ["order", id] as const,

  reviews: (productId: string) => ["reviews", productId] as const,
};

function queryString(params: ProductQueryParams) {
  const q = new URLSearchParams();

  if (params.page !== undefined) {
    q.set("page", String(params.page));
  }

  if (params.limit !== undefined) {
    q.set("limit", String(params.limit));
  }

  if (params.search?.trim()) {
    q.set("search", params.search.trim());
  }

  if (params.category) {
    q.set("category", params.category);
  }

  if (params.status) {
    q.set("status", params.status);
  }

  if (params.sort) {
    q.set("sort", params.sort);
  }

  const value = q.toString();

  return value ? `?${value}` : "";
}

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

export function useProducts(params: ProductQueryParams = {}) {
  return useQuery({
    queryKey: API_KEYS.products(params),

    queryFn: async (): Promise<ProductListResponse> => {
      const response = await apiRequest<any>(
        `/products${queryString(params)}`
      );

      if (response && Array.isArray(response.items)) {
        return {
          products: response.items,
          total: response.pagination?.total ?? response.items.length,
        };
      }

      if (response && Array.isArray(response.products)) {
        return {
          products: response.products,
          total: response.total ?? response.products.length,
        };
      }

      return {
        products: [],
        total: 0,
      };
    },

    staleTime: 30_000,

    placeholderData: (previous) => previous,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: API_KEYS.product(id),

    queryFn: async (): Promise<Product> => {
      const response = await apiRequest<unknown>(`/products/${id}`);

      /*
       * Supports both:
       *
       * { id, name, ... }
       *
       * and:
       *
       * { data: { id, name, ... } }
       */
      if (
        response &&
        typeof response === "object" &&
        "data" in response
      ) {
        return response.data as Product;
      }

      return response as Product;
    },

    enabled: Boolean(id),

    staleTime: 30_000,
  });
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

export function useCategories() {
  return useQuery({
    queryKey: API_KEYS.categories(),

    queryFn: async (): Promise<Category[]> => {
      const response = await apiRequest<unknown>("/categories");

      return asArray<Category>(response);
    },

    staleTime: 60_000,

    placeholderData: [],
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: API_KEYS.category(id),

    queryFn: async (): Promise<Category> => {
      const response = await apiRequest<unknown>(`/categories/${id}`);

      if (
        response &&
        typeof response === "object" &&
        "data" in response
      ) {
        return response.data as Category;
      }

      return response as Category;
    },

    enabled: Boolean(id),

    staleTime: 60_000,
  });
}

/* -------------------------------------------------------------------------- */
/* Cart                                                                       */
/* -------------------------------------------------------------------------- */

export function useCart() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: API_KEYS.cart(),

    queryFn: async (): Promise<Cart> => {
      const response = await apiRequest<unknown>("/cart");

      /*
       * Backend may return:
       *
       * {
       *   items: [...]
       * }
       *
       * OR:
       *
       * {
       *   data: {
       *     items: [...]
       *   }
       * }
       */

      if (
        response &&
        typeof response === "object" &&
        "items" in response &&
        Array.isArray(response.items)
      ) {
        return response as Cart;
      }

      if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        response.data &&
        typeof response.data === "object" &&
        "items" in response.data &&
        Array.isArray(response.data.items)
      ) {
        return response.data as Cart;
      }

      // Safe frontend fallback when the API returns an unexpected shape.
      return {
        items: [],
      } as unknown as Cart;
    },

    enabled: isAuthenticated,

    placeholderData: {
      items: [],
    } as unknown as Cart,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      productId: string;
      quantity: number;
    }) =>
      apiRequest<CartItem>("/cart", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: API_KEYS.cart(),
      });
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      quantity,
    }: {
      itemId: string;
      quantity: number;
    }) =>
      apiRequest<CartItem>(`/cart/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({
          quantity,
        }),
      }),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: API_KEYS.cart(),
      });
    },
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<ApiMessage>(`/cart/${id}`, {
        method: "DELETE",
      }),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: API_KEYS.cart(),
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Wishlist                                                                   */
/* -------------------------------------------------------------------------- */

export function useWishlist() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: API_KEYS.wishlist(),

    queryFn: async (): Promise<WishlistItem[]> => {
      const response = await apiRequest<unknown>("/wishlist");

      /*
       * IMPORTANT:
       *
       * This prevents:
       *
       * (wishlistData ?? []).map is not a function
       *
       * because asArray() converts:
       *
       * []                    -> []
       * { data: [] }          -> []
       * { items: [] }         -> []
       * { wishlist: [] }      -> []
       * invalid response      -> []
       */
      return asArray<WishlistItem>(response);
    },

    enabled: isAuthenticated,

    placeholderData: [],
  });
}

export function useAddToWishlist() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      apiRequest<WishlistItem>("/wishlist", {
        method: "POST",
        body: JSON.stringify({
          productId,
        }),
      }),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: API_KEYS.wishlist(),
      });
    },
  });
}

export function useRemoveFromWishlist() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      apiRequest<ApiMessage>(`/wishlist/${productId}`, {
        method: "DELETE",
      }),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: API_KEYS.wishlist(),
      });
    },
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();

  const { data: wishlist = [] } = useWishlist();

  return useMutation({
    mutationFn: async (productId: string): Promise<void> => {
      /*
       * Extra runtime protection.
       *
       * Even if a malformed response somehow reaches this hook,
       * the frontend will not crash on .some().
       */
      const safeWishlist = Array.isArray(wishlist)
        ? wishlist
        : [];

      const isWishlisted = safeWishlist.some(
        (item) => item.productId === productId
      );

      if (isWishlisted) {
        await apiRequest<ApiMessage>(
          `/wishlist/${productId}`,
          {
            method: "DELETE",
          }
        );
      } else {
        await apiRequest<WishlistItem>(
          "/wishlist",
          {
            method: "POST",
            body: JSON.stringify({
              productId,
            }),
          }
        );
      }
    },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: API_KEYS.wishlist(),
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Addresses                                                                  */
/* -------------------------------------------------------------------------- */

export type CreateAddressPayload = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault?: boolean;
};

export function useAddresses() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: API_KEYS.addresses(),

    queryFn: async (): Promise<Address[]> => {
      const response = await apiRequest<unknown>("/addresses");

      return asArray<Address>(response);
    },

    enabled: isAuthenticated,

    placeholderData: [],
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateAddressPayload): Promise<Address> => {
      const response = await apiRequest<{ data?: Address } | Address>("/addresses", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response && typeof response === "object" && "data" in response && response.data) {
        return response.data;
      }

      return response as Address;
    },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: API_KEYS.addresses(),
      });
    },
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateAddressPayload>;
    }): Promise<Address> => {
      const response = await apiRequest<{ data?: Address } | Address>(`/addresses/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (response && typeof response === "object" && "data" in response && response.data) {
        return response.data;
      }

      return response as Address;
    },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: API_KEYS.addresses(),
      });
    },
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<ApiMessage>(`/addresses/${id}`, {
        method: "DELETE",
      }),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: API_KEYS.addresses(),
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

export function useOrders() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: API_KEYS.orders(),

    queryFn: async (): Promise<Order[]> => {
      const response = await apiRequest<unknown>("/orders");

      return asArray<Order>(response);
    },

    enabled: isAuthenticated,

    placeholderData: [],
  });
}

export function useOrder(id: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: API_KEYS.order(id),

    queryFn: async (): Promise<Order> => {
      const response = await apiRequest<unknown>(
        `/orders/${id}`
      );

      if (
        response &&
        typeof response === "object" &&
        "data" in response
      ) {
        return response.data as Order;
      }

      return response as Order;
    },

    enabled: isAuthenticated && Boolean(id),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<Order>(`/orders/${id}/cancel`, {
        method: "PATCH",
      }),

    onSuccess: (_, id) => {
      qc.invalidateQueries({
        queryKey: API_KEYS.orders(),
      });

      qc.invalidateQueries({
        queryKey: API_KEYS.order(id),
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Checkout                                                                   */
/* -------------------------------------------------------------------------- */

export function useCheckout() {
  return useMutation({
    mutationFn: async (payload: {
      addressId: string;
      couponCode?: string;
    }): Promise<CheckoutResponse> => {
      const response = await apiRequest<{ success?: boolean; data?: CheckoutResponse } | CheckoutResponse>("/checkout", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response && typeof response === "object" && "data" in response && response.data) {
        return response.data;
      }

      return response as CheckoutResponse;
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Payments                                                                   */
/* -------------------------------------------------------------------------- */

export function useCreatePayment() {
  return useMutation({
    mutationFn: async (payload: {
      addressId: string;
      couponCode?: string;
    }): Promise<CreatePaymentResponse> => {
      const response = await apiRequest<{ success?: boolean; data?: CreatePaymentResponse } | CreatePaymentResponse>(
        "/payments/create-order",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      if (response && typeof response === "object" && "data" in response && response.data) {
        return response.data;
      }

      return response as CreatePaymentResponse;
    },
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      providerOrderId: string;
      providerPaymentId: string;
      signature: string;
    }) =>
      apiRequest<Order>("/payments/verify", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    onSuccess: (order) => {
      qc.invalidateQueries({
        queryKey: API_KEYS.cart(),
      });

      qc.invalidateQueries({
        queryKey: API_KEYS.orders(),
      });

      qc.setQueryData(
        API_KEYS.order(order.id),
        order
      );
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Coupons                                                                    */
/* -------------------------------------------------------------------------- */

export function useApplyCoupon() {
  return useMutation({
    mutationFn: async (payload: {
      code: string;
      subtotal: number;
    }): Promise<ApplyCouponResponse> => {
      const response = await apiRequest<any>(
        "/coupons/apply",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const raw = (response && typeof response === "object" && "data" in response && response.data)
        ? response.data
        : response;

      return {
        code: raw.coupon?.code ?? payload.code,
        type: raw.coupon?.type ?? "FIXED",
        value: raw.coupon?.value ?? 0,
        discount: raw.discount ?? 0,
        subtotal: payload.subtotal,
        total: raw.finalAmount ?? Math.max(0, payload.subtotal - Number(raw.discount ?? 0)),
      };
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

export function useSettings() {
  return useQuery({
    queryKey: ["settings"] as const,
    queryFn: async (): Promise<StoreSettings> => {
      const response = await apiRequest<{ success?: boolean; data?: StoreSettings } | StoreSettings>("/settings");
      if (response && typeof response === "object" && "data" in response && response.data) {
        return response.data;
      }
      return response as StoreSettings;
    },
    staleTime: 60_000,
  });
}

/* -------------------------------------------------------------------------- */
/* Reviews                                                                    */
/* -------------------------------------------------------------------------- */

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: API_KEYS.reviews(productId),

    queryFn: async (): Promise<Review[]> => {
      const response = await apiRequest<unknown>(
        `/reviews/product/${productId}`
      );

      return asArray<Review>(response);
    },

    enabled: Boolean(productId),

    staleTime: 30_000,

    placeholderData: [],
  });
}

export function useCreateReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      productId: string;
      rating: number;
      title?: string;
      comment?: string;
      images?: string[];
    }) =>
      apiRequest<Review>("/reviews", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    onSuccess: (_, payload) => {
      qc.invalidateQueries({
        queryKey: API_KEYS.reviews(
          payload.productId
        ),
      });

      qc.invalidateQueries({
        queryKey: API_KEYS.product(
          payload.productId
        ),
      });
    },
  });
}