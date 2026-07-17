import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  INAUGURAL_ADMIN_ROLES,
  CHILDREN_AGE_GROUPS,
  formatBadgeId,
  type ChildrenAgeGroup,
} from '@/lib/types/inaugural-registration'
import {
  InauguralManager,
  type DashboardInauguralRegistration,
} from '@/components/dashboard/inaugural-manager'

/**
 * Narrow Prisma's JsonValue into the typed ChildrenAgeGroup[] the dashboard
 * expects. Defensive — keeps only known age-group labels and drops anything
 * malformed (legacy rows, hand-edited DB writes, etc.).
 */
function narrowAgeGroups(value: unknown): ChildrenAgeGroup[] | null {
  if (!Array.isArray(value)) return null
  const known = new Set<string>(CHILDREN_AGE_GROUPS)
  const filtered = value.filter(
    (v): v is ChildrenAgeGroup => typeof v === 'string' && known.has(v)
  )
  return filtered.length > 0 ? filtered : null
}

const PAGE_SIZE = 25

function getSiteUrl(): string {
  const url =
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    'https://www.glorytabernacle.co.uk'
  // Strip trailing slash AND canonicalise the apex to the www. host.
  // Some env configs omit www, but glorytabernacle.co.uk has no DNS
  // record — only www. does — so bare-domain QRs fail with "site
  // cannot be reached" when scanned. Force the www. prefix here so
  // every generated QR / URL is guaranteed to resolve.
  return url
    .replace(/\/+$/, '')
    .replace(/^https:\/\/glorytabernacle\.co\.uk/, 'https://www.glorytabernacle.co.uk')
}

export default async function InauguralServiceDashboardPage() {
  // Auth: session cookie must exist + role must be in the admin allow-list.
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

  const [total, rows] = await Promise.all([
    prisma.inauguralRegistration.count(),
    prisma.inauguralRegistration.findMany({
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
    }),
  ])

  const initialRows: DashboardInauguralRegistration[] = rows.map((r) => ({
    ...r,
    registrationId: formatBadgeId(r),
    childrenAgeGroups: narrowAgeGroups(r.childrenAgeGroups),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#000666]">Inaugural Service Registrations</h2>
        <p className="mt-1 text-sm text-gray-500 max-w-2xl">
          Every person who&apos;s registered for the inaugural service on 19 July 2026. Search by name, email, or registration ID (e.g. <code className="text-gray-600">GT-2026-0001</code>). Click any row&apos;s ID to copy it, or &quot;View badge&quot; to preview and print the badge.
        </p>
      </div>

      <InauguralManager
        initialRows={initialRows}
        initialTotal={total}
        pageSize={PAGE_SIZE}
        siteUrl={getSiteUrl()}
      />
    </div>
  )
}
