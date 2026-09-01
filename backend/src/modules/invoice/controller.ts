import { Hono } from "hono";

import * as service from "./service";
import { authMiddleware } from "../../middleware/authMiddleware";

export const invoiceController = new Hono();

invoiceController.use("*", authMiddleware);

invoiceController.get("/:orderId", async (c) => {
  const orderId = c.req.param("orderId");
  const user = c.get("user");

  const invoice = await service.generateInvoice(
    orderId,
    user,
  );

  c.header("Content-Type", "application/pdf");

  c.header(
    "Content-Disposition",
    `attachment; filename="${invoice.filename}"`,
  );

  return c.body(
    new Uint8Array(invoice.pdf),
  );
});

export { invoiceRouter } from "./routes";