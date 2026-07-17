'use client'

import Link from 'next/link'
import { Printer, X } from 'lucide-react'
import { BadgeCard } from './inaugural-badge'

/**
 * Bulk badge print sheet. Renders every inaugural-service registrant as
 * the FULL BadgeCard used in the single-badge preview — flyer strip,
 * name block, QR, ID, and the "Please scan to access programme" footer
 * — laid out two side by side on an A4 sheet.
 *
 * We deliberately use the same BadgeCard component rather than a custom
 * compact variant, so what you see in "View badge" is exactly what you
 * get on the printed sheet. Nothing is trimmed or restyled; the only
 * difference is that eight or so badges fit on a page instead of one.
 *
 * NOTE — the `perPage` prop is retained for URL compatibility with the
 * PrintPickerModal but is ignored internally: we always render two
 * columns of full-size badges (~88mm wide each) which is what the A4
 * width allows without shrinking any element. The browser paginates
 * naturally with `break-inside: avoid` on each badge.
 */

/** Cloudinary URL for the flyer — kept for backwards compatibility but
 *  unused now that we render the shared BadgeCard component. */
export const FLYER_URL_LEGACY =
  'https://res.cloudinary.com/deckwmsth/image/upload/w_1200,c_limit,q_auto,f_auto/v1782403597/Inaugural_Service_Thumbnail_okeluk.png'

export interface BulkBadgeItem {
  /** Prisma row id — used only as React key. */
  id: string
  /** Human-readable badge ID (e.g. "GT-2026-4827"). */
  registrationId: string
  firstName: string
  lastName: string
  /** Home church or "RCCG Glory Tabernacle, Barnstaple". */
  subtitle: string
  /** Full URL the QR resolves to. */
  qrTarget: string
}

type PerPage = 4 | 6 | 8

interface Props {
  badges: BulkBadgeItem[]
  /** Present for URL compatibility; the sheet always renders 2 columns
   *  of full-size badges (roughly 4 badges per A4 sheet). */
  perPage: PerPage
}

export function BulkBadgePrint({ badges }: Props) {
  // Two full-size badges per row, ~2 rows per A4 → 4 per sheet. Round up
  // and treat that as the sheet estimate; the browser handles the
  // actual pagination via break-inside: avoid on each badge.
  const BADGES_PER_SHEET_ESTIMATE = 4
  const sheetCount = Math.max(
    1,
    Math.ceil(badges.length / BADGES_PER_SHEET_ESTIMATE)
  )

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
          html, body { background: white !important; margin: 0; padding: 0; }
          .print-toolbar { display: none !important; }
          .sheet-bg { background: white !important; padding: 0 !important; }
        }
        .badges-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6mm;
          max-width: 194mm;
          margin: 0 auto;
          justify-items: center;
        }
        .badge-slot {
          break-inside: avoid;
          page-break-inside: avoid;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }
      `}</style>

      {/* Toolbar — sticky on screen, hidden when printing. */}
      <div className="print-toolbar sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <div className="mx-auto flex max-w-[210mm] items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Print {badges.length} badge{badges.length === 1 ? '' : 's'}
              {' · '}
              side by side on A4
              {' · '}
              ~{sheetCount} sheet{sheetCount === 1 ? '' : 's'}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Every badge prints at full size, exactly like the single-badge
              preview. In the print dialog, choose &quot;Portrait&quot; and set
              scale to 100% (not &quot;Fit to page&quot;) to keep the sizing
              accurate.
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
          <div className="badges-grid">
            {badges.map((b) => (
              <div key={b.id} className="badge-slot">
                <BadgeCard
                  data={{
                    registrationId: b.registrationId,
                    firstName: b.firstName,
                    lastName: b.lastName,
                    subtitle: b.subtitle,
                    qrTarget: b.qrTarget,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
