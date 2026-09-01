import { Hono } from "hono";

import { authRouter } from "../modules/auth";
import { productRouter } from "../modules/products";
import { categoryRouter } from "../modules/categories";
import { addressRouter } from "../modules/address";
import { cartRouter } from "../modules/cart";
import { wishlistRouter } from "../modules/wishlist";
import { orderRouter } from "../modules/orders";
import { paymentRouter } from "../modules/payment";
import { checkoutRouter } from "../modules/checkout";
import { couponRouter } from "../modules/coupon";
import { reviewRouter } from "../modules/reviews";
import { uploadRouter } from "../modules/upload";
import { notificationRouter } from "../modules/notification";
import { invoiceRouter } from "../modules/invoice";
import { inventoryRouter } from "../modules/inventory";
import { adminRouter } from "../modules/admin";
import { settingsRouter } from "../modules/settings";

const router = new Hono();

router.get("/health", (c) => {
  return c.json({
    status: "OK",
  });
});

router.route("/auth", authRouter);
router.route("/products", productRouter);
router.route("/categories", categoryRouter);
router.route("/addresses", addressRouter);
router.route("/cart", cartRouter);
router.route("/wishlist", wishlistRouter);
router.route('/orders', orderRouter)
router.route("/payments", paymentRouter);
router.route("/checkout", checkoutRouter);
router.route("/coupons", couponRouter);
router.route("/reviews", reviewRouter);
router.route("/upload", uploadRouter);
router.route("/notifications",notificationRouter);
router.route("/invoice", invoiceRouter);
router.route("/inventory",inventoryRouter);
router.route("/admin", adminRouter);
router.route(
  "/settings",
  settingsRouter,
);

export default router;