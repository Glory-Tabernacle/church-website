import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

/**
 * Sunday service hymn page — a single hymn laid out for congregational
 * reading. Reachable at /service.
 *
 * Design notes:
 *   • Cream background + serif type throughout for a reverent, hymnal
 *     feel that's still comfortable to read on a phone at arm's length.
 *   • Refrain is repeated in full after every verse (not `[Refrain]`
 *     with a pointer), so a worshipper never has to scroll back up
 *     mid-song. On a small screen this matters far more than saving
 *     ink like a printed hymnal would.
 *   • Verse numbers are large serif numerals in the church red so the
 *     eye finds them instantly when the leader calls "verse three".
 *   • The refrain sits in its own bordered card with the church green
 *     accent — visually anchors it as "the part everyone sings".
 *   • Print styles strip decoration and force black-on-white so any
 *     steward who wants a paper backup can hit Cmd/Ctrl+P.
 *
 * All hymn text lives in the VERSES / REFRAIN constants below —
 * swap those out to reuse the same page for next week's hymn, or
 * lift the constants into a `HYMNS` map keyed by slug if we ever
 * want /service/the-great-physician-style routes.
 */

export const metadata: Metadata = {
  title:
    'The Great Physician — Sunday Service Hymn | RCCG Glory Tabernacle, Barnstaple',
  description:
    "The Great Physician — congregational hymn for this Sunday's service at RCCG Glory Tabernacle, Barnstaple.",
}

const HYMN_TITLE = 'The Great Physician'
const HYMN_SUBTITLE = 'Congregational Hymn'

/** Each verse is stored as an array of lines so we can render one
 *  <p> per line — that keeps the visual line breaks that the sung
 *  cadence depends on, without shoving <br> tags into JSX. */
const VERSES: readonly { number: number; lines: readonly string[] }[] = [
  {
    number: 1,
    lines: [
      'The great Physician now is near,',
      'the sympathizing Jesus;',
      'He speaks the drooping heart to cheer,',
      'oh! hear the voice of Jesus.',
    ],
  },
  {
    number: 2,
    lines: [
      'Your many sins are all forgiven,',
      'oh! hear the voice of Jesus;',
      'go on your way in peace to heaven,',
      'and wear a crown with Jesus.',
    ],
  },
  {
    number: 3,
    lines: [
      'All glory to the risen Lamb!',
      'I now believe in Jesus;',
      'I love the blessed Savior’s name,',
      'I love the name of Jesus.',
    ],
  },
  {
    number: 4,
    lines: [
      'His name dispels my guilt and fear,',
      'no other name but Jesus;',
      'oh! how my soul delights to hear',
      'the charming name of Jesus.',
    ],
  },
]

const REFRAIN: readonly string[] = [
  'Sweetest note in seraph song,',
  'sweetest name on mortal tongue;',
  'sweetest carol ever sung,',
  'Jesus, blessed Jesus.',
]

export default function ServiceHymnPage() {
  return (
    <>
      <style>{`
        /* Print: strip background, force black text, hide chrome so a
           paper hand-out prints cleanly on a single sheet. */
        @media print {
          .hymn-page {
            background: #ffffff !important;
            padding: 0 !important;
          }
          .hymn-print-hide { display: none !important; }
          .hymn-verse-num, .hymn-body, .hymn-title, .hymn-refrain-label {
            color: #000 !important;
          }
          .hymn-refrain {
            border: 1px solid #000 !important;
            background: #ffffff !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <main className="hymn-page min-h-screen bg-[#faf8f3] px-4 py-10 md:px-8 md:py-16">
        {/* Back link — hidden on print */}
        <div className="hymn-print-hide mx-auto mb-6 max-w-3xl md:mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.22em] text-[#000666]/70 transition-colors hover:text-[#c8342e]"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Home
          </Link>
        </div>

        <article className="mx-auto max-w-3xl">
          {/* ─── Header ─────────────────────────────────────────── */}
          <header className="text-center">
            <p className="text-[0.7rem] font-black uppercase tracking-[0.32em] text-[#c8342e] md:text-xs">
              Sunday Service · Hymn
            </p>
            <h1 className="hymn-title mt-4 font-serif text-4xl font-extrabold leading-tight text-[#000666] md:text-6xl">
              {HYMN_TITLE}
            </h1>
            <p className="mt-3 text-sm text-gray-500 md:text-base">
              {HYMN_SUBTITLE}
            </p>
            {/* Ornament divider */}
            <div className="mx-auto mt-8 flex items-center justify-center gap-3 md:mt-10">
              <span className="h-px w-12 bg-[#1b6d24]" />
              <span className="h-2 w-2 rotate-45 bg-[#1b6d24]" aria-hidden="true" />
              <span className="h-px w-12 bg-[#1b6d24]" />
            </div>
          </header>

          {/* ─── Verses + Refrain ───────────────────────────────── */}
          <div className="mt-12 space-y-10 md:mt-16 md:space-y-14">
            {VERSES.map((verse) => (
              <div key={verse.number}>
                <Verse number={verse.number} lines={verse.lines} />
                <Refrain lines={REFRAIN} />
              </div>
            ))}
          </div>

          {/* ─── Closing scripture ──────────────────────────────── */}
          <footer className="mt-16 text-center md:mt-20">
            <div className="mx-auto mb-8 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-gray-300" />
              <span className="h-1.5 w-1.5 rotate-45 bg-gray-300" aria-hidden="true" />
              <span className="h-px w-10 bg-gray-300" />
            </div>
            <p className="font-serif text-lg italic leading-relaxed text-[#000666] md:text-xl">
              &ldquo;Bless the LORD, O my soul&hellip; who healeth all thy
              diseases.&rdquo;
            </p>
            <p className="mt-2 text-[0.65rem] font-black uppercase tracking-[0.28em] text-gray-500 md:text-xs">
              Psalm 103 : 2&ndash;3
            </p>
          </footer>
        </article>
      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// Verse + Refrain sub-components
// ---------------------------------------------------------------------------

function Verse({
  number,
  lines,
}: {
  number: number
  lines: readonly string[]
}) {
  return (
    <section
      aria-label={`Verse ${number}`}
      className="flex gap-5 md:gap-8"
    >
      <div className="shrink-0">
        <span className="hymn-verse-num font-serif text-4xl font-extrabold leading-none text-[#c8342e] md:text-5xl">
          {number}
        </span>
      </div>
      <div className="min-w-0">
        {lines.map((line, i) => (
          <p
            key={i}
            className="hymn-body font-serif text-lg leading-loose text-[#0a0a2b] md:text-xl"
          >
            {line}
          </p>
        ))}
      </div>
    </section>
  )
}

function Refrain({ lines }: { lines: readonly string[] }) {
  return (
    <section
      aria-label="Refrain"
      className="hymn-refrain mt-6 rounded-xl border-l-4 border-[#1b6d24] bg-white px-5 py-6 shadow-[0_2px_12px_rgba(0,6,102,0.06)] md:mt-8 md:px-8 md:py-7"
    >
      <p className="hymn-refrain-label text-[0.65rem] font-black uppercase tracking-[0.32em] text-[#1b6d24] md:text-xs">
        Refrain
      </p>
      <div className="mt-3 md:mt-4">
        {lines.map((line, i) => (
          <p
            key={i}
            className="hymn-body font-serif text-lg leading-loose text-[#0a0a2b] md:text-xl"
          >
            {line}
          </p>
        ))}
      </div>
    </section>
  )
}
