type JsonSchema = Record<string, unknown>;

type Operation = {
  tags: string[];
  summary: string;
  description?: string;
  security?: Array<Record<string, string[]>>;
  parameters?: Array<Record<string, unknown>>;
  requestBody?: Record<string, unknown>;
  responses: Record<string, Record<string, unknown>>;
};

type PathItem = Partial<Record<"get" | "post" | "put" | "patch" | "delete", Operation>>;

const bearerAuth = [{ bearerAuth: [] }];
const jsonResponse = (description: string): Record<string, unknown> => ({
  description,
  content: { "application/json": { schema: { type: "object" } } },
});
const pdfResponse = (description: string): Record<string, unknown> => ({
  description,
  content: { "application/pdf": { schema: { type: "string", format: "binary" } } },
});
const responses = (successStatus = "200", description = "Successful response"): Record<string, Record<string, unknown>> => ({
  [successStatus]: jsonResponse(description),
  "400": { $ref: "#/components/responses/BadRequest" },
  "401": { $ref: "#/components/responses/Unauthorized" },
  "404": { $ref: "#/components/responses/NotFound" },
  "500": { $ref: "#/components/responses/InternalError" },
});
const body = (schema: JsonSchema, description: string): Record<string, unknown> => ({
  required: true,
  description,
  content: { "application/json": { schema } },
});
const pathParameter = (name: string): Record<string, unknown> => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string" },
});

const schemas = {
  signup: { type: "object", required: ["name", "email", "password"], properties: { name: { type: "string", minLength: 3, maxLength: 100 }, email: { type: "string", format: "email" }, password: { type: "string", minLength: 8, maxLength: 100, format: "password" } } },
  login: { type: "object", required: ["email", "password"], properties: { email: { type: "string", format: "email" }, password: { type: "string", minLength: 8, maxLength: 100, format: "password" } } },
  address: { type: "object", required: ["fullName", "phone", "addressLine1", "city", "state", "country", "postalCode"], properties: { fullName: { type: "string" }, phone: { type: "string", pattern: "^[6-9]\\d{9}$" }, addressLine1: { type: "string" }, addressLine2: { type: "string" }, city: { type: "string" }, state: { type: "string" }, country: { type: "string" }, postalCode: { type: "string", pattern: "^\\d{6}$" }, isDefault: { type: "boolean" } } },
  cartItem: { type: "object", required: ["productId", "quantity"], properties: { productId: { type: "string" }, quantity: { type: "integer", minimum: 1, maximum: 10 } } },
  quantity: { type: "object", required: ["quantity"], properties: { quantity: { type: "integer", minimum: 1, maximum: 10 } } },
  product: { type: "object", required: ["name", "description", "price", "stock", "categoryId"], properties: { name: { type: "string" }, description: { type: "string" }, price: { type: "number", minimum: 0 }, stock: { type: "integer", minimum: 0 }, categoryId: { type: "string" }, status: { type: "string", enum: ["DRAFT", "ACTIVE", "OUT_OF_STOCK", "ARCHIVED"] } } },
  category: { type: "object", required: ["name"], properties: { name: { type: "string", minLength: 2, maxLength: 100 }, isActive: { type: "boolean" } } },
  checkout: { type: "object", required: ["addressId"], properties: { addressId: { type: "string" }, couponCode: { type: "string" } } },
  coupon: { type: "object", required: ["code", "type", "value"], properties: { code: { type: "string", minLength: 3, maxLength: 30 }, description: { type: "string" }, type: { type: "string", enum: ["PERCENTAGE", "FIXED"] }, value: { type: "number", exclusiveMinimum: 0 }, minimumOrderAmount: { type: "number", minimum: 0 }, maximumDiscount: { type: "number", exclusiveMinimum: 0 }, usageLimit: { type: "integer", minimum: 1 }, startsAt: { type: "string", format: "date-time" }, expiresAt: { type: "string", format: "date-time" }, isActive: { type: "boolean" } } },
  applyCoupon: { type: "object", required: ["code", "subtotal"], properties: { code: { type: "string" }, subtotal: { type: "number", exclusiveMinimum: 0 } } },
  payment: { type: "object", required: ["addressId"], properties: { addressId: { type: "string" }, couponCode: { type: "string" } } },
  verifyPayment: { type: "object", required: ["providerOrderId", "providerPaymentId", "signature"], properties: { providerOrderId: { type: "string" }, providerPaymentId: { type: "string" }, signature: { type: "string" } } },
  review: { type: "object", required: ["productId", "rating"], properties: { productId: { type: "string" }, rating: { type: "integer", minimum: 1, maximum: 5 }, title: { type: "string", maxLength: 100 }, comment: { type: "string", maxLength: 1000 }, images: { type: "array", items: { type: "string", format: "uri" }, maxItems: 5 } } },
  reviewUpdate: { type: "object", properties: { rating: { type: "integer", minimum: 1, maximum: 5 }, title: { type: "string", maxLength: 100 }, comment: { type: "string", maxLength: 1000 }, images: { type: "array", items: { type: "string", format: "uri" }, maxItems: 5 } } },
  stock: { type: "object", required: ["stock"], properties: { stock: { type: "integer", minimum: 0 } } },
  notification: { type: "object", required: ["to", "message"], properties: { to: { type: "string" }, subject: { type: "string" }, message: { type: "string" } } },
} satisfies Record<string, JsonSchema>;

export const openApiDocument = {
  openapi: "3.1.0",
  info: { title: "grandeur India E-Commerce API", version: "1.0.0", description: "Production e-commerce backend API." },
  servers: [{ url: "/", description: "Current deployment" }],
  tags: [
    { name: "Operations" }, { name: "Authentication" }, { name: "Products" }, { name: "Categories" },
    { name: "Addresses" }, { name: "Cart" }, { name: "Wishlist" }, { name: "Checkout" }, { name: "Coupons" },
    { name: "Orders" }, { name: "Payments" }, { name: "Reviews" }, { name: "Inventory" }, { name: "Notifications" },
    { name: "Upload" }, { name: "Invoices" },
  ],
  paths: {
    "/live": { get: { tags: ["Operations"], summary: "Liveness probe", responses: { "200": jsonResponse("Process is live") } } },
    "/ready": { get: { tags: ["Operations"], summary: "Readiness probe", description: "Checks PostgreSQL, Redis, BullMQ, and Cloudinary.", responses: { "200": jsonResponse("All dependencies are healthy"), "503": jsonResponse("One or more dependencies are unhealthy") } } },
    "/health": { get: { tags: ["Operations"], summary: "Dependency health summary", responses: { "200": jsonResponse("All dependencies are healthy"), "503": jsonResponse("One or more dependencies are unhealthy") } } },
    "/metrics": { get: { tags: ["Operations"], summary: "Prometheus metrics", responses: { "200": { description: "Prometheus exposition format", content: { "text/plain": { schema: { type: "string" } } } } } } },
    "/api/v1/health": { get: { tags: ["Operations"], summary: "Legacy API health probe", responses: { "200": jsonResponse("API is healthy") } } },
    "/api/v1/auth/signup": { post: { tags: ["Authentication"], summary: "Create an account", requestBody: body(schemas.signup, "Registration details"), responses: responses("201", "Account created") } },
    "/api/v1/auth/login": { post: { tags: ["Authentication"], summary: "Authenticate an account", requestBody: body(schemas.login, "Credentials"), responses: responses() } },
    "/api/v1/auth/me": { get: { tags: ["Authentication"], summary: "Get current profile", security: bearerAuth, responses: responses() } },
    "/api/v1/products": {
      get: { tags: ["Products"], summary: "List products", parameters: [{ name: "page", in: "query", schema: { type: "integer", minimum: 1 } }, { name: "limit", in: "query", schema: { type: "integer", minimum: 1 } }], responses: responses() },
      post: { tags: ["Products"], summary: "Create product", security: bearerAuth, requestBody: body(schemas.product, "Product details"), responses: responses("201", "Product created") },
    },
    "/api/v1/products/{id}": { get: { tags: ["Products"], summary: "Get product", parameters: [pathParameter("id")], responses: responses() }, put: { tags: ["Products"], summary: "Update product", security: bearerAuth, parameters: [pathParameter("id")], requestBody: body(schemas.product, "Product changes"), responses: responses() }, delete: { tags: ["Products"], summary: "Delete product", security: bearerAuth, parameters: [pathParameter("id")], responses: responses() } },
    "/api/v1/categories": { get: { tags: ["Categories"], summary: "List categories", parameters: [{ name: "search", in: "query", schema: { type: "string" } }], responses: responses() }, post: { tags: ["Categories"], summary: "Create category", security: bearerAuth, requestBody: body(schemas.category, "Category details"), responses: responses("201", "Category created") } },
    "/api/v1/categories/{id}": { get: { tags: ["Categories"], summary: "Get category", parameters: [pathParameter("id")], responses: responses() }, put: { tags: ["Categories"], summary: "Update category", security: bearerAuth, parameters: [pathParameter("id")], requestBody: body(schemas.category, "Category changes"), responses: responses() }, delete: { tags: ["Categories"], summary: "Delete category", security: bearerAuth, parameters: [pathParameter("id")], responses: responses() } },
    "/api/v1/addresses": { get: { tags: ["Addresses"], summary: "List current user addresses", security: bearerAuth, responses: responses() }, post: { tags: ["Addresses"], summary: "Create address", security: bearerAuth, requestBody: body(schemas.address, "Address details"), responses: responses("201", "Address created") } },
    "/api/v1/addresses/{id}": { put: { tags: ["Addresses"], summary: "Update address", security: bearerAuth, parameters: [pathParameter("id")], requestBody: body(schemas.address, "Address changes"), responses: responses() }, delete: { tags: ["Addresses"], summary: "Delete address", security: bearerAuth, parameters: [pathParameter("id")], responses: responses() } },
    "/api/v1/cart": { get: { tags: ["Cart"], summary: "Get cart", security: bearerAuth, responses: responses() }, post: { tags: ["Cart"], summary: "Add cart item", security: bearerAuth, requestBody: body(schemas.cartItem, "Cart item"), responses: responses("201", "Cart item added") } },
    "/api/v1/cart/{itemId}": { put: { tags: ["Cart"], summary: "Update cart item", security: bearerAuth, parameters: [pathParameter("itemId")], requestBody: body(schemas.quantity, "New quantity"), responses: responses() }, delete: { tags: ["Cart"], summary: "Remove cart item", security: bearerAuth, parameters: [pathParameter("itemId")], responses: responses() } },
    "/api/v1/wishlist": { get: { tags: ["Wishlist"], summary: "Get wishlist", security: bearerAuth, responses: responses() }, post: { tags: ["Wishlist"], summary: "Add wishlist item", security: bearerAuth, requestBody: body({ type: "object", required: ["productId"], properties: { productId: { type: "string" } } }, "Wishlist item"), responses: responses("201", "Wishlist item added") } },
    "/api/v1/wishlist/{productId}": { delete: { tags: ["Wishlist"], summary: "Remove wishlist item", security: bearerAuth, parameters: [pathParameter("productId")], responses: responses() } },
    "/api/v1/checkout": { post: { tags: ["Checkout"], summary: "Calculate checkout", security: bearerAuth, requestBody: body(schemas.checkout, "Checkout request"), responses: responses() } },
    "/api/v1/coupons/apply": { post: { tags: ["Coupons"], summary: "Apply coupon", security: bearerAuth, requestBody: body(schemas.applyCoupon, "Coupon and subtotal"), responses: responses() } },
    "/api/v1/coupons": { get: { tags: ["Coupons"], summary: "List coupons", security: bearerAuth, responses: responses() }, post: { tags: ["Coupons"], summary: "Create coupon", security: bearerAuth, requestBody: body(schemas.coupon, "Coupon details"), responses: responses("201", "Coupon created") } },
    "/api/v1/coupons/{id}": { get: { tags: ["Coupons"], summary: "Get coupon", security: bearerAuth, parameters: [pathParameter("id")], responses: responses() }, patch: { tags: ["Coupons"], summary: "Update coupon", security: bearerAuth, parameters: [pathParameter("id")], requestBody: body(schemas.coupon, "Coupon changes"), responses: responses() }, delete: { tags: ["Coupons"], summary: "Delete coupon", security: bearerAuth, parameters: [pathParameter("id")], responses: responses() } },
    "/api/v1/orders": { get: { tags: ["Orders"], summary: "List current user orders", security: bearerAuth, responses: responses() } },
    "/api/v1/orders/{id}": { get: { tags: ["Orders"], summary: "Get order", security: bearerAuth, parameters: [pathParameter("id")], responses: responses() } },
    "/api/v1/orders/{id}/cancel": { patch: { tags: ["Orders"], summary: "Cancel pending order", security: bearerAuth, parameters: [pathParameter("id")], responses: responses() } },
    "/api/v1/payments/create-order": { post: { tags: ["Payments"], summary: "Create payment order", security: bearerAuth, requestBody: body(schemas.payment, "Payment details"), responses: responses("201", "Payment order created") } },
    "/api/v1/payments/verify": { post: { tags: ["Payments"], summary: "Verify payment", security: bearerAuth, requestBody: body(schemas.verifyPayment, "Provider verification payload"), responses: responses() } },
    "/api/v1/payments/{id}": { get: { tags: ["Payments"], summary: "Get payment", security: bearerAuth, parameters: [pathParameter("id")], responses: responses() } },
    "/api/v1/payments/webhook/razorpay": { post: { tags: ["Payments"], summary: "Razorpay webhook", parameters: [{ name: "x-razorpay-signature", in: "header", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } }, responses: responses() } },
    "/api/v1/payments/webhook/stripe": { post: { tags: ["Payments"], summary: "Stripe webhook", parameters: [{ name: "stripe-signature", in: "header", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } }, responses: responses() } },
    "/api/v1/reviews": { post: { tags: ["Reviews"], summary: "Create review", security: bearerAuth, requestBody: body(schemas.review, "Review details"), responses: responses("201", "Review created") } },
    "/api/v1/reviews/product/{productId}": { get: { tags: ["Reviews"], summary: "List product reviews", security: bearerAuth, parameters: [pathParameter("productId")], responses: responses() } },
    "/api/v1/reviews/product/{productId}/rating": { get: { tags: ["Reviews"], summary: "Get product rating", security: bearerAuth, parameters: [pathParameter("productId")], responses: responses() } },
    "/api/v1/reviews/{id}": { get: { tags: ["Reviews"], summary: "Get review", security: bearerAuth, parameters: [pathParameter("id")], responses: responses() }, patch: { tags: ["Reviews"], summary: "Update review", security: bearerAuth, parameters: [pathParameter("id")], requestBody: body(schemas.reviewUpdate, "Review changes"), responses: responses() }, delete: { tags: ["Reviews"], summary: "Delete review", security: bearerAuth, parameters: [pathParameter("id")], responses: responses() } },
    "/api/v1/upload": { post: { tags: ["Upload"], summary: "Upload file", security: bearerAuth, requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary" }, folder: { type: "string", default: "products" } } } } } }, responses: responses() } },
    "/api/v1/notifications/email": { post: { tags: ["Notifications"], summary: "Queue email notification", security: bearerAuth, requestBody: body({ ...schemas.notification, required: ["to", "subject", "message"] }, "Email notification"), responses: responses("202", "Email queued") } },
    "/api/v1/notifications/sms": { post: { tags: ["Notifications"], summary: "Send SMS notification", security: bearerAuth, requestBody: body(schemas.notification, "SMS notification"), responses: responses() } },
    "/api/v1/notifications/push": { post: { tags: ["Notifications"], summary: "Send push notification", security: bearerAuth, requestBody: body(schemas.notification, "Push notification"), responses: responses() } },
    "/api/v1/invoice": { post: { tags: ["Invoices"], summary: "Generate invoice PDF", security: bearerAuth, requestBody: body({ type: "object" }, "Invoice data"), responses: { "200": pdfResponse("Generated invoice"), "401": { $ref: "#/components/responses/Unauthorized" }, "500": { $ref: "#/components/responses/InternalError" } } } },
    "/api/v1/inventory/{productId}": { get: { tags: ["Inventory"], summary: "Check product stock", security: bearerAuth, parameters: [pathParameter("productId")], responses: responses() }, patch: { tags: ["Inventory"], summary: "Set product stock", security: bearerAuth, parameters: [pathParameter("productId")], requestBody: body(schemas.stock, "Stock value"), responses: responses() } },
  } satisfies Record<string, PathItem>,
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    responses: {
      BadRequest: jsonResponse("Invalid request"),
      Unauthorized: jsonResponse("Authentication required or invalid"),
      NotFound: jsonResponse("Resource not found"),
      InternalError: jsonResponse("Unexpected server error"),
    },
  },
};
