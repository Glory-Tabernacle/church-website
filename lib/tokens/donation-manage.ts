/**
 * HMAC-signed magic-link token for the "Manage my monthly gift" flow.
 *
 * The token encodes an email + expiry, signed with a server-side
 * secret. When the donor clicks the link we verify the signature +
 * expiry, then look them up in Stripe and open a Billing Portal
 * session for that customer.
 *
 * Chose this over a random token stored in the DB because it's
 * stateless (no cleanup job needed) and short-lived (1 hour) so a
 * leaked link is limited-blast.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

const TTL_MS = 60 * 60 * 1000 // 1 hour

function getSecret(): string {
  const s = process.env.DONATION_MANAGE_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!s) {
    throw new Error(
      'Set DONATION_MANAGE_SECRET (or NEXTAUTH_SECRET) to sign donation-manage tokens.'
    )
  }
  return s
}

export function signManageToken(email: string): string {
  const expiresAt = Date.now() + TTL_MS
  const normalisedEmail = email.trim().toLowerCase()
  const payload = `${normalisedEmail}|${expiresAt}`
  const sig = createHmac('sha256', getSecret()).update(payload).digest('hex')
  // base64url so the token is safe in a URL query string without extra
  // encoding on either side.
  return Buffer.from(`${payload}|${sig}`).toString('base64url')
}

/**
 * Returns the verified email if the token is valid and unexpired,
 * or null if the token is malformed, tampered with, or expired.
 * Uses timing-safe comparison so a bad actor can't binary-search the
 * signature byte by byte.
 */
export function verifyManageToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const parts = decoded.split('|')
    if (parts.length !== 3) return null
    const [email, expiresAtStr, sig] = parts
    const expiresAt = Number(expiresAtStr)
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null

    const expectedSig = createHmac('sha256', getSecret())
      .update(`${email}|${expiresAt}`)
      .digest('hex')

    const sigBuf = Buffer.from(sig, 'hex')
    const expectedBuf = Buffer.from(expectedSig, 'hex')
    if (sigBuf.length !== expectedBuf.length) return null
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null
    return email
  } catch {
    return null
  }
}
