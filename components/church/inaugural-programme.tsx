'use client'

import { useEffect, useState, type ComponentType } from 'react'
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
} from 'lucide-react'

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
        .gt-prog-card {
          animation: gtProgFadeUp 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .gt-prog-backdrop {
          animation: gtProgBackdropIn 220ms ease-out both;
        }
        .gt-prog-sheet {
          animation: gtProgSheetIn 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
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

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card, index) => (
          <Card
            key={card.id}
            card={card}
            index={index}
            onOpen={() => setSelectedId(card.id)}
          />
        ))}
      </div>

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

function StoryContent({ registrantFirstName }: { registrantFirstName: string | null }) {
  return (
    <div className="space-y-5 text-sm leading-relaxed text-gray-700 md:text-base md:leading-loose">
      <p className="rounded-xl bg-[#000666]/5 p-5 font-serif text-lg italic leading-relaxed text-[#000666] md:text-xl">
        Every great move of God begins with a question.
      </p>
      <p>
        Ours began with this one: what if a church could be more than a Sunday
        gathering? What if it could be a place where people don&apos;t just
        attend but are <em>furnished</em> unto every good work, <em>transformed</em>
        {' '}within and without, and sent out to <em>influence</em> the world
        around them for Jesus Christ?
      </p>
      <p>
        That question became a conviction. That conviction became a calling.
        And that calling became RCCG Glory Tabernacle, Barnstaple — planted in
        the heart of North Devon with a mandate to liberate God&apos;s people,
        thereby walking in absolute victory.
      </p>
      <p>
        We are a people in pursuit of God&apos;s presence, His purpose, and His
        glory. Every person who walks through our door carries a destiny too
        significant to be left unfinished.
      </p>
      <blockquote className="border-l-4 border-[#1b6d24] bg-[#1b6d24]/5 px-5 py-4 font-serif text-lg font-bold italic text-[#000666] md:text-xl">
        We build the Tabernacle. God fills it with His glory. Because <em>you</em>
        {' '}are the Tabernacle.
      </blockquote>
      {registrantFirstName && (
        <p className="text-[#1b6d24]">
          Welcome home, {registrantFirstName}.
        </p>
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

  return (
    <div className="space-y-6 text-sm leading-relaxed text-gray-700 md:text-base">
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
      <div className="rounded-2xl bg-gradient-to-br from-[#000666] to-[#0a1078] p-8 text-center text-white">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[rgba(163,246,156,1)]">
          Lead Pastors
        </p>
        <h4 className="mt-3 font-serif text-4xl font-extrabold leading-tight md:text-5xl">
          Seye &amp; Tolu
          <br />
          <span className="text-[rgba(163,246,156,1)]">Adebayo</span>
        </h4>
        <div className="mx-auto mt-5 h-px w-24 bg-white/30" />
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-white/80">
          RCCG Glory Tabernacle, Barnstaple
        </p>
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
      <div className="rounded-2xl bg-gradient-to-br from-[#a5252c] via-[#c8342e] to-[#7d1a20] p-8 text-center text-white">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-white/80">
          General Overseer
        </p>
        <h4 className="mt-3 font-serif text-4xl font-extrabold leading-tight md:text-5xl">
          Pastor E. A.
          <br />
          Adeboye
        </h4>
        <div className="mx-auto mt-5 h-px w-24 bg-white/30" />
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-white/80">
          Redeemed Christian Church of God
        </p>
      </div>

      <div className="space-y-3 text-sm leading-relaxed text-gray-700 md:text-base">
        <p>
          Dr. Enoch Adejare Adeboye became General Overseer in 1981, succeeding
          Rev. Josiah Akindayomi. Under his leadership RCCG has grown from a
          Nigerian church to a global family of parishes in more than 190
          nations — carrying the same fire that lit the first altar in 1952.
        </p>
        <p>
          Today we sit under that same covering, part of a house built on
          holiness, prayer, the Word of God, and evangelism.
        </p>
      </div>
    </div>
  )
}
