import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import {
  DONATION_ADMIN_ROLES,
  formatReceiptNumber,
} from '@/lib/types/donation'
import { DonationDetail } from '@/components/dashboard/donation-detail'

/**
 * Individual donation detail page. Shows every field the admin might
 * want (donor info, gift type, amount, Gift Aid address, Stripe IDs)
 * and exposes the "Refund" action as a client-side button.
 */

interface PageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function DonationDetailPage({ params }: PageProps) {
  const { id } = await params

  // Auth
  const sessionToken = (await cookies()).get('session_token')?.value
  if (!sessionToken) redirect('/login')

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: { select: { role: true } } },
  })
  if (!session || session.expiresAt < new Date()) redirect('/login')
  const role = session.user?.role
  if (!role || !(DONATION_ADMIN_ROLES as readonly string[]).includes(role)) {
    redirect('/dashboard')
  }

  const donation = await prisma.donation.findUnique({ where: { id } })
  if (!donation) notFound()

  const receiptId = formatReceiptNumber(donation.receiptNumber)

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/donations"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#000666]"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back to donations
      </Link>

      <DonationDetail
        donation={{
          id: donation.id,
          receiptId,
          receiptNumber: donation.receiptNumber,
          firstName: donation.firstName,
          lastName: donation.lastName,
          email: donation.email,
          phoneNumber: donation.phoneNumber,
          giftType: donation.giftType,
          amountPence: donation.amountPence,
          currency: donation.currency,
          note: donation.note,
          giftAidClaimed: donation.giftAidClaimed,
          giftAidAddressLine1: donation.giftAidAddressLine1,
          giftAidPostcode: donation.giftAidPostcode,
          status: donation.status,
          stripeSessionId: donation.stripeSessionId,
          stripePaymentIntentId: donation.stripePaymentIntentId,
          stripeSubscriptionId: donation.stripeSubscriptionId,
          paidAt: donation.paidAt?.toISOString() ?? null,
          createdAt: donation.createdAt.toISOString(),
        }}
      />
    </div>
  )
}
