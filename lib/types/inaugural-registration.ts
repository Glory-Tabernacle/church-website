import type { Gender } from '@/lib/types/group-member'

export const INAUGURAL_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'CONTENT_EDITOR',
] as const
export type InauguralAdminRole = (typeof INAUGURAL_ADMIN_ROLES)[number]

/** The inaugural service date — single source of truth used by the form,
 *  the email template, the dashboard, and the programme page. */
export const INAUGURAL_SERVICE_DATE = new Date('2026-07-19T10:00:00Z')

/** Public-facing service theme. Referenced from the registration form hero,
 *  the confirmation email header, the programme placeholder page, the
 *  homepage CTA, and the printed badge so every touchpoint reads as one
 *  designed campaign. */
export const INAUGURAL_THEME = {
  title: 'Glory Ahead',
  scripture: 'Haggai 2:9',
} as const

/** Service start time displayed alongside the date everywhere — kept here
 *  rather than parsed off the date so the format stays consistent. */
export const INAUGURAL_SERVICE_TIME = '1:00pm'

/**
 * Moment the /inaugural-service/programme page reveals the interactive
 * cards. Before this timestamp visitors see a countdown; at this
 * timestamp a curtain-parting animation plays and the cards become
 * interactive. Production value is 30 minutes before the service
 * begins (12:30 BST on Sun 19 July 2026).
 *
 * To test the flow without waiting until Sunday, visit the programme
 * page with `?test_reveal_in=<seconds>` — e.g. `?test_reveal_in=300`
 * for a 5-minute countdown from the moment you load the page. The
 * override is handled by the page's server component (see there for
 * the logic); this constant stays as the production default.
 */
export const INAUGURAL_PROGRAMME_REVEAL_AT = new Date(
  '2026-07-19T12:45:00+01:00'
)

/** Venue details displayed on the registration page hero, confirmation
 *  email, programme page, and homepage CTA. Single source of truth so the
 *  address (and the parking note) only needs editing in one place. */
export const INAUGURAL_SERVICE_VENUE = {
  name: 'North Devon College',
  address: 'Old Sticklepath Hill, Barnstaple, EX31 2BQ',
  // Free-text parking note. Tweak this when the parking plan is finalised
  // (overflow lot, marshals, etc.) and every touchpoint picks it up.
  parkingNotes: 'Free on-site parking available. Our volunteers will direct you on arrival.',
  // Google Maps deep link so the email and CTA can offer a "Get directions"
  // button. Update if the parking entrance differs from the venue postcode.
  directionsUrl:
    'https://maps.google.com/?q=North+Devon+College+Old+Sticklepath+Hill+Barnstaple+EX31+2BQ',
} as const

/** Multi-select options for the "Bringing children?" registration question.
 *  Kept short and unambiguous so checkbox labels read cleanly on mobile and
 *  the dashboard chips stay scannable. */
export const CHILDREN_AGE_GROUPS = [
  'Under 2',
  '2-5',
  '6-11',
  '12-17',
] as const
export type ChildrenAgeGroup = (typeof CHILDREN_AGE_GROUPS)[number]

/** Year embedded in the human-readable ID. Update if the badge series ever
 *  rolls over to a new year. */
export const INAUGURAL_ID_YEAR = 2026

/** Prefix used in the human-readable badge ID. */
export const INAUGURAL_ID_PREFIX = 'GT'

/**
 * Format an auto-incrementing serialNumber from the database into the
 * legacy public badge ID, e.g. 1 → "GT-2026-0001", 2843 → "GT-2026-2843".
 *
 * Kept for backwards compatibility with rows that pre-date the random
 * publicCode column. Prefer `formatBadgeId(row)` everywhere so new rows
 * automatically pick up their random code.
 */
export function formatRegistrationId(serialNumber: number): string {
  return `${INAUGURAL_ID_PREFIX}-${INAUGURAL_ID_YEAR}-${String(serialNumber).padStart(4, '0')}`
}

/**
 * Preferred badge formatter. Uses the randomly-allocated `publicCode`
 * when present; falls back to the padded `serialNumber` for legacy rows
 * created before randomised badge IDs landed.
 *
 * Accepts a partial row so it can be called with anything Prisma
 * `select`ed — the only fields actually read are `serialNumber` and
 * `publicCode`.
 */
export function formatBadgeId(row: {
  serialNumber: number
  publicCode: string | null
}): string {
  if (row.publicCode) {
    return `${INAUGURAL_ID_PREFIX}-${INAUGURAL_ID_YEAR}-${row.publicCode}`
  }
  return formatRegistrationId(row.serialNumber)
}

/**
 * Parse a human-readable badge ID back into the serialNumber for DB lookups.
 * Returns null if the input doesn't match the expected pattern.
 * Lenient on case + whitespace so check-in staff can type roughly.
 *
 * Legacy thin wrapper around `parseBadgeId` — kept so any older call site
 * keeps compiling. New code should call `parseBadgeId` and look up both
 * `publicCode` and `serialNumber` (in that order).
 */
export function parseRegistrationId(input: string): number | null {
  const parsed = parseBadgeId(input)
  return parsed ? parsed.serial : null
}

/** What `parseBadgeId` returns: enough to do a unique lookup on either
 *  the new `publicCode` column or the legacy `serialNumber` column. */
export interface ParsedBadgeId {
  /** 4-character numeric code as a string, e.g. "0001" or "4827".
   *  Used for the `publicCode` unique lookup. */
  code: string
  /** Numeric form of the trailing digits, e.g. 1 or 4827. Used for the
   *  legacy `serialNumber` unique lookup. */
  serial: number
}

/**
 * Parse a human-readable badge ID into both its `publicCode` form (4-char
 * zero-padded string) and its legacy `serialNumber` form (integer), so the
 * caller can try both lookups without re-parsing.
 *
 * Lenient on case + whitespace so check-in staff can type roughly.
 * Returns null if the input doesn't match `GT-YYYY-NNNN`.
 */
export function parseBadgeId(input: string): ParsedBadgeId | null {
  const cleaned = input.trim().toUpperCase()
  const match = cleaned.match(/^GT-(\d{4})-(\d{1,6})$/)
  if (!match) return null
  const digits = match[2]
  const serial = Number(digits)
  if (!Number.isFinite(serial) || serial < 0) return null
  // Pad to 4 chars so single-digit / 2-digit input still matches a stored
  // `publicCode` like "0001". 5+ digit input keeps its length.
  const code = digits.length < 4 ? digits.padStart(4, '0') : digits
  return { code, serial }
}

/** Full registration record as it lives in the database. */
export interface InauguralRegistration {
  id: string
  serialNumber: number
  publicCode: string | null
  firstName: string
  lastName: string
  email: string
  gender: Gender
  address: string
  isRccgMember: boolean
  fromOutsideBarnstaple: boolean
  homeChurch: string | null
  photographyConsent: boolean
  bringingChildren: boolean
  numberOfChildren: number | null
  childrenAgeGroups: ChildrenAgeGroup[] | null
  childrenSpecialNeeds: string | null
  createdAt: Date
}
