import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import * as service from "./service";
import { updateSettingsSchema } from "./schema";

import { authMiddleware } from "../../middleware/authMiddleware";
import { roleMiddleware } from "../../middleware/roleMiddleware";

export const settingsController = new Hono();

/**
 * Public store configuration.
 *
 * Only expose settings that the frontend
 * legitimately needs.
 */
settingsController.get(
  "/",
  async (c) => {
    const settings =
      await service.getSettings();

    return c.json({
      success: true,
      data: {
        currency: settings.currency,
        gstRate: settings.gstRate,
        freeShippingThreshold:
          settings.freeShippingThreshold,
        codEnabled: settings.codEnabled,
        internationalShippingEnabled:
          settings.internationalShippingEnabled,
        storeEnabled: settings.storeEnabled,
      },
    });
  },
);

/**
 * Admin settings update.
 */
settingsController.patch(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  zValidator(
    "json",
    updateSettingsSchema,
  ),
  async (c) => {
    const settings =
      await service.updateSettings(
        c.req.valid("json"),
      );

    return c.json({
      success: true,
      message: "Store settings updated successfully",
      data: settings,
    });
  },
);

export { settingsRouter } from "./routes";