'use client'

import { useEffect, useRef, useState, type ComponentType } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ListOrdered,
  BookOpen,
  Church,
  Sparkles,
  Music,
  Users,
  Award,
  HandCoins,
  X,
  ArrowRight,
  ArrowUpRight,
  Quote,
  Building2,
  Compass,
  Flame,
  Target,
  Play,
  Pause,
  CalendarDays,
  FileText,
} from 'lucide-react'

/**
 * The full printed programme booklet as a PDF, hosted on Cloudinary.
 * Opened in a new tab from the "View Programme Booklet" CTA below the
 * card grid — new-tab means iOS Safari / Android Chrome / desktop
 * browsers all use their own built-in PDF viewer, which reads well on
 * any device without us shipping a viewer library.
 */
const PROGRAMME_PDF_URL =
  'https://res.cloudinary.com/deckwmsth/image/upload/v1784302738/ORDER_OF_SERVICE_y6xiqr.pdf'

/**
 * Interactive programme portal for /inaugural-service/programme.
 *
 * A grid of tap-cards, each opening a designed modal sheet with the
 * corresponding content (order of service, our story, RCCG, DNA, hymns,
 * pastors, GO, give). Inspired by the RCCG COMC 2026 portal concept but
 * rebuilt with cleaner gradients, staggered mount animations, and a
 * proper scale+fade modal.
 *
 * All content comes from the "form flow.pdf" the user shared, transcribed
 * inline so the page renders completely on the server / at build without
 * any external fetches.
 */

// ---------------------------------------------------------------------------
// Card definitions
// ---------------------------------------------------------------------------

type Accent = 'navy' | 'green' | 'red' | 'ivory'

interface CardDef {
  id: string
  label: string
  subtitle: string
  icon: ComponentType<{ className?: string }>
  accent: Accent
  /** If set, the card is a link that navigates instead of a modal trigger. */
  href?: string
}

const CARDS: CardDef[] = [
  {
    id: 'order',
    label: 'Order of Service',
    subtitle: 'Tonight’s programme flow',
    icon: ListOrdered,
    accent: 'navy',
  },
  {
    id: 'story',
    label: 'Our Story',
    subtitle: 'How Glory Tabernacle began',
    icon: BookOpen,
    accent: 'green',
  },
  {
    id: 'rccg',
    label: 'About RCCG',
    subtitle: 'Our roots, vision & mandate',
    icon: Church,
    accent: 'red',
  },
  {
    id: 'dna',
    label: 'Our DNA',
    subtitle: 'Furnish · Transform · Influence',
    icon: Sparkles,
    accent: 'ivory',
  },
  {
    id: 'hymns',
    label: 'Hymns',
    subtitle: 'Songs we sing together',
    icon: Music,
    accent: 'green',
  },
  {
    id: 'lead-pastors',
    label: 'Lead Pastors',
    subtitle: 'Seye & Tolu Adebayo',
    icon: Users,
    accent: 'navy',
  },
  {
    id: 'go',
    label: 'General Overseer',
    subtitle: 'Pastor E. A. Adeboye',
    icon: Award,
    accent: 'red',
  },
  {
    id: 'offering',
    label: 'Give an Offering',
    subtitle: 'Support the work of God',
    icon: HandCoins,
    accent: 'ivory',
    href: '/giving',
  },
  {
    id: 'upcoming',
    label: 'Upcoming Programmes',
    subtitle: "What's next on the calendar",
    icon: CalendarDays,
    accent: 'green',
    href: '/events',
  },
]

// ---------------------------------------------------------------------------
// Accent → style map
// ---------------------------------------------------------------------------
//
// Each accent maps to a set of styles applied on the CARD FACE. The MODAL
// shares the accent so the transition feels visually connected — user's
// eye tracks from the tapped card into the sheet that appears.
//

const ACCENTS: Record<
  Accent,
  {
    face: string
    iconWrap: string
    iconColor: string
    title: string
    subtitle: string
    arrow: string
    modalHeader: string
    modalHeaderText: string
    modalHeaderAccent: string
  }
> = {
  navy: {
    face: 'bg-gradient-to-br from-[#000666] via-[#0a1078] to-[#00041f] text-white',
    iconWrap: 'bg-white/10',
    iconColor: 'text-[rgba(163,246,156,1)]',
    title: 'text-white',
    subtitle: 'text-white/70',
    arrow: 'text-[rgba(163,246,156,1)]',
    modalHeader: 'bg-gradient-to-br from-[#000666] via-[#0a1078] to-[#00041f]',
    modalHeaderText: 'text-white',
    modalHeaderAccent: 'text-[rgba(163,246,156,1)]',
  },
  green: {
    face: 'bg-gradient-to-br from-[#1b6d24] via-[#248f30] to-[#134819] text-white',
    iconWrap: 'bg-white/15',
    iconColor: 'text-white',
    title: 'text-white',
    subtitle: 'text-white/80',
    arrow: 'text-white',
    modalHeader: 'bg-gradient-to-br from-[#1b6d24] via-[#248f30] to-[#134819]',
    modalHeaderText: 'text-white',
    modalHeaderAccent: 'text-[rgba(163,246,156,1)]',
  },
  red: {
    face: 'bg-gradient-to-br from-[#a5252c] via-[#c8342e] to-[#7d1a20] text-white',
    iconWrap: 'bg-white/15',
    iconColor: 'text-white',
    title: 'text-white',
    subtitle: 'text-white/85',
    arrow: 'text-white',
    modalHeader: 'bg-gradient-to-br from-[#a5252c] via-[#c8342e] to-[#7d1a20]',
    modalHeaderText: 'text-white',
    modalHeaderAccent: 'text-white/85',
  },
  ivory: {
    face: 'bg-gradient-to-br from-white via-[#f7f8fc] to-[#eef0f8] text-[#000666] border border-[#000666]/8',
    iconWrap: 'bg-[#000666]/8',
    iconColor: 'text-[#000666]',
    title: 'text-[#000666]',
    subtitle: 'text-gray-500',
    arrow: 'text-[#1b6d24]',
    modalHeader: 'bg-gradient-to-br from-white via-[#f7f8fc] to-[#eef0f8] border-b border-[#000666]/8',
    modalHeaderText: 'text-[#000666]',
    modalHeaderAccent: 'text-[#1b6d24]',
  },
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  /** First name — if set, we personalise the "Now that you're seated" intro. */
  registrantFirstName?: string | null
}

export function InauguralProgramme({ registrantFirstName }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = CARDS.find((c) => c.id === selectedId) ?? null

  // Body-scroll lock + Escape key while the modal is open.
  useEffect(() => {
    if (!selectedId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [selectedId])

  return (
    <>
      {/* Scoped animations — kept inline so we don't need a global CSS
          module for this one page. Uses spring-like cubic-bezier for a
          modern, snappy feel. */}
      <style>{`
        @keyframes gtProgFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gtProgBackdropIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to   { opacity: 1; backdrop-filter: blur(6px); }
        }
        @keyframes gtProgSheetIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        /* "Gentle" — slower + smoother than the sheet's own entrance, with
           a slight delay so the modal settles before the portrait glides
           in. Used for the pastor + GO photographs. */
        @keyframes gtGentleGlide {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .gt-prog-card {
          animation: gtProgFadeUp 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .gt-prog-backdrop {
          animation: gtProgBackdropIn 220ms ease-out both;
        }
        .gt-prog-sheet {
          animation: gtProgSheetIn 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .gt-gentle-image {
          animation: gtGentleGlide 1100ms cubic-bezier(0.22, 1, 0.36, 1) 240ms both;
        }
        .gt-gentle-caption {
          animation: gtGentleGlide 1100ms cubic-bezier(0.22, 1, 0.36, 1) 460ms both;
        }
      `}</style>

      {/* Intro line — quieter than a heading, feels like the announcer
          welcoming the room. */}
      <div className="mb-8 text-center md:mb-10">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.28em] text-[rgba(27,109,36,1)]">
          {registrantFirstName ? `Now that you're seated, ${registrantFirstName}` : 'Now that you’re seated'}
        </p>
        <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#000666] md:text-4xl">
          Tap through the service
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600 md:text-base">
          The order of programme, our story, the hymns, and everything else you
          might want at your fingertips today.
        </p>
      </div>

      {/* Card grid — 3 columns on desktop so nine cards form a clean 3×3
          block instead of 4×2 with one orphan on a third row. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card, index) => (
          <Card
            key={card.id}
            card={card}
            index={index}
            onOpen={() => setSelectedId(card.id)}
          />
        ))}
      </div>

      {/* Capstone CTA — full-width Programme Booklet link. Sits BELOW the
          grid rather than inside it because it's the "big final action":
          nine tap-cards to explore, one PDF booklet to take away.
          Animates in after every grid card so the cascade ends here. */}
      <a
        href={PROGRAMME_PDF_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="gt-prog-card group mt-4 flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#000666] via-[#0a1078] to-[#00041f] p-5 shadow-[0_16px_50px_-16px_rgba(0,6,102,0.55)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_70px_-20px_rgba(0,6,102,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3f69c] focus-visible:ring-offset-2 sm:mt-6 sm:p-7"
        style={{ animationDelay: `${CARDS.length * 80}ms` }}
        aria-label="View the full programme booklet (opens in a new tab)"
      >
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 sm:h-14 sm:w-14">
            <FileText className="h-5 w-5 text-[rgba(163,246,156,1)] sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[rgba(163,246,156,1)]">
              Order of Service · PDF
            </p>
            <h3 className="mt-1 text-lg font-extrabold leading-tight text-white sm:text-xl md:text-2xl">
              View Programme Booklet
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-white/70 sm:text-sm">
              The full printed programme. Reads beautifully on any device —
              phone, tablet, or laptop.
            </p>
          </div>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 transition-all duration-300 group-hover:bg-[rgba(163,246,156,1)] group-hover:text-[#000666] sm:h-12 sm:w-12">
          <ArrowUpRight className="h-4 w-4 text-white transition-all duration-300 group-hover:text-[#000666] sm:h-5 sm:w-5" />
        </div>
      </a>

      {/* Modal — one at a time, driven by `selected`. */}
      {selected && (
        <Modal card={selected} onClose={() => setSelectedId(null)}>
          <ModalContent id={selected.id} registrantFirstName={registrantFirstName ?? null} />
        </Modal>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function Card({
  card,
  index,
  onOpen,
}: {
  card: CardDef
  index: number
  onOpen: () => void
}) {
  const styles = ACCENTS[card.accent]
  const Icon = card.icon

  const inner = (
    <>
      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${styles.iconWrap}`}
        >
          <Icon className={`h-5 w-5 ${styles.iconColor}`} />
        </div>
        {card.href ? (
          <ArrowUpRight
            className={`h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${styles.arrow}`}
          />
        ) : (
          <ArrowRight
            className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 ${styles.arrow}`}
          />
        )}
      </div>
      <div className="mt-8">
        <p className={`text-[0.65rem] font-bold uppercase tracking-[0.2em] ${styles.subtitle}`}>
          {String(index + 1).padStart(2, '0')}
        </p>
        <h3 className={`mt-2 text-lg font-extrabold leading-tight md:text-xl ${styles.title}`}>
          {card.label}
        </h3>
        <p className={`mt-1.5 text-xs leading-relaxed md:text-sm ${styles.subtitle}`}>
          {card.subtitle}
        </p>
      </div>
    </>
  )

  const shared = `group gt-prog-card relative flex min-h-[180px] flex-col justify-between overflow-hidden rounded-2xl p-5 shadow-[0_12px_36px_-16px_rgba(0,6,102,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-16px_rgba(0,6,102,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3f69c] focus-visible:ring-offset-2 ${styles.face}`

  // 80ms stagger between cards on load — noticeable but not slow.
  const style = { animationDelay: `${index * 80}ms` }

  if (card.href) {
    return (
      <Link href={card.href} className={shared} style={style} aria-label={card.label}>
        {inner}
      </Link>
    )
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${shared} text-left`}
      style={style}
      aria-label={`Open ${card.label}`}
    >
      {inner}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

function Modal({
  card,
  onClose,
  children,
}: {
  card: CardDef
  onClose: () => void
  children: React.ReactNode
}) {
  const styles = ACCENTS[card.accent]
  const Icon = card.icon

  return (
    <div
      className="gt-prog-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`modal-${card.id}-title`}
    >
      <div
        className="gt-prog-sheet relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header
          className={`relative flex items-center gap-4 px-6 py-5 sm:px-8 sm:py-6 ${styles.modalHeader}`}
        >
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${styles.iconWrap}`}>
            <Icon className={`h-6 w-6 ${styles.iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`text-[0.65rem] font-bold uppercase tracking-[0.22em] ${styles.modalHeaderAccent}`}
            >
              {card.subtitle}
            </p>
            <h3
              id={`modal-${card.id}-title`}
              className={`mt-1 text-xl font-extrabold leading-tight md:text-2xl ${styles.modalHeaderText}`}
            >
              {card.label}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-black/10 ${styles.modalHeaderText}`}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Scroll body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
          {children}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal content router
// ---------------------------------------------------------------------------

function ModalContent({
  id,
  registrantFirstName,
}: {
  id: string
  registrantFirstName: string | null
}) {
  switch (id) {
    case 'order':
      return <OrderContent />
    case 'story':
      return <StoryContent registrantFirstName={registrantFirstName} />
    case 'rccg':
      return <RccgContent />
    case 'dna':
      return <DnaContent />
    case 'hymns':
      return <HymnsContent />
    case 'lead-pastors':
      return <LeadPastorsContent />
    case 'go':
      return <GoContent />
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Content: Order of Service
// ---------------------------------------------------------------------------

const ORDER_ITEMS = [
  'Call to Worship',
  'Opening Prayer',
  'Worship & Hymn',
  'Introduction of VIPs',
  'Choir Ministration',
  'Word',
  'Offering',
  'Vision Casting',
  'Special Prayer',
  'Announcement',
  'Closing Prayer',
]

function OrderContent() {
  return (
    <div>
      <p className="mb-6 text-sm leading-relaxed text-gray-600 md:text-base">
        Eleven movements, one shared breath. Follow along — or just be present
        for the moment you&apos;re in.
      </p>
      <ol className="space-y-2.5">
        {ORDER_ITEMS.map((item, i) => (
          <li
            key={item}
            className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-3.5 transition-all hover:border-[#1b6d24]/40 hover:bg-[#f7fdf5]"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold"
              style={{
                backgroundColor: 'rgba(0,6,102,0.06)',
                color: 'rgba(0,6,102,1)',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-base font-semibold text-gray-900">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Content: Our Story
// ---------------------------------------------------------------------------

/**
 * The narration file — same asset used on /about's Our Story section
 * (see app/about/our-story-section.tsx). Lives at /public/About_us.mp4;
 * kept as a plain HTML5 <audio> so iOS Safari + Android Chrome play it
 * without needing a bundled PDF viewer or media player library.
 */
const STORY_NARRATION_SRC = '/About_us.mp4'

function StoryContent({ registrantFirstName }: { registrantFirstName: string | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Sync button state with the audio element's own events so ended /
  // pause / play from the OS media controls all reflect correctly. Also
  // pause on unmount so the narration stops the instant the modal closes
  // — critical UX or the audio would keep talking behind the scenes.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.pause()
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  function togglePlayback() {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      return
    }
    // play() can reject on mobile autoplay policies — but a user tap is
    // a valid user gesture, so this should always resolve. Defensive
    // fallback prevents a stranded "playing" state if it ever fails.
    void audio.play().catch(() => setIsPlaying(false))
  }

  return (
    <div className="space-y-5 text-sm leading-relaxed text-gray-700 md:text-base md:leading-loose">
      {/* Listen strip — audio narrator button + heading. */}
      <div className="flex items-center justify-between gap-4 rounded-xl bg-[#000666]/5 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#1b6d24]">
            Our Story
          </p>
          <p className="mt-1 font-serif text-base italic text-[#000666] md:text-lg">
            Every great move of God begins with a question.
          </p>
        </div>
        <button
          type="button"
          onClick={togglePlayback}
          className="group inline-flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-[11px] font-bold uppercase tracking-[0.15em] text-white shadow-md transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--church-green)]"
          style={{ backgroundColor: 'rgba(0, 6, 102, 1)' }}
          aria-label={isPlaying ? 'Pause the story' : 'Listen to the story'}
          aria-pressed={isPlaying}
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--church-green)', color: '#ffffff' }}
            aria-hidden="true"
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5" fill="currentColor" />
            ) : (
              <Play
                className="h-3.5 w-3.5"
                fill="currentColor"
                style={{ transform: 'translateX(1px)' }}
              />
            )}
          </span>
          {isPlaying ? 'Pause' : 'Listen'}
        </button>
        <audio ref={audioRef} src={STORY_NARRATION_SRC} preload="metadata" />
      </div>

      {/* Story body — full text from the printed programme, verbatim. */}
      <p>
        Ours began with this one: What if a church could be more than a Sunday
        gathering? What if it could be a place where people don&apos;t just
        attend but are furnished unto every good work, transformed within and
        without, and sent out to influence the world around them for Jesus
        Christ?
      </p>
      <p>
        That question became a conviction, that conviction became a calling,
        and that calling became The RCCG Glory Tabernacle, Barnstaple, planted
        in the heart of Barnstaple, North Devon, with a mandate to liberate
        God&apos;s people, thereby walking in absolute victory.
      </p>
      <p>
        We are a people in pursuit of God&apos;s presence, His purpose, and His
        glory. We believe that every person who walks through our door carries
        a destiny too significant to be left unfinished. We believe that
        ordinary people, when they encounter an extraordinary God, they become
        extraordinary themselves.
      </p>

      <blockquote className="border-l-4 border-[#1b6d24] bg-[#1b6d24]/5 px-5 py-4 font-serif text-lg font-bold italic text-[#000666] md:text-xl">
        We build the Tabernacle, God fills it with His Glory. Because you are
        the <span className="not-italic">TABERNACLE</span>.
      </blockquote>

      <p>
        From our first gathering to where we stand today, one thing has never
        changed, our hunger for His presence. Because we have learned that when
        God&apos;s glory rests in a place, atmospheres shift, hearts are
        convicted unto conversion, thereby resulting to salvation and
        discipleship of many.
      </p>

      <p className="font-semibold text-[#000666]">
        This is not just our story, it is the beginning of yours.
      </p>

      <p>
        You may have come broken, but you will not leave broken. You may have
        come small, but you cannot remain small because nothing small is found
        in the Tabernacle.
      </p>

      {/* Closing signature — feels like the end of a printed pamphlet. */}
      <div className="border-t border-gray-200 pt-5">
        <p className="text-xl font-extrabold leading-tight text-[#000666] md:text-2xl">
          Welcome to RCCG Glory Tabernacle,
        </p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-[#1b6d24]">
          Barnstaple, England
        </p>
      </div>

      {registrantFirstName && (
        <p className="text-[#1b6d24]">Welcome home, {registrantFirstName}.</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Content: About RCCG
// ---------------------------------------------------------------------------

function RccgContent() {
  const mandate = [
    'To make heaven and take as many people as possible with us.',
    'To have a member of RCCG in every family in every nation.',
    'To accomplish these through planting churches within five minutes’ drive of every home.',
  ]

  const pillars: { icon: ComponentType<{ className?: string }>; label: string; body: string }[] = [
    {
      icon: Building2,
      label: 'Our Heritage',
      body: 'Holiness, prayer, the Word of God, and evangelism — the four pillars that have defined RCCG for over 70 years.',
    },
    {
      icon: Compass,
      label: 'Our Strategy',
      body: 'To build according to God’s specification — not the world’s. Character before crowds, depth before display.',
    },
    {
      icon: Flame,
      label: 'Our Fire',
      body: 'A move of God started by Rev. Josiah Akindayomi in 1952, carried today across 190+ nations under Pastor E. A. Adeboye.',
    },
  ]

  // Timeline of key dates in RCCG history — pulled from the founding
  // narrative below. Renders as a horizontally-scrollable rail on mobile
  // and a static grid on desktop.
  const timeline: { year: string; note: string }[] = [
    { year: '1927', note: 'Rev. Akindayomi baptised at Church Missionary Society' },
    { year: '1952', note: 'RCCG founded in Lagos, Nigeria' },
    { year: '1973', note: 'Dr. E. A. Adeboye joins the church' },
    { year: '1975', note: 'Adeboye ordained as pastor' },
    { year: '1980', note: 'Rev. Akindayomi goes to be with the Lord' },
    { year: '1981', note: 'Adeboye becomes General Overseer' },
    { year: '2008', note: 'Newsweek names Adeboye one of the 50 most influential people' },
    { year: '2026', note: 'Adeboye turns 84; Light Up events reach thousands' },
  ]

  return (
    <div className="space-y-8 text-sm leading-relaxed text-gray-700 md:text-base">
      {/* Intro + mandate */}
      <div className="space-y-4">
        <p>
          We are a parish of the <strong>Redeemed Christian Church of God</strong>{' '}
          — one of the fastest-growing churches in the world, with members in
          over 190 nations and still counting. Our local expression at Glory
          Tabernacle carries the global mandate:
        </p>
        <ol className="space-y-2">
          {mandate.map((line, i) => (
            <li key={line} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#c8342e]/10 font-mono text-xs font-bold text-[#c8342e]">
                {i + 1}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Pillars — three glanceable cards. */}
      <div className="grid gap-3 sm:grid-cols-3">
        {pillars.map((p) => {
          const Icon = p.icon
          return (
            <div
              key={p.label}
              className="rounded-xl border border-gray-100 bg-gray-50 p-4"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c8342e]/10">
                <Icon className="h-4 w-4 text-[#c8342e]" />
              </div>
              <p className="mt-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#c8342e]">
                {p.label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">{p.body}</p>
            </div>
          )
        })}
      </div>

      {/* Founding history — long-form narrative + timeline. Section-title
          eyebrow separates it from the vision content above. */}
      <div className="border-t border-gray-100 pt-8">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#c8342e]">
          Our history
        </p>
        <h4 className="mt-2 font-serif text-2xl font-extrabold leading-tight text-[#000666] md:text-3xl">
          A covenant kept for over seventy years
        </h4>

        {/* Timeline chips — horizontally scrollable on narrow screens. */}
        <div className="mt-6 -mx-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-2 pb-2">
          {timeline.map((t) => (
            <div
              key={t.year}
              className="min-w-[10.5rem] shrink-0 snap-start rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
            >
              <p className="font-mono text-lg font-extrabold text-[#c8342e]">
                {t.year}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">{t.note}</p>
            </div>
          ))}
        </div>

        {/* Narrative — cleaned + de-duplicated from the printed history. */}
        <div className="mt-8 space-y-4">
          <p>
            The Redeemed Christian Church of God (RCCG) was founded in 1952 in
            Nigeria, following a divine revelation received by a young man whose
            heart had been set ablaze with an unquenchable desire to personally
            encounter the Supreme Being, in spite of a prevailing environment of
            nature worship.
          </p>
          <p>
            Seeking a fervent relationship with the God he still knew little
            about at the time, Reverend Josiah Olufemi Akindayomi was fired by
            the intuition that there was a greater power than those commonly
            known to his people. This pursuit of God led him to the Church
            Missionary Society, where he was baptised in 1927. Yet, remaining
            largely spiritually unfulfilled, he later joined the Cherubim and
            Seraphim Church, an indigenous African Church that emerged from the
            Anglican (Episcopal) Church in Nigeria.
          </p>
          <p>
            Reverend Akindayomi&apos;s call as a servant of God began whilst
            still a member of the Cherubim and Seraphim Church — a prompting he
            ignored for several years, until repeated business failures brought
            him to the point of repentance. This season became the turning-point
            for him in his relationship with God. Humbled, he made the decision
            to totally yield to God and His purposes, seeking divine
            confirmation of a call to ministry. The confirmation eventually came
            through the Holy Scriptures.
          </p>
          <p>
            By 1947, he had also become increasingly concerned about some of the
            doctrinal beliefs of the Cherubim and Seraphim Church, and became
            totally persuaded to leave in 1952.
          </p>

          <blockquote className="border-l-4 border-[#c8342e] bg-[#c8342e]/5 px-5 py-4 font-serif text-base italic leading-relaxed text-[#000666] md:text-lg">
            The House Fellowship he set up in Lagos soon became the hub of
            spiritual conversions and remarkable miracles.
          </blockquote>

          <p>
            During this period, Rev. Akindayomi — who couldn&apos;t read or
            write English, not having had a formal education — received a vision
            in which the words &ldquo;The Redeemed Christian Church of
            God&rdquo; were written, being the name of the Church that the Lord
            would establish through him. By supernatural enablement, he was able
            to write these words, spelling out the name of the Church.
          </p>
          <p>
            In the course of that spiritual encounter, God also revealed that
            the Church would spread to the ends of the earth, and that when the
            Lord Jesus Christ appears in glory at the end of the age, He would
            meet the RCCG. Without doubt, these were extraordinary prophecies to
            a man with no formal education or great means.
          </p>
          <p>
            Yet, he did not doubt the promises of the Lord but set out in faith
            to do His will. RCCG was, therefore, set up on the basis of this
            covenant between God and man: as long as the members of the RCCG
            remain obedient to God&apos;s Word, the Lord has promised to always
            miraculously meet the needs of the Church.
          </p>

          <p>
            Rev. Akindayomi remained faithful to this heavenly vision until he
            went to be with the Lord in 1980. Prior to this, sometime in the
            early 1970s, he had received a message from the Lord about his
            spiritual successor — a young, educated man who at the time was not
            a member of the church.
          </p>
          <p>
            Hence, when Dr. Enoch Adejare Adeboye, a young university lecturer
            in Mathematics, became a member of the Church in 1973, Rev.
            Akindayomi spiritually discerned that this was the person the Lord
            had spoken about. Dr. Adeboye soon became involved in the activities
            of the church and began to serve as an interpreter for Rev.
            Akindayomi, translating his live sermons from Yoruba to English. The
            young man was ordained a pastor of the church in 1975.
          </p>

          <p>
            As revealed by the Lord, Pastor E. A. Adeboye became the General
            Overseer of the RCCG in 1981. Under his leadership, RCCG has begun
            to experience the phenomenal growth promised by the Lord to his
            predecessor. A man devoted to fervent prayer and known for his
            unwavering emphasis on holy living as the foundation of a fruitful
            and enduring relationship with God, Pastor Adeboye is being used by
            God to bring the message of the gospel to nations around the world.
          </p>
          <p>
            In spite of the miraculous move of God in his ministry, Pastor
            Adeboye&apos;s humble disposition is widely acknowledged — making
            him a role model for many the world over. In December 2008,{' '}
            <em>Newsweek</em> magazine named him one of the 50 most influential
            people on the planet.
          </p>

          <p className="font-semibold text-[#000666]">
            Pastor E. A. Adeboye turned 84 in March 2026 and, from the look of
            things, he does not seem to be slowing down — with Light Up events
            continuing across the world and thousands coming to the knowledge
            of Christ.
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Content: Our DNA (Furnish · Transform · Influence)
// ---------------------------------------------------------------------------

function DnaContent() {
  const strands = [
    {
      title: 'Furnish',
      scripture: '2 Timothy 3:16-17',
      icon: Target,
      color: '#000666',
      bullets: [
        'We equip every believer with the Word, spiritual gifts, and tools for Kingdom living.',
        'We build people according to God’s specification — character, integrity, diligence.',
        'We raise disciples who are grounded, growing, and ready for every good work.',
        'Nothing about God’s design for you is incomplete. This is where you are fully furnished.',
      ],
    },
    {
      title: 'Transform',
      scripture: 'Romans 12:2',
      icon: Sparkles,
      color: '#1b6d24',
      bullets: [
        'Genuine renewal — in the individual, the family, the community.',
        'The Word of God changes lives, shapes character, and produces lasting impact.',
        'You may come broken — you will not leave broken. You may come small — you cannot remain small.',
        'Transformation is not a programme. It is the nature of this house.',
      ],
    },
    {
      title: 'Influence',
      scripture: 'Matthew 5:13-14',
      icon: Compass,
      color: '#c8342e',
      bullets: [
        'Influence in business.',
        'Influence in government.',
        'Influence in media.',
        'Influence in education.',
        'Influence in family.',
        'Influence in community.',
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-gray-600 md:text-base">
        A reflection of our faith. Three strands, one identity.
      </p>
      {strands.map((s) => {
        const Icon = s.icon
        return (
          <div
            key={s.title}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white"
          >
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ backgroundColor: `${s.color}0d` }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${s.color}1f` }}
              >
                <Icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <div>
                <h4 className="text-lg font-extrabold" style={{ color: s.color }}>
                  {s.title}
                </h4>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-gray-500">
                  {s.scripture}
                </p>
              </div>
            </div>
            <ul className="space-y-2 px-5 py-4 text-sm leading-relaxed text-gray-700 md:text-base">
              {s.bullets.map((b) => (
                <li key={b} className="flex gap-3">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Content: Hymns
// ---------------------------------------------------------------------------

const HYMN_VERSES = [
  [
    'Praise to the Lord, the Almighty, the King of creation!',
    'O my soul, praise Him, for He is thy health and salvation!',
    'All ye who hear, now to His temple draw near;',
    'Sing now in glad adoration!',
  ],
  [
    'Praise to the Lord, who o’er all things so wondrously reigneth,',
    'Who, as on wings of an eagle, uplifteth, sustaineth.',
    'Hast thou not seen how thy desires all have been',
    'Granted in what He ordaineth?',
  ],
  [
    'Praise to the Lord, who hath fearfully, wondrously, made thee!',
    'Health hath vouchsafed and, when heedlessly falling, hath stayed thee.',
    'What need or grief ever hath failed of relief?',
    'Wings of His mercy did shade thee.',
  ],
  [
    'Praise to the Lord, who doth prosper thy work and defend thee;',
    'Surely His goodness and mercy here daily attend thee.',
    'Ponder anew what the Almighty can do,',
    'If with His love He befriend thee.',
  ],
  [
    'Praise to the Lord! Oh, let all that is in me adore Him!',
    'All that hath life and breath, come now with praises before Him!',
    'Let the Amen sound from His people again;',
    'Gladly for aye we adore Him.',
  ],
]

function HymnsContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1b6d24]/10">
          <Music className="h-4 w-4 text-[#1b6d24]" />
        </div>
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#1b6d24]">
            Opening Hymn
          </p>
          <h4 className="text-lg font-extrabold text-[#000666]">
            Praise to the Lord, the Almighty
          </h4>
        </div>
      </div>

      <div className="space-y-5">
        {HYMN_VERSES.map((verse, i) => (
          <div
            key={i}
            className="relative rounded-xl border-l-4 border-[#1b6d24] bg-gray-50 px-5 py-4 md:px-6"
          >
            <span className="absolute -left-3 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#1b6d24] font-mono text-[10px] font-bold text-white">
              {i + 1}
            </span>
            {verse.map((line, li) => (
              <p
                key={li}
                className="font-serif text-base leading-relaxed text-gray-800 md:text-lg"
              >
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Content: Lead Pastors
// ---------------------------------------------------------------------------

function LeadPastorsContent() {
  return (
    <div className="space-y-6">
      {/* Portrait + name card combined so the image and text feel like one
          designed object rather than a photo pasted above a caption. The
          portrait glides in first (240ms delay), then the caption follows
          (460ms) — a small cascade that reads as intentional, not late. */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#000666] via-[#0a1078] to-[#00041f] text-white">
        <div className="gt-gentle-image relative mx-auto aspect-[4/3] w-full overflow-hidden bg-white/5">
          <Image
            src="https://res.cloudinary.com/deckwmsth/image/upload/v1784301376/Artboard_12_j1lsoh.png"
            alt="Pastors Seye and Tolu Adebayo — Lead Pastors, RCCG Glory Tabernacle, Barnstaple"
            fill
            className="object-contain object-center"
            sizes="(max-width: 640px) 100vw, 640px"
          />
        </div>
        <div className="gt-gentle-caption px-6 pb-8 pt-6 text-center sm:px-8">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[rgba(163,246,156,1)]">
            Lead Pastors
          </p>
          <h4 className="mt-3 font-serif text-3xl font-extrabold leading-tight md:text-4xl">
            Seye &amp; Tolu
            <br />
            <span className="text-[rgba(163,246,156,1)]">Adebayo</span>
          </h4>
          <div className="mx-auto mt-5 h-px w-24 bg-white/30" />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 md:text-sm">
            RCCG Glory Tabernacle, Barnstaple
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
        <Quote className="h-5 w-5 text-[#1b6d24]" aria-hidden="true" />
        <p className="mt-3 font-serif text-base italic leading-relaxed text-gray-700 md:text-lg">
          &ldquo;We build the Tabernacle. God fills it with His glory. Because
          you are the Tabernacle.&rdquo;
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Content: General Overseer
// ---------------------------------------------------------------------------

function GoContent() {
  return (
    <div className="space-y-6">
      {/* Same portrait-then-caption cascade as the Lead Pastors card, in
          the church-red gradient so the two pages read as siblings from
          the same design family. */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#a5252c] via-[#c8342e] to-[#7d1a20] text-white">
        <div className="gt-gentle-image relative mx-auto aspect-[4/3] w-full overflow-hidden bg-white/5">
          <Image
            src="https://res.cloudinary.com/deckwmsth/image/upload/v1784301380/papa_ukpdm5.png"
            alt="Pastor E. A. Adeboye — General Overseer, Redeemed Christian Church of God"
            fill
            className="object-contain object-center"
            sizes="(max-width: 640px) 100vw, 640px"
          />
        </div>
        <div className="gt-gentle-caption px-6 pb-8 pt-6 text-center sm:px-8">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-white/80">
            General Overseer
          </p>
          <h4 className="mt-3 font-serif text-3xl font-extrabold leading-tight md:text-4xl">
            Pastor E. A.
            <br />
            Adeboye
          </h4>
          <div className="mx-auto mt-5 h-px w-24 bg-white/30" />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 md:text-sm">
            Redeemed Christian Church of God
          </p>
        </div>
      </div>

      <div className="space-y-3 text-sm leading-relaxed text-gray-700 md:text-base">
        <p>
          Dr. Enoch Adejare Adeboye became General Overseer in 1981, succeeding
          Rev. Josiah Akindayomi. Under his leadership RCCG has grown from a
          Nigerian church to a global family of parishes in more than 190
          nations — carrying the same fire that lit the first altar in 1952.
        </p>
        <p>
          A man devoted to fervent prayer and known for his unwavering emphasis
          on holy living, Pastor Adeboye is used by God to bring the gospel to
          nations around the world. In December 2008, <em>Newsweek</em>{' '}
          magazine named him one of the 50 most influential people on the
          planet — yet his humble disposition remains a role model for many.
        </p>
        <p className="font-semibold text-[#000666]">
          Today we sit under that same covering, part of a house built on
          holiness, prayer, the Word of God, and evangelism.
        </p>
      </div>
    </div>
  )
}
