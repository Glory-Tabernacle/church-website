'use client'

import { useEffect, useState, useRef } from 'react'

/**
 * Countdown-then-curtain wrapper for the inaugural-service programme.
 *
 * Three states over the visitor's lifetime on this page:
 *
 *   1. `countdown` — before the reveal moment. Big centred numeric
 *      countdown ticking down live in the browser. Children are NOT in
 *      the DOM (nothing to spoil).
 *   2. `revealing` — the reveal moment hits. Children mount, but two
 *      navy curtain panels sit on top of them and slide off to left
 *      and right over ~2 seconds. Feels like a stage reveal.
 *   3. `revealed` — curtain animation finished. Curtains removed from
 *      the DOM, children fully interactive.
 *
 * The reveal timestamp is passed in as an ISO string from the server
 * component. That lets the server decide (production default vs
 * `?test_reveal_in=N` override) without leaking clock skew.
 */

interface Props {
  /** ISO datetime string — when to open the curtain. */
  revealAt: string
  /** Rendered inside the reveal — the programme cards + capstone CTA. */
  children: React.ReactNode
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
}

function computeTimeLeft(revealMs: number): TimeLeft {
  const totalMs = Math.max(0, revealMs - Date.now())
  const totalSeconds = Math.floor(totalMs / 1000)
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds, totalMs }
}

type RevealState = 'countdown' | 'revealing' | 'revealed'

export function ProgrammeReveal({ revealAt, children }: Props) {
  const revealMs = new Date(revealAt).getTime()

  // Compute initial state from the moment the component first mounts.
  // If we've already blown past the reveal timestamp (visitor loaded
  // the page after Sunday 12:30), skip the curtain animation entirely.
  const initialState: RevealState = Date.now() >= revealMs ? 'revealed' : 'countdown'
  const [state, setState] = useState<RevealState>(initialState)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => computeTimeLeft(revealMs))
  const curtainTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (state !== 'countdown') return

    const tick = () => {
      const next = computeTimeLeft(revealMs)
      setTimeLeft(next)
      if (next.totalMs <= 0) {
        // Flip to `revealing` — children mount underneath the curtains,
        // curtains start their slide-off animation immediately. After
        // ~2.6s (0.4s delay + 2s animation + tiny buffer) we consider
        // the curtain done and drop it from the DOM.
        setState('revealing')
        curtainTimeout.current = setTimeout(() => setState('revealed'), 2600)
      }
    }

    // Tick every 250ms — smoother when the seconds change, still cheap.
    const id = window.setInterval(tick, 250)
    return () => {
      window.clearInterval(id)
    }
  }, [state, revealMs])

  useEffect(() => {
    return () => {
      if (curtainTimeout.current) clearTimeout(curtainTimeout.current)
    }
  }, [])

  // ── State 1: Countdown ───────────────────────────────────────────
  if (state === 'countdown') {
    return <CountdownView timeLeft={timeLeft} revealMs={revealMs} />
  }

  // ── State 2 & 3: Reveal ──────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes gtCurtainLeftOff {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-105%); }
        }
        @keyframes gtCurtainRightOff {
          0%   { transform: translateX(0); }
          100% { transform: translateX(105%); }
        }
        @keyframes gtCurtainTextFade {
          0%   { opacity: 1; transform: scale(1); }
          40%  { opacity: 1; transform: scale(1.02); }
          100% { opacity: 0; transform: scale(0.98); }
        }
        .gt-curtain-shell {
          position: absolute;
          inset: 0;
          z-index: 10;
          overflow: hidden;
          pointer-events: none;
        }
        .gt-curtain-panel {
          position: absolute;
          top: 0;
          height: 100%;
          width: 51%;
          background-image:
            linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.06) 55%, transparent 100%),
            linear-gradient(to bottom, #000666 0%, #07184a 45%, #000666 100%);
          box-shadow: inset 0 0 60px rgba(0,0,0,0.35);
        }
        .gt-curtain-panel--left {
          left: 0;
          animation: gtCurtainLeftOff 2000ms cubic-bezier(0.65, 0.05, 0.36, 1) 400ms forwards;
        }
        .gt-curtain-panel--right {
          right: 0;
          animation: gtCurtainRightOff 2000ms cubic-bezier(0.65, 0.05, 0.36, 1) 400ms forwards;
        }
        .gt-curtain-panel::after {
          content: '';
          position: absolute;
          top: 0;
          height: 100%;
          width: 3px;
          background: linear-gradient(to bottom, transparent 0%, rgba(163,246,156,0.65) 50%, transparent 100%);
        }
        .gt-curtain-panel--left::after  { right: 0; }
        .gt-curtain-panel--right::after { left: 0; }
        .gt-curtain-caption {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
          text-align: center;
          padding: 0 24px;
          z-index: 11;
          animation: gtCurtainTextFade 1400ms ease-out both;
          pointer-events: none;
        }
      `}</style>
      <div className="relative min-h-[600px]">
        {children}
        {state === 'revealing' && (
          <div className="gt-curtain-shell" aria-hidden="true">
            <div className="gt-curtain-panel gt-curtain-panel--left" />
            <div className="gt-curtain-panel gt-curtain-panel--right" />
            <div className="gt-curtain-caption">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.32em] text-[rgba(163,246,156,1)]">
                Welcome to your seat
              </p>
              <p className="mt-3 font-serif text-3xl font-extrabold md:text-5xl">
                The programme is opening
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Countdown view
// ---------------------------------------------------------------------------

/**
 * Manual 12-hour formatter using `Intl.DateTimeFormat` with an explicit
 * `Europe/London` timezone. `toLocaleTimeString('en-GB', {hour12:true})`
 * disagrees between Node (renders midnight as "00:48 am") and browsers
 * (render it as "12:48 am"), which broke SSR hydration. This function
 * produces the same string on both by extracting the hour + minute
 * components via `formatToParts` and building the 12-hour string
 * ourselves.
 */
function formatLondonTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const partVal = (t: string): number =>
    Number(parts.find((p) => p.type === t)?.value ?? 0)
  const hour24 = partVal('hour')
  const minute = partVal('minute')
  const ampm = hour24 >= 12 ? 'pm' : 'am'
  const h12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${h12}:${String(minute).padStart(2, '0')} ${ampm}`
}

/** Long weekday-day-month in London time. Deterministic across Node
 *  and browser because we pin the timeZone explicitly. */
function formatLondonDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

function CountdownView({
  timeLeft,
  revealMs,
}: {
  timeLeft: TimeLeft
  revealMs: number
}) {
  const revealDate = new Date(revealMs)
  const displayTime = formatLondonTime(revealDate)
  const displayDate = formatLondonDate(revealDate)

  const showDays = timeLeft.days > 0

  return (
    <div className="mx-auto max-w-3xl py-12 text-center md:py-16">
      <style>{`
        @keyframes gtCountdownPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.02); }
        }
        .gt-countdown-live {
          animation: gtCountdownPulse 1.6s ease-in-out infinite;
        }
      `}</style>
      <p className="gt-countdown-live inline-flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-[#1b6d24]">
        <span className="inline-block h-2 w-2 rounded-full bg-[#1b6d24]" />
        The programme opens in
      </p>
      <h2 className="mt-4 text-3xl font-extrabold text-[#000666] md:text-5xl">
        Almost time
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600 md:text-base">
        The full programme, hymns, and Order of Service will unveil the moment
        we&rsquo;re ready — at <strong>{displayTime}</strong> on {displayDate}.
      </p>

      <div className="mt-10 flex justify-center gap-3 md:gap-4">
        {showDays && <Box value={timeLeft.days} label="Days" />}
        <Box value={timeLeft.hours} label="Hours" />
        <Box value={timeLeft.minutes} label="Mins" />
        <Box value={timeLeft.seconds} label="Secs" />
      </div>

      <p className="mx-auto mt-12 max-w-md text-xs leading-relaxed text-gray-500 md:text-sm">
        Keep this tab open. When the curtain opens you&rsquo;ll see every
        card, hymn, and detail of the service — no need to refresh.
      </p>
    </div>
  )
}

function Box({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[74px] flex-col items-center rounded-2xl border border-[#000666]/15 bg-white px-3 py-5 shadow-[0_8px_28px_-14px_rgba(0,6,102,0.35)] md:min-w-[96px] md:py-6">
      <span className="font-serif text-4xl font-extrabold tabular-nums leading-none text-[#000666] md:text-6xl">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-2 text-[0.6rem] font-extrabold uppercase tracking-[0.22em] text-gray-500 md:text-xs">
        {label}
      </span>
    </div>
  )
}
