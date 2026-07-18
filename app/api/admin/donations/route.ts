import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { donationQuerySchema } from '@/lib/validation/donation'
import {
  DONATION_ADMIN_ROLES,
  formatReceiptNumber,
  type DonationAdminRole,
} from '@/lib/types/donation'

function isAdmin(role: string | undefined): role is DonationAdminRole {
  return DONATION_ADMIN_ROLES.includes(role as DonationAdminRole)
}

/**
 * GET /api/admin/donations
 *
 * Paginated list for the dashboard. Filter by status, giftType, and a
 * free-text search matching donor name / email / receipt number.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = donationQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      giftType: searchParams.get('giftType') ?? undefined,
    })
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 }
      )
    }

    const { page, pageSize, search, status, giftType } = parsed.data

    // Build a filter clause. `search` is applied on top of the other
    // structured filters (AND-style) so an admin can e.g. "SUCCEEDED
    // donations for oluwaseye" in one query.
    type WhereCondition = Record<string, unknown>
    const where: WhereCondition = {}
    if (status) where.status = status
    if (giftType) where.giftType = giftType
    if (search) {
      const q = search.trim()
      // Try to parse "GT-D-2026-0001" → receiptNumber lookup
      const receiptMatch = q.toUpperCase().match(/^GT-D-\d{4}-(\d{1,6})$/)
      const OR: WhereCondition[] = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ]
      if (receiptMatch) {
        const receiptN = Number(receiptMatch[1])
        if (Number.isFinite(receiptN)) OR.push({ receiptNumber: receiptN })
      }
      where.OR = OR
    }

    const [total, rows, aggregate] = await Promise.all([
      prisma.donation.count({ where }),
      prisma.donation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.donation.aggregate({
        where: { ...where, status: 'SUCCEEDED' },
        _sum: { amountPence: true },
        _count: true,
      }),
    ])

    return NextResponse.json({
      donations: rows.map((r) => ({
        ...r,
        receiptId: formatReceiptNumber(r.receiptNumber),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      totals: {
        succeededCount: aggregate._count,
        succeededPence: aggregate._sum.amountPence ?? 0,
      },
    })
  } catch (err) {
    console.error('Error listing donations:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
