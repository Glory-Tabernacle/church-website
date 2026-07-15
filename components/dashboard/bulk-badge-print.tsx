'use client'

import Link from 'next/link'
import QRCode from 'react-qr-code'
import { Printer, X } from 'lucide-react'

/**
 * Bulk badge print sheet. Renders every inaugural-service registrant as a
 * compact badge in a 2-column grid, sized so exactly `perPage` badges fit
 * on one A4 sheet. Browser handles pagination via `break-inside: avoid`
 * on each badge — no manual page-break math needed.
 *
 * Same flyer + QR + name + ID layout as the single InauguralBadge card,
 * just at a smaller scale so the sheet stays cuttable.
 */

/** Cloudinary URL for the Inaugural Service flyer — same asset used on
 *  /inaugural-service/register, /programme, the homepage CTA, the email,
 *  and the single-badge print. Keep in sync if the artwork ever moves. */
const FLYER_URL =
  'https://res.cloudinary.com/deckwmsth/image/upload/w_1200,c_limit,q_auto,f_auto/v1782403597/Inaugural_Service_Thumbnail_okeluk.png'

export interface BulkBadgeItem {
  /** Prisma row id — used only as React key. */
  id: string
  /** Human-readable badge ID (e.g. "GT-2026-4827"). */
  registrationId: string
  firstName: string
  lastName: string
  /** Home church or "Member of RCCG Glory Tabernacle, Barnstaple". */
  subtitle: string
  /** Full URL the QR resolves to. */
  qrTarget: string
}

type PerPage = 4 | 6 | 8

interface Props {
  badges: BulkBadgeItem[]
  perPage: PerPage
}

/** Rows per A4 sheet — 2 columns × these many rows fits `perPage` badges. */
const ROWS_PER_PAGE: Record<PerPage, number> = { 4: 2, 6: 3, 8: 4 }

/**
 * A4 usable height after 8mm margins ≈ 281mm. Divide by row count (minus
 * inter-row gaps) to get the min-height each badge needs so exactly N
 * fit on a page and `break-inside: avoid` bumps the (N+1)th to a new page.
 */
function badgeHeightMm(perPage: PerPage): number {
  const rows = ROWS_PER_PAGE[perPage]
  const usable = 281 - (rows - 1) * 6 // 6mm gap between rows
  return usable / rows
}

/** QR pixel size scales with badge size. Minimum ~65px still scans on most
 *  phone cameras at reading distance. */
function qrPixelSize(perPage: PerPage): number {
  return perPage === 4 ? 110 : perPage === 6 ? 82 : 66
}

export function BulkBadgePrint({ badges, perPage }: Props) {
  const badgeMinHeight = `${badgeHeightMm(perPage).toFixed(2)}mm`
  const qrSize = qrPixelSize(perPage)
  const sheetCount = Math.max(1, Math.ceil(badges.length / perPage))

  return (
    <>
      <style>{`
        @media print {
          /* A4 with tight margins — small margins let the badges be
             a comfortable size. Add 2mm on all sides internally via padding
             on the sheet to give a cutting margin. */
          @page { size: A4; margin: 8mm; }
          html, body { background: white !important; margin: 0; padding: 0; }
          .print-toolbar { display: none !important; }
          .sheet-bg { background: white !important; padding: 0 !important; }
        }
        .badges-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6mm;
        }
        .compact-badge {
          break-inside: avoid;
          page-break-inside: avoid;
          background: white;
          border: 1px solid rgba(0,6,102,0.15);
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
      `}</style>

      {/* Toolbar — sticky on screen, hidden when printing. */}
      <div className="print-toolbar sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <div className="mx-auto flex max-w-[210mm] items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Print {badges.length} badge{badges.length === 1 ? '' : 's'}
              {' · '}
              {perPage} per A4 sheet
              {' · '}
              ~{sheetCount} sheet{sheetCount === 1 ? '' : 's'}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Tip: in the browser print dialog, choose &quot;Portrait&quot; and set
              scale to 100% (not &quot;Fit to page&quot;) for the sizing to stay accurate.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/dashboard/inaugural-service"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Close
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#000666] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Print now
            </button>
          </div>
        </div>
      </div>

      {/* Sheet body */}
      <div className="sheet-bg bg-gray-100 p-6">
        {badges.length === 0 ? (
          <div className="mx-auto max-w-md rounded-xl bg-white p-8 text-center text-sm text-gray-600 shadow">
            No registrations yet, nothing to print.
          </div>
        ) : (
          <div className="badges-grid mx-auto max-w-[210mm]">
            {badges.map((b) => (
              <div
                key={b.id}
                className="compact-badge"
                style={{ minHeight: badgeMinHeight }}
              >
                {/* Flyer strip — carries branding + event details */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={FLYER_URL} alt="" className="block h-auto w-full" />

                {/* Name block */}
                <div className="flex-1 px-3 pt-2 text-center">
                  <p
                    className="font-medium uppercase text-gray-500"
                    style={{ fontSize: perPage === 8 ? '8px' : '10px', letterSpacing: '0.14em' }}
                  >
                    {b.firstName}
                  </p>
                  <p
                    className="font-extrabold leading-tight text-[#000666]"
                    style={{ fontSize: perPage === 4 ? '18px' : perPage === 6 ? '14px' : '12px' }}
                  >
                    {b.lastName}
                  </p>
                  {perPage !== 8 && (
                    <p
                      className="mt-1 italic text-gray-500"
                      style={{ fontSize: perPage === 4 ? '10px' : '9px' }}
                    >
                      {b.subtitle}
                    </p>
                  )}
                </div>

                {/* QR + ID */}
                <div className="flex flex-col items-center gap-1 px-3 pb-2">
                  <QRCode
                    value={b.qrTarget}
                    size={qrSize}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#000666"
                  />
                  <p
                    className="font-mono font-bold tracking-wider text-[#000666]"
                    style={{ fontSize: perPage === 8 ? '9px' : '11px' }}
                  >
                    {b.registrationId}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
