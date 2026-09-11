ALTER TABLE "Order"
  ADD COLUMN "courier" TEXT,
  ADD COLUMN "waybill" TEXT,
  ADD COLUMN "shippingStatus" TEXT,
  ADD COLUMN "trackingUrl" TEXT,
  ADD COLUMN "isInternational" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Order_waybill_idx" ON "Order"("waybill");