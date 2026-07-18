import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createDonationSchema } from '@/lib/validation/donation'
import { getStripe, getSiteUrl } from '@/lib/stripe/client'
import { DONATION_TYPE_META } from '@/lib/types/donation'

/**
 * POST /api/donations/create-checkout-session
 *
 * Public endpoint. Flow:
 *   1. Validate payload (Zod).
 *   2. Insert a PENDING Donation row.
 *   3. Create a Stripe Checkout Session (payment mode for one-off,
 *      subscription mode for MONTHLY).
 *   4. Save the session id back onto the row.
 *   5. Return { url } so the client can `window.location = url`.
 *
 * The eventual outcome (SUCCEEDED / FAILED) is recorded by the webhook
 * at /api/webhooks/stripe — this route does NOT wait for payment.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createDonationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 }
      )
    }
    const data = parsed.data
    const meta = DONATION_TYPE_META[data.giftType]
    const isRecurring = meta.recurring

    const stripe = getStripe()
    const siteUrl = getSiteUrl()

    // Step 1 — create the PENDING donation row.
    const donation = await prisma.donation.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber ?? null,
        giftType: data.giftType,
        amountPence: data.amountPence,
        currency: 'gbp',
        note: data.note ?? null,
        giftAidClaimed: data.giftAidClaimed,
        giftAidAddressLine1: data.giftAidClaimed
          ? data.giftAidAddressLine1 ?? null
          : null,
        giftAidPostcode: data.giftAidClaimed
          ? data.giftAidPostcode ?? null
          : null,
        status: 'PENDING',
      },
    })

    // Step 2 — build Stripe Checkout Session. Payment mode for one-off,
    // subscription mode for MONTHLY. Metadata carries our donation id so
    // the webhook can reconcile back to the row.
    const successUrl = `${siteUrl}/giving/success?donation=${donation.id}&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${siteUrl}/giving?cancelled=1`

    const productName = `${meta.label} — RCCG Glory Tabernacle, Barnstaple`
    const productDescription = data.note ?? meta.description

    const session = isRecurring
      ? await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          customer_email: data.email,
          success_url: successUrl,
          cancel_url: cancelUrl,
          line_items: [
            {
              price_data: {
                currency: 'gbp',
                product_data: {
                  name: productName,
                  description: productDescription,
                },
                unit_amount: data.amountPence,
                recurring: { interval: 'month' },
              },
              quantity: 1,
            },
          ],
          metadata: { donationId: donation.id },
          subscription_data: {
            metadata: { donationId: donation.id },
          },
        })
      : await stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          customer_email: data.email,
          success_url: successUrl,
          cancel_url: cancelUrl,
          line_items: [
            {
              price_data: {
                currency: 'gbp',
                product_data: {
                  name: productName,
                  description: productDescription,
                },
                unit_amount: data.amountPence,
              },
              quantity: 1,
            },
          ],
          metadata: { donationId: donation.id },
          payment_intent_data: {
            metadata: { donationId: donation.id },
          },
        })

    // Step 3 — persist the session id back onto the row so the webhook
    // can look it up by either metadata OR by stripeSessionId as a
    // safety net.
    await prisma.donation.update({
      where: { id: donation.id },
      data: { stripeSessionId: session.id },
    })

    if (!session.url) {
      // Stripe should always give us a URL for redirect flows — this is
      // defensive. If we ever hit this, log so we notice.
      console.error('Stripe returned no session URL for donation', donation.id)
      return NextResponse.json(
        { error: 'Payment provider did not return a checkout URL.' },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { url: session.url, donationId: donation.id },
      { status: 201 }
    )
  } catch (err) {
    console.error('Create donation checkout error:', err)
    return NextResponse.json(
      { error: 'Could not start the checkout. Please try again.' },
      { status: 500 }
    )
  }
}
