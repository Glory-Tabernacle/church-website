'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from '@/components/ui/modal'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LiveStreamSectionProps {
  heading?: string
  subtext?: string
  thumbnailSrc: string
  thumbnailAlt: string
  isLive: boolean
  youtubeLiveHref?: string
  /** ISO 8601 datetime string — countdown target */
  nextServiceDate: string
  /**
   * Optional event id used by the "Get Notified" form to subscribe the
   * visitor to a reminder. When omitted, the modal shows but submission
   * is disabled (subscriptions need a target event).
   */
  eventId?: string
}

// ---------------------------------------------------------------------------
// Countdown hook
// ---------------------------------------------------------------------------

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

function useCountdown(targetDate: string): TimeLeft {
  const calculate = (): TimeLeft => {
    const diff = new Date(targetDate).getTime() - Date.now()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
    const totalSeconds = Math.floor(diff / 1000)
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      expired: false,
    }
  }

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculate)

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calculate()), 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate])

  return timeLeft
}

// ---------------------------------------------------------------------------
// Countdown box
// ---------------------------------------------------------------------------

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="flex min-w-[3.75rem] flex-col items-center rounded-xl px-3 py-2.5"
      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(163,246,156,0.2)' }}
    >
      <span className="text-2xl font-extrabold leading-none text-white">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[0.55rem] font-bold uppercase tracking-widest" style={{ color: 'rgba(163,246,156,0.7)' }}>
        {label}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notify modal form
// ---------------------------------------------------------------------------

function NotifyModal({ eventId }: { eventId?: string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Submission is allowed even without an upcoming event — in that case
  // we still capture the visitor's general program interest so admins can
  // reach them later. When an eventId exists, we additionally subscribe
  // them to that event's 30-min-before reminder.
  const canSubmit = !isSubmitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    let valid = true
    if (!name.trim()) {
      setNameError('Name is required')
      valid = false
    } else {
      setNameError('')
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('A valid email is required')
      valid = false
    } else {
      setEmailError('')
    }
    if (!valid) return

    setIsSubmitting(true)

    const payload = { name: name.trim(), email: email.trim() }

    try {
      // Always capture as a general program-interest signup. This is the
      // primary outcome — if this succeeds we count the form as submitted.
      const interestPromise = fetch('/api/program-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      // If an upcoming event exists, also subscribe for its 30-min reminder.
      // Failure here is non-fatal — the admin still has the program-interest row.
      const eventPromise = eventId
        ? fetch(`/api/events/${eventId}/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch((err) => {
            console.warn('Event notify subscribe failed (non-fatal):', err)
            return null
          })
        : Promise.resolve(null)

      const [interestRes] = await Promise.all([interestPromise, eventPromise])

      if (interestRes.ok) {
        setSubmitted(true)
      } else {
        const data = await interestRes.json().catch(() => ({}))
        setSubmitError(
          data.error ?? 'Something went wrong. Please try again in a moment.'
        )
      }
    } catch (err) {
      console.error('Notify subscribe error:', err)
      setSubmitError(
        'Unable to reach the server. Please check your connection and try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal>
      <ModalTrigger asChild>
        <button
          type="button"
          className="w-full rounded-xl border border-[rgba(163,246,156,0.35)] bg-transparent px-4 py-3 text-sm font-bold uppercase tracking-widest text-white transition-all duration-200 hover:bg-[rgba(163,246,156,0.12)] hover:border-[rgba(163,246,156,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(163,246,156,0.4)]"
        >
          Get Notified
        </button>
      </ModalTrigger>
      <ModalContent variant="form" style={{ backgroundColor: 'rgba(255, 255, 255, 1)', color: 'rgba(17, 17, 17, 1)' }}>
        <ModalHeader>
          <ModalTitle className="text-xl font-bold text-[var(--church-navy)]">
            Stay in the Loop
          </ModalTitle>
          <ModalDescription style={{ color: 'rgba(100, 100, 100, 1)' }}>
            Enter your details and we&apos;ll notify you before the next live service begins.
          </ModalDescription>
        </ModalHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--church-green)]/10">
              <svg className="h-7 w-7 text-[var(--church-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-[var(--church-navy)]">You&apos;re on the list!</p>
            <p className="text-sm" style={{ color: 'rgba(100, 100, 100, 1)' }}>
              We&apos;ll send you a reminder before we go live.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 pt-4">
            {/* Name field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="notify-name"
                className="text-sm font-medium"
                style={{ color: 'rgba(30, 30, 30, 1)' }}
              >
                Full Name
              </label>
              <input
                id="notify-name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!nameError}
                aria-describedby={nameError ? 'notify-name-error' : undefined}
                className={cn(
                  'w-full rounded-lg border px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400',
                  'bg-white outline-none transition-all duration-150',
                  'focus:border-[var(--church-navy)] focus:ring-2 focus:ring-[var(--church-navy)]/15',
                  nameError
                    ? 'border-red-400 ring-2 ring-red-100'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              />
              {nameError && (
                <p id="notify-name-error" className="text-xs text-red-500">{nameError}</p>
              )}
            </div>

            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="notify-email"
                className="text-sm font-medium"
                style={{ color: 'rgba(30, 30, 30, 1)' }}
              >
                Email Address
              </label>
              <input
                id="notify-email"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'notify-email-error' : undefined}
                className={cn(
                  'w-full rounded-lg border px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400',
                  'bg-white outline-none transition-all duration-150',
                  'focus:border-[var(--church-navy)] focus:ring-2 focus:ring-[var(--church-navy)]/15',
                  emailError
                    ? 'border-red-400 ring-2 ring-red-100'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              />
              {emailError && (
                <p id="notify-email-error" className="text-xs text-red-500">{emailError}</p>
              )}
            </div>

            {submitError && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-xs"
              >
                {submitError}
              </p>
            )}

            <ModalFooter className="pt-2">
              <ModalClose asChild>
                <button
                  type="button"
                  disabled={isSubmitting}
                  className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
                >
                  Cancel
                </button>
              </ModalClose>
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-lg bg-[var(--church-green)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--church-green)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--church-green)]/50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting…' : 'Notify Me'}
              </button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LiveStreamSection({
  heading = 'Experience The Hub Live',
  subtext = 'Join our digital congregation from anywhere in the world. Our next encounter begins in:',
  thumbnailSrc,
  thumbnailAlt,
  isLive,
  youtubeLiveHref,
  nextServiceDate,
  eventId,
}: LiveStreamSectionProps) {
  const { days, hours, minutes, expired } = useCountdown(nextServiceDate)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Slight delay so the fade-in is visible after the hero has settled
    const id = setTimeout(() => setMounted(true), 120)
    return () => clearTimeout(id)
  }, [])

  const PlayButton = () => {
    const inner = (
      <span
        className={cn(
          'flex h-20 w-20 items-center justify-center rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.45)]',
          'bg-white/20 backdrop-blur-sm border border-white/30',
          'transition-all duration-300',
          isLive && 'hover:scale-110 hover:bg-white/30 cursor-pointer',
          !isLive && 'opacity-80 cursor-default'
        )}
        aria-label={isLive ? 'Watch live stream' : 'Stream is currently offline'}
      >
        <Play className="h-8 w-8 fill-white text-white translate-x-0.5" />
      </span>
    )

    if (isLive && youtubeLiveHref) {
      return (
        <a
          href={youtubeLiveHref}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center"
        >
          {inner}
        </a>
      )
    }

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {inner}
      </div>
    )
  }

  return (
    <section
      aria-label="Live stream section"
      className="w-full px-[var(--section-padding-x)] py-10 md:py-14"
      style={{ backgroundColor: 'rgba(249,249,249,1)' }}
    >
      <div
        className="mx-auto max-w-5xl overflow-hidden rounded-3xl"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 900ms cubic-bezier(0.16,1,0.3,1), transform 900ms cubic-bezier(0.16,1,0.3,1)',
          boxShadow: '0 32px 80px -20px rgba(0,6,102,0.22), 0 4px 16px -4px rgba(0,0,0,0.08)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr]">

          {/* ── Thumbnail — tall, cinematic ── */}
          <div className="relative min-h-[320px] md:min-h-[480px]">
            <Image
              src={thumbnailSrc}
              alt={thumbnailAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 60vw"
              priority
            />

            {/* Dark gradient so text/badge reads cleanly over any image */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(0,6,102,0.6) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
              }}
              aria-hidden="true"
            />

            {/* Status badge */}
            <div className="absolute left-4 top-4 z-10">
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--church-green)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                  Live Now
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow backdrop-blur-sm border border-white/15">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  Offline
                </span>
              )}
            </div>

            {/* Play button — centred */}
            <PlayButton />

            {/* Bottom label over image */}
            <div className="absolute bottom-5 left-5 z-10">
              <p className="text-[0.6rem] font-black uppercase tracking-[0.28em] text-white/60">
                Glory Tabernacle · Live
              </p>
            </div>
          </div>

          {/* ── Content panel ── */}
          <div
            className="flex flex-col justify-center gap-6 p-7 md:p-10"
            style={{
              background: 'linear-gradient(160deg, #000666 0%, #000444 100%)',
            }}
          >
            {/* Decorative rule */}
            <div
              className="h-[3px] w-10 rounded-full"
              style={{ backgroundColor: 'rgba(163,246,156,1)' }}
              aria-hidden="true"
            />

            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-extrabold leading-tight text-white md:text-3xl">
                {heading}
              </h2>
              <p className="text-sm leading-relaxed text-white/60">{subtext}</p>
            </div>

            {/* Countdown or live message */}
            {expired || isLive ? (
              <p className="text-lg font-bold" style={{ color: 'rgba(163,246,156,1)' }}>
                We&apos;re Live! 🎉
              </p>
            ) : (
              <div
                className="flex gap-3"
                role="timer"
                aria-label={`Countdown: ${days} days, ${hours} hours, ${minutes} minutes`}
              >
                <CountdownBox value={days} label="Days" />
                <CountdownBox value={hours} label="Hours" />
                <CountdownBox value={minutes} label="Mins" />
              </div>
            )}

            {/* CTA */}
            <NotifyModal eventId={eventId} />
          </div>

        </div>
      </div>
    </section>
  )
}
