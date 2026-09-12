import { prisma } from "../../db/prisma";
import { BadRequestException } from "../../exceptions/BadRequestException";
import { NotFoundException } from "../../exceptions/NotFoundException";
import { logger } from "../../config/logger";
import {
  blueDartClient,
  type ShippingRateInput,
  type PickupRegistrationInput,
} from "./bluedart.client";

/* -------------------------------------------------------------------------- */
/* Pincode serviceability                                                      */
/* -------------------------------------------------------------------------- */

export async function checkPincode(pincode: string) {
  return blueDartClient.checkServiceability(pincode);
}

/* -------------------------------------------------------------------------- */
/* Shipping Rate Calculation (Dynamic Backend Source of Truth)                */
/* -------------------------------------------------------------------------- */

export async function calculateShippingRate(input: ShippingRateInput) {
  return blueDartClient.calculateRate(input);
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
      courier: order.courier,
      alreadyCreated: true,
    };
  }

  const result = await blueDartClient.generateWaybill({
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

  if (!result.success || !result.waybill) {
    throw new BadRequestException(result.message ?? "Failed to create Blue Dart shipment");
  }

  const trackingUrl = `https://www.bluedart.com/tracking?handler=waybill&action=track&track=${encodeURIComponent(result.waybill)}`;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "SHIPPED",
      waybill: result.waybill,
      shippingStatus: "MANIFESTED",
      trackingUrl,
      courier: "BLUEDART",
    },
  });

  logger.info({ orderId, waybill: result.waybill }, "Blue Dart shipment created");

  return {
    waybill: updated.waybill,
    shippingStatus: updated.shippingStatus,
    trackingUrl: updated.trackingUrl,
    courier: updated.courier,
    alreadyCreated: false,
  };
}

/* -------------------------------------------------------------------------- */
/* Shipment Cancellation                                                       */
/* -------------------------------------------------------------------------- */

export async function cancelShipmentForOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundException("Order not found");

  if (!order.waybill) {
    throw new BadRequestException("No shipment waybill found for this order");
  }

  const result = await blueDartClient.cancelWaybill(order.waybill);
  if (!result.success) {
    throw new BadRequestException(result.message || "Failed to cancel Blue Dart waybill");
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      shippingStatus: "CANCELLED",
    },
  });

  logger.info({ orderId, waybill: order.waybill }, "Blue Dart shipment cancelled");

  return {
    success: true,
    orderId,
    waybill: order.waybill,
    shippingStatus: updated.shippingStatus,
    message: result.message,
  };
}

/* -------------------------------------------------------------------------- */
/* Pickup Registration                                                         */
/* -------------------------------------------------------------------------- */

export async function registerPickupForOrder(orderId: string, input: Partial<PickupRegistrationInput>) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new NotFoundException("Order not found");

  const todayStr = new Date().toISOString().split("T")[0] ?? "";
  const pickupDate: string = input.pickupDate ?? todayStr;
  const pickupTime = input.pickupTime || "14:00";

  const result = await blueDartClient.registerPickup({
    orderNumber: order.orderNumber,
    pickupDate,
    pickupTime,
    packageCount: input.packageCount ?? 1,
    weightKg: input.weightKg ?? 1.0,
    contactPerson: input.contactPerson,
    contactNumber: input.contactNumber,
    addressLine1: input.addressLine1,
    pincode: input.pincode,
    remarks: input.remarks,
  });

  if (!result.success) {
    throw new BadRequestException(result.message || "Failed to register Blue Dart pickup");
  }

  return result;
}

export async function cancelPickup(tokenNumber: string) {
  const result = await blueDartClient.cancelPickup(tokenNumber);
  if (!result.success) {
    throw new BadRequestException(result.message || "Failed to cancel Blue Dart pickup");
  }
  return result;
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
  if ((order.courier === "BLUEDART" || order.courier === "DELHIVERY") && order.waybill) {
    tracking = await blueDartClient.trackShipment(order.waybill);
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
/* Packing slip / Label                                                       */
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

  const slipUrl = blueDartClient.getPackingSlip(order.waybill);
  return { slipUrl };
}
