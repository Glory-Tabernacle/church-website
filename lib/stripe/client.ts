/**
 * Server-side Stripe client — singleton, initialised lazily so the
 * app doesn't crash at import time if STRIPE_SECRET_KEY is missing
 * from a preview / local env. Throws with a clear message the first
 * time it's actually needed.
 *
 * Required env vars:
 *   - STRIPE_SECRET_KEY               sk_live_… or sk_test_…
 *   - STRIPE_WEBHOOK_SECRET           whsec_… (from webhook endpoint config)
 *   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  pk_live_… or pk_test_… (client-side)
 *   - SITE_URL / NEXT_PUBLIC_SITE_URL / NEXTAUTH_URL  used to build
 *                                      success + cancel URLs
 */

import Stripe from 'stripe'

let cachedClient: Stripe | null = null

export function getStripe(): Stripe {
  if (cachedClient) return cachedClient
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Add it to Vercel/Railway env vars ' +
        '(and .env.local for dev) before enabling card giving.'
    )
  }
  cachedClient = new Stripe(key, {
    // Pin the API version so a future silent Stripe change can't break
    // parsing of webhook payloads. Update deliberately + test.
    // Must match what the installed Stripe SDK version expects — check
    // node_modules/stripe/types/lib.d.ts if you upgrade the package.
    apiVersion: '2026-06-24.dahlia',
    appInfo: {
      name: 'RCCG Glory Tabernacle, Barnstaple',
      version: '1.0.0',
    },
  })
  return cachedClient
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET is not set. Copy the signing secret from your ' +
        'Stripe Dashboard → Developers → Webhooks → your endpoint.'
    )
  }
  return secret
}

/** Canonical production URL — the ONLY place Stripe redirects, emails,
 *  QR codes, and OG images should ever send donors. Everything else is
 *  rewritten to this via the guard in getSiteUrl below. */
const CANONICAL_PRODUCTION_URL = 'https://www.glorytabernacle.co.uk'

/**
 * Resolve the public site URL for Checkout success / cancel redirects.
 *
 * Multiple defensive layers because the church's env-var setup has bitten
 * us twice now:
 *   1. Vercel auto-populates `NEXTAUTH_URL` (and sometimes `SITE_URL`)
 *      with a `*.vercel.app` deployment domain. That preview app can be
 *      paused, live, or deleted — donors don't care, they need the real
 *      domain. Any `*.vercel.app` URL is rewritten to canonical.
 *   2. Bare-apex `glorytabernacle.co.uk` (without `www`) doesn't resolve
 *      via DNS — only the `www` subdomain does. Anything using the bare
 *      apex is upgraded to `www.` (same fix we applied to the QR helpers).
 *   3. Trailing slashes are stripped so URL joins are predictable.
 *
 * localhost is preserved untouched so `npm run dev` + Stripe CLI still
 * works for local testing.
 */
export function getSiteUrl(): string {
  const url =
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    CANONICAL_PRODUCTION_URL

  // If we've ended up with a Vercel preview URL — treat it as junk and
  // fall through to the canonical production domain. Stripe redirects
  // MUST land somewhere donors can actually reach.
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app/i.test(url)) {
    return CANONICAL_PRODUCTION_URL
  }

  return url
    .replace(/\/+$/, '')
    .replace(/^https:\/\/glorytabernacle\.co\.uk/, CANONICAL_PRODUCTION_URL)
}
