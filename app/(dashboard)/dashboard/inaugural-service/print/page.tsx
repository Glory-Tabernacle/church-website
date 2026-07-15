import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  INAUGURAL_ADMIN_ROLES,
  formatBadgeId,
} from '@/lib/types/inaugural-registration'
import {
  BulkBadgePrint,
  type BulkBadgeItem,
} from '@/components/dashboard/bulk-badge-print'

/**
 * Bulk-badge print view. Landed on from the "Print badges" modal in the
 * inaugural-service manager. Server component so we can fetch every
 * registration in one query and hand it to the client-side print
 * component — no client-side pagination loop, no waterfall.
 *
 * ?perPage=4|6|8  → chooses layout density (2 columns × N rows per A4).
 * Anything else falls back to 4 per page.
 */

export const metadata = {
  title: 'Print Inaugural Service Badges',
}

// Don't cache this — the roster changes as new people register right up
// to service day, and admins will re-print in batches.
export const dynamic = 'force-dynamic'

const VALID_PER_PAGE = [4, 6, 8] as const
type PerPage = (typeof VALID_PER_PAGE)[number]

function coercePerPage(input: string | undefined): PerPage {
  const n = Number(input)
  return (VALID_PER_PAGE as readonly number[]).includes(n) ? (n as PerPage) : 4
}

function getSiteUrl(): string {
  const url =
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    'https://www.glorytabernacle.co.uk'
  return url.replace(/\/+$/, '')
}

interface PageProps {
  searchParams: Promise<{ perPage?: string }>
}

export default async function BulkPrintPage({ searchParams }: PageProps) {
  const { perPage: perPageParam } = await searchParams
  const perPage = coercePerPage(perPageParam)

  // Auth — same gate as the manager. A CONTENT_EDITOR or SUPER_ADMIN
  // should be able to print.
  const sessionToken = (await cookies()).get('session_token')?.value
  if (!sessionToken) redirect('/login')

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: { select: { role: true } } },
  })
  if (!session || session.expiresAt < new Date()) redirect('/login')
  const role = session.user?.role
  if (!role || !(INAUGURAL_ADMIN_ROLES as readonly string[]).includes(role)) {
    redirect('/dashboard')
  }

  // Fetch everyone, sorted by serial so the printed batch reads in the
  // order people signed up — handy for check-in staff on the day.
  const rows = await prisma.inauguralRegistration.findMany({
    orderBy: { serialNumber: 'asc' },
  })

  const siteUrl = getSiteUrl()

  const badges: BulkBadgeItem[] = rows.map((r) => {
    const registrationId = formatBadgeId(r)
    const subtitle =
      r.fromOutsideBarnstaple && r.homeChurch
        ? r.homeChurch
        : 'RCCG Glory Tabernacle, Barnstaple'
    return {
      id: r.id,
      registrationId,
      firstName: r.firstName,
      lastName: r.lastName,
      subtitle,
      qrTarget: `${siteUrl}/inaugural-service/programme?id=${encodeURIComponent(registrationId)}`,
    }
  })

  return <BulkBadgePrint badges={badges} perPage={perPage} />
}
