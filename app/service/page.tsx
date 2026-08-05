import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

/**
 * Sunday service hymn page — a single hymn laid out for congregational
 * reading. Reachable at /service.
 *
 * This hymn has a classic verse + repeated refrain structure:
 *   • Five verses (four lines each).
 *   • One refrain sung after every verse — same text each time.
 *   • A scripture epigraph at the top ("I have loved you, saith the
 *     Lord." — Malachi 1:2) that gave rise to the hymn, and a
 *     closing verse (1 John 4:19) that bookends it.
 *
 * Design decisions:
 *   • Refrain repeats in full after each verse (not `[Refrain]` with
 *     a pointer), so a worshipper on a phone never has to scroll
 *     back mid-song. Slightly longer page; far better mobile UX.
 *   • Verse numbers are large serif numerals in the church red so
 *     the eye finds them instantly when a leader calls a verse.
 *   • Refrain sits in its own bordered card with the church green
 *     accent — visually anchors it as "the part everyone sings".
 *   • Print styles strip decoration and force black-on-white so any
 *     steward who wants a paper backup can hit Cmd/Ctrl+P.
 *
 * All hymn text lives in the VERSES / REFRAIN / EPIGRAPH constants
 * below — swap those out to reuse the same page for next week.
 */

export const metadata: Metadata = {
  title:
    'I Am So Glad That Our Father in Heaven — Sunday Service Hymn | RCCG Glory Tabernacle, Barnstaple',
  description:
    "I Am So Glad That Our Father in Heaven — congregational hymn for this Sunday's service at RCCG Glory Tabernacle, Barnstaple.",
}

const HYMN_TITLE = 'I Am So Glad That Our Father in Heaven'
const HYMN_SUBTITLE = 'Congregational Hymn'

/** Scripture that anchors the hymn — displayed as an epigraph beneath
 *  the title. */
const EPIGRAPH = {
  quote: 'I have loved you, saith the Lord.',
  reference: 'Malachi 1:2',
} as const

/** Each verse stored as an array of lines so we can render one <p>
 *  per line — preserves the sung cadence without shoving <br> into
 *  JSX. */
const VERSES: readonly { number: number; lines: readonly string[] }[] = [
  {
    number: 1,
    lines: [
      'I am so glad that our Father in heaven',
      'Tells of His love in the Book He has giv’n;',
      'Wonderful things in the Bible I see;',
      'This is the dearest, that Jesus loves me.',
    ],
  },
  {
    number: 2,
    lines: [
      'Jesus loves me and I know I love Him;',
      'Love brought Him down my lost soul to redeem;',
      'Yes, it was love made Him die on the tree,',
      'Oh, I am certain that Jesus loves me.',
    ],
  },
  {
    number: 3,
    lines: [
      'In this assurance I find sweetest rest,',
      'Trusting in Jesus I know I am blest;',
      'Satan dismayed from my soul doth now flee,',
      'When I just tell him that Jesus loves me.',
    ],
  },
  {
    number: 4,
    lines: [
      'Oh, if there’s only one song I can sing,',
      'When in His beauty I see the great King,',
      'This shall my song in eternity be,',
      '“Oh, what a wonder that Jesus loves me!”',
    ],
  },
  {
    number: 5,
    lines: [
      'If one should ask of me how can I tell?',
      'Glory to Jesus, I know very well!',
      'God’s Holy Spirit with mine doth agree,',
      'Constantly witnessing — Jesus loves me.',
    ],
  },
]

const REFRAIN: readonly string[] = [
  'I am so glad that Jesus loves me,',
  'Jesus loves me, Jesus loves me,',
  'I am so glad that Jesus loves me,',
  'Jesus loves even me.',
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
          .hymn-verse-num, .hymn-body, .hymn-title, .hymn-refrain-label,
          .hymn-epigraph {
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

            {/* Scripture epigraph — the promise the hymn celebrates */}
            <div className="hymn-epigraph mx-auto mt-8 max-w-lg md:mt-10">
              <p className="font-serif text-base italic leading-relaxed text-[#000666] md:text-lg">
                &ldquo;{EPIGRAPH.quote}&rdquo;
              </p>
              <p className="mt-1.5 text-[0.6rem] font-black uppercase tracking-[0.28em] text-[#1b6d24] md:text-[0.7rem]">
                {EPIGRAPH.reference}
              </p>
            </div>

            {/* Ornament divider */}
            <div className="mx-auto mt-8 flex items-center justify-center gap-3 md:mt-10">
              <span className="h-px w-12 bg-[#1b6d24]" />
              <span
                className="h-2 w-2 rotate-45 bg-[#1b6d24]"
                aria-hidden="true"
              />
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
              <span
                className="h-1.5 w-1.5 rotate-45 bg-gray-300"
                aria-hidden="true"
              />
              <span className="h-px w-10 bg-gray-300" />
            </div>
            <p className="font-serif text-lg italic leading-relaxed text-[#000666] md:text-xl">
              &ldquo;We love him, because he first loved us.&rdquo;
            </p>
            <p className="mt-2 text-[0.65rem] font-black uppercase tracking-[0.28em] text-gray-500 md:text-xs">
              1 John 4 : 19
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
