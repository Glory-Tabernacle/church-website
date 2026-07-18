import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe/client'
import { sendDonationReceipt } from '@/lib/email/send-donation-receipt'

/**
 * POST /api/webhooks/stripe
 *
 * Stripe posts here after a Checkout session completes. We verify the
 * signature, then update the matching Donation row and fire the receipt
 * email on success.
 *
 * Set up in Stripe Dashboard → Developers → Webhooks:
 *   Endpoint URL: https://www.glorytabernacle.co.uk/api/webhooks/stripe
 *   Events to send:
 *     - checkout.session.completed
 *     - checkout.session.async_payment_succeeded
 *     - checkout.session.async_payment_failed
 *     - invoice.paid                (recurring — one row per monthly renewal)
 *     - charge.refunded             (dashboard refunds)
 *   Copy the signing secret into STRIPE_WEBHOOK_SECRET env var.
 */

// Stripe needs the raw body to verify the signature. In App Router we
// disable the JSON body parser by reading the request as text ourselves.
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    )
  }

  const rawBody = await request.text()
  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret()
    )
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSuccess(session)
        break
      }
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutFailure(session)
        break
      }
      case 'invoice.paid': {
        // Second and subsequent monthly renewals — first one is caught
        // by checkout.session.completed above. We create a new Donation
        // row for each renewal so the treasurer sees each month.
        const invoice = event.data.object as Stripe.Invoice
        await handleRecurringRenewal(invoice)
        break
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await handleRefund(charge)
        break
      }
      default:
        // Ignore other events silently — this endpoint is intentionally
        // narrow.
        break
    }
  } catch (err) {
    console.error(
      `Stripe webhook handler for ${event.type} threw:`,
      err
    )
    // Return 200 so Stripe doesn't hammer retries when the failure is
    // on our side (missing donation row, DB blip, etc.). We've logged;
    // manual reconciliation is fine.
    return NextResponse.json({ received: true, handled: false })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutSuccess(session: Stripe.Checkout.Session) {
  const donationId = session.metadata?.donationId
  if (!donationId) {
    console.warn(
      'checkout.session.completed missing donationId metadata:',
      session.id
    )
    return
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : null
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : null

  const updated = await prisma.donation.update({
    where: { id: donationId },
    data: {
      status: 'SUCCEEDED',
      paidAt: new Date(),
      stripePaymentIntentId: paymentIntentId,
      stripeSubscriptionId: subscriptionId,
      // Stripe reports the actual charged amount — trust it over what
      // we captured on the client just in case a currency conversion or
      // fee adjustment happened.
      amountPence: session.amount_total ?? undefined,
    },
  })

  // Fire-and-forget receipt email — never block the webhook response.
  void sendDonationReceipt(updated).catch((err) => {
    console.error('Donation receipt email failed:', err)
  })
}

async function handleCheckoutFailure(session: Stripe.Checkout.Session) {
  const donationId = session.metadata?.donationId
  if (!donationId) return
  await prisma.donation.update({
    where: { id: donationId },
    data: { status: 'FAILED' },
  })
}

/**
 * Extract the subscription id from an Invoice, tolerating both Stripe
 * API shapes:
 *   • Pre-2025-03-01: `invoice.subscription` (string | Subscription).
 *   • 2025-03-01 and later: `invoice.parent.subscription_details.subscription`.
 *
 * The SDK types reflect the newest shape, but webhook payloads follow
 * whatever API version was pinned when the webhook endpoint was created,
 * so we defensively check both.
 */
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parent = (invoice as { parent?: unknown }).parent as
    | { subscription_details?: { subscription?: string | { id: string } | null } }
    | null
    | undefined
  const fromParent = parent?.subscription_details?.subscription
  if (typeof fromParent === 'string') return fromParent
  if (fromParent && typeof fromParent === 'object' && 'id' in fromParent) {
    return fromParent.id
  }

  const legacy = (invoice as unknown as {
    subscription?: string | { id: string } | null
  }).subscription
  if (typeof legacy === 'string') return legacy
  if (legacy && typeof legacy === 'object' && 'id' in legacy) {
    return legacy.id
  }

  return null
}

/** Same pattern as getInvoiceSubscriptionId for the invoice's payment
 *  intent — moved in the same API-version rename. */
function getInvoicePaymentIntentId(invoice: Stripe.Invoice): string | null {
  const parent = (invoice as { parent?: unknown }).parent as
    | { payment_intent?: string | { id: string } | null }
    | null
    | undefined
  const fromParent = parent?.payment_intent
  if (typeof fromParent === 'string') return fromParent
  if (fromParent && typeof fromParent === 'object' && 'id' in fromParent) {
    return fromParent.id
  }

  const legacy = (invoice as unknown as {
    payment_intent?: string | { id: string } | null
  }).payment_intent
  if (typeof legacy === 'string') return legacy
  if (legacy && typeof legacy === 'object' && 'id' in legacy) {
    return legacy.id
  }

  return null
}

async function handleRecurringRenewal(invoice: Stripe.Invoice) {
  // First invoice = the initial checkout; already handled by
  // checkout.session.completed. Skip it here.
  if (invoice.billing_reason === 'subscription_create') return

  const subscriptionId = getInvoiceSubscriptionId(invoice)
  if (!subscriptionId) return

  // Find the original Donation for this subscription so we can copy the
  // donor details forward onto a fresh row for the new month.
  const original = await prisma.donation.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    orderBy: { createdAt: 'asc' },
  })
  if (!original) {
    console.warn(
      'invoice.paid renewal has no matching original donation:',
      subscriptionId
    )
    return
  }

  const renewal = await prisma.donation.create({
    data: {
      firstName: original.firstName,
      lastName: original.lastName,
      email: original.email,
      phoneNumber: original.phoneNumber,
      giftType: 'MONTHLY',
      amountPence: invoice.amount_paid,
      currency: invoice.currency,
      note: `Monthly renewal — original receipt GT-D-${original.receiptNumber}`,
      giftAidClaimed: original.giftAidClaimed,
      giftAidAddressLine1: original.giftAidAddressLine1,
      giftAidPostcode: original.giftAidPostcode,
      stripeSubscriptionId: subscriptionId,
      stripePaymentIntentId: getInvoicePaymentIntentId(invoice),
      status: 'SUCCEEDED',
      paidAt: new Date(),
    },
  })

  void sendDonationReceipt(renewal).catch((err) => {
    console.error('Renewal receipt email failed:', err)
  })
}

async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : null
  if (!paymentIntentId) return
  await prisma.donation.updateMany({
    where: { stripePaymentIntentId: paymentIntentId },
    data: { status: 'REFUNDED' },
  })
}
