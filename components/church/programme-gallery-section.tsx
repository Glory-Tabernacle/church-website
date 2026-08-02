'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Images } from 'lucide-react'

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

interface Props {
  programme: ProgrammeGalleryItem
}

/**
 * CSS scroll-snap gallery.
 *
 * Each photo is a full-viewport slide inside a scroll-snap container.
 * The container itself is exactly 100vh tall and uses overflow-y: scroll
 * with scroll-snap-type: y mandatory. Each child is 100% height with
 * scroll-snap-align: start.
 *
 * This means:
 * - Every photo snaps to fill the full viewport exactly.
 * - Scrolling inside the container moves photo by photo.
 * - When the last photo is reached and the user scrolls again,
 *   the browser exits the container and continues down the page.
 * - No sticky positioning, no JS scroll listeners for layout.
 */
export function ProgrammeGallerySection({ programme }: Props) {
  const photos = programme.photos
  const scrollRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  // Track which slide is visible via IntersectionObserver
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const slides = Array.from(container.querySelectorAll('[data-slide]'))
    if (!slides.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.slide)
            setActive(idx)
          }
        })
      },
      { root: container, threshold: 0.6 }
    )

    slides.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [photos])

  if (!photos.length) return null

  const n = photos.length

  return (
    <>
      <style>{`
        .pg-snap-container {
          height: 100vh;
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          -webkit-overflow-scrolling: touch;
          /* hide scrollbar */
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .pg-snap-container::-webkit-scrollbar {
          display: none;
        }
        .pg-slide {
          height: 100vh;
          width: 100%;
          scroll-snap-align: start;
          scroll-snap-stop: always;
          position: relative;
          flex-shrink: 0;
          background: #000;
        }
        @keyframes pgFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .pg-img-wrap {
          position: absolute;
          inset: 0;
          animation: pgFadeIn 400ms ease both;
        }
        @media (prefers-reduced-motion: reduce) {
          .pg-img-wrap { animation: none !important; }
        }
      `}</style>

      <section aria-label={`Programme Gallery: ${programme.name}`}>
        {/* Header — sits above the scroll container, normal page flow */}
        <div
          className="flex items-center justify-between px-6 py-4 md:px-10 md:py-5"
          style={{ background: 'linear-gradient(to bottom, #000444, #000666)' }}
        >
          <div className="flex items-center gap-3">
            <Images className="h-4 w-4 shrink-0" style={{ color: 'rgba(163,246,156,0.9)' }} aria-hidden="true" />
            <div>
              <p className="text-[0.6rem] font-black uppercase tracking-[0.3em] text-white/50">
                Programme Gallery
              </p>
              <h2 className="font-serif text-lg font-extrabold text-white md:text-xl">
                {programme.name}
              </h2>
            </div>
          </div>
          <span className="text-sm font-black tabular-nums" style={{ color: 'rgba(163,246,156,0.8)' }}>
            <span>{String(active + 1).padStart(2, '0')}</span>
            <span className="text-white/30"> / {String(n).padStart(2, '0')}</span>
          </span>
        </div>

        {/* Snap scroll container */}
        <div ref={scrollRef} className="pg-snap-container">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              data-slide={i}
              className="pg-slide"
            >
              <div className="pg-img-wrap">
                <Image
                  src={photo.imageUrl}
                  alt={photo.imageAlt}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority={i === 0}
                  unoptimized
                />
              </div>

              {/* Bottom gradient */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-28 z-10"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)' }}
                aria-hidden="true"
              />

              {/* Scroll hint on first slide */}
              {i === 0 && n > 1 && (
                <div className="absolute bottom-7 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-1.5">
                  <p className="text-[0.55rem] font-black uppercase tracking-[0.28em] text-white/50">
                    Scroll for more
                  </p>
                  <svg
                    className="h-4 w-4 text-white/40 animate-bounce"
                    fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
