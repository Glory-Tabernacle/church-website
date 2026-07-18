import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import {
  DONATION_ADMIN_ROLES,
  DONATION_TYPE_META,
  formatReceiptNumber,
  type DonationAdminRole,
} from '@/lib/types/donation'
import type { Prisma } from '@prisma/client'

/**
 * GET /api/admin/donations/export?giftAidOnly=true|false&fromDate=&toDate=
 *
 * Streams a CSV of successful donations. Two intended uses:
 *   1. `?giftAidOnly=true` — the exact set the treasurer needs to file a
 *      Gift Aid claim on HMRC's Charities Online. Excludes rows where the
 *      donor didn't tick the Gift Aid box.
 *   2. Default (no `giftAidOnly`) — every SUCCEEDED donation, for the
 *      church's own accounting records.
 *
 * Date range is optional. Both bounds are inclusive on the day.
 */

function isAdmin(role: string | undefined): role is DonationAdminRole {
  return DONATION_ADMIN_ROLES.includes(role as DonationAdminRole)
}

/** Escape a value for RFC 4180 CSV. Wraps in double quotes if the value
 *  contains a comma, quote, or line break; doubles up any inner quotes. */
function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

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
    const giftAidOnly = searchParams.get('giftAidOnly') === 'true'
    const fromDateStr = searchParams.get('fromDate')
    const toDateStr = searchParams.get('toDate')

    const where: Prisma.DonationWhereInput = { status: 'SUCCEEDED' }
    if (giftAidOnly) where.giftAidClaimed = true
    if (fromDateStr || toDateStr) {
      where.paidAt = {}
      if (fromDateStr) {
        const d = new Date(fromDateStr)
        d.setHours(0, 0, 0, 0)
        where.paidAt.gte = d
      }
      if (toDateStr) {
        const d = new Date(toDateStr)
        // Inclusive end-of-day so `toDate=2026-07-31` catches gifts made
        // any time on 31 July.
        d.setHours(23, 59, 59, 999)
        where.paidAt.lte = d
      }
    }

    const donations = await prisma.donation.findMany({
      where,
      orderBy: { paidAt: 'asc' },
    })

    const headers = [
      'Receipt Number',
      'Date',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Gift Type',
      'Amount (GBP)',
      'Currency',
      'Gift Aid',
      'Address Line 1',
      'Postcode',
      'Note',
      'Stripe Session ID',
      'Stripe Payment Intent ID',
    ]

    const rows = donations.map((d) => [
      formatReceiptNumber(d.receiptNumber),
      d.paidAt ? d.paidAt.toISOString().slice(0, 10) : '',
      d.firstName,
      d.lastName,
      d.email,
      d.phoneNumber ?? '',
      DONATION_TYPE_META[d.giftType].label,
      (d.amountPence / 100).toFixed(2),
      d.currency.toUpperCase(),
      d.giftAidClaimed ? 'Yes' : 'No',
      d.giftAidAddressLine1 ?? '',
      d.giftAidPostcode ?? '',
      d.note ?? '',
      d.stripeSessionId ?? '',
      d.stripePaymentIntentId ?? '',
    ])

    // Prepend UTF-8 BOM so Excel opens the file with the right encoding
    // (important for £ signs and any accented donor names).
    const csv =
      '﻿' +
      [
        headers.map(csvEscape).join(','),
        ...rows.map((r) => r.map(csvEscape).join(',')),
      ].join('\r\n')

    const today = new Date().toISOString().slice(0, 10)
    const filename = giftAidOnly
      ? `gift-aid-donations-${today}.csv`
      : `donations-${today}.csv`

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('Donations export error:', err)
    return NextResponse.json(
      { error: 'Export failed. Please try again.' },
      { status: 500 }
    )
  }
}
