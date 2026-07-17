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
 * A4 usable height after 8mm margins is ~281mm. We reserve ~19mm of
 * safety headroom (leaving 262mm actual) so browser rendering quirks
 * never push the bottom-most row off the sheet.
 */
function badgeHeightMm(perPage: PerPage): number {
  const rows = ROWS_PER_PAGE[perPage]
  const safeUsable = 262
  return (safeUsable - (rows - 1) * 6) / rows
}

/**
 * Height reserved at the top of each badge for the flyer. The flyer
 * itself is rendered with object-fit: contain inside this box, so the
 * WHOLE flyer is always visible — narrower on smaller layouts,
 * letterboxed with white sides. Better than cropping the artwork.
 *
 * For perPage=4 we go bigger (46mm ≈ 36% of badge) so the flyer fills
 * more of the badge visually. For 6 and 8 we shrink proportionally.
 */
function flyerHeightMm(perPage: PerPage): number {
  const bh = badgeHeightMm(perPage)
  if (perPage === 4) return Math.min(46, bh * 0.36)
  if (perPage === 6) return bh * 0.3
  return bh * 0.24
}

/** QR pixel size scales with badge size. Minimum ~55px still scans on most
 *  phone cameras at reading distance. */
function qrPixelSize(perPage: PerPage): number {
  return perPage === 4 ? 100 : perPage === 6 ? 72 : 56
}

export function BulkBadgePrint({ badges, perPage }: Props) {
  const badgeHeight = `${badgeHeightMm(perPage).toFixed(2)}mm`
  const flyerHeight = `${flyerHeightMm(perPage).toFixed(2)}mm`
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
        .flyer-strip {
          flex-shrink: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        /* object-fit: contain — shows the WHOLE flyer inside the strip
           height, letterboxes on the sides when the strip is shorter
           than the flyer's natural aspect. Never crops the artwork. */
        .flyer-strip img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          display: block;
        }
        .badge-body {
          flex: 1 1 auto;
          min-height: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }
        .badge-qr {
          flex-shrink: 0;
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
                style={{ height: badgeHeight }}
              >
                {/* Flyer strip — object-contain shows the FULL flyer
                    inside the strip; letterboxed with white on the
                    sides when the strip is shorter than the natural
                    16:9 aspect. Nothing is ever cropped from the
                    artwork. */}
                <div className="flyer-strip" style={{ height: flyerHeight }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={FLYER_URL} alt="" />
                </div>

                {/* Body: name (flexible) on top, QR + ID (fixed) at
                    bottom. min-height:0 + overflow:hidden on body lets
                    flex shrink the name area if a long lastName pushes
                    the total taller than the badge — QR stays visible. */}
                <div className="badge-body px-3 pt-2 pb-2 text-center">
                  <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
                    <p
                      className="font-medium uppercase text-gray-500 leading-tight"
                      style={{ fontSize: perPage === 8 ? '7.5px' : '9px', letterSpacing: '0.14em' }}
                    >
                      {b.firstName}
                    </p>
                    <p
                      className="font-extrabold leading-tight text-[#000666] mt-0.5"
                      style={{ fontSize: perPage === 4 ? '17px' : perPage === 6 ? '13px' : '10.5px' }}
                    >
                      {b.lastName}
                    </p>
                    {perPage !== 8 && (
                      <p
                        className="mt-0.5 italic text-gray-500 leading-tight"
                        style={{ fontSize: perPage === 4 ? '9px' : '8px' }}
                      >
                        {b.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="badge-qr mt-1 flex flex-col items-center gap-0.5">
                    <QRCode
                      value={b.qrTarget}
                      size={qrSize}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#000666"
                    />
                    <p
                      className="font-mono font-bold tracking-wider text-[#000666] leading-tight"
                      style={{ fontSize: perPage === 8 ? '7.5px' : '9.5px' }}
                    >
                      {b.registrationId}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
