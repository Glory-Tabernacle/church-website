-- Add Donation table + enums for card giving via Stripe.
-- Amounts are stored in pence (INT) to avoid floating-point rounding.

CREATE TYPE "DonationType" AS ENUM ('ONE_OFF', 'MONTHLY', 'SUNDAY_OFFERING', 'FREEWILL');
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

CREATE TABLE "Donation" (
  "id"                    TEXT NOT NULL,
  "receiptNumber"         SERIAL NOT NULL,
  "firstName"             TEXT NOT NULL,
  "lastName"              TEXT NOT NULL,
  "email"                 TEXT NOT NULL,
  "phoneNumber"           TEXT,
  "giftType"              "DonationType" NOT NULL,
  "amountPence"           INTEGER NOT NULL,
  "currency"              TEXT NOT NULL DEFAULT 'gbp',
  "note"                  TEXT,
  "giftAidClaimed"        BOOLEAN NOT NULL DEFAULT false,
  "giftAidAddressLine1"   TEXT,
  "giftAidPostcode"       TEXT,
  "stripeSessionId"       TEXT,
  "stripePaymentIntentId" TEXT,
  "stripeSubscriptionId"  TEXT,
  "status"                "DonationStatus" NOT NULL DEFAULT 'PENDING',
  "paidAt"                TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Donation_receiptNumber_key"         ON "Donation"("receiptNumber");
CREATE UNIQUE INDEX "Donation_stripeSessionId_key"       ON "Donation"("stripeSessionId");
CREATE UNIQUE INDEX "Donation_stripePaymentIntentId_key" ON "Donation"("stripePaymentIntentId");
CREATE UNIQUE INDEX "Donation_stripeSubscriptionId_key"  ON "Donation"("stripeSubscriptionId");
CREATE INDEX "Donation_status_idx"                       ON "Donation"("status");
CREATE INDEX "Donation_giftType_idx"                     ON "Donation"("giftType");
CREATE INDEX "Donation_createdAt_idx"                    ON "Donation"("createdAt");
CREATE INDEX "Donation_email_idx"                        ON "Donation"("email");
