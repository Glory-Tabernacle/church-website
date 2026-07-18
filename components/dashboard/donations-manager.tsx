'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Download, FileSpreadsheet } from 'lucide-react'
import {
  DONATION_TYPE_META,
  formatPence,
  type DonationStatus,
  type DonationType,
} from '@/lib/types/donation'

export interface DashboardDonation {
  id: string
  receiptNumber: number
  receiptId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  giftType: DonationType
  amountPence: number
  currency: string
  note: string | null
  giftAidClaimed: boolean
  giftAidAddressLine1: string | null
  giftAidPostcode: string | null
  status: DonationStatus
  paidAt: string | Date | null
  createdAt: string | Date
}

interface ListResponse {
  donations: DashboardDonation[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  totals: {
    succeededCount: number
    succeededPence: number
  }
}

interface Props {
  initialRows: DashboardDonation[]
  initialTotal: number
  initialTotals: { succeededCount: number; succeededPence: number }
  pageSize: number
}

function formatDate(v: string | Date): string {
  const d = typeof v === 'string' ? new Date(v) : v
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const STATUS_STYLES: Record<DonationStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  SUCCEEDED: { label: 'Received', className: 'bg-green-50 text-green-700 border border-green-200' },
  FAILED: { label: 'Failed', className: 'bg-red-50 text-red-700 border border-red-200' },
  REFUNDED: { label: 'Refunded', className: 'bg-gray-100 text-gray-700 border border-gray-200' },
}

export function DonationsManager({
  initialRows,
  initialTotal,
  initialTotals,
  pageSize,
}: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<DonationStatus | ''>('')
  const [giftType, setGiftType] = useState<DonationType | ''>('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ListResponse>({
    donations: initialRows,
    total: initialTotal,
    page: 1,
    pageSize,
    totalPages: Math.max(1, Math.ceil(initialTotal / pageSize)),
    totals: initialTotals,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)

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
        if (status) params.set('status', status)
        if (giftType) params.set('giftType', giftType)
        const res = await fetch(`/api/admin/donations?${params}`, {
          cache: 'no-store',
        })
        if (cancelled) return
        if (res.ok) setData(await res.json())
        else {
          const json = await res.json().catch(() => ({}))
          setError(json.error ?? 'Could not load donations.')
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Donations fetch error:', err)
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
  }, [hasInteracted, page, pageSize, search, status, giftType])

  const startIdx = data.total === 0 ? 0 : (data.page - 1) * pageSize + 1
  const endIdx = Math.min(data.page * pageSize, data.total)

  return (
    <div className="space-y-4">
      {/* Aggregate stat + export card */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gray-500">
            Total received
          </p>
          <p className="mt-2 text-3xl font-extrabold text-[#000666]">
            {formatPence(data.totals.succeededPence)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {data.totals.succeededCount} successful gift
            {data.totals.succeededCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gray-500">
              Export
            </p>
            <p className="mt-2 text-sm text-gray-600">
              CSV for the treasurer&apos;s records and HMRC Gift Aid claims.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="/api/admin/donations/export?giftAidOnly=true"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1b6d24] px-3 py-2 text-xs font-bold text-white hover:opacity-90"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Gift Aid CSV
            </a>
            <a
              href="/api/admin/donations/export"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-3.5 w-3.5" />
              All donations CSV
            </a>
          </div>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Search by name, email, or GT-D-2026-0001"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setHasInteracted(true)
          }}
          className="w-full max-w-lg rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as DonationStatus | '')
              setHasInteracted(true)
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
          >
            <option value="">All statuses</option>
            <option value="SUCCEEDED">Received</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <select
            value={giftType}
            onChange={(e) => {
              setGiftType(e.target.value as DonationType | '')
              setHasInteracted(true)
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
          >
            <option value="">All types</option>
            {(Object.keys(DONATION_TYPE_META) as DonationType[]).map((t) => (
              <option key={t} value={t}>
                {DONATION_TYPE_META[t].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        {data.total === 0
          ? 'No donations yet'
          : `Showing ${startIdx}–${endIdx} of ${data.total}`}
        {isLoading && ' · loading…'}
      </p>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <Th>Receipt</Th>
              <Th>Donor</Th>
              <Th>Type</Th>
              <Th>Amount</Th>
              <Th>Gift Aid</Th>
              <Th>Status</Th>
              <Th>Received</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.donations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                  {isLoading ? 'Loading…' : 'No donations match your filters.'}
                </td>
              </tr>
            ) : (
              data.donations.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <Td>
                    <Link
                      href={`/dashboard/donations/${r.id}`}
                      className="font-mono text-xs font-bold text-[#000666] hover:underline"
                    >
                      {r.receiptId}
                    </Link>
                  </Td>
                  <Td>
                    <Link
                      href={`/dashboard/donations/${r.id}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {r.firstName} {r.lastName}
                    </Link>
                    <br />
                    <a
                      className="text-xs text-blue-600 hover:underline"
                      href={`mailto:${r.email}`}
                    >
                      {r.email}
                    </a>
                  </Td>
                  <Td>
                    <span className="text-sm text-gray-700">
                      {DONATION_TYPE_META[r.giftType].label}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-bold text-[#000666]">
                      {formatPence(r.amountPence, r.currency.toUpperCase())}
                    </span>
                  </Td>
                  <Td>
                    {r.giftAidClaimed ? (
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                        Gift Aid
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[r.status].className}`}
                    >
                      {STATUS_STYLES[r.status].label}
                    </span>
                  </Td>
                  <Td>
                    {r.paidAt ? formatDate(r.paidAt) : formatDate(r.createdAt)}
                  </Td>
                </tr>
              ))
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
