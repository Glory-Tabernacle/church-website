import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

/**
 * Sunday service hymn page — a single hymn laid out for congregational
 * reading. Reachable at /service.
 *
 * Structural note for this hymn:
 *   Unlike "The Great Physician" (which had a repeating refrain), this
 *   hymn — Henry Lyte's paraphrase of Psalm 103 — carries a
 *   *doxological ending* that varies each verse. Every verse closes
 *   with the "Praise Him, praise Him, praise Him, praise Him" line,
 *   but the final line changes: "Praise the everlasting King", then
 *   "Glorious in His faithfulness", then "Praise the high eternal
 *   One", and so on.
 *
 *   So there's no repeated refrain block. Instead each verse renders
 *   its own six lines together, with the last two (the doxology)
 *   visually offset by a green left-border so worshippers can see
 *   at a glance where the sung "Praise Him" line lands each time.
 *
 * Print styles strip decoration and force black-on-white so any
 * steward who wants a paper backup can hit Cmd/Ctrl+P.
 *
 * All hymn text lives in the VERSES constant below — swap that
 * array to reuse the same page for next week's hymn.
 */

export const metadata: Metadata = {
  title:
    'Praise, My Soul, the King of Heaven — Sunday Service Hymn | RCCG Glory Tabernacle, Barnstaple',
  description:
    "Praise, My Soul, the King of Heaven — congregational hymn for this Sunday's service at RCCG Glory Tabernacle, Barnstaple. A paraphrase of Psalm 103 by Henry F. Lyte.",
}

const HYMN_TITLE = 'Praise, My Soul, the King of Heaven'
const HYMN_SUBTITLE = 'Congregational Hymn · A paraphrase of Psalm 103'

/**
 * Each verse has:
 *   • `lines`    — the main body (usually 4 lines)
 *   • `doxology` — the closing "Praise Him, praise Him…" couplet whose
 *                  final line varies per verse. Rendered in an offset
 *                  block so the eye can find the sung line quickly.
 */
const VERSES: readonly {
  number: number
  lines: readonly string[]
  doxology: readonly string[]
}[] = [
  {
    number: 1,
    lines: [
      'Praise, my soul, the King of heaven;',
      'To His feet thy tribute bring.',
      'Ransomed, healed, restored, forgiven,',
      'Who like me His praise should sing?',
    ],
    doxology: [
      'Praise Him, praise Him, praise Him, praise Him,',
      'Praise the everlasting King.',
    ],
  },
  {
    number: 2,
    lines: [
      'Praise Him for His grace and favor',
      'To our fathers in distress.',
      'Praise Him still the same forever,',
      'Slow to chide, and swift to bless.',
    ],
    doxology: [
      'Praise Him, praise Him, praise Him, praise Him,',
      'Glorious in His faithfulness.',
    ],
  },
  {
    number: 3,
    lines: [
      'Frail as summer’s flower we flourish,',
      'Blows the wind and it is gone;',
      'But while mortals rise and perish,',
      'God endures unchanging on.',
    ],
    doxology: [
      'Praise Him, praise Him, praise Him, praise Him,',
      'Praise the high eternal One.',
    ],
  },
  {
    number: 4,
    lines: [
      'Fatherlike He tends and spares us;',
      'Well our feeble frame He knows.',
      'In His hands He gently bears us,',
      'Rescues us from all our foes.',
    ],
    doxology: [
      'Praise Him, praise Him, praise Him, praise Him,',
      'Widely as His mercy goes.',
    ],
  },
  {
    number: 5,
    lines: [
      'Angels, help us to adore Him;',
      'Ye behold Him face to face;',
      'Sun and moon, bow down before Him,',
      'Dwellers all in time and space.',
    ],
    doxology: [
      'Praise Him, praise Him, praise Him, praise Him,',
      'Praise with us the God of grace.',
    ],
  },
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
          .hymn-verse-num, .hymn-body, .hymn-title, .hymn-dox-label {
            color: #000 !important;
          }
          .hymn-dox {
            border-left-color: #000 !important;
            background: transparent !important;
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
              <span
                className="h-2 w-2 rotate-45 bg-[#1b6d24]"
                aria-hidden="true"
              />
              <span className="h-px w-12 bg-[#1b6d24]" />
            </div>
          </header>

          {/* ─── Verses ─────────────────────────────────────────── */}
          <div className="mt-12 space-y-12 md:mt-16 md:space-y-16">
            {VERSES.map((verse) => (
              <Verse
                key={verse.number}
                number={verse.number}
                lines={verse.lines}
                doxology={verse.doxology}
              />
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
              &ldquo;Bless the LORD, O my soul: and all that is within me,
              bless his holy name.&rdquo;
            </p>
            <p className="mt-2 text-[0.65rem] font-black uppercase tracking-[0.28em] text-gray-500 md:text-xs">
              Psalm 103 : 1
            </p>
          </footer>
        </article>
      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// Verse sub-component (main lines + doxology in one block)
// ---------------------------------------------------------------------------

function Verse({
  number,
  lines,
  doxology,
}: {
  number: number
  lines: readonly string[]
  doxology: readonly string[]
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
      <div className="min-w-0 flex-1">
        {/* Main lines of the verse */}
        {lines.map((line, i) => (
          <p
            key={i}
            className="hymn-body font-serif text-lg leading-loose text-[#0a0a2b] md:text-xl"
          >
            {line}
          </p>
        ))}

        {/* Doxology — the "Praise Him, praise Him…" couplet.
            Offset so worshippers can spot the sung line quickly. */}
        <div className="hymn-dox mt-4 border-l-4 border-[#1b6d24] bg-[#1b6d24]/[0.035] py-3 pl-5 md:mt-5 md:pl-6">
          <p className="hymn-dox-label mb-1.5 text-[0.6rem] font-black uppercase tracking-[0.32em] text-[#1b6d24] md:text-[0.7rem]">
            Doxology
          </p>
          {doxology.map((line, i) => (
            <p
              key={i}
              className="hymn-body font-serif text-lg leading-loose text-[#0a0a2b] md:text-xl"
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
