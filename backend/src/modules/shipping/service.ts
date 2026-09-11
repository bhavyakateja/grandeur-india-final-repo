import { prisma } from "../../db/prisma";
import { BadRequestException } from "../../exceptions/BadRequestException";
import { NotFoundException } from "../../exceptions/NotFoundException";
import { logger } from "../../config/logger";
import { delhiveryClient } from "./delhivery.client";

/* -------------------------------------------------------------------------- */
/* Pincode serviceability                                                      */
/* -------------------------------------------------------------------------- */

export async function checkPincode(pincode: string) {
  return delhiveryClient.checkPincode(pincode);
}

/* -------------------------------------------------------------------------- */
/* Shipment creation                                                           */
/* -------------------------------------------------------------------------- */

export async function createShipmentForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new NotFoundException("Order not found");

  if (order.status !== "CONFIRMED" && order.status !== "SHIPPED") {
    throw new BadRequestException("Only confirmed orders can be shipped");
  }

  if (order.isInternational) {
    throw new BadRequestException(
      "International orders must be shipped via a manual courier. Use updateShipment to set the waybill.",
    );
  }

  if (order.waybill) {
    return {
      waybill: order.waybill,
      shippingStatus: order.shippingStatus,
      trackingUrl: order.trackingUrl,
      alreadyCreated: true,
    };
  }

  const result = await delhiveryClient.createShipment({
    orderNumber: order.orderNumber,
    fullName: order.fullName,
    phone: order.phone ?? "",
    addressLine1: order.addressLine1 ?? "",
    addressLine2: order.addressLine2,
    city: order.city ?? "",
    state: order.state ?? "",
    country: order.country ?? "India",
    postalCode: order.postalCode ?? "",
    totalAmount: Number(order.total),
    paymentMode: "Pre-paid",
    items: order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      price: Number(item.price),
    })),
  });

  if (!result.success) {
    throw new BadRequestException(result.message ?? "Failed to create Delhivery shipment");
  }

  const trackingUrl = `https://www.delhivery.com/track/package/${encodeURIComponent(result.waybill)}`;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "SHIPPED",
      waybill: result.waybill,
      shippingStatus: "MANIFESTED",
      trackingUrl,
      courier: "DELHIVERY",
    },
  });

  logger.info({ orderId, waybill: result.waybill }, "Delhivery shipment created");

  return {
    waybill: updated.waybill,
    shippingStatus: updated.shippingStatus,
    trackingUrl: updated.trackingUrl,
    alreadyCreated: false,
  };
}

/* -------------------------------------------------------------------------- */
/* Manual shipment update (international or override)                         */
/* -------------------------------------------------------------------------- */

export interface UpdateShipmentInput {
  courier?: string;
  waybill?: string;
  shippingStatus?: string;
  trackingUrl?: string;
}

export async function updateShipmentForOrder(orderId: string, input: UpdateShipmentInput) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundException("Order not found");

  return prisma.order.update({
    where: { id: orderId },
    data: {
      ...(input.shippingStatus === "DISPATCHED" ? { status: "SHIPPED" } : {}),
      ...(input.courier !== undefined ? { courier: input.courier } : {}),
      ...(input.waybill !== undefined ? { waybill: input.waybill } : {}),
      ...(input.shippingStatus !== undefined ? { shippingStatus: input.shippingStatus } : {}),
      ...(input.trackingUrl !== undefined ? { trackingUrl: input.trackingUrl } : {}),
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Tracking                                                                   */
/* -------------------------------------------------------------------------- */

export async function trackOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      waybill: true,
      courier: true,
      isInternational: true,
      shippingStatus: true,
      trackingUrl: true,
    },
  });

  if (!order) throw new NotFoundException("Order not found");

  if (!order.waybill) {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      courier: order.courier,
      waybill: null,
      shippingStatus: order.shippingStatus ?? "PENDING_SHIPMENT",
      trackingUrl: order.trackingUrl ?? null,
      tracking: null,
    };
  }

  let tracking = null;
  if (order.courier === "DELHIVERY" && order.waybill) {
    tracking = await delhiveryClient.trackShipment(order.waybill);
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    courier: order.courier,
    waybill: order.waybill,
    shippingStatus: order.shippingStatus ?? "DISPATCHED",
    trackingUrl: order.trackingUrl,
    tracking,
  };
}

export async function trackPublicOrder(orderNumber: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: { id: true },
  });

  if (!order) throw new NotFoundException("Order not found");
  return trackOrder(order.id);
}

/* -------------------------------------------------------------------------- */
/* Packing slip                                                                */
/* -------------------------------------------------------------------------- */

export async function getPackingSlipUrl(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { waybill: true, orderNumber: true },
  });

  if (!order) throw new NotFoundException("Order not found");

  if (!order.waybill) {
    throw new BadRequestException("Shipment has not been created for this order yet");
  }

  const slipUrl = await delhiveryClient.getPackingSlip(order.waybill);
  return { slipUrl };
}
