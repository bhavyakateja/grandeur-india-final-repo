export const CacheKeys = {

    product: (id: string) =>
        `product:${id}`,

    products: (page: number, limit: number, query = "") =>
        `products:${page}:${limit}:${query}`,

    category: (id: string) =>
        `category:${id}`,

    categories: () =>
        "categories",

    user: (id: string) =>
        `user:${id}`,

    cart: (userId: string) =>
        `cart:${userId}`,

    wishlist: (userId: string) =>
        `wishlist:${userId}`,

    productReviews: (productId: string) =>
        `product-reviews:${productId}`,

    productRating: (productId: string) =>
        `product-rating:${productId}`,
};
