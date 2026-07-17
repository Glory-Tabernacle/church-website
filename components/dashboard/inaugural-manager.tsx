'use client'

import { Fragment, useEffect, useState } from 'react'
import { ChevronDown, Printer } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import { GENDER_LABELS, type Gender } from '@/lib/types/group-member'
import { type ChildrenAgeGroup } from '@/lib/types/inaugural-registration'
import { InauguralBadge, type BadgeData } from './inaugural-badge'

type PerPage = 4 | 6 | 8

export interface DashboardInauguralRegistration {
  id: string
  registrationId: string
  serialNumber: number
  /** Random 4-digit code minted at registration time. Null for legacy
   *  rows created before the random-ID change shipped — those still
   *  show their serialNumber-derived registrationId. */
  publicCode: string | null
  firstName: string
  lastName: string
  email: string
  gender: Gender
  address: string
  isRccgMember: boolean
  fromOutsideBarnstaple: boolean
  homeChurch: string | null
  photographyConsent: boolean
  bringingChildren: boolean
  numberOfChildren: number | null
  childrenAgeGroups: ChildrenAgeGroup[] | null
  childrenSpecialNeeds: string | null
  createdAt: Date | string
}

interface ListResponse {
  registrations: DashboardInauguralRegistration[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface InauguralManagerProps {
  initialRows: DashboardInauguralRegistration[]
  initialTotal: number
  pageSize: number
  /** Base URL used to build the QR target on the badge. Set in the page from
   *  SITE_URL so the QR points at production, not localhost. */
  siteUrl: string
}

function formatDate(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function subtitleFor(r: DashboardInauguralRegistration): string {
  if (r.fromOutsideBarnstaple && r.homeChurch) return r.homeChurch
  return 'RCCG Glory Tabernacle, Barnstaple'
}

export function InauguralManager({
  initialRows,
  initialTotal,
  pageSize,
  siteUrl,
}: InauguralManagerProps) {
  const { toast } = useToast()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ListResponse>({
    registrations: initialRows,
    total: initialTotal,
    page: 1,
    pageSize,
    totalPages: Math.max(1, Math.ceil(initialTotal / pageSize)),
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewBadge, setPreviewBadge] = useState<BadgeData | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [printPickerOpen, setPrintPickerOpen] = useState(false)
  // Accordion-style: only one row expanded at a time. Click a chevron to
  // reveal children-attending detail + supplementary address / home-church
  // fields for that registrant. Clicking again (or another chevron) closes.
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId((current) => (current === id ? null : id))
  }

  // Debounce the search box.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    if (!hasInteracted) return
    let cancelled = false
    async function fetchRows() {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        if (search) params.set('search', search)
        const res = await fetch(`/api/admin/inaugural-service?${params}`, {
          cache: 'no-store',
        })
        if (cancelled) return
        if (res.ok) {
          setData(await res.json())
        } else {
          const json = await res.json().catch(() => ({}))
          setError(json.error ?? 'Could not load registrations.')
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Inaugural fetch error:', err)
          setError('Network error')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchRows()
    return () => {
      cancelled = true
    }
  }, [hasInteracted, page, pageSize, search])

  function viewBadge(r: DashboardInauguralRegistration) {
    setPreviewBadge({
      registrationId: r.registrationId,
      firstName: r.firstName,
      lastName: r.lastName,
      subtitle: subtitleFor(r),
      // Scan destination — everyone lands on the same programme portal,
      // no ?id= query param. The portal itself is the same rich portal
      // for every guest; personalisation happens on the confirmation
      // email link (which does still carry ?id=).
      qrTarget: `${siteUrl}/inaugural-service/programme`,
    })
  }

  async function copyId(r: DashboardInauguralRegistration) {
    try {
      await navigator.clipboard.writeText(r.registrationId)
      toast({
        title: 'Registration ID copied',
        description: r.registrationId,
        variant: 'success',
        duration: 2500,
      })
    } catch {
      toast({
        title: 'Could not copy',
        variant: 'error',
        duration: 2500,
      })
    }
  }

  const startIdx = data.total === 0 ? 0 : (data.page - 1) * pageSize + 1
  const endIdx = Math.min(data.page * pageSize, data.total)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          aria-label="Search registrations"
          placeholder="Search by name, email, or ID (e.g. GT-2026-0001)"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setHasInteracted(true)
          }}
          className="w-full max-w-lg rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-600">
            {data.total === 0
              ? 'No registrations yet'
              : `Showing ${startIdx}–${endIdx} of ${data.total}`}
            {isLoading && ' · loading…'}
          </p>
          <button
            type="button"
            onClick={() => setPrintPickerOpen(true)}
            disabled={data.total === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#000666] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print badges
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Empty header for the expand-chevron column. */}
              <th className="w-10 px-2 py-3" aria-hidden="true" />
              <Th>Registration ID</Th>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Gender</Th>
              <Th>RCCG?</Th>
              <Th>From</Th>
              <Th>Photo</Th>
              <Th>Children</Th>
              <Th>Submitted</Th>
              <th className="px-4 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.registrations.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center text-sm text-gray-500">
                  {isLoading ? 'Loading…' : 'No registrations match your search.'}
                </td>
              </tr>
            ) : (
              data.registrations.map((r) => {
                const isExpanded = expandedId === r.id
                return (
                  <Fragment key={r.id}>
                    <tr className={isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                      <td className="w-10 px-2 py-3">
                        <button
                          type="button"
                          onClick={() => toggleExpand(r.id)}
                          aria-label={isExpanded ? 'Hide details' : 'Show details'}
                          aria-expanded={isExpanded}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                          />
                        </button>
                      </td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => copyId(r)}
                          title="Click to copy"
                          className="font-mono text-xs font-bold tracking-wider text-[#000666] hover:underline"
                        >
                          {r.registrationId}
                        </button>
                      </Td>
                      <Td>
                        <span className="font-medium text-gray-900">
                          {r.firstName} {r.lastName}
                        </span>
                      </Td>
                      <Td>
                        <a className="text-blue-600 hover:underline" href={`mailto:${r.email}`}>
                          {r.email}
                        </a>
                      </Td>
                      <Td>{GENDER_LABELS[r.gender]}</Td>
                      <Td>
                        <Pill kind={r.isRccgMember ? 'green' : 'gray'}>
                          {r.isRccgMember ? 'Member' : 'Non-member'}
                        </Pill>
                      </Td>
                      <Td>
                        {r.fromOutsideBarnstaple ? (
                          <span className="text-xs text-gray-700">
                            {r.homeChurch ?? 'Outside Barnstaple'}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Barnstaple</span>
                        )}
                      </Td>
                      <Td>
                        <Pill kind={r.photographyConsent ? 'green' : 'gray'}>
                          {r.photographyConsent ? '📸 Yes' : 'No'}
                        </Pill>
                      </Td>
                      <Td>
                        {r.bringingChildren ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(r.id)}
                            className="flex flex-col items-start gap-1 text-left"
                          >
                            <span className="text-xs font-bold text-[#000666] hover:underline">
                              {r.numberOfChildren ?? '—'} {r.numberOfChildren === 1 ? 'child' : 'children'}
                            </span>
                            {r.childrenSpecialNeeds && (
                              <span className="text-[10px] uppercase tracking-wider text-amber-700">
                                Note
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </Td>
                      <Td>{formatDate(r.createdAt)}</Td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => viewBadge(r)}
                          className="rounded-lg bg-[#000666] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                        >
                          View badge
                        </button>
                      </td>
                    </tr>

                    {/* Spotify-style detail panel — muted gray canvas, tight
                        eyebrow labels + large primary values, one prominent
                        block for children (the field this manager was missing)
                        with quoted special-needs note when present. */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={11} className="border-l-2 border-[#000666] bg-gray-50 p-0">
                          <div className="grid grid-cols-1 gap-8 px-8 py-8 md:grid-cols-3 md:gap-10">
                            {/* Children — the star of the panel */}
                            <section className="md:col-span-2">
                              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gray-500">
                                Children attending
                              </p>
                              {r.bringingChildren ? (
                                <div className="mt-4 space-y-6">
                                  <div className="flex items-baseline gap-3">
                                    <span className="text-5xl font-extrabold leading-none text-[#000666]">
                                      {r.numberOfChildren ?? '—'}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {r.numberOfChildren === 1 ? 'child coming with them' : 'children coming with them'}
                                    </span>
                                  </div>

                                  {r.childrenAgeGroups && r.childrenAgeGroups.length > 0 && (
                                    <div>
                                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-gray-400">
                                        Age groups
                                      </p>
                                      <p className="mt-2 text-sm font-medium text-gray-800">
                                        {r.childrenAgeGroups.join('  ·  ')}
                                      </p>
                                    </div>
                                  )}

                                  {r.childrenSpecialNeeds ? (
                                    <div>
                                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-amber-700">
                                        Special needs to be aware of
                                      </p>
                                      <blockquote className="mt-2 border-l-2 border-amber-400 pl-4 text-sm italic leading-relaxed text-gray-700">
                                        {r.childrenSpecialNeeds}
                                      </blockquote>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-400">No special-needs note left</p>
                                  )}
                                </div>
                              ) : (
                                <p className="mt-4 text-sm text-gray-400">Not bringing any children.</p>
                              )}
                            </section>

                            {/* Supplementary info column */}
                            <section className="space-y-6">
                              <div>
                                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gray-500">
                                  Address
                                </p>
                                <p className="mt-2 whitespace-normal text-sm text-gray-800">
                                  {r.address || <span className="text-gray-400">—</span>}
                                </p>
                              </div>

                              {r.fromOutsideBarnstaple && (
                                <div>
                                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gray-500">
                                    Home church
                                  </p>
                                  <p className="mt-2 text-sm text-gray-800">
                                    {r.homeChurch ?? <span className="text-gray-400">Not specified</span>}
                                  </p>
                                </div>
                              )}

                              <div>
                                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gray-500">
                                  Photography
                                </p>
                                <p className="mt-2 text-sm text-gray-800">
                                  {r.photographyConsent ? 'Happy to be photographed' : 'Prefers not to be photographed'}
                                </p>
                              </div>
                            </section>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => {
              setPage((p) => Math.max(1, p - 1))
              setHasInteracted(true)
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {data.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.totalPages || isLoading}
            onClick={() => {
              setPage((p) => Math.min(data.totalPages, p + 1))
              setHasInteracted(true)
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}

      {previewBadge && (
        <InauguralBadge data={previewBadge} onClose={() => setPreviewBadge(null)} />
      )}

      {printPickerOpen && (
        <PrintPickerModal onClose={() => setPrintPickerOpen(false)} />
      )}
    </div>
  )
}

/**
 * Small modal that asks how many badges to print per A4 sheet, then
 * opens the /print route with that setting in a new tab. Kept inline
 * here because it's only used from this manager — no need for its own
 * file yet.
 */
function PrintPickerModal({ onClose }: { onClose: () => void }) {
  const [perPage, setPerPage] = useState<PerPage>(4)

  const options: { value: PerPage; hint: string }[] = [
    { value: 4, hint: '2 × 2 grid — largest badges, easiest to cut and hand out' },
    { value: 6, hint: '2 × 3 grid — a balanced size, fewer sheets to print' },
    { value: 8, hint: '2 × 4 grid — most compact, uses the least paper' },
  ]

  const printUrl = `/dashboard/inaugural-service/print?perPage=${perPage}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-picker-title"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 px-6 py-5">
          <h3 id="print-picker-title" className="text-lg font-bold text-[#000666]">
            Print all badges
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Choose how many badges you&apos;d like on each A4 sheet. The next
            screen will show a preview and open the browser&apos;s print dialog.
          </p>
        </div>

        <div className="space-y-2 px-6 py-5">
          {options.map((opt) => {
            const active = perPage === opt.value
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  active
                    ? 'border-[#000666] bg-[#000666]/5'
                    : 'border-gray-200 hover:border-[#000666]/50'
                }`}
              >
                <input
                  type="radio"
                  name="perPage"
                  value={opt.value}
                  checked={active}
                  onChange={() => setPerPage(opt.value)}
                  className="mt-1 h-4 w-4 border-gray-400 text-[#000666] focus:ring-[#000666]"
                />
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {opt.value} per page
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">{opt.hint}</p>
                </div>
              </label>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <a
            href={printUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="inline-flex items-center rounded-lg bg-[#000666] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
          >
            Open print view
          </a>
        </div>
      </div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{children}</td>
}

function Pill({
  kind,
  children,
}: {
  kind: 'green' | 'gray'
  children: React.ReactNode
}) {
  const cls =
    kind === 'green'
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-600'
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
      {children}
    </span>
  )
}
