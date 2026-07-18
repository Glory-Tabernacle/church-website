import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  DONATION_ADMIN_ROLES,
  formatReceiptNumber,
} from '@/lib/types/donation'
import {
  DonationsManager,
  type DashboardDonation,
} from '@/components/dashboard/donations-manager'

const PAGE_SIZE = 25

export default async function DonationsDashboardPage() {
  // Auth — same pattern as inaugural-service dashboard.
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

  const [total, rows, aggregate] = await Promise.all([
    prisma.donation.count(),
    prisma.donation.findMany({
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
    }),
    prisma.donation.aggregate({
      where: { status: 'SUCCEEDED' },
      _sum: { amountPence: true },
      _count: true,
    }),
  ])

  const initialRows: DashboardDonation[] = rows.map((r) => ({
    id: r.id,
    receiptNumber: r.receiptNumber,
    receiptId: formatReceiptNumber(r.receiptNumber),
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    phoneNumber: r.phoneNumber,
    giftType: r.giftType,
    amountPence: r.amountPence,
    currency: r.currency,
    note: r.note,
    giftAidClaimed: r.giftAidClaimed,
    giftAidAddressLine1: r.giftAidAddressLine1,
    giftAidPostcode: r.giftAidPostcode,
    status: r.status,
    paidAt: r.paidAt,
    createdAt: r.createdAt,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#000666]">Donations</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Every card gift given via <code className="text-gray-600">/giving</code>.
          Filter by status or gift type, search by donor name / email / receipt
          number (e.g. <code className="text-gray-600">GT-D-2026-0001</code>).
        </p>
      </div>

      <DonationsManager
        initialRows={initialRows}
        initialTotal={total}
        initialTotals={{
          succeededCount: aggregate._count,
          succeededPence: aggregate._sum.amountPence ?? 0,
        }}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}
