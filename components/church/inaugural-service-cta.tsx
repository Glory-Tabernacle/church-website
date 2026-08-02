'use client'

import { useEffect, useRef, useState } from 'react'
import { Flame, UserCircle2 } from 'lucide-react'

const PLACEHOLDER_NAME = 'your name'

function buildConfessionParagraphs(name: string) {
  const displayName = name.trim() || PLACEHOLDER_NAME
  return [
    `Father, Your son, ${displayName}, is eternally grateful. Thank You for the gift of Your Son, Jesus Christ, through whom I have received salvation, righteousness, and eternal life.`,
    "Souls are saved through me, leaders are raised through me, nations are impacted through me and the Kingdom of God advances through my obedience.",
    "I am the breaker in my lineage, every evil pattern, limitation, and generational cycle terminates with me because I am the tabernacle that carries the glory of God.",
    "The gate of this land is opened unto me, I receive access to the gift of men, kings, helpers, and destiny partners are drawn to me by divine orchestration.",
    "I reject laziness, I walk in diligence, I receive wisdom, knowledge, understanding, and divine strategy. I know what to do, how to do it, when to do it, and I obtain maximum productivity. No to wrong association.",
    "My mind is sound, my health is preserved, I think right, I speak right, I act right, I am who God says I am.",
    "I am not a failure, therefore, nothing fails in my hands. I am not a loser, therefore, I lose nothing that God has entrusted to me.",
    "I walk in excellence, integrity is my lifestyle. Faithfulness is my nature, I am faithful at work, at home, in church, I represent Christ with honour in every place.",
    "The vision God has committed into my hands shall become reality, my eyes are opened to opportunities, my ears are opened to hear the voice of the Holy Spirit, I walk circumspectly, and even my mistakes are turned into testimonies by the mercy of God.",
    "Hear me, devil — take off your ugly hands from my life, my family, my ministry, and all that belongs to me. I am in Christ, and Christ is in me, the hope of glory.",
    "I reject doubt, fear, anxiety, depression, confusion, and every imagination contrary to the knowledge of Christ. My atmosphere is saturated with faith, peace, joy, and confidence in God.",
    "The Lord is my Anchor, my Shield, my Banner, my Deliverer, my Helper, my Strength, my Wisdom, and my exceedingly great Reward.",
    "The oil of gladness rests upon me, you see me, you favour me, you hear about me, you are compelled to bless me, my words are seasoned with wisdom, grace, and life.",
    "I receive power and authority over all devils, and to cure diseases, so nothing dies in my hands. Everything committed into my care flourishes.",
    "My gaze is fixed on eternity, so no devil, scheme, circumstance, distraction, or worldly attraction can shift my gaze away from Jesus. I will finish my race with joy and stand before Him in glory.",
    "I am thoroughly FURNISHED unto every good work, continually TRANSFORMED within and without, and empowered to INFLUENCE the marketplace.",
    "This is Glory Tabernacle — I am the tabernacle built to pattern, to carry His divine presence, splendour and majesty to influence the market.",
  ]
}

function useFadeInOnScroll() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) { setVisible(true); return }

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

function ConfessionLine({
  text,
  index,
  highlight,
}: {
  text: string
  index: number
  highlight?: string
}) {
  const { ref, visible } = useFadeInOnScroll()

  // Split the text around the highlighted name so we can style it
  const parts =
    highlight && text.includes(highlight)
      ? text.split(highlight)
      : null

  return (
    <div
      ref={ref}
      className="confession-line"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 700ms cubic-bezier(0.16,1,0.3,1) ${index * 55}ms, transform 700ms cubic-bezier(0.16,1,0.3,1) ${index * 55}ms`,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Accent line */}
        <div
          className="mt-1.5 h-3 w-0.5 shrink-0 rounded-full"
          style={{ backgroundColor: 'rgba(163,246,156,0.55)' }}
          aria-hidden="true"
        />
        <p className="text-sm leading-8 text-white/85 md:text-base md:leading-9">
          {parts ? (
            <>
              {parts[0]}
              <span
                className="font-bold"
                style={{ color: '#a3f69c' }}
              >
                {highlight}
              </span>
              {parts[1]}
            </>
          ) : text}
        </p>
      </div>
    </div>
  )
}

export function InauguralServiceCta() {
  const headerRef = useRef<HTMLDivElement | null>(null)
  const [headerVisible, setHeaderVisible] = useState(false)
  const [closingVisible, setClosingVisible] = useState(false)
  const closingRef = useRef<HTMLDivElement | null>(null)
  const [name, setName] = useState('')
  const [started, setStarted] = useState(false)

  const paragraphs = buildConfessionParagraphs(name)

  useEffect(() => {
    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const observe = (
      el: HTMLDivElement | null,
      setter: (v: boolean) => void
    ) => {
      if (!el) return
      if (prefersReduced) { setter(true); return }
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { setter(true); obs.disconnect() } },
        { threshold: 0.15 }
      )
      obs.observe(el)
      return () => obs.disconnect()
    }

    observe(headerRef.current, setHeaderVisible)
    observe(closingRef.current, setClosingVisible)
  }, [])

  return (
    <>
      <style>{`
        @keyframes cta-glow-pulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%       { opacity: 0.55; transform: scale(1.08); }
        }
        .cta-glow { animation: cta-glow-pulse 6s ease-in-out infinite; }

        @keyframes cta-flame {
          0%, 100% { transform: scaleY(1) rotate(-2deg); }
          50%       { transform: scaleY(1.15) rotate(2deg); }
        }
        .cta-flame { animation: cta-flame 2.4s ease-in-out infinite; }

        @keyframes cta-shimmer {
          from { background-position: -200% center; }
          to   { background-position: 200% center; }
        }
        .cta-shimmer-text {
          background: linear-gradient(
            90deg,
            #a3f69c 0%,
            #ffffff 40%,
            #a3f69c 60%,
            #ffffff 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: cta-shimmer 4s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .cta-glow, .cta-flame, .cta-shimmer-text {
            animation: none !important;
          }
          .cta-shimmer-text {
            -webkit-text-fill-color: #a3f69c;
          }
        }
      `}</style>

      <section
        aria-labelledby="confession-heading"
        className="relative overflow-hidden"
        style={{
          height: '100vh',
          background: 'linear-gradient(160deg, #000444 0%, #000666 40%, #0d1a0d 100%)',
        }}
      >
        {/* Ambient glows — fixed inside section, don't scroll */}
        <div
          aria-hidden="true"
          className="cta-glow pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(163,246,156,0.45) 0%, transparent 70%)' }}
        />
        <div
          aria-hidden="true"
          className="cta-glow pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(27,109,36,0.4) 0%, transparent 70%)', animationDelay: '3s' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,1) 39px, rgba(255,255,255,1) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,1) 39px, rgba(255,255,255,1) 40px)',
          }}
        />

        {/* Scrollable content — fills the 100vh section */}
        <div className="relative h-full overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-16 md:px-10 md:py-20">

          {/* Header */}
          <div
            ref={headerRef}
            style={{
              opacity: headerVisible ? 1 : 0,
              transform: headerVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 800ms cubic-bezier(0.16,1,0.3,1), transform 800ms cubic-bezier(0.16,1,0.3,1)',
            }}
            className="mb-12 text-center md:mb-16"
          >
            <div className="mb-5 flex justify-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: 'rgba(163,246,156,0.12)', border: '1px solid rgba(163,246,156,0.25)' }}
              >
                <Flame
                  className="cta-flame h-7 w-7"
                  style={{ color: '#a3f69c' }}
                  aria-hidden="true"
                />
              </div>
            </div>

            <p className="mb-3 text-[0.65rem] font-black uppercase tracking-[0.35em] text-[rgba(163,246,156,0.7)] md:text-xs">
              Daily Confession
            </p>
            <h2
              id="confession-heading"
              className="cta-shimmer-text font-serif text-3xl font-extrabold leading-tight md:text-5xl"
            >
              Declare this with faith.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/50 md:text-base">
              Speak it aloud from your heart.
            </p>

            {/* Name input */}
            <div
              className="mx-auto mt-8 max-w-sm"
              style={{
                opacity: headerVisible ? 1 : 0,
                transition: 'opacity 600ms ease 400ms',
              }}
            >
              <label
                htmlFor="confession-name"
                className="mb-2 block text-[0.65rem] font-black uppercase tracking-[0.3em] text-[rgba(163,246,156,0.7)]"
              >
                Enter your name to personalise this confession
              </label>
              <div className="relative">
                <UserCircle2
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
                  aria-hidden="true"
                />
                <input
                  id="confession-name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setStarted(true) }}
                  placeholder="e.g. John Adeyemi"
                  maxLength={60}
                  className="w-full rounded-xl border py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[rgba(163,246,156,0.4)]"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(163,246,156,0.22)',
                  }}
                />
              </div>
              {!started && (
                <p className="mt-2 text-center text-[0.6rem] text-white/30">
                  Your name stays on your device — it is never stored.
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[rgba(163,246,156,0.3)]" />
              <div className="h-1.5 w-1.5 rounded-full bg-[rgba(163,246,156,0.5)]" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[rgba(163,246,156,0.3)]" />
            </div>
          </div>

          {/* Confession paragraphs */}
          <div className="space-y-6">
            {paragraphs.map((text, i) => (
              <ConfessionLine
                key={i}
                text={text}
                index={i}
                highlight={i === 0 && name.trim() ? name.trim() : undefined}
              />
            ))}
          </div>

          {/* Closing call to pray */}
          <div
            ref={closingRef}
            style={{
              opacity: closingVisible ? 1 : 0,
              transform: closingVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 900ms cubic-bezier(0.16,1,0.3,1) 200ms, transform 900ms cubic-bezier(0.16,1,0.3,1) 200ms',
            }}
            className="mt-14 text-center"
          >
            {/* Divider */}
            <div className="mb-10 flex items-center justify-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[rgba(163,246,156,0.3)]" />
              <div className="h-1.5 w-1.5 rounded-full bg-[rgba(163,246,156,0.5)]" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[rgba(163,246,156,0.3)]" />
            </div>

            <div
              className="inline-flex flex-col items-center gap-3 rounded-2xl px-8 py-6 text-center"
              style={{ background: 'rgba(163,246,156,0.06)', border: '1px solid rgba(163,246,156,0.18)' }}
            >
              <Flame
                className="cta-flame h-6 w-6"
                style={{ color: '#a3f69c' }}
                aria-hidden="true"
              />
              <p className="font-serif text-lg font-bold italic text-white/90 md:text-xl">
                Now pray in the Holy Ghost for a few minutes.
              </p>
              <p className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-[rgba(163,246,156,0.6)]">
                Glory Tabernacle · Furnish · Transform · Influence
              </p>
            </div>
          </div>

          </div>{/* end scrollable */}
        </div>{/* end max-w-3xl */}
      </section>
    </>
  )
}
