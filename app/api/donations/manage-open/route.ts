import { NextRequest, NextResponse } from 'next/server'
import { getStripe, getSiteUrl } from '@/lib/stripe/client'
import { verifyManageToken } from '@/lib/tokens/donation-manage'

/**
 * GET /api/donations/manage-open?token=…
 *
 * The link the donor clicked in their "manage your monthly gift" email.
 * We verify the HMAC token, find their Stripe customer, create a
 * one-off Billing Portal session, and redirect them straight to it.
 *
 * If anything fails, we bounce them back to /giving/manage with an
 * error query so they can request a fresh link.
 */

export const dynamic = 'force-dynamic'

function bounceBack(reason: 'expired' | 'no_customer' | 'error'): NextResponse {
  const siteUrl = getSiteUrl()
  return NextResponse.redirect(
    `${siteUrl}/giving/manage?error=${reason}`,
    { status: 302 }
  )
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  if (!token) return bounceBack('expired')

  const email = verifyManageToken(token)
  if (!email) return bounceBack('expired')

  try {
    const stripe = getStripe()
    // Find the customer by email. Stripe returns a list — take the most
    // recent (most likely to be the one with an active subscription).
    const customers = await stripe.customers.list({ email, limit: 5 })
    if (customers.data.length === 0) return bounceBack('no_customer')

    // Prefer a customer that actually has a subscription attached — we
    // may have several customers with the same email if someone did
    // one-off gifts before their monthly subscription.
    let customerId = customers.data[0].id
    for (const c of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: c.id,
        limit: 1,
        status: 'active',
      })
      if (subs.data.length > 0) {
        customerId = c.id
        break
      }
    }

    const siteUrl = getSiteUrl()
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/giving?managed=1`,
    })

    return NextResponse.redirect(session.url, { status: 302 })
  } catch (err) {
    console.error('Manage-open failed:', err)
    return bounceBack('error')
  }
}
