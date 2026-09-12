import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

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
  ProductRating,
  Review,
  StoreSettings,
  WishlistItem,
} from "@/lib/types";

import {
  apiRequest,
  asArray,
  ApiError,
} from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* Query keys                                                                 */
/* -------------------------------------------------------------------------- */

export const API_KEYS = {
  products: (params?: ProductQueryParams) =>
    ["products", params] as const,

  /**
   * Complete storefront catalogue.
   *
   * This is intentionally a single stable query key.
   *
   * Search, category, price filtering and sorting are all
   * performed locally by ProductBrowser.
   */
  productCatalogue: () =>
    ["products", "catalogue"] as const,

  product: (id: string) =>
    ["product", id] as const,

  productFeatured: () => [
    "products",
    "featured",
  ],

  categories: () =>
    ["categories"] as const,

  category: (id: string) =>
    ["category", id] as const,

  cart: () =>
    ["cart"] as const,

  wishlist: () =>
    ["wishlist"] as const,

  addresses: () =>
    ["addresses"] as const,

  orders: () =>
    ["orders"] as const,

  order: (id: string) =>
    ["order", id] as const,

  reviews: (productId: string) =>
    ["reviews", productId] as const,

  productRating: (productId: string) =>
    ["product-rating", productId] as const,
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeArray<T>(
  value: unknown,
): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (
    value &&
    typeof value === "object" &&
    "items" in value &&
    Array.isArray(
      (value as {
        items?: unknown;
      }).items,
    )
  ) {
    return (
      (value as {
        items: T[];
      }).items
    );
  }

  return [];
}

function queryString(
  params: ProductQueryParams,
) {
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

/**
 * Safely unwrap a product catalogue response.
 *
 * Supported backend shapes:
 *
 * { items: [...] }
 * { products: [...] }
 * { data: [...] }
 * { data: { items: [...] } }
 * { data: { products: [...] } }
 */
function normalizeProducts(
  response: unknown,
): Product[] {
  if (Array.isArray(response)) {
    return response as Product[];
  }

  if (
    !response ||
    typeof response !== "object"
  ) {
    return [];
  }

  const raw =
    response as Record<string, unknown>;

  if (Array.isArray(raw.items)) {
    return raw.items as Product[];
  }

  if (Array.isArray(raw.products)) {
    return raw.products as Product[];
  }

  if (Array.isArray(raw.data)) {
    return raw.data as Product[];
  }

  if (
    raw.data &&
    typeof raw.data === "object"
  ) {
    const nested =
      raw.data as Record<string, unknown>;

    if (Array.isArray(nested.items)) {
      return nested.items as Product[];
    }

    if (Array.isArray(nested.products)) {
      return nested.products as Product[];
    }
  }

  return [];
}

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Existing server-side products hook.
 *
 * KEEP THIS for places that genuinely need:
 * - pagination
 * - server-side search
 * - server-side category filtering
 * - server-side sorting
 *
 * Do NOT use this for the main storefront catalogue.
 */
export function useProducts(
  params: ProductQueryParams = {},
) {
  return useQuery({
    queryKey: API_KEYS.products(params),

    queryFn:
      async (): Promise<ProductListResponse> => {
        const response =
          await apiRequest<unknown>(
            `/products${queryString(params)}`,
          );

        if (
          response &&
          typeof response === "object" &&
          "items" in response &&
          Array.isArray(response.items)
        ) {
          const raw =
            response as {
              items: Product[];
              pagination?: {
                total?: number;
              };
            };

          return {
            products: raw.items,
            total:
              raw.pagination?.total ??
              raw.items.length,
          };
        }

        if (
          response &&
          typeof response === "object" &&
          "products" in response &&
          Array.isArray(response.products)
        ) {
          const raw =
            response as {
              products: Product[];
              total?: number;
            };

          return {
            products: raw.products,
            total:
              raw.total ??
              raw.products.length,
          };
        }

        return {
          products: [],
          total: 0,
        };
      },

    staleTime: 30_000,

    placeholderData: (
      previous,
    ) => previous,
  });
}

/**
 * Main storefront product catalogue.
 *
 * THIS is the hook ProductBrowser should use.
 *
 * The backend returns the complete active catalogue once.
 * React Query keeps that result cached.
 *
 * ProductBrowser then performs:
 *
 * - search
 * - category filtering
 * - price filtering
 * - sorting
 *
 * entirely in memory.
 *
 * Therefore:
 *
 * Search "ring"
 *     -> NO API REQUEST
 *
 * Click "Rings"
 *     -> NO API REQUEST
 *
 * Sort by price
 *     -> NO API REQUEST
 *
 * Change price range
 *     -> NO API REQUEST
 */
export function useProductCatalogue() {
  return useQuery({
    queryKey: API_KEYS.productCatalogue(),

    queryFn: async (): Promise<Product[]> => {
      const response =
        await apiRequest<unknown>(
          "/products/catalogue",
        );

      return normalizeProducts(response);
    },

    /**
     * The catalogue is the main storefront dataset.
     *
     * Keep it fresh enough for normal browsing, but do not
     * repeatedly hit the API while the customer navigates.
     */
    staleTime: 5 * 60 * 1000,

    /**
     * Keep the catalogue available in memory for 30 minutes
     * after the last component stops using it.
     *
     * Returning to All Jewellery within this period should
     * therefore be essentially instant.
     */
    gcTime: 30 * 60 * 1000,

    /**
     * Do not reload the entire catalogue merely because the
     * customer switches browser tabs.
     */
    refetchOnWindowFocus: false,

    /**
     * If ProductBrowser unmounts/remounts during navigation,
     * don't immediately fire another request while the cached
     * data is still fresh.
     */
    refetchOnMount: false,

    /**
     * Reconnects are allowed to refresh stale catalogue data,
     * but a healthy cached catalogue should continue rendering.
     */
    refetchOnReconnect: true,

    /**
     * Do not retry client errors such as 401/403/404.
     *
     * Server/network failures get one retry instead of
     * hammering the API three times.
     */
    retry: (
      failureCount,
      error,
    ) => {
      if (failureCount >= 1) {
        return false;
      }

      if (error instanceof ApiError) {
        return error.status >= 500;
      }

      return true;
    },

    /**
     * Keep already-loaded products visible during a background
     * refetch so the customer never gets an empty product grid
     * merely because a refresh is happening.
     */
    placeholderData: (
      previous,
    ) => previous ?? [],
  });
}

export type FeaturedProduct = {
  product: Product;
  badge: "Bestseller" | "New";
};

export function useFeaturedProducts() {
  return useQuery({
    queryKey:
      API_KEYS.productFeatured(),

    queryFn: async () => {
      const response =
        await apiRequest<{
          items?: FeaturedProduct[];
        }>(
          "/products/featured",
        );

      return Array.isArray(
        response?.items,
      )
        ? response.items
        : [];
    },

    staleTime:
      10 * 60 * 1000,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: API_KEYS.product(id),

    queryFn:
      async (): Promise<Product> => {
        const response =
          await apiRequest<unknown>(
            `/products/${id}`,
          );

        /*
         * Supports:
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
          return (
            response.data as Product
          );
        }

        return response as Product;
      },

    enabled: Boolean(id),

    staleTime: 30_000,

    gcTime: 10 * 60 * 1000,

    refetchOnWindowFocus: false,
  });
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

export function useCategories() {
  return useQuery({
    queryKey: API_KEYS.categories(),

    queryFn:
      async (): Promise<Category[]> => {
        const response =
          await apiRequest<unknown>(
            "/categories",
          );

        return asArray<Category>(
          response,
        );
      },

    /**
     * Categories change very rarely compared
     * with normal browsing activity.
     */
    staleTime: 10 * 60 * 1000,

    gcTime: 30 * 60 * 1000,

    refetchOnWindowFocus: false,

    placeholderData: [],
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: API_KEYS.category(id),

    queryFn:
      async (): Promise<Category> => {
        const response =
          await apiRequest<unknown>(
            `/categories/${id}`,
          );

        if (
          response &&
          typeof response === "object" &&
          "data" in response
        ) {
          return (
            response.data as Category
          );
        }

        return response as Category;
      },

    enabled: Boolean(id),

    staleTime: 10 * 60 * 1000,

    gcTime: 30 * 60 * 1000,

    refetchOnWindowFocus: false,
  });
}

/* -------------------------------------------------------------------------- */
/* Cart                                                                       */
/* -------------------------------------------------------------------------- */

export function useCart() {
  const { isAuthenticated } =
    useAuth();

  return useQuery({
    queryKey: API_KEYS.cart(),

    queryFn:
      async (): Promise<Cart> => {
        const response =
          await apiRequest<unknown>(
            "/cart",
          );

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
          typeof response.data ===
          "object" &&
          "items" in response.data &&
          Array.isArray(
            response.data.items,
          )
        ) {
          return response.data as Cart;
        }

        return {
          items: [],
        } as unknown as Cart;
      },

    enabled: isAuthenticated,

    placeholderData: {
      items: [],
    } as unknown as Cart,

    refetchOnWindowFocus: false,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      productId: string;
      quantity: number;
    }) =>
      apiRequest<CartItem>(
        "/cart",
        {
          method: "POST",
          body: JSON.stringify(
            payload,
          ),
        },
      ),

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
      apiRequest<CartItem>(
        `/cart/${itemId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            quantity,
          }),
        },
      ),

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
      apiRequest<ApiMessage>(
        `/cart/${id}`,
        {
          method: "DELETE",
        },
      ),

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
  const { isAuthenticated } =
    useAuth();

  return useQuery({
    queryKey: API_KEYS.wishlist(),

    queryFn:
      async (): Promise<
        WishlistItem[]
      > => {
        const response =
          await apiRequest<unknown>(
            "/wishlist",
          );

        return asArray<WishlistItem>(
          response,
        );
      },

    enabled: isAuthenticated,

    placeholderData: [],

    refetchOnWindowFocus: false,
  });
}

export function useAddToWishlist() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      apiRequest<WishlistItem>(
        "/wishlist",
        {
          method: "POST",
          body: JSON.stringify({
            productId,
          }),
        },
      ),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey:
          API_KEYS.wishlist(),
      });
    },
  });
}

export function useRemoveFromWishlist() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      apiRequest<ApiMessage>(
        `/wishlist/${productId}`,
        {
          method: "DELETE",
        },
      ),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey:
          API_KEYS.wishlist(),
      });
    },
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();

  const {
    data: wishlist = [],
  } = useWishlist();

  return useMutation({
    mutationFn:
      async (
        productId: string,
      ): Promise<void> => {
        const safeWishlist =
          Array.isArray(wishlist)
            ? wishlist
            : [];

        const isWishlisted =
          safeWishlist.some(
            (item) =>
              item.productId ===
              productId,
          );

        if (isWishlisted) {
          await apiRequest<ApiMessage>(
            `/wishlist/${productId}`,
            {
              method: "DELETE",
            },
          );
        } else {
          await apiRequest<WishlistItem>(
            "/wishlist",
            {
              method: "POST",
              body: JSON.stringify({
                productId,
              }),
            },
          );
        }
      },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey:
          API_KEYS.wishlist(),
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

export async function checkShippingServiceability(pincode: string) {
  const response = await apiRequest<unknown>(
    `/shipping/serviceability/${encodeURIComponent(pincode)}`,
  );
  return response as {
    pincode: string;
    isServiceable: boolean;
    prePaid: boolean;
    cod: boolean;
    remarks?: string;
    expectedDeliveryDays?: number;
    transitDays?: number;
    estimatedDelivery?: string;
    availableServices?: string[];
  };
}

export async function calculateShippingRate(input: {
  pincode: string;
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}) {
  const response = await apiRequest<unknown>("/shipping/calculate-rate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return response as {
    pincode: string;
    isServiceable: boolean;
    rate: number;
    weightGrams: number;
    billableWeightGrams: number;
    transitDays?: number;
    estimatedDelivery?: string;
    courier: string;
    remarks?: string;
  };
}

export function useAddresses() {
  const { isAuthenticated } =
    useAuth();

  return useQuery({
    queryKey:
      API_KEYS.addresses(),

    queryFn:
      async (): Promise<Address[]> => {
        const response =
          await apiRequest<unknown>(
            "/addresses",
          );

        return asArray<Address>(
          response,
        );
      },

    enabled: isAuthenticated,

    placeholderData: [],

    refetchOnWindowFocus: false,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn:
      async (
        payload: CreateAddressPayload,
      ): Promise<Address> => {
        const response =
          await apiRequest<
            { data?: Address } | Address
          >(
            "/addresses",
            {
              method: "POST",
              body: JSON.stringify(
                payload,
              ),
            },
          );

        if (
          response &&
          typeof response === "object" &&
          "data" in response &&
          response.data
        ) {
          return response.data;
        }

        return response as Address;
      },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey:
          API_KEYS.addresses(),
      });
    },
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn:
      async ({
        id,
        data,
      }: {
        id: string;
        data: Partial<CreateAddressPayload>;
      }): Promise<Address> => {
        const response =
          await apiRequest<
            { data?: Address } | Address
          >(
            `/addresses/${id}`,
            {
              method: "PUT",
              body: JSON.stringify(
                data,
              ),
            },
          );

        if (
          response &&
          typeof response === "object" &&
          "data" in response &&
          response.data
        ) {
          return response.data;
        }

        return response as Address;
      },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey:
          API_KEYS.addresses(),
      });
    },
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<ApiMessage>(
        `/addresses/${id}`,
        {
          method: "DELETE",
        },
      ),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey:
          API_KEYS.addresses(),
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

export function useOrders() {
  const { isAuthenticated } =
    useAuth();

  return useQuery({
    queryKey: API_KEYS.orders(),

    queryFn:
      async (): Promise<Order[]> => {
        const response =
          await apiRequest<unknown>(
            "/orders",
          );

        return asArray<Order>(
          response,
        );
      },

    enabled: isAuthenticated,

    placeholderData: [],

    refetchOnWindowFocus: false,
  });
}

export function useOrder(id: string) {
  const { isAuthenticated } =
    useAuth();

  return useQuery({
    queryKey: API_KEYS.order(id),

    queryFn:
      async (): Promise<Order> => {
        const response =
          await apiRequest<unknown>(
            `/orders/${id}`,
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

    enabled:
      isAuthenticated &&
      Boolean(id),

    refetchOnWindowFocus: false,
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<Order>(
        `/orders/${id}/cancel`,
        {
          method: "PATCH",
        },
      ),

    onSuccess: (_, id) => {
      qc.invalidateQueries({
        queryKey: API_KEYS.orders(),
      });

      qc.invalidateQueries({
        queryKey:
          API_KEYS.order(id),
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Checkout                                                                   */
/* -------------------------------------------------------------------------- */

export function useCheckout() {
  return useMutation({
    mutationFn:
      async (payload: {
        addressId: string;
        couponCode?: string;
      }): Promise<CheckoutResponse> => {
        const response =
          await apiRequest<
            {
              success?: boolean;
              data?: CheckoutResponse;
            } | CheckoutResponse
          >(
            "/checkout",
            {
              method: "POST",
              body: JSON.stringify(
                payload,
              ),
            },
          );

        if (
          response &&
          typeof response === "object" &&
          "data" in response &&
          response.data
        ) {
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
    mutationFn:
      async (payload: {
        addressId: string;
        couponCode?: string;
      }): Promise<CreatePaymentResponse> => {
        const response =
          await apiRequest<
            {
              success?: boolean;
              data?: CreatePaymentResponse;
            } | CreatePaymentResponse
          >(
            "/payments/create-order",
            {
              method: "POST",
              body: JSON.stringify(
                payload,
              ),
            },
          );

        if (
          response &&
          typeof response === "object" &&
          "data" in response &&
          response.data
        ) {
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

    onSuccess: async (order) => {
      qc.setQueryData<Cart>(
        API_KEYS.cart(),
        (current) =>
          current
            ? {
              ...current,
              items: [],
            }
            : current,
      );

      await qc.invalidateQueries({
        queryKey: API_KEYS.cart(),
      });

      await qc.invalidateQueries({
        queryKey: API_KEYS.orders(),
      });

      qc.setQueryData(
        API_KEYS.order(order.id),
        order,
      );
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Coupons                                                                    */
/* -------------------------------------------------------------------------- */

export function useApplyCoupon() {
  return useMutation({
    mutationFn:
      async (payload: {
        code: string;
        subtotal: number;
      }): Promise<ApplyCouponResponse> => {
        const response =
          await apiRequest<unknown>(
            "/coupons/apply",
            {
              method: "POST",
              body: JSON.stringify(
                payload,
              ),
            },
          );

        const raw =
          response &&
            typeof response === "object" &&
            "data" in response &&
            response.data
            ? response.data
            : response;

        const data =
          raw as {
            coupon?: {
              code?: string;
              type?:
              | "PERCENTAGE"
              | "FIXED";
              value?: number | string;
            };
            discount?: number | string;
            finalAmount?: number | string;
          };

        return {
          code:
            data.coupon?.code ??
            payload.code,

          type:
            data.coupon?.type ??
            "FIXED",

          value:
            data.coupon?.value ??
            0,

          discount:
            data.discount ??
            0,

          subtotal:
            payload.subtotal,

          total:
            data.finalAmount ??
            Math.max(
              0,
              payload.subtotal -
              Number(
                data.discount ?? 0,
              ),
            ),
        };
      },
  });
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

export function useSettings() {
  return useQuery({
    queryKey:
      ["settings"] as const,

    queryFn:
      async (): Promise<StoreSettings> => {
        const response =
          await apiRequest<
            {
              success?: boolean;
              data?: StoreSettings;
            } | StoreSettings
          >("/settings");

        if (
          response &&
          typeof response === "object" &&
          "data" in response &&
          response.data
        ) {
          return response.data;
        }

        return response as StoreSettings;
      },

    staleTime: 10 * 60 * 1000,

    gcTime: 30 * 60 * 1000,

    refetchOnWindowFocus: false,
  });
}

/* -------------------------------------------------------------------------- */
/* Reviews                                                                    */
/* -------------------------------------------------------------------------- */

export function useProductReviews(
  productId: string,
) {
  return useQuery({
    queryKey:
      API_KEYS.reviews(productId),

    queryFn:
      async (): Promise<Review[]> => {
        const response =
          await apiRequest<unknown>(
            `/reviews/product/${productId}`,
          );

        return asArray<Review>(
          response,
        );
      },

    enabled: Boolean(productId),

    staleTime: 30_000,

    gcTime: 10 * 60 * 1000,

    refetchOnWindowFocus: false,

    placeholderData: [],
  });
}

export function useProductRating(
  productId: string,
) {
  return useQuery({
    queryKey:
      API_KEYS.productRating(productId),

    queryFn:
      async (): Promise<ProductRating> => {
        const response =
          await apiRequest<unknown>(
            `/reviews/product/${productId}/rating`,
          );

        const raw =
          response &&
            typeof response === "object"
            ? response as Record<string, unknown>
            : {};

        const data =
          raw.data &&
            typeof raw.data === "object"
            ? raw.data as Record<string, unknown>
            : raw;

        const nestedAverage =
          data._avg &&
            typeof data._avg === "object"
            ? (data._avg as Record<string, unknown>).rating
            : undefined;

        const nestedCount =
          data._count &&
            typeof data._count === "object"
            ? (data._count as Record<string, unknown>).rating
            : undefined;

        const average = Number(
          data.average ??
          data.avg ??
          nestedAverage ??
          0,
        );

        const count = Number(
          data.count ??
          nestedCount ??
          0,
        );

        return {
          average: Number.isFinite(average) ? average : 0,
          count: Number.isFinite(count) ? count : 0,
        };
      },

    enabled: Boolean(productId),

    staleTime: 30_000,

    gcTime: 10 * 60 * 1000,

    refetchOnWindowFocus: false,

    placeholderData: {
      average: 0,
      count: 0,
    },
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
      apiRequest<Review>(
        "/reviews",
        {
          method: "POST",
          body: JSON.stringify(
            payload,
          ),
        },
      ),

    onSuccess: (_, payload) => {
      qc.invalidateQueries({
        queryKey:
          API_KEYS.reviews(
            payload.productId,
          ),
      });

      qc.invalidateQueries({
        queryKey:
          API_KEYS.product(
            payload.productId,
          ),
      });

      qc.invalidateQueries({
        queryKey:
          API_KEYS.productRating(
            payload.productId,
          ),
      });
    },
  });
}