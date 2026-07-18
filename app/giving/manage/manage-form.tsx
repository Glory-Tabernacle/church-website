'use client'

import { useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2, Send } from 'lucide-react'

/**
 * Public form on /giving/manage. Donor enters email → we email them a
 * magic link to the Stripe Billing Portal. Success message always the
 * same regardless of whether the email is on file, so we don't leak
 * whether someone is a donor.
 */
export function ManageForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setErrorMessage(null)
    try {
      const res = await fetch('/api/donations/manage-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus('error')
        setErrorMessage(data.error ?? 'Please try again in a moment.')
        return
      }
      setStatus('sent')
    } catch (err) {
      console.error('Manage-request threw:', err)
      setStatus('error')
      setErrorMessage('Network error. Please try again.')
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-[0_18px_50px_rgba(0,6,102,0.08)] md:p-10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1b6d24]/10">
          <CheckCircle2 className="h-8 w-8 text-[#1b6d24]" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-extrabold text-[#000666] md:text-2xl">
          Check your inbox
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">
          If <strong>{email}</strong> has a monthly gift with us, we&rsquo;ve
          sent a secure link to open your billing portal. It expires in one hour
          for your security.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus('idle')
            setEmail('')
          }}
          className="mt-6 text-sm font-semibold text-[#000666] underline-offset-4 hover:underline"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(0,6,102,0.08)] md:p-8"
    >
      <label className="block">
        <span className="mb-2 block text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-gray-500">
          Email address
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          disabled={status === 'submitting'}
          className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-[#000666] focus:ring-2 focus:ring-[#000666]/20 disabled:opacity-60"
        />
      </label>

      {errorMessage && (
        <div role="alert" className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting' || !email}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#1b6d24] px-6 text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_12px_22px_rgba(27,109,36,0.28)] transition-colors hover:bg-[#155a1d] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'submitting' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending link…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Email me a manage-gift link
          </>
        )}
      </button>
    </form>
  )
}
