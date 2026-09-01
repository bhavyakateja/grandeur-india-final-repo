-- Final payment/order relationship and admin-managed store settings.
-- This migration intentionally rejects legacy Stripe rows: the application no
-- longer supports that provider, so operators must settle or migrate them
-- before applying this release.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Payment" WHERE "provider"::text = 'STRIPE') THEN
    RAISE EXCEPTION 'Cannot remove Stripe provider while Stripe payments exist';
  END IF;
END $$;

CREATE TYPE "PaymentProvider_new" AS ENUM ('RAZORPAY');
ALTER TABLE "Payment" ALTER COLUMN "provider" DROP DEFAULT;
ALTER TABLE "Payment"
  ALTER COLUMN "provider" TYPE "PaymentProvider_new"
  USING ("provider"::text::"PaymentProvider_new");
DROP TYPE "PaymentProvider";
ALTER TYPE "PaymentProvider_new" RENAME TO "PaymentProvider";
ALTER TABLE "Payment" ALTER COLUMN "provider" SET DEFAULT 'RAZORPAY';
ALTER TABLE "Payment" ALTER COLUMN "providerOrderId" SET NOT NULL;

ALTER TABLE "Order" DROP COLUMN IF EXISTS "razorpayOrderId";
ALTER TABLE "Order" ALTER COLUMN "paymentId" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Order_paymentId_key" ON "Order"("paymentId");
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "StoreSettings" (
  "id" TEXT NOT NULL DEFAULT 'store',
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 18,
  "freeShippingThreshold" DECIMAL(10,2) NOT NULL DEFAULT 999,
  "defaultShippingCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "codEnabled" BOOLEAN NOT NULL DEFAULT true,
  "internationalShippingEnabled" BOOLEAN NOT NULL DEFAULT false,
  "storeEnabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);
