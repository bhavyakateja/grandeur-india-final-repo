import type { Context } from "hono";
import { z } from "zod";
import { AppError } from "../../exceptions/AppError";
import { successResponse } from "../../shared/response";
import * as service from "./service";

function requiredParam(c: Context, name: string): string {
  const value = c.req.param(name);
  if (!value) throw new AppError(`${name} is required`, 400);
  return value;
}

const checkPincodeSchema = z.object({
  pincode: z.string().trim().min(1),
});

const updateShipmentSchema = z.object({
  courier: z.string().trim().min(1).optional(),
  waybill: z.string().trim().min(1).optional(),
  shippingStatus: z.string().trim().min(1).optional(),
  trackingUrl: z.string().url().optional(),
});

const internationalShipmentSchema = z.object({
  courier: z.string().trim().min(2).max(50),
  waybill: z.string().trim().min(2).max(100),
  trackingUrl: z.string().url().optional(),
});

export const checkPincode = async (c: Context) => {
  const { pincode } = checkPincodeSchema.parse(c.req.query());
  return successResponse(c, await service.checkPincode(pincode));
};

export const checkPincodeParam = async (c: Context) => {
  const pincode = requiredParam(c, "pincode");
  return successResponse(c, await service.checkPincode(pincode));
};

export const trackPublicOrder = async (c: Context) => {
  const orderNumber = requiredParam(c, "orderNumber");
  return successResponse(c, await service.trackPublicOrder(orderNumber));
};

export const createShipment = async (c: Context) => {
  const id = requiredParam(c, "id");
  return successResponse(
    c,
    await service.createShipmentForOrder(id),
    "Delhivery shipment created",
    201,
  );
};

export const updateShipment = async (c: Context) => {
  const id = requiredParam(c, "id");
  const input = updateShipmentSchema.parse(await c.req.json());
  return successResponse(
    c,
    await service.updateShipmentForOrder(id, input),
    "Shipment details updated",
  );
};

export const dispatchInternational = async (c: Context) => {
  const id = requiredParam(c, "id");
  const input = internationalShipmentSchema.parse(await c.req.json());
  return successResponse(
    c,
    await service.updateShipmentForOrder(id, {
      ...input,
      shippingStatus: "DISPATCHED",
    }),
    "International shipment dispatched",
  );
};

export const trackOrder = async (c: Context) => {
  const id = requiredParam(c, "id");
  return successResponse(c, await service.trackOrder(id));
};

export const getPackingSlip = async (c: Context) => {
  const id = requiredParam(c, "id");
  return successResponse(c, await service.getPackingSlipUrl(id));
};
