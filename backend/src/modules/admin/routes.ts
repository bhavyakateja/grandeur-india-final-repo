import { Hono } from "hono";
import * as controller from "./controller";
import { authMiddleware } from "../../middleware/authMiddleware";
import { roleMiddleware } from "../../middleware/roleMiddleware";

export const adminRouter = new Hono();

adminRouter.use("*", authMiddleware);
adminRouter.use("*", roleMiddleware("ADMIN", "SUPER_ADMIN"));

adminRouter.get("/dashboard", controller.dashboard);
adminRouter.get("/users", controller.listUsers);
adminRouter.get("/users/:id", controller.getUser);
adminRouter.patch("/users/:id", controller.updateUser);
adminRouter.delete("/users/:id", controller.deleteUser);

adminRouter.get("/orders", controller.listOrders);
adminRouter.get("/orders/:id", controller.getOrder);
adminRouter.patch("/orders/:id/status", controller.updateOrderStatus);

adminRouter.get("/reviews", controller.listReviews);
adminRouter.patch("/reviews/:id/status", controller.updateReviewStatus);
adminRouter.delete("/reviews/:id", controller.deleteReview);

adminRouter.post("/products/:productId/images", controller.attachProductImage);
adminRouter.patch("/products/:productId/images/:imageId", controller.setPrimaryProductImage);
adminRouter.delete("/products/:productId/images/:imageId", controller.deleteProductImage);

adminRouter.get("/payments", controller.listPayments);
adminRouter.post("/payments/:id/refund", controller.refundPayment);

adminRouter.get("/analytics", controller.analytics);
