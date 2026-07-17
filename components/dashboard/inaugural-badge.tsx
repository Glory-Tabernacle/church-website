'use client'

import QRCode from 'react-qr-code'
import { Printer, X } from 'lucide-react'
import { INAUGURAL_THEME } from '@/lib/types/inaugural-registration'

/**
 * The programme flyer used on /inaugural-service/register, /programme,
 * the homepage CTA, the confirmation email, and the OG image — kept in
 * one place so if the artwork ever gets re-uploaded to Cloudinary, all
 * six surfaces move together. `w_1200,c_limit,q_auto,f_auto` keeps the
 * fetch small in the browser while still giving crisp printed output on
 * A6 badges at ~88mm wide.
 */
const FLYER_URL =
  'https://res.cloudinary.com/deckwmsth/image/upload/w_1200,c_limit,q_auto,f_auto/v1782403597/Inaugural_Service_Thumbnail_okeluk.png'

export interface BadgeData {
  registrationId: string
  firstName: string
  lastName: string
  /** Where the registrant is from. Either "Member of RCCG Glory Tabernacle"
   *  for locals, or the home-church name for visitors. */
  subtitle: string
  /** Full URL the QR code resolves to. Encoded straight into the QR. */
  qrTarget: string
}

interface InauguralBadgeProps {
  data: BadgeData
  onClose?: () => void
}

/**
 * Printable badge for an inaugural-service registrant. Designed to be
 * printed at A6 (105×148mm) or similar — anything roughly portrait.
 *
 * The wrapping dashboard-only chrome (close button, toolbar) is hidden via a
 * print stylesheet so the printed page contains nothing but the badge
 * itself.
 */
export function InauguralBadge({ data, onClose }: InauguralBadgeProps) {
  return (
    <>
      <style>{`
        @media print {
          /* Hide everything except the badge wrapper when printing. */
          body * { visibility: hidden !important; }
          #inaugural-badge-print-root,
          #inaugural-badge-print-root * { visibility: visible !important; }
          #inaugural-badge-print-root {
            position: fixed !important;
            inset: 0 !important;
            background: white !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          #inaugural-badge-toolbar { display: none !important; }
          @page { size: A6 portrait; margin: 8mm; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="relative w-full max-w-md">
          {/* Toolbar — print + close, hidden when printing. */}
          <div
            id="inaugural-badge-toolbar"
            className="mb-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-lg"
          >
            <p className="text-sm font-semibold text-gray-700">
              Badge preview
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#000666] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                Print badge
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* The badge itself — print scope wraps this root. */}
          <div id="inaugural-badge-print-root">
            <BadgeCard data={data} />
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Pure badge card — no chrome. Exported separately so it could be rendered
 * inline anywhere else (e.g. a future "wallet" page) without the modal
 * wrapper.
 */
export function BadgeCard({ data }: { data: BadgeData }) {
  return (
    <div
      className="overflow-hidden rounded-2xl bg-white shadow-2xl"
      style={{
        width: '88mm',
        margin: '0 auto',
        border: '2px solid rgba(0,6,102,0.12)',
      }}
    >
      {/* Header — full-bleed programme flyer. The artwork already carries
          the event name, theme, scripture, date, time, and venue, so we
          deliberately don't layer any text on it. A plain <img> (not
          next/image) is used because the badge is rendered inside a
          print-scoped root — some print engines choke on next/image's
          runtime wrapper, but <img> is universally supported and Cloudinary
          serves an already-optimised JPG/WebP for us. */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FLYER_URL}
          alt={`Inaugural Service — ${INAUGURAL_THEME.title} (${INAUGURAL_THEME.scripture})`}
          className="block h-auto w-full"
        />
      </div>

      {/* Name block */}
      <div className="px-6 pt-7 pb-3 text-center">
        <p
          className="text-base font-medium uppercase tracking-[0.18em] text-gray-500"
          style={{ letterSpacing: '0.16em' }}
        >
          {data.firstName}
        </p>
        <p
          className="mt-1 text-3xl font-extrabold leading-tight"
          style={{ color: 'rgba(0,6,102,1)' }}
        >
          {data.lastName}
        </p>
        <p className="mt-3 text-xs italic text-gray-600">{data.subtitle}</p>
      </div>

      {/* QR code */}
      <div className="flex flex-col items-center px-6 pb-4">
        <div
          className="rounded-lg bg-white p-2"
          style={{ border: '1px solid rgba(0,6,102,0.08)' }}
        >
          <QRCode
            value={data.qrTarget}
            size={120}
            level="M"
            bgColor="#ffffff"
            fgColor="#000666"
          />
        </div>
        <p
          className="mt-3 font-mono text-sm font-bold tracking-wider"
          style={{ color: 'rgba(0,6,102,1)' }}
        >
          {data.registrationId}
        </p>
      </div>

      {/* Footer disclaimer — copyright + scan-me prompt. Prompt is bold
          + darker so it reads as a call-to-action next to the QR above,
          not a legal footnote. */}
      <div
        className="px-6 pb-4 text-center"
        style={{ borderTop: '1px solid rgba(0,6,102,0.06)' }}
      >
        <p className="mt-3 text-[0.6rem] font-extrabold uppercase tracking-[0.2em] text-[#000666]">
          © RCCG Glory Tabernacle, Barnstaple · Please scan to access programme
        </p>
      </div>
    </div>
  )
}
