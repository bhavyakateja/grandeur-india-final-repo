export const CacheKeys = {
    /**
     * ------------------------------------------------------------------------
     * Products
     * ------------------------------------------------------------------------
     */

    product: (id: string) =>
        `product:${id}`,

    products: (
        page: number,
        limit: number,
        query = "",
    ) =>
        `products:${page}:${limit}:${query}`,

    /**
     * Complete storefront catalogue.
     *
     * This is deliberately a single stable key because the storefront
     * performs search/filter/sort/pagination on the client.
     */
    productCatalogue: () =>
        "product-catalogue",

    /**
 * Homepage featured products.
 *
 * Uses a stable key because the homepage only needs one dynamically
 * selected set of up to 6 products.
 */
    productFeatured: () =>
        "products:featured",

    /**
     * ------------------------------------------------------------------------
     * Categories
     * ------------------------------------------------------------------------
     */

    category: (id: string) =>
        `category:${id}`,

    categories: () =>
        "categories",

    /**
     * ------------------------------------------------------------------------
     * User
     * ------------------------------------------------------------------------
     */

    user: (id: string) =>
        `user:${id}`,

    /**
     * ------------------------------------------------------------------------
     * Cart / wishlist
     * ------------------------------------------------------------------------
     */

    cart: (userId: string) =>
        `cart:${userId}`,

    wishlist: (userId: string) =>
        `wishlist:${userId}`,

    /**
     * ------------------------------------------------------------------------
     * Reviews
     * ------------------------------------------------------------------------
     */

    productReviews: (productId: string) =>
        `product-reviews:${productId}`,

    productRating: (productId: string) =>
        `product-rating:${productId}`,

    /**
     * ------------------------------------------------------------------------
     * Store settings
     * ------------------------------------------------------------------------
     */

    settings: () =>
        "store-settings",
};