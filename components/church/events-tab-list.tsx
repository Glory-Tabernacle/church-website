'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react'

/**
 * Master-detail layout for the "Upcoming Gatherings" section on /events.
 *
 * Left rail: a vertical list of every upcoming event (tab-style).
 * Right pane: the selected event's image, title, description, meta and
 *             a Register CTA.
 *
 * On mobile the rail collapses into a horizontally-scrollable pill row
 * across the top, and the detail sits below it — same content, layout
 * that fits a narrow viewport.
 */

/**
 * Serialised PublicEvent (dates come across the RSC → client boundary as
 * strings when the parent forwards them via JSON). We accept both to be
 * defensive so the component works whether the parent passes Date
 * instances or ISO strings.
 */
export interface TabListEvent {
  id: string
  title: string
  description: string
  date: Date | string
  time: string | null
  location: string | null
  imageSrc: string | null
  imageAlt: string | null
  registrationHref: string | null
}

interface Props {
  events: TabListEvent[]
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=80'

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function EventsTabList({ events }: Props) {
  const [selectedId, setSelectedId] = useState<string>(events[0]?.id ?? '')
  const selected = events.find((e) => e.id === selectedId) ?? events[0]

  if (!selected) return null

  const selectedDate = toDate(selected.date)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(240px,300px)_1fr] lg:gap-10">
      {/* ─── Left rail: tab list ───────────────────────────────────── */}
      <nav aria-label="Upcoming events" className="lg:border-r lg:border-gray-100 lg:pr-4">
        <ul
          className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
          role="tablist"
        >
          {events.map((e) => {
            const active = e.id === selected.id
            const d = toDate(e.date)
            return (
              <li key={e.id} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedId(e.id)}
                  className={`group w-full whitespace-nowrap rounded-lg border-l-2 px-4 py-3 text-left transition-colors lg:whitespace-normal ${
                    active
                      ? 'border-[#1b6d24] bg-[#000666]/5'
                      : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p
                    className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
                    style={{ color: 'var(--church-green)' }}
                  >
                    {formatShortDate(d)}
                  </p>
                  <p
                    className={`mt-1 text-sm font-bold leading-tight ${
                      active ? 'text-[#000666]' : 'text-gray-700'
                    }`}
                  >
                    {e.title}
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ─── Right pane: selected event detail ─────────────────────── */}
      <article
        role="tabpanel"
        aria-live="polite"
        className="min-w-0"
      >
        {/* Image */}
        <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100">
          <Image
            src={selected.imageSrc ?? FALLBACK_IMAGE}
            alt={selected.imageAlt ?? selected.title}
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority
          />
        </div>

        {/* Title + description */}
        <h3
          className="text-2xl font-extrabold leading-tight md:text-3xl"
          style={{ color: 'rgba(27,34,119,1)' }}
        >
          {selected.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 md:text-base">
          {selected.description}
        </p>

        {/* Meta rows */}
        <div className="mt-6 flex flex-col gap-2 text-sm text-gray-600">
          <MetaRow icon={Calendar} value={formatLongDate(selectedDate)} />
          {selected.time && <MetaRow icon={Clock} value={selected.time} />}
          {selected.location && <MetaRow icon={MapPin} value={selected.location} />}
        </div>

        {/* CTA */}
        {selected.registrationHref && (
          <Link
            href={selected.registrationHref}
            className="mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_12px_28px_-12px_rgba(0,6,102,0.7)] transition-all hover:gap-3 hover:opacity-90"
            style={{ backgroundColor: 'rgba(0,6,102,1)' }}
          >
            Register
            <ArrowRight className="h-4 w-4 transition-transform" aria-hidden="true" />
          </Link>
        )}
      </article>
    </div>
  )
}

function MetaRow({
  icon: Icon,
  value,
}: {
  icon: typeof Calendar
  value: string
}) {
  return (
    <span className="inline-flex items-start gap-2.5">
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0"
        style={{ color: 'var(--church-green)' }}
        aria-hidden="true"
      />
      <span>{value}</span>
    </span>
  )
}
