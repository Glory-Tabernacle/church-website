'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Quote, Sparkles, User } from 'lucide-react'
import type { PublicTestimony } from '@/app/testimonies/page'

/**
 * Public testimonies page — client shell.
 *
 * Two hero moments live on this page:
 *   1. A grid of Spotify-style cards, each with its own vivid gradient,
 *      a large decorative quote mark, the testimony body, and the
 *      author's byline. Cards fade up as they scroll into view.
 *   2. An inline submission form at the bottom that POSTs to
 *      /api/testimonials/public. Submissions land unpublished and go
 *      through admin review before appearing here.
 *
 * Motion: every ambient animation (fade-up, quote-mark float,
 * gradient shimmer) is gated behind `prefers-reduced-motion: no-preference`
 * so users who've asked their OS for calmer visuals get a still page.
 */

// ---------------------------------------------------------------------------
// Gradient palette — deterministically assigned per testimony
// ---------------------------------------------------------------------------

type Palette = {
  from: string
  via: string
  to: string
  accent: string
  quoteColor: string
}

/**
 * Rich, deep gradients only — every one must keep white text at AA
 * contrast, so no washed-out midtones. Ordered so consecutive
 * indices produce visually distinct neighbours (no two blues in a row).
 */
const PALETTES: Palette[] = [
  {
    from: '#000666',
    via: '#1e1b7a',
    to: '#4c1d95',
    accent: '#a3f69c',
    quoteColor: 'rgba(163, 246, 156, 0.28)',
  },
  {
    from: '#064e3b',
    via: '#0f766e',
    to: '#1b6d24',
    accent: '#fef3c7',
    quoteColor: 'rgba(254, 243, 199, 0.28)',
  },
  {
    from: '#7f1d1d',
    via: '#a02322',
    to: '#c8342e',
    accent: '#fed7aa',
    quoteColor: 'rgba(254, 215, 170, 0.32)',
  },
  {
    from: '#0e7490',
    via: '#155e75',
    to: '#164e63',
    accent: '#a3f69c',
    quoteColor: 'rgba(163, 246, 156, 0.28)',
  },
  {
    from: '#312e81',
    via: '#5b21b6',
    to: '#6d28d9',
    accent: '#fbcfe8',
    quoteColor: 'rgba(251, 207, 232, 0.32)',
  },
  {
    from: '#1e293b',
    via: '#334155',
    to: '#475569',
    accent: '#a3f69c',
    quoteColor: 'rgba(163, 246, 156, 0.28)',
  },
  {
    from: '#78350f',
    via: '#9a3412',
    to: '#c2410c',
    accent: '#fef3c7',
    quoteColor: 'rgba(254, 243, 199, 0.32)',
  },
  {
    from: '#134e4a',
    via: '#115e59',
    to: '#0f766e',
    accent: '#fbbf24',
    quoteColor: 'rgba(251, 191, 36, 0.28)',
  },
]

/** Deterministic hash → palette index so the same testimony always
 *  gets the same colour, even after list re-ordering. */
function pickPalette(seed: string): Palette {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }
  return PALETTES[Math.abs(hash) % PALETTES.length]
}

/** Author initials for the "album art" circle — up to 2 characters. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TestimoniesPageClient({
  testimonies,
}: {
  testimonies: PublicTestimony[]
}) {
  const formRef = useRef<HTMLDivElement | null>(null)

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <style>{`
        /* ── Hero entrance ─────────────────────────────────────── */
        @keyframes tstFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tst-fade-up { animation: tstFadeUp 700ms cubic-bezier(0.16, 1, 0.3, 1) both; }

        /* ── Card ambient gradient shimmer ─────────────────────── */
        @keyframes tstShimmer {
          0%, 100% { transform: translate(0, 0); }
          50%      { transform: translate(-4%, -3%); }
        }
        .tst-shimmer {
          animation: tstShimmer 14s ease-in-out infinite;
        }

        /* ── Quote-mark subtle float ───────────────────────────── */
        @keyframes tstQuoteFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-6px) rotate(-2deg); }
        }
        .tst-quote-float { animation: tstQuoteFloat 6s ease-in-out infinite; }

        /* ── Card fade-up on scroll (via IntersectionObserver) ── */
        .tst-card {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 800ms cubic-bezier(0.16, 1, 0.3, 1),
                      transform 800ms cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 400ms ease-out;
        }
        .tst-card.tst-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Hover: subtle Spotify-style lift + shine sweep ────── */
        @keyframes tstShine {
          from { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
          40%  { opacity: 1; }
          to   { transform: translateX(220%) skewX(-18deg); opacity: 0; }
        }
        .tst-card:hover .tst-shine { animation: tstShine 1100ms ease-out; }

        /* ── Reduced motion: strip every ambient animation ─────── */
        @media (prefers-reduced-motion: reduce) {
          .tst-fade-up,
          .tst-shimmer,
          .tst-quote-float {
            animation: none !important;
          }
          .tst-card,
          .tst-card.tst-visible {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          .tst-card:hover .tst-shine { animation: none !important; }
        }
      `}</style>

      <main className="min-h-screen bg-[#faf8f3] pb-24 pt-12 md:pt-16">
        {/* ─── Hero ─────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 text-center md:px-8">
          <div className="tst-fade-up">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#c8342e] md:text-sm">
              Testimonies
            </p>
            <h1 className="mt-4 font-serif text-4xl font-extrabold leading-tight text-[#000666] md:text-6xl">
              Real testimonies, real God
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-gray-600 md:text-lg">
              Every card below is a word from someone whose life Jesus
              has touched through this house. Read them, celebrate with
              them, and if He&rsquo;s done something for you too — add
              yours.
            </p>
            {/* Scripture banner */}
        <div className="mx-auto mt-8 max-w-2xl">
          <div
            className="relative overflow-hidden rounded-2xl px-7 py-6 text-center shadow-[0_8px_32px_-8px_rgba(0,6,102,0.28)]"
            style={{
              background: 'linear-gradient(135deg, #000666 0%, #1e1b7a 50%, #1b6d24 100%)',
            }}
          >
            {/* decorative quote marks */}
            <span
              className="pointer-events-none absolute left-3 top-2 font-serif text-7xl font-black leading-none text-white/10 select-none"
              aria-hidden="true"
            >
              &ldquo;
            </span>
            <span
              className="pointer-events-none absolute bottom-2 right-3 font-serif text-7xl font-black leading-none text-white/10 select-none"
              aria-hidden="true"
            >
              &rdquo;
            </span>
            <p className="relative font-serif text-base font-semibold italic leading-relaxed text-white md:text-lg">
              And they overcame him by the blood of the Lamb, and by the word
              of their testimony; and they loved not their lives unto the death.
            </p>
            <p className="relative mt-3 text-xs font-black uppercase tracking-[0.28em] text-[#a3f69c]">
              Revelation 12:11
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row md:mt-10">
              <button
                type="button"
                onClick={scrollToForm}
                className="inline-flex items-center gap-2 rounded-full bg-[#000666] px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-[#0a1170] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8342e] focus-visible:ring-offset-2"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Share your testimony
              </button>
              {testimonies.length > 0 && (
                <span className="text-xs font-bold uppercase tracking-[0.28em] text-gray-400 md:text-sm">
                  {testimonies.length}{' '}
                  {testimonies.length === 1 ? 'testimony' : 'testimonies'} shared
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ─── Cards grid ───────────────────────────────────────── */}
        <section className="mx-auto mt-14 max-w-6xl px-4 md:mt-20 md:px-8">
          {testimonies.length > 0 ? (
            <CardsGrid testimonies={testimonies} />
          ) : (
            <EmptyState onShareClick={scrollToForm} />
          )}
        </section>

        {/* ─── Submission form ──────────────────────────────────── */}
        <section
          ref={formRef}
          id="share"
          className="mx-auto mt-20 max-w-3xl px-4 md:mt-28 md:px-8"
        >
          <SubmitForm />
        </section>
      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// Cards grid + observer
// ---------------------------------------------------------------------------

function CardsGrid({ testimonies }: { testimonies: PublicTestimony[] }) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const els = cardRefs.current.filter(
      (el): el is HTMLDivElement => el !== null
    )

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('tst-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('tst-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [testimonies])

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
      {testimonies.map((t, i) => (
        <TestimonyCard
          key={t.id}
          ref={(el) => {
            cardRefs.current[i] = el
          }}
          testimony={t}
          staggerMs={i * 70}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Single card — Spotify "cover" vibe with gradient + big quote mark
// ---------------------------------------------------------------------------

const TestimonyCard = ({
  ref,
  testimony,
  staggerMs,
}: {
  ref: (el: HTMLDivElement | null) => void
  testimony: PublicTestimony
  staggerMs: number
}) => {
  const palette = pickPalette(testimony.id)
  const authorInitials = initials(testimony.name)

  return (
    <div
      ref={ref}
      className="tst-card group relative overflow-hidden rounded-2xl shadow-[0_10px_30px_-12px_rgba(0,6,102,0.35)] hover:shadow-[0_24px_60px_-16px_rgba(0,6,102,0.55)]"
      style={{
        transitionDelay: `${staggerMs}ms`,
        background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.via} 50%, ${palette.to} 100%)`,
      }}
    >
      {/* Animated inner gradient wash — parallax feel without heavy assets. */}
      <div
        className="tst-shimmer pointer-events-none absolute -inset-8 opacity-70"
        aria-hidden="true"
        style={{
          background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.14) 0%, transparent 45%),
                       radial-gradient(circle at 70% 80%, ${palette.accent}22 0%, transparent 55%)`,
        }}
      />

      {/* Hover shine sweep */}
      <span
        className="tst-shine pointer-events-none absolute inset-y-0 left-0 w-1/2 -translate-x-full"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
        }}
      />

      {/* Large decorative quote mark, top-right corner */}
      <Quote
        className="tst-quote-float pointer-events-none absolute right-3 top-3 h-24 w-24 md:right-4 md:top-4 md:h-32 md:w-32"
        style={{ color: palette.quoteColor }}
        strokeWidth={1.2}
        aria-hidden="true"
      />

      <div className="relative flex h-full min-h-[340px] flex-col justify-between p-6 md:min-h-[380px] md:p-7">
        {/* Quote body — clamped so mixed lengths still tile cleanly.
            No line-clamp on the whole card; users can open the modal
            or just read what fits. */}
        <blockquote className="relative z-10 mt-6 font-serif text-lg leading-relaxed text-white md:mt-8 md:text-xl">
          <span className="line-clamp-[8]">{testimony.quote}</span>
        </blockquote>

        {/* Byline */}
        <div className="relative z-10 mt-6">
          <div
            className="h-px w-10"
            style={{ backgroundColor: palette.accent, opacity: 0.7 }}
            aria-hidden="true"
          />
          <div className="mt-4 flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-serif text-sm font-black backdrop-blur-sm"
              style={{
                background: 'rgba(255,255,255,0.14)',
                border: `1.5px solid ${palette.accent}66`,
                color: palette.accent,
              }}
              aria-hidden="true"
            >
              {authorInitials}
            </div>
            <div className="min-w-0">
              <p
                className="truncate text-sm font-bold"
                style={{ color: palette.accent }}
              >
                {testimony.name}
              </p>
              <p className="text-[0.6rem] font-black uppercase tracking-[0.24em] text-white/50 md:text-[0.65rem]">
                Member since {testimony.memberSince}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
TestimonyCard.displayName = 'TestimonyCard'

// ---------------------------------------------------------------------------
// Empty state — first-ever visitor, no testimonies yet
// ---------------------------------------------------------------------------

function EmptyState({ onShareClick }: { onShareClick: () => void }) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm md:p-12">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#000666]/5 md:h-16 md:w-16">
        <Quote className="h-6 w-6 text-[#000666] md:h-7 md:w-7" strokeWidth={1.5} />
      </div>
      <h2 className="mt-5 font-serif text-2xl font-extrabold text-[#000666] md:text-3xl">
        Be the first to share
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600 md:text-base">
        No testimonies have been shared yet. If God has touched your life
        through this house, we&rsquo;d love to hear about it — your testimony
        may be the one that lifts someone else&rsquo;s faith today.
      </p>
      <button
        type="button"
        onClick={onShareClick}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1b6d24] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-md transition-transform hover:-translate-y-0.5"
      >
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
        Share yours below
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Submission form — hits POST /api/testimonials/public
// ---------------------------------------------------------------------------

const MIN_QUOTE_LEN = 10
const MAX_QUOTE_LEN = 2000
const MAX_NAME_LEN = 100

function SubmitForm() {
  const [name, setName] = useState('')
  const [quote, setQuote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const canSubmit =
    name.trim().length > 0 &&
    quote.trim().length >= MIN_QUOTE_LEN &&
    quote.trim().length <= MAX_QUOTE_LEN &&
    !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/testimonials/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          quote: quote.trim(),
        }),
      })
      if (res.ok) {
        setSubmitted(true)
        setName('')
        setQuote('')
      } else {
        const data = (await res.json().catch(() => null)) as
          | { error?: string; details?: string[] }
          | null
        const detailMsg = data?.details?.[0]
        setError(
          detailMsg ??
            data?.error ??
            'Something went wrong. Please try again in a moment.'
        )
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#1b6d24]/20 bg-white p-8 text-center shadow-[0_20px_50px_-20px_rgba(27,109,36,0.35)] md:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1b6d24]/10 md:h-16 md:w-16">
          <svg
            className="h-7 w-7 text-[#1b6d24] md:h-8 md:w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
        <h2 className="mt-5 font-serif text-2xl font-extrabold text-[#000666] md:text-3xl">
          Thank you.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600 md:text-base">
          Your testimony has been received and will appear on this page
          once our team has reviewed it. Bless you for sharing what God
          has done.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 text-xs font-black uppercase tracking-widest text-[#000666] underline underline-offset-4 hover:text-[#c8342e]"
        >
          Share another
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_16px_40px_-20px_rgba(0,6,102,0.25)] md:p-10">
      <div className="mb-6 text-center md:mb-8">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.32em] text-[#c8342e] md:text-xs">
          Share Your Testimony
        </p>
        <h2 className="mt-2 font-serif text-2xl font-extrabold text-[#000666] md:text-4xl">
          What has God done for you?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-600 md:text-base">
          Your testimony will be reviewed by our team before it appears on
          this page. Please write in your own words.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="tst-name"
            className="mb-1.5 block text-xs font-black uppercase tracking-widest text-[#000666]"
          >
            Your name
          </label>
          <div className="relative">
            <User
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="tst-name"
              type="text"
              required
              maxLength={MAX_NAME_LEN}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
              className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#000666] focus:outline-none focus:ring-2 focus:ring-[#000666]/20 md:text-base"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="tst-quote"
            className="mb-1.5 block text-xs font-black uppercase tracking-widest text-[#000666]"
          >
            Your testimony
          </label>
          <textarea
            id="tst-quote"
            required
            rows={6}
            minLength={MIN_QUOTE_LEN}
            maxLength={MAX_QUOTE_LEN}
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="Tell us what God has done in your life through Glory Tabernacle…"
            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 focus:border-[#000666] focus:outline-none focus:ring-2 focus:ring-[#000666]/20 md:text-base"
          />
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-gray-400">
              Minimum {MIN_QUOTE_LEN} characters
            </span>
            <span
              className={
                quote.length > MAX_QUOTE_LEN - 100
                  ? 'font-bold text-[#c8342e]'
                  : 'text-gray-400'
              }
            >
              {quote.length} / {MAX_QUOTE_LEN}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#000666] px-6 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#0a1170] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 md:text-base"
        >
          {submitting ? (
            'Submitting…'
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Send my testimony
            </>
          )}
        </button>

        <p className="text-center text-xs leading-relaxed text-gray-400">
          By submitting, you consent to your name and testimony being
          published on this website after review. See our{' '}
          <a
            href="/privacy-notice"
            className="font-semibold text-[#000666] underline-offset-2 hover:underline"
          >
            privacy notice
          </a>
          .
        </p>
      </form>
    </div>
  )
}
