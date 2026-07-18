import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { getStripe } from '@/lib/stripe/client'
import {
  DONATION_ADMIN_ROLES,
  type DonationAdminRole,
} from '@/lib/types/donation'

/**
 * POST /api/admin/donations/[id]/refund
 *
 * Refund a successful donation via Stripe. The webhook will also flip
 * the row to REFUNDED via `charge.refunded`, but we do it here
 * synchronously so the admin sees the change immediately without lag.
 *
 * Idempotent-ish: subsequent calls will error at Stripe with "already
 * refunded" — we surface a friendly message.
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

function isAdmin(role: string | undefined): role is DonationAdminRole {
  return DONATION_ADMIN_ROLES.includes(role as DonationAdminRole)
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const donation = await prisma.donation.findUnique({ where: { id } })
    if (!donation) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 })
    }
    if (donation.status === 'REFUNDED') {
      return NextResponse.json(
        { error: 'This donation has already been refunded.' },
        { status: 400 }
      )
    }
    if (donation.status !== 'SUCCEEDED') {
      return NextResponse.json(
        {
          error:
            'Only successful donations can be refunded. This one is currently ' +
            donation.status.toLowerCase() + '.',
        },
        { status: 400 }
      )
    }
    if (!donation.stripePaymentIntentId) {
      return NextResponse.json(
        {
          error:
            'No payment intent on file — refund manually in the Stripe dashboard.',
        },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const refund = await stripe.refunds.create({
      payment_intent: donation.stripePaymentIntentId,
      metadata: { donationId: donation.id, refundedBy: user.id },
    })

    await prisma.donation.update({
      where: { id },
      data: { status: 'REFUNDED' },
    })

    return NextResponse.json({
      refundId: refund.id,
      status: 'REFUNDED',
    })
  } catch (err) {
    console.error('Refund error:', err)
    // Stripe errors have a `.message` we can safely surface — they're
    // human-readable ("charge already fully refunded", etc.).
    const msg = err instanceof Error ? err.message : 'Refund failed.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
