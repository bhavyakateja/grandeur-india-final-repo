import { Hono } from "hono";
import * as controller from "./controller";

export const shippingRouter = new Hono();

/**
 * Public – check if an Indian pincode is serviceable by Delhivery.
 * GET /shipping/check-pincode?pincode=110001
 */
shippingRouter.get("/check-pincode", controller.checkPincode);
shippingRouter.get("/serviceability/:pincode", controller.checkPincodeParam);
shippingRouter.get("/track/:orderNumber", controller.trackPublicOrder);
