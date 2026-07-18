'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'
import { AlertTriangle, ExternalLink, Loader2, Undo2 } from 'lucide-react'
import {
  DONATION_TYPE_META,
  formatPence,
  type DonationStatus,
  type DonationType,
} from '@/lib/types/donation'

export interface DetailDonation {
  id: string
  receiptId: string
  receiptNumber: number
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
  stripeSessionId: string | null
  stripePaymentIntentId: string | null
  stripeSubscriptionId: string | null
  paidAt: string | null
  createdAt: string
}

const STATUS_STYLES: Record<DonationStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  SUCCEEDED: { label: 'Received', className: 'bg-green-50 text-green-700 border border-green-200' },
  FAILED: { label: 'Failed', className: 'bg-red-50 text-red-700 border border-red-200' },
  REFUNDED: { label: 'Refunded', className: 'bg-gray-100 text-gray-700 border border-gray-200' },
}

function formatDate(v: string | null): string {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DonationDetail({ donation }: { donation: DetailDonation }) {
  const router = useRouter()
  const { toast } = useToast()
  const [confirming, setConfirming] = useState(false)
  const [isRefunding, setIsRefunding] = useState(false)

  const canRefund = donation.status === 'SUCCEEDED' && !!donation.stripePaymentIntentId
  const isMonthly = donation.giftType === 'MONTHLY'
  const meta = DONATION_TYPE_META[donation.giftType]

  async function handleRefund() {
    setIsRefunding(true)
    try {
      const res = await fetch(`/api/admin/donations/${donation.id}/refund`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({
          title: 'Refund failed',
          description: data.error ?? 'Please try again.',
          variant: 'error',
          duration: 5000,
        })
        setConfirming(false)
        return
      }
      toast({
        title: 'Refund issued',
        description: `${donation.receiptId} · ${formatPence(donation.amountPence, donation.currency.toUpperCase())} refunded to the donor`,
        variant: 'success',
        duration: 5000,
      })
      setConfirming(false)
      router.refresh()
    } catch (err) {
      console.error('Refund threw:', err)
      toast({
        title: 'Refund failed',
        description: 'Network error. Please try again.',
        variant: 'error',
      })
      setConfirming(false)
    } finally {
      setIsRefunding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero card — receipt id + amount + status */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#1b6d24]">
              Receipt
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-[#000666]">
              {donation.receiptId}
            </p>
            <p className="mt-4 text-4xl font-extrabold text-[#000666] md:text-5xl">
              {formatPence(donation.amountPence, donation.currency.toUpperCase())}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {meta.label}
              {isMonthly && ' · Recurring monthly'}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <span
              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${STATUS_STYLES[donation.status].className}`}
            >
              {STATUS_STYLES[donation.status].label}
            </span>
            {donation.status === 'SUCCEEDED' && donation.paidAt && (
              <p className="text-xs text-gray-500">
                Received {formatDate(donation.paidAt)}
              </p>
            )}
            {donation.status === 'PENDING' && (
              <p className="text-xs text-amber-700">
                Awaiting Stripe confirmation — check back in a moment.
              </p>
            )}
          </div>
        </div>

        {canRefund && (
          <div className="mt-8 border-t border-gray-100 pt-6">
            {confirming ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-900">
                      Refund {formatPence(donation.amountPence, donation.currency.toUpperCase())} to {donation.firstName} {donation.lastName}?
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-amber-800">
                      The donor will see the credit on their card in 5–10 working
                      days. This action can&apos;t be undone from the dashboard.
                      {isMonthly && ' Only this one gift is refunded — the monthly subscription continues; cancel it separately if needed.'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleRefund}
                        disabled={isRefunding}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRefunding ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Refunding…
                          </>
                        ) : (
                          <>
                            <Undo2 className="h-3.5 w-3.5" />
                            Yes, refund now
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        disabled={isRefunding}
                        className="inline-flex items-center rounded-lg border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800"
              >
                <Undo2 className="h-4 w-4" />
                Refund this gift
              </button>
            )}
          </div>
        )}
      </div>

      {/* Donor + gift info grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Section title="Donor">
          <Row label="Name" value={`${donation.firstName} ${donation.lastName}`} />
          <Row
            label="Email"
            value={
              <a
                className="text-blue-600 hover:underline"
                href={`mailto:${donation.email}`}
              >
                {donation.email}
              </a>
            }
          />
          <Row label="Phone" value={donation.phoneNumber ?? '—'} />
        </Section>

        <Section title="Gift">
          <Row label="Type" value={meta.label} />
          <Row
            label="Amount"
            value={formatPence(donation.amountPence, donation.currency.toUpperCase())}
          />
          <Row
            label="Received on"
            value={donation.paidAt ? formatDate(donation.paidAt) : '—'}
          />
          <Row label="Created" value={formatDate(donation.createdAt)} />
        </Section>

        <Section title="Gift Aid">
          {donation.giftAidClaimed ? (
            <>
              <Row
                label="Declaration"
                value={
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                    Yes, add Gift Aid (+25%)
                  </span>
                }
              />
              <Row label="Address" value={donation.giftAidAddressLine1 ?? '—'} />
              <Row label="Postcode" value={donation.giftAidPostcode ?? '—'} />
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Donor did not tick the Gift Aid box on this gift.
            </p>
          )}
        </Section>

        <Section title="Note from donor">
          {donation.note ? (
            <blockquote className="border-l-2 border-[#1b6d24] pl-3 text-sm italic text-gray-700">
              &ldquo;{donation.note}&rdquo;
            </blockquote>
          ) : (
            <p className="text-sm text-gray-500">No note left with this gift.</p>
          )}
        </Section>

        <Section title="Stripe references" fullWidth>
          {donation.stripeSessionId && (
            <StripeLink
              label="Checkout session"
              id={donation.stripeSessionId}
              path="checkout/sessions"
            />
          )}
          {donation.stripePaymentIntentId && (
            <StripeLink
              label="Payment intent"
              id={donation.stripePaymentIntentId}
              path="payments"
            />
          )}
          {donation.stripeSubscriptionId && (
            <StripeLink
              label="Subscription"
              id={donation.stripeSubscriptionId}
              path="subscriptions"
            />
          )}
          {!donation.stripeSessionId &&
            !donation.stripePaymentIntentId &&
            !donation.stripeSubscriptionId && (
              <p className="text-sm text-gray-500">
                No Stripe references on file yet — either the session is still
                pending or was created outside our records.
              </p>
            )}
        </Section>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
  fullWidth,
}: {
  title: string
  children: React.ReactNode
  fullWidth?: boolean
}) {
  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white p-5 shadow-sm ${
        fullWidth ? 'md:col-span-2' : ''
      }`}
    >
      <h3 className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gray-500">
        {title}
      </h3>
      <div className="mt-3 space-y-2.5">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  )
}

function StripeLink({
  label,
  id,
  path,
}: {
  label: string
  id: string
  path: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
      <div className="min-w-0">
        <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-gray-500">
          {label}
        </p>
        <p className="truncate font-mono text-xs text-gray-700">{id}</p>
      </div>
      <a
        href={`https://dashboard.stripe.com/${path}/${id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
      >
        Open <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  )
}
