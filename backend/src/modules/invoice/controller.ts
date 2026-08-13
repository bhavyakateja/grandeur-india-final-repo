import { Hono } from "hono";

import * as service from "./service";

import { authMiddleware } from "../../middleware/authMiddleware";

export const invoiceController = new Hono();

invoiceController.use("*", authMiddleware);

invoiceController.post("/", async (c) => {
  const body = await c.req.json();

  const pdf = await service.generateInvoice(body);

  c.header(
    "Content-Type",
    "application/pdf"
  );

  c.header(
    "Content-Disposition",
    `attachment; filename=invoice.pdf`
  );

  return c.body(pdf.buffer as ArrayBuffer);
});
