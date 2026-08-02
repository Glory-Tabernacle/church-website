'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Images } from 'lucide-react'

export interface ProgrammeGalleryPhoto {
  id: string
  imageUrl: string
  imageAlt: string
  order: number
}

export interface ProgrammeGalleryItem {
  id: string
  name: string
  photos: ProgrammeGalleryPhoto[]
}

interface ProgrammeGallerySectionProps {
  programme: ProgrammeGalleryItem
}

/**
 * Book-page-flip carousel.
 *
 * The container is fixed-height and fixed in viewport space.
 * As the user scrolls DOWN through the section's scroll budget,
 * the active photo increments — like turning pages of a book
 * without the book moving on screen.
 *
 * Implementation: a tall sticky-scroll wrapper. The outer div
 * is `height: (n_photos + 1) * 100vh` so it occupies scroll space;
 * the inner panel is `position: sticky; top: 0; height: 100vh`.
 * A scroll listener maps scrollY progress → active photo index.
 */
export function ProgrammeGallerySection({ programme }: ProgrammeGallerySectionProps) {
  const photos = programme.photos
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [animating, setAnimating] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Number of "virtual pages" — one per photo after the first
  const n = photos.length

  useEffect(() => {
    setMounted(true)
  }, [])

  // Scroll-driven page flip
  useEffect(() => {
    if (n <= 1) return
    const section = sectionRef.current
    if (!section) return

    const onScroll = () => {
      const rect = section.getBoundingClientRect()
      // Progress 0→1 through the scroll budget (n * 100vh tall section,
      // minus the sticky viewport itself which is 1*100vh).
      const budget = section.offsetHeight - window.innerHeight
      if (budget <= 0) return
      const scrolled = Math.max(0, -rect.top)
      const progress = Math.min(1, scrolled / budget)
      const targetIndex = Math.min(n - 1, Math.floor(progress * n))
      if (targetIndex !== active) {
        setDirection(targetIndex > active ? 'next' : 'prev')
        setAnimating(true)
        setActive(targetIndex)
        setTimeout(() => setAnimating(false), 500)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, active])

  // Manual prev/next (also works on touch/click without scroll)
  function goTo(index: number) {
    if (index === active || animating) return
    setDirection(index > active ? 'next' : 'prev')
    setAnimating(true)
    setActive(index)
    setTimeout(() => setAnimating(false), 500)
  }

  if (!photos.length) return null

  // Section height = n * 100vh so scroll budget = (n-1) * 100vh
  const sectionHeight = `${Math.max(1, n) * 100}vh`

  const photo = photos[active]

  return (
    <>
      <style>{`
        @keyframes pg-flip-in-right {
          from { transform: perspective(1200px) rotateY(-25deg) translateX(6%); opacity: 0; }
          to   { transform: perspective(1200px) rotateY(0deg) translateX(0); opacity: 1; }
        }
        @keyframes pg-flip-in-left {
          from { transform: perspective(1200px) rotateY(25deg) translateX(-6%); opacity: 0; }
          to   { transform: perspective(1200px) rotateY(0deg) translateX(0); opacity: 1; }
        }
        .pg-flip-in-right { animation: pg-flip-in-right 500ms cubic-bezier(0.16,1,0.3,1) both; }
        .pg-flip-in-left  { animation: pg-flip-in-left 500ms cubic-bezier(0.16,1,0.3,1) both; }

        @keyframes pg-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pg-fade-up { animation: pg-fade-up 700ms cubic-bezier(0.16,1,0.3,1) both; }

        @media (prefers-reduced-motion: reduce) {
          .pg-flip-in-right, .pg-flip-in-left, .pg-fade-up {
            animation: none !important;
          }
        }
      `}</style>

      {/* Outer scroll-budget container */}
      <div
        ref={sectionRef}
        style={{ height: sectionHeight }}
        aria-label={`Programme Gallery: ${programme.name}`}
      >
        {/* Sticky viewport panel */}
        <div
          className="sticky top-0 h-screen w-full overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #000444 0%, #000666 55%, #0d1a0d 100%)' }}
        >
          {/* Ambient glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(163,246,156,0.5) 0%, transparent 70%)' }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
          />

          <div className="relative flex h-full flex-col items-center justify-center px-4 md:px-10">

            {/* Header */}
            <div
              className={`mb-6 text-center md:mb-8 ${mounted ? 'pg-fade-up' : 'opacity-0'}`}
            >
              <div className="mb-3 flex items-center justify-center gap-2">
                <Images className="h-4 w-4" style={{ color: 'rgba(163,246,156,0.8)' }} aria-hidden="true" />
                <p className="text-[0.6rem] font-black uppercase tracking-[0.32em] text-[rgba(163,246,156,0.7)] md:text-xs">
                  Programme Gallery
                </p>
              </div>
              <h2 className="font-serif text-2xl font-extrabold text-white md:text-4xl">
                {programme.name}
              </h2>
            </div>

            {/* Book container */}
            <div className="relative w-full max-w-3xl">

              {/* Page counter */}
              <div className="mb-3 flex items-center justify-between px-1 text-xs font-bold text-white/40">
                <span className="uppercase tracking-widest">
                  {n > 1 ? 'Scroll or use arrows' : ''}
                </span>
                <span style={{ color: 'rgba(163,246,156,0.6)' }}>
                  {active + 1} / {n}
                </span>
              </div>

              {/* Book frame */}
              <div
                className="relative overflow-hidden rounded-2xl shadow-[0_32px_80px_-16px_rgba(0,0,0,0.7)]"
                style={{
                  aspectRatio: '16/10',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: '#000',
                }}
              >
                {/* Image */}
                <div
                  key={photo.id}
                  className={
                    animating
                      ? direction === 'next'
                        ? 'pg-flip-in-right absolute inset-0'
                        : 'pg-flip-in-left absolute inset-0'
                      : 'absolute inset-0'
                  }
                >
                  <Image
                    src={photo.imageUrl}
                    alt={photo.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                    priority={active === 0}
                    unoptimized
                  />
                  {/* Subtle gradient at bottom */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-24"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)' }}
                    aria-hidden="true"
                  />
                </div>

                {/* Prev button */}
                {active > 0 && (
                  <button
                    type="button"
                    onClick={() => goTo(active - 1)}
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60 hover:scale-110"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}

                {/* Next button */}
                {active < n - 1 && (
                  <button
                    type="button"
                    onClick={() => goTo(active + 1)}
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60 hover:scale-110"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Dot indicators */}
              {n > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2" role="tablist" aria-label="Photo navigation">
                  {photos.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      role="tab"
                      aria-selected={i === active}
                      aria-label={`Photo ${i + 1}`}
                      onClick={() => goTo(i)}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === active ? '24px' : '8px',
                        height: '8px',
                        background: i === active ? 'rgba(163,246,156,1)' : 'rgba(255,255,255,0.25)',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Scroll hint — fades out once user starts scrolling */}
            {n > 1 && active === 0 && (
              <p className="absolute bottom-8 text-[0.6rem] font-bold uppercase tracking-[0.28em] text-white/30 animate-bounce">
                Scroll to flip pages
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
