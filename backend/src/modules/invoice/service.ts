import PDFDocument from "pdfkit";
import { Buffer } from "node:buffer";

import type { InvoiceData } from "./types";

export async function generateInvoice(
  data: InvoiceData
) {
  const doc = new PDFDocument();

  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => chunks.push(chunk));

  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.fontSize(24).text("INVOICE");

    doc.moveDown();

    doc.fontSize(14).text(`Order ID: ${data.orderId}`);
    doc.text(`Customer: ${data.customerName}`);
    doc.text(`Email: ${data.customerEmail}`);

    doc.moveDown();

    data.items.forEach((item) => {
      doc.text(
        `${item.name} (${item.quantity}) - ₹${item.price}`
      );
    });

    doc.moveDown();

    doc.text(`Subtotal : ₹${data.subtotal}`);
    doc.text(`Discount : ₹${data.discount}`);
    doc.text(`Tax : ₹${data.tax}`);

    doc.moveDown();

    doc.fontSize(16).text(`Total : ₹${data.total}`);

    doc.end();
  });
}