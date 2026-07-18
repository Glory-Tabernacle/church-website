import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSiteUrl } from '@/lib/stripe/client'
import { signManageToken } from '@/lib/tokens/donation-manage'
import { sendManageLink } from '@/lib/email/send-manage-link'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/donations/manage-request
 *
 * Public endpoint. Body: { email }.
 *
 * If the donor has ever made a monthly gift with that email, we send
 * them a magic link that opens Stripe's Billing Portal. The response
 * is intentionally always success ("if that email exists we sent a
 * link") so we don't leak whether an email is in the system.
 */

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = inputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }
    const email = parsed.data.email

    // Look up an existing SUCCEEDED monthly donation for this email.
    // We don't need to find EVERY subscription — one is enough to
    // establish "this email has a gift on file with us"; the Billing
    // Portal will show them all their subscriptions once opened.
    const existing = await prisma.donation.findFirst({
      where: {
        email,
        giftType: 'MONTHLY',
        status: 'SUCCEEDED',
      },
      select: { id: true },
    })

    if (existing) {
      // Fire the email in the background. Even if it fails we still
      // return the same generic response — we've logged the failure.
      const token = signManageToken(email)
      const url = `${getSiteUrl()}/api/donations/manage-open?token=${encodeURIComponent(token)}`
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
      void sendManageLink({ to: email, managePortalUrl: url, expiresAt })
        .then((result) => {
          if (!result.ok) {
            console.error('Manage-link email failed:', {
              email,
              reason: result.detail,
            })
          }
        })
        .catch((err) => console.error('Manage-link email threw:', err))
    }

    // Same response either way — don't leak email presence.
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Manage-request error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
