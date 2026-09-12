import { Hono } from "hono";
import * as controller from "./controller";

export const shippingRouter = new Hono();

/**
 * Public – check if an Indian pincode is serviceable by Blue Dart.
 * GET /shipping/check-pincode?pincode=110001
 * GET /shipping/serviceability/:pincode
 */
shippingRouter.get("/check-pincode", controller.checkPincode);
shippingRouter.get("/serviceability/:pincode", controller.checkPincodeParam);

/**
 * Public – calculate dynamic Blue Dart shipping rate & ETA for checkout.
 * POST /shipping/calculate-rate
 */
shippingRouter.post("/calculate-rate", controller.calculateRate);

/**
 * Public – track order by orderNumber
 * GET /shipping/track/:orderNumber
 */
shippingRouter.get("/track/:orderNumber", controller.trackPublicOrder);
