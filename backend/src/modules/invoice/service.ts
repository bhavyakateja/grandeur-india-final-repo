import PDFDocument from "pdfkit";
import { Buffer } from "node:buffer";

import * as repository from "./repository";

import {
  NotFoundException,
} from "../../exceptions/NotFoundException";

import {
  BadRequestException,
} from "../../exceptions/BadRequestException";

import type { AuthUser } from "../../types/hono";
import type { InvoiceData } from "./types";

export async function generateInvoice(
  orderId: string,
  user: AuthUser,
) {
  const order = await repository.findOrderForInvoice(orderId);

  if (!order) {
    throw new NotFoundException("Order not found");
  }

  /**
   * Customers can only access their own invoices.
   * Admin can access any order invoice.
   */
  if (
    user.role !== "ADMIN" &&
    order.userId !== user.id
  ) {
    throw new NotFoundException("Order not found");
  }

  if (order.paymentStatus !== "PAID") {
    throw new BadRequestException(
      "Invoice is available only for paid orders",
    );
  }

  const data: InvoiceData = {
    orderNumber: order.orderNumber,
    customerName: order.fullName,
    customerEmail: order.user.email,

    phone: order.phone,

    address: {
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2,
      city: order.city,
      state: order.state,
      country: order.country,
      postalCode: order.postalCode,
    },

    items: order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      price: Number(item.price),
      total: Number(item.price) * item.quantity,
    })),

    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shipping: Number(order.shippingCharge),
    tax: Number(order.tax),
    total: Number(order.total),
  };

  const pdf = await createPdf(data);

  return {
    pdf,
    filename: `invoice-${order.orderNumber}.pdf`,
  };
}

function createPdf(
  data: InvoiceData,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => {
      chunks.push(Buffer.from(chunk));
    });

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on("error", reject);

    doc
      .fontSize(24)
      .text("INVOICE");

    doc.moveDown();

    doc
      .fontSize(11)
      .text(`Order: ${data.orderNumber}`)
      .text(`Customer: ${data.customerName}`)
      .text(`Email: ${data.customerEmail}`)
      .text(`Phone: ${data.phone}`);

    doc.moveDown();

    doc.fontSize(12).text("Billing / Shipping Address");

    doc
      .fontSize(10)
      .text(data.address.addressLine1);

    if (data.address.addressLine2) {
      doc.text(data.address.addressLine2);
    }

    doc.text(
      `${data.address.city}, ${data.address.state}`,
    );

    doc.text(
      `${data.address.country} - ${data.address.postalCode}`,
    );

    doc.moveDown();

    doc.fontSize(12).text("Items");

    doc.moveDown(0.5);

    for (const item of data.items) {
      doc
        .fontSize(10)
        .text(
          `${item.name} × ${item.quantity}   ₹${item.total.toFixed(2)}`,
        );
    }

    doc.moveDown();

    doc
      .fontSize(10)
      .text(`Subtotal: ₹${data.subtotal.toFixed(2)}`)
      .text(`Discount: ₹${data.discount.toFixed(2)}`)
      .text(`Shipping: ₹${data.shipping.toFixed(2)}`)
      .text(`Tax: ₹${data.tax.toFixed(2)}`);

    doc.moveDown();

    doc
      .fontSize(16)
      .text(`Total: ₹${data.total.toFixed(2)}`);

    doc.moveDown();

    doc
      .fontSize(9)
      .text(
        "Thank you for your purchase.",
      );

    doc.end();
  });
}