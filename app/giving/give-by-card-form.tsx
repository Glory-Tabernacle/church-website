'use client'

import { useState, type FormEvent } from 'react'
import { CreditCard, Heart, Loader2, Lock } from 'lucide-react'
import {
  DONATION_TYPE_META,
  DONATION_PRESET_AMOUNTS_PENCE,
  formatPence,
  type DonationType,
} from '@/lib/types/donation'

/**
 * Give by Card — the public form that starts a Stripe Checkout session.
 *
 * Flow:
 *   1. Donor picks gift type + amount + fills details.
 *   2. Submit posts to /api/donations/create-checkout-session.
 *   3. API returns { url }; we redirect to Stripe's hosted checkout.
 *   4. On success, Stripe redirects back to /giving/success.
 *
 * We deliberately don't collect card details here — Stripe hosts the
 * card page for PCI reasons. This form only captures who the donor is
 * and what they want to give.
 */

export function GiveByCardForm() {
  const [giftType, setGiftType] = useState<DonationType>('ONE_OFF')
  const [amountPence, setAmountPence] = useState<number>(2000) // £20 default
  const [customMode, setCustomMode] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function pickPreset(pence: number) {
    setCustomMode(false)
    setCustomAmount('')
    setAmountPence(pence)
  }

  function pickCustom() {
    setCustomMode(true)
    setAmountPence(0)
  }

  function onCustomChange(v: string) {
    setCustomAmount(v)
    const n = Number(v)
    if (!Number.isFinite(n) || n < 0) {
      setAmountPence(0)
      return
    }
    setAmountPence(Math.round(n * 100))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (amountPence < 100) {
      setError('The minimum gift is £1.')
      return
    }

    const form = event.currentTarget
    const fd = new FormData(form)

    const payload = {
      firstName: String(fd.get('firstName') ?? ''),
      lastName: String(fd.get('lastName') ?? ''),
      email: String(fd.get('email') ?? ''),
      phoneNumber: String(fd.get('phoneNumber') ?? '') || undefined,
      giftType,
      amountPence,
      note: String(fd.get('note') ?? '') || undefined,
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/donations/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        const detail = Array.isArray(data.details)
          ? data.details.join(' ')
          : null
        throw new Error(detail ?? data.error ?? 'Could not start checkout.')
      }
      // Redirect the whole window — Stripe Checkout must load top-level.
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setIsSubmitting(false)
    }
  }

  const isRecurring = DONATION_TYPE_META[giftType].recurring

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-2xl rounded-2xl bg-white px-6 py-8 shadow-[0_18px_50px_rgba(0,6,102,0.08)] md:px-10 md:py-10"
    >
      <div className="mb-6 flex items-start gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: 'rgba(0,6,102,0.08)' }}
        >
          <CreditCard className="h-5 w-5" style={{ color: 'rgba(0,6,102,1)' }} />
        </div>
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#1b6d24]">
            Give by card
          </p>
          <h3 className="mt-1 text-xl font-extrabold text-[#000666] md:text-2xl">
            Sow a seed securely
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Powered by Stripe — the same trusted checkout used by Deliveroo,
            Amazon and thousands of UK charities.
          </p>
        </div>
      </div>

      {/* Gift type chips */}
      <fieldset className="mt-6">
        <legend className="mb-3 text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-gray-500">
          Type of gift
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(Object.keys(DONATION_TYPE_META) as DonationType[]).map((t) => {
            const meta = DONATION_TYPE_META[t]
            const active = giftType === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setGiftType(t)}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                  active
                    ? 'border-[#1b6d24] bg-[#1b6d24]/5'
                    : 'border-gray-200 hover:border-[#000666]/40'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    active ? 'border-[#1b6d24] bg-[#1b6d24]' : 'border-gray-300'
                  }`}
                >
                  {active && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-[#000666]">
                    {meta.label}
                    {meta.recurring && (
                      <span className="ml-2 rounded-full bg-[#000666]/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-[#000666]">
                        Monthly
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                    {meta.description}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Amount preset chips */}
      <fieldset className="mt-6">
        <legend className="mb-3 text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-gray-500">
          Amount{isRecurring ? ' per month' : ''}
        </legend>
        <div className="flex flex-wrap gap-2">
          {DONATION_PRESET_AMOUNTS_PENCE.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => pickPreset(p)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                !customMode && amountPence === p
                  ? 'border-[#1b6d24] bg-[#1b6d24] text-white'
                  : 'border-gray-200 bg-white text-[#000666] hover:border-[#1b6d24]/50'
              }`}
            >
              {formatPence(p)}
            </button>
          ))}
          <button
            type="button"
            onClick={pickCustom}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
              customMode
                ? 'border-[#1b6d24] bg-[#1b6d24] text-white'
                : 'border-gray-200 bg-white text-[#000666] hover:border-[#1b6d24]/50'
            }`}
          >
            Other
          </button>
        </div>
        {customMode && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-lg font-bold text-[#000666]">£</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="1"
              value={customAmount}
              onChange={(e) => onCustomChange(e.target.value)}
              placeholder="0.00"
              className="h-11 w-40 rounded-lg border border-gray-300 bg-white px-3 text-base font-bold text-gray-900 outline-none focus:border-[#000666] focus:ring-2 focus:ring-[#000666]/20"
            />
            {isRecurring && <span className="text-sm text-gray-500">/ month</span>}
          </div>
        )}
      </fieldset>

      {/* Personal details */}
      <section className="mt-8 grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
        <Field name="firstName" label="First name" placeholder="Your first name" autoComplete="given-name" required />
        <Field name="lastName" label="Last name" placeholder="Your last name" autoComplete="family-name" required />
        <div className="md:col-span-2">
          <Field name="email" label="Email" placeholder="you@example.com" type="email" autoComplete="email" required />
        </div>
        <div className="md:col-span-2">
          <Field name="phoneNumber" label="Phone (optional)" placeholder="+44 …" autoComplete="tel" />
        </div>
        <div className="md:col-span-2">
          <label className="block">
            <span className="mb-2 block text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-gray-500">
              A note with your gift (optional)
            </span>
            <textarea
              name="note"
              rows={2}
              maxLength={500}
              placeholder="e.g. For the inaugural service, or a prayer request…"
              className="w-full resize-none rounded-lg border border-gray-300 bg-white p-3 text-sm leading-6 text-gray-900 outline-none focus:border-[#000666] focus:ring-2 focus:ring-[#000666]/20"
            />
          </label>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Card details are entered on Stripe&rsquo;s secure page — we never see them.
        </p>
        <button
          type="submit"
          disabled={isSubmitting || amountPence < 100}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#1b6d24] px-6 text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_12px_22px_rgba(27,109,36,0.28)] transition-colors hover:bg-[#155a1d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting…
            </>
          ) : (
            <>
              <Heart className="h-4 w-4" />
              Give {amountPence >= 100 && formatPence(amountPence)}
              {isRecurring ? ' / month' : ''}
            </>
          )}
        </button>
      </div>
    </form>
  )
}

function Field({
  name,
  label,
  placeholder,
  type = 'text',
  autoComplete,
  required,
}: {
  name: string
  label: string
  placeholder: string
  type?: string
  autoComplete?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-gray-500">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-[#000666] focus:ring-2 focus:ring-[#000666]/20"
      />
    </label>
  )
}
