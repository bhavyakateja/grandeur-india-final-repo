import { Hono } from "hono";

import * as controller from "./controller";

import { authMiddleware } from "../../middleware/authMiddleware";
import { roleMiddleware } from "../../middleware/roleMiddleware";

export const adminRouter = new Hono();

adminRouter.use("*", authMiddleware);
adminRouter.use(
  "*",
  roleMiddleware("ADMIN"),
);

adminRouter.get(
  "/dashboard",
  controller.dashboard,
);

adminRouter.get(
  "/analytics",
  controller.analytics,
);

// Users
adminRouter.get(
  "/users",
  controller.listUsers,
);

adminRouter.get(
  "/users/:id",
  controller.getUser,
);

adminRouter.patch(
  "/users/:id",
  controller.updateUser,
);

adminRouter.delete(
  "/users/:id",
  controller.deleteUser,
);

// Orders
adminRouter.get(
  "/orders",
  controller.listOrders,
);

adminRouter.get(
  "/orders/:id",
  controller.getOrder,
);

adminRouter.patch(
  "/orders/:id/status",
  controller.updateOrderStatus,
);

// Reviews
adminRouter.get(
  "/reviews",
  controller.listReviews,
);

adminRouter.patch(
  "/reviews/:id/status",
  controller.updateReviewStatus,
);

adminRouter.delete(
  "/reviews/:id",
  controller.deleteReview,
);

// Product images
adminRouter.get(
  "/products/:productId/images/upload-signature",
  controller.getProductImageUploadSignature,
);

adminRouter.post(
  "/products/:productId/images",
  controller.attachProductImages,
);

adminRouter.patch(
  "/products/:productId/images/:imageId",
  controller.setPrimaryProductImage,
);

adminRouter.delete(
  "/products/:productId/images/:imageId",
  controller.deleteProductImage,
);

// Payments
adminRouter.get(
  "/payments",
  controller.listPayments,
);

adminRouter.post(
  "/payments/:id/refund",
  controller.refundPayment,
);

// Shipping
adminRouter.post(
  "/orders/:id/shipment",
  controller.createShipment,
);

adminRouter.post(
  "/orders/:id/ship-bluedart",
  controller.createShipment,
);

adminRouter.post(
  "/orders/:id/ship-delhivery",
  controller.createShipment,
);

adminRouter.post(
  "/orders/:id/cancel-shipment",
  controller.cancelShipment,
);

adminRouter.post(
  "/orders/:id/register-pickup",
  controller.registerPickup,
);

adminRouter.post(
  "/orders/:id/cancel-pickup/:token",
  controller.cancelPickup,
);

adminRouter.patch(
  "/orders/:id/shipment",
  controller.updateShipment,
);

adminRouter.post(
  "/orders/:id/ship-international",
  controller.dispatchInternational,
);

adminRouter.get(
  "/orders/:id/tracking",
  controller.trackOrder,
);

adminRouter.get(
  "/orders/:id/shipping-track",
  controller.trackOrder,
);

adminRouter.get(
  "/orders/:id/packing-slip",
  controller.getPackingSlip,
);

adminRouter.get(
  "/orders/:id/shipping-label",
  controller.getPackingSlip,
);

adminRouter.get(
  "/orders/:id/delhivery-slip",
  controller.getPackingSlip,
);