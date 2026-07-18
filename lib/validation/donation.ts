import { z } from 'zod'
import {
  DONATION_TYPES,
  DONATION_MIN_PENCE,
  DONATION_MAX_PENCE,
} from '@/lib/types/donation'

/**
 * Public form → POST /api/donations/create-checkout-session
 *
 * Server validates via this schema, then creates a Donation row (PENDING)
 * and a Stripe Checkout Session. Gift Aid fields are conditionally
 * required when giftAidClaimed is true.
 */
export const createDonationSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, 'First name is required')
      .max(80, 'First name is too long'),
    lastName: z
      .string()
      .trim()
      .min(1, 'Last name is required')
      .max(80, 'Last name is too long'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email'),
    phoneNumber: z
      .string()
      .trim()
      .max(30, 'Phone number is too long')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    giftType: z.enum(DONATION_TYPES, {
      // Zod v4 renamed `errorMap` to `error` and expects a message or
      // a function returning one — no more `{ message: ... }` shape.
      error: 'Please choose a gift type',
    }),
    amountPence: z
      .number()
      .int('Amount must be a whole number of pence')
      .min(DONATION_MIN_PENCE, `Minimum gift is £${DONATION_MIN_PENCE / 100}`)
      .max(DONATION_MAX_PENCE, `Maximum gift is £${DONATION_MAX_PENCE / 100}`),
    note: z
      .string()
      .trim()
      .max(500, 'Note is too long (max 500 characters)')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    giftAidClaimed: z.boolean().default(false),
    giftAidAddressLine1: z
      .string()
      .trim()
      .max(200)
      .optional()
      .or(z.literal('').transform(() => undefined)),
    giftAidPostcode: z
      .string()
      .trim()
      .max(20)
      .optional()
      .or(z.literal('').transform(() => undefined)),
  })
  // If Gift Aid is claimed, address line + postcode become mandatory
  // (HMRC requires them on the declaration).
  .refine(
    (v) =>
      !v.giftAidClaimed || (v.giftAidAddressLine1 && v.giftAidAddressLine1.length > 0),
    {
      message: 'Address is required to claim Gift Aid',
      path: ['giftAidAddressLine1'],
    }
  )
  .refine(
    (v) =>
      !v.giftAidClaimed || (v.giftAidPostcode && v.giftAidPostcode.length > 0),
    {
      message: 'Postcode is required to claim Gift Aid',
      path: ['giftAidPostcode'],
    }
  )

export type CreateDonationInput = z.infer<typeof createDonationSchema>

/** Query parameters for GET /api/admin/donations. */
export const donationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
  search: z.string().trim().max(200).optional(),
  status: z.enum(['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED']).optional(),
  giftType: z.enum(DONATION_TYPES).optional(),
})

export type DonationQueryInput = z.infer<typeof donationQuerySchema>
