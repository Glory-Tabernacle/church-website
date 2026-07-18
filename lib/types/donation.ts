/**
 * Domain types + constants for the card-giving flow (Stripe-backed).
 * The Prisma enums are re-declared here so client components can import
 * them without pulling in the whole @prisma/client package.
 */

export const DONATION_TYPES = [
  'ONE_OFF',
  'MONTHLY',
  'SUNDAY_OFFERING',
  'FREEWILL',
] as const
export type DonationType = (typeof DONATION_TYPES)[number]

/** Display label + short description for each gift type — used on the
 *  public giving form's chip selector and the dashboard. */
export const DONATION_TYPE_META: Record<
  DonationType,
  { label: string; description: string; recurring: boolean }
> = {
  ONE_OFF: {
    label: 'One-off gift',
    description: 'A single gift, whenever you feel led.',
    recurring: false,
  },
  MONTHLY: {
    label: 'Monthly gift',
    description: 'A recurring standing gift each month. Cancel any time.',
    recurring: true,
  },
  SUNDAY_OFFERING: {
    label: 'Sunday offering',
    description: "This Sunday's tithe or offering.",
    recurring: false,
  },
  FREEWILL: {
    label: 'Freewill / seed',
    description: 'General freewill giving, sowing, or a specific project seed.',
    recurring: false,
  },
}

/** Preset amounts (in pence) shown as quick-pick chips on the form.
 *  Donors can also enter a custom amount. */
export const DONATION_PRESET_AMOUNTS_PENCE = [500, 1000, 2000, 5000, 10000] as const

export const DONATION_MIN_PENCE = 100 // £1 — Stripe's practical minimum for GBP
export const DONATION_MAX_PENCE = 1_000_000 // £10,000 — above this, Stripe often rejects card

export const DONATION_STATUSES = [
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED',
] as const
export type DonationStatus = (typeof DONATION_STATUSES)[number]

/** Roles that can view the donations dashboard. Treasurer work is
 *  sensitive — keep it to Super Admin + CONTENT_EDITOR by default. */
export const DONATION_ADMIN_ROLES = ['SUPER_ADMIN', 'CONTENT_EDITOR'] as const
export type DonationAdminRole = (typeof DONATION_ADMIN_ROLES)[number]

/** Format an autoincrementing receiptNumber into the human-readable
 *  form shown on emails and dashboards (e.g. "GT-D-2026-0001"). */
export function formatReceiptNumber(receiptNumber: number, year = 2026): string {
  return `GT-D-${year}-${String(receiptNumber).padStart(4, '0')}`
}

/** Format an amount in pence as a GBP display string, e.g. 5000 → "£50.00". */
export function formatPence(amountPence: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amountPence / 100)
}
