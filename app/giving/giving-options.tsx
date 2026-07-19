'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Building2, CreditCard, Users } from 'lucide-react'
import { GiveByCardForm } from './give-by-card-form'

/**
 * Tabbed "How to Give" panel — vertical tab rail on desktop, horizontal
 * pill scroller on mobile, one detail pane on the right.
 *
 * Three giving methods live behind the tabs:
 *   1. Give by card (Stripe checkout) — featured/default
 *   2. Bank transfer (Lloyds UK)
 *   3. In-person during Sunday services
 *
 * The card form is the biggest slab of markup, so it lives in its own
 * client component; this file just orchestrates which detail pane is
 * shown for the currently-selected tab.
 */

type TabId = 'card' | 'bank' | 'in-person'

interface TabDef {
  id: TabId
  label: string
  subtitle: string
  icon: typeof CreditCard
  /** Optional pill shown on the tab — e.g. "Recommended". */
  pill?: string
}

const TABS: TabDef[] = [
  // {
  //   id: 'card',
  //   label: 'Give by card',
  //   subtitle: 'One-off, monthly, or offering',
  //   icon: CreditCard,
  //   pill: 'Recommended',
  // },
  {
    id: 'bank',
    label: 'Bank transfer',
    subtitle: 'Lloyds Bank · UK',
    icon: Building2,
  },
  {
    id: 'in-person',
    label: 'In-person',
    subtitle: "During Sunday's service",
    icon: Users,
  },
]

export function GivingOptions() {
  const [selectedId, setSelectedId] = useState<TabId>('card')
  const selected = TABS.find((t) => t.id === selectedId) ?? TABS[0]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(240px,300px)_1fr] lg:gap-10">
      {/* ─── Left rail: tab list ─────────────────────────────────── */}
      <nav aria-label="Giving methods" className="lg:border-r lg:border-gray-200 lg:pr-4">
        <ul
          className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
          role="tablist"
        >
          {TABS.map((t) => {
            const active = t.id === selected.id
            const Icon = t.icon
            return (
              <li key={t.id} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedId(t.id)}
                  className={`group w-full whitespace-nowrap rounded-lg border-l-2 px-4 py-3 text-left transition-colors lg:whitespace-normal ${
                    active
                      ? 'border-[#1b6d24] bg-[#000666]/5'
                      : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        active ? 'bg-[#1b6d24]/10' : 'bg-gray-100'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          active ? 'text-[#1b6d24]' : 'text-gray-500'
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`text-sm font-bold leading-tight ${
                            active ? 'text-[#000666]' : 'text-gray-800'
                          }`}
                        >
                          {t.label}
                        </p>
                        {t.pill && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest ${
                              active
                                ? 'bg-[#1b6d24] text-white'
                                : 'bg-[#1b6d24]/10 text-[#1b6d24]'
                            }`}
                          >
                            {t.pill}
                          </span>
                        )}
                      </div>
                      <p
                        className={`mt-0.5 text-xs leading-relaxed ${
                          active ? 'text-gray-600' : 'text-gray-500'
                        }`}
                      >
                        {t.subtitle}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ─── Right pane: selected detail ─────────────────────────── */}
      <div role="tabpanel" aria-live="polite" className="min-w-0">
        {selected.id === 'card' && <CardPane />}
        {selected.id === 'bank' && <BankPane />}
        {selected.id === 'in-person' && <InPersonPane />}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail panes
// ---------------------------------------------------------------------------

function CardPane() {
  return (
    <div>
      <div className="mb-6">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#1b6d24]">
          Give by card
        </p>
        <h3 className="mt-2 text-2xl font-extrabold text-[#000666] md:text-3xl">
         Send in your givings securely
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 md:text-base">
          A one-off gift, a monthly standing gift, this Sunday&rsquo;s offering,
          or freewill / seed — pay securely by card in seconds. UK taxpayers can
          add Gift Aid at no extra cost.
        </p>
      </div>
      <GiveByCardForm />
      <p className="mt-6 text-center text-xs text-gray-500">
        Already a monthly donor?{' '}
        <a
          href="/giving/manage"
          className="font-semibold text-[#000666] underline-offset-4 hover:underline"
        >
          Manage your gift
        </a>
        .
      </p>
    </div>
  )
}

function BankPane() {
  return (
    <div>
      <div className="mb-6">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#1b6d24]">
          Bank transfer
        </p>
        <h3 className="mt-2 text-2xl font-extrabold text-[#000666] md:text-3xl">
          Direct to the church account
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 md:text-base">
          Send tithes, offerings, or a designated gift straight from your UK
          bank. Please include your full name in the reference so we can
          allocate it correctly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1fr] md:items-center">
        {/* Offering graphic */}
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-[0_18px_50px_rgba(0,6,102,0.12)]">
          <Image
            src="/offering.jpeg"
            alt="Offering & Tithe — RCCG Glory Tabernacle, Barnstaple: Account 12399462, Sort Code 30-54-66, Lloyds Bank"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 40vw"
          />
        </div>

        {/* Bank details card */}
        <div
          className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5"
          style={{ boxShadow: '0px 2px 12px 0px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'rgba(0,6,102,0.08)' }}
            >
              <Building2
                className="h-4 w-4"
                style={{ color: 'rgba(0,6,102,1)' }}
              />
            </div>
            <div>
              <h4
                className="text-sm font-bold"
                style={{ color: 'rgba(0,6,102,1)' }}
              >
                Bank Transfer (UK)
              </h4>
              <p className="text-[11px] text-gray-400">Lloyds Bank</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 rounded-xl bg-gray-50 p-3">
            <BankRow label="Name" value="RCCG GLORY TABERNACLE" />
            <BankRow label="Sort Code" value="30-54-66" />
            <BankRow label="Account" value="12399462" />
          </div>
          <p className="text-xs leading-relaxed text-gray-500">
            Prefer a giving reference? Use{' '}
            <span className="font-semibold text-gray-700">
              &ldquo;TITHE&rdquo;
            </span>
            ,{' '}
            <span className="font-semibold text-gray-700">
              &ldquo;OFFERING&rdquo;
            </span>{' '}
            or a project name plus your surname.
          </p>
        </div>
      </div>
    </div>
  )
}

function InPersonPane() {
  return (
    <div>
      <div className="mb-6">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#1b6d24]">
          In-person
        </p>
        <h3 className="mt-2 text-2xl font-extrabold text-[#000666] md:text-3xl">
          Give during our Sunday service
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 md:text-base">
          If you&rsquo;re joining us on a Sunday, you can give during our
          designated giving moments. Our stewards are happy to help with any
          questions.
        </p>
      </div>

      <div
        className="flex flex-col gap-4 rounded-2xl p-6"
        style={{ backgroundColor: 'rgba(0,6,102,1)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <Users className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <h4 className="text-base font-bold text-white">In-Person Giving</h4>
        </div>
        <p className="text-sm leading-relaxed text-white/80">
          Tithes and offerings are received at all regular Sunday morning
          services during our giving moments. Our team collects gifts from the
          congregation and guests, and receipts can be provided on request.
        </p>
        <div className="mt-2 rounded-xl bg-white/8 p-4 backdrop-blur-sm">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[rgba(163,246,156,1)]">
            Where we meet
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            North Devon College
          </p>
          <p className="text-xs text-white/70">
            Old Sticklepath Hill, Barnstaple, EX31 2BQ
          </p>
        </div>
      </div>
    </div>
  )
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <span
        className="font-semibold"
        style={{ color: 'rgba(0,6,102,1)' }}
      >
        {value}
      </span>
    </div>
  )
}
