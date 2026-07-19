'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Play, Sparkles, X } from 'lucide-react'

/**
 * Light Up Barnstaple gallery — a hero-and-grid layout for yesterday's
 * evangelism recap.
 *
 *   ┌─────────────────────────────────────────────────┐
 *   │  ✨ Moment of the Day                            │
 *   │                                                  │
 *   │            [ hero photo, Ken Burns ]             │
 *   │                                                  │
 *   └─────────────────────────────────────────────────┘
 *   ┌────┬────┬────┬────┐
 *   │ ▶  │ ▶  │ 📷 │ 📷 │  ← ten remaining moments
 *   ├────┼────┼────┼────┤    fade in on scroll,
 *   │ 📷 │ 📷 │ 📷 │ 📷 │    click any to enlarge
 *   ├────┼────┼────┼────┤
 *   │ 📷 │ 📷 │    │    │
 *   └────┴────┴────┴────┘
 *
 * Motion is respectful:
 *   • Hero photo has a slow Ken Burns zoom (~22s per cycle, ping-pongs)
 *   • Grid tiles fade up as they scroll into view (IntersectionObserver)
 *   • "Moment of the Day" pin has a soft 3.4s float
 *   • Every ambient animation is disabled under
 *     `prefers-reduced-motion: reduce`, and grid tiles start visible
 *     for those users so nothing hides behind an animation they can't
 *     trigger.
 *
 * Cloudinary transforms:
 *   • Ring grid  → 600×600 c_fill  (thumbnail)
 *   • Hero       → 1600×900 c_fill + g_auto  (smart-crop for the
 *                  16:9 frame, keeps faces centred)
 *   • Lightbox   → 1600 c_limit    (aspect preserved)
 * Video posters use the same transforms on `/video/upload/` with
 * `so_1` (second-1 frame) and `.mp4 → .jpg`.
 */

// ---------------------------------------------------------------------------
// Source assets
// ---------------------------------------------------------------------------

const IMAGE_URLS = [
  'https://res.cloudinary.com/deckwmsth/image/upload/v1784419262/gallery/file_e4uu6q.jpg',
  'https://res.cloudinary.com/deckwmsth/image/upload/v1784419198/gallery/file_xgcmdv.jpg',
  'https://res.cloudinary.com/deckwmsth/image/upload/v1784419157/gallery/file_xzayrl.jpg',
  'https://res.cloudinary.com/deckwmsth/image/upload/v1784419034/gallery/file_irxms7.jpg',
  'https://res.cloudinary.com/deckwmsth/image/upload/v1784419001/gallery/file_k2fgpp.jpg',
  'https://res.cloudinary.com/deckwmsth/image/upload/v1784418922/gallery/file_zcbeph.jpg',
  'https://res.cloudinary.com/deckwmsth/image/upload/v1784422608/WhatsApp_Image_2026-07-18_at_22.43.11_5_yncbya.jpg',
  'https://res.cloudinary.com/deckwmsth/image/upload/v1784422633/WhatsApp_Image_2026-07-18_at_22.43.10_6_lzm21a.jpg',
]

const VIDEO_URLS = [
  'https://res.cloudinary.com/deckwmsth/video/upload/v1784422688/WhatsApp_Video_2026-07-18_at_22.43.10_epoxwd.mp4',
  'https://res.cloudinary.com/deckwmsth/video/upload/v1784422672/WhatsApp_Video_2026-07-18_at_22.43.10_1_lxq4lv.mp4',
  'https://res.cloudinary.com/deckwmsth/video/upload/v1784422665/WhatsApp_Video_2026-07-18_at_22.43.11_1_n9y5tu.mp4',
]

// ---------------------------------------------------------------------------
// Cloudinary URL transforms
// ---------------------------------------------------------------------------

function imageThumb(url: string): string {
  return url.replace(
    '/image/upload/',
    '/image/upload/w_600,h_600,c_fill,q_auto,f_auto/'
  )
}

function imageFull(url: string): string {
  return url.replace(
    '/image/upload/',
    '/image/upload/w_1600,c_limit,q_auto,f_auto/'
  )
}

/** 16:9 hero crop with content-aware gravity so faces / subjects stay
 *  in-frame regardless of the source aspect ratio. */
function imageHero(url: string): string {
  return url.replace(
    '/image/upload/',
    '/image/upload/w_1600,h_900,c_fill,g_auto,q_auto,f_auto/'
  )
}

function videoThumb(url: string): string {
  return url
    .replace(
      '/video/upload/',
      '/video/upload/w_600,h_600,c_fill,q_auto,f_auto,so_1/'
    )
    .replace(/\.mp4$/, '.jpg')
}

/** 16:9 poster frame extracted from a Cloudinary MP4 — same hero
 *  treatment as photos, so a featured video reads cinematically. */
function videoHero(url: string): string {
  return url
    .replace(
      '/video/upload/',
      '/video/upload/w_1600,h_900,c_fill,g_auto,q_auto,f_auto,so_1/'
    )
    .replace(/\.mp4$/, '.jpg')
}

type MediaItem = {
  kind: 'image' | 'video'
  /** Small square tile for the grid. */
  thumbnailUrl: string
  /** 16:9 crop for the hero (used when this item is featured). */
  heroUrl: string
  /** Full-size asset opened in the lightbox. */
  fullUrl: string
}

// Videos first so their play icons dominate visually — evangelism
// clips are the most narratively rich content on the day.
const MEDIA: MediaItem[] = [
  ...VIDEO_URLS.map(
    (url): MediaItem => ({
      kind: 'video',
      thumbnailUrl: videoThumb(url),
      heroUrl: videoHero(url),
      fullUrl: url,
    })
  ),
  ...IMAGE_URLS.map(
    (url): MediaItem => ({
      kind: 'image',
      thumbnailUrl: imageThumb(url),
      heroUrl: imageHero(url),
      fullUrl: imageFull(url),
    })
  ),
]

/**
 * Which item to pin as "Moment of the Day".
 *
 * Videos live at indices 0..2, photos at 3..10 (see MEDIA build-up
 * above). Change this constant when a different moment deserves the
 * top slot — e.g. `0` to feature the first video, `7` to feature a
 * particular photo.
 *
 * The featured item is removed from the grid so it doesn't appear
 * twice, but stays reachable in the lightbox via prev/next arrows.
 */
const FEATURED_INDEX = 3

const GRID_INDICES = MEDIA.map((_, i) => i).filter((i) => i !== FEATURED_INDEX)

// ---------------------------------------------------------------------------
// Reduced-motion hook
// ---------------------------------------------------------------------------

/**
 * Tracks `prefers-reduced-motion: reduce` at runtime so we can skip
 * setting up scroll-triggered animations for users who've asked the
 * OS to keep motion to a minimum. The CSS also has a media-query
 * fallback covering the case where JS hasn't hydrated yet.
 */
function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(mq.matches)
    const on = (e: MediaQueryListEvent) => setReduce(e.matches)
    // Older Safari uses addListener/removeListener; modern uses add/removeEventListener
    if (mq.addEventListener) {
      mq.addEventListener('change', on)
      return () => mq.removeEventListener('change', on)
    }
    mq.addListener(on)
    return () => mq.removeListener(on)
  }, [])
  return reduce
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LightUpGallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const prefersReduced = useReducedMotion()
  const gridRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Fade-in tiles on scroll via IntersectionObserver. If the user has
  // requested reduced motion, mark every tile visible on mount and
  // skip the observer entirely — nothing worse than content that
  // stays invisible because an animation was suppressed.
  useEffect(() => {
    const els = gridRefs.current.filter(
      (el): el is HTMLButtonElement => el !== null
    )
    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('lug-visible'))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('lug-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [prefersReduced])

  // Keyboard nav + body scroll lock while lightbox is open. Same
  // handler as before — Esc closes, arrows step through MEDIA.
  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft')
        setLightboxIndex((cur) =>
          cur === null || cur === 0 ? cur : cur - 1
        )
      if (e.key === 'ArrowRight')
        setLightboxIndex((cur) =>
          cur === null || cur === MEDIA.length - 1 ? cur : cur + 1
        )
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [lightboxIndex])

  const active = lightboxIndex !== null ? MEDIA[lightboxIndex] : null
  const hasPrev = lightboxIndex !== null && lightboxIndex > 0
  const hasNext = lightboxIndex !== null && lightboxIndex < MEDIA.length - 1
  const featured = MEDIA[FEATURED_INDEX]

  return (
    <>
      <style>{`
        /* ── Ken Burns on the hero photo ────────────────────────── */
        @keyframes lugKenBurns {
          0%   { transform: scale(1.04) translate(0, 0); }
          100% { transform: scale(1.14) translate(-2%, -1.4%); }
        }
        .lug-ken-burns {
          animation: lugKenBurns 22s ease-in-out infinite alternate;
          transform-origin: 50% 50%;
          will-change: transform;
        }

        /* ── Moment of the Day pin: gentle float ────────────────── */
        @keyframes lugPinFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        .lug-pin { animation: lugPinFloat 3.4s ease-in-out infinite; }

        /* ── Header entrance ────────────────────────────────────── */
        @keyframes lugHeaderFade {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lug-header { animation: lugHeaderFade 700ms ease-out both; }

        /* ── Hero entrance ──────────────────────────────────────── */
        @keyframes lugHeroIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lug-hero { animation: lugHeroIn 900ms cubic-bezier(0.16, 1, 0.3, 1) 80ms both; }

        /* ── Grid tiles: opacity 0 → 1 as they scroll into view ── */
        .lug-tile {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 700ms cubic-bezier(0.16, 1, 0.3, 1),
                      transform 700ms cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 300ms ease-out;
        }
        .lug-tile.lug-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Lightbox open ──────────────────────────────────────── */
        @keyframes lugLightboxIn {
          from { opacity: 0; backdrop-filter: blur(0); }
          to   { opacity: 1; backdrop-filter: blur(12px); }
        }
        @keyframes lugContentIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .lug-lightbox { animation: lugLightboxIn 260ms ease-out both; }
        .lug-content  { animation: lugContentIn 340ms cubic-bezier(0.16, 1, 0.3, 1) both; }

        /* ── Reduced motion: strip every ambient animation ──────── */
        @media (prefers-reduced-motion: reduce) {
          .lug-ken-burns,
          .lug-pin,
          .lug-header,
          .lug-hero,
          .lug-lightbox,
          .lug-content {
            animation: none !important;
          }
          .lug-ken-burns { transform: scale(1.04); }
          .lug-tile,
          .lug-tile.lug-visible {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        {/* ─── Header ─────────────────────────────────────────────── */}
        <div className="lug-header mb-8 text-center md:mb-10">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#c8342e] md:text-sm">
            Light Up Barnstaple · Yesterday
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#000666] md:text-4xl">
            The team took the fire to the streets
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600 md:text-base">
            Before the doors opened here, our team spent yesterday across
            Barnstaple sharing Jesus with the community. Tap the
            featured moment or any tile below to enlarge.
          </p>
        </div>

        {/* ─── Hero: Moment of the Day ────────────────────────────── */}
        <button
          type="button"
          onClick={() => setLightboxIndex(FEATURED_INDEX)}
          aria-label="Open the Moment of the Day"
          className="lug-hero group relative block w-full overflow-hidden rounded-2xl shadow-[0_24px_60px_-16px_rgba(0,6,102,0.4)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c8342e]"
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/10] md:aspect-[16/9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured.heroUrl}
              alt="Moment of the Day from Light Up Barnstaple"
              className="lug-ken-burns absolute inset-0 h-full w-full object-cover"
            />

            {/* Legibility gradient for the pin + play button */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)',
              }}
              aria-hidden="true"
            />

            {/* Centre play badge for video hero */}
            {featured.kind === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-2xl transition-transform duration-500 group-hover:scale-110 md:h-20 md:w-20">
                  <Play
                    className="ml-1 h-6 w-6 fill-[#000666] text-[#000666] md:h-8 md:w-8"
                    aria-hidden="true"
                  />
                </div>
              </div>
            )}

            {/* Moment of the Day pin — top-left */}
            <div className="lug-pin absolute left-3 top-3 md:left-5 md:top-5">
              <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur-sm md:gap-2 md:px-4 md:py-2">
                <Sparkles
                  className="h-3.5 w-3.5 fill-[#c8342e] text-[#c8342e] md:h-4 md:w-4"
                  aria-hidden="true"
                />
                <span className="text-[0.6rem] font-black uppercase tracking-[0.24em] text-[#000666] md:text-[0.7rem]">
                  Moment of the Day
                </span>
              </div>
            </div>

            {/* Bottom-left caption */}
            <div className="absolute bottom-3 left-3 right-3 md:bottom-5 md:left-5 md:right-5">
              <p className="text-[0.6rem] font-black uppercase tracking-[0.28em] text-[#a3f69c] md:text-xs">
                Yesterday · From the streets
              </p>
              <p className="mt-1 text-base font-extrabold leading-tight text-white md:mt-1.5 md:text-2xl">
                Sharing Jesus, one conversation at a time
              </p>
            </div>
          </div>
        </button>

        {/* ─── Grid of remaining moments ──────────────────────────── */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:mt-6 md:grid-cols-4 md:gap-3">
          {GRID_INDICES.map((originalIndex, gridIdx) => {
            const item = MEDIA[originalIndex]
            return (
              <button
                key={item.fullUrl + originalIndex}
                ref={(el) => {
                  gridRefs.current[gridIdx] = el
                }}
                type="button"
                onClick={() => setLightboxIndex(originalIndex)}
                // Stagger the fade-up so tiles ripple in row-by-row
                // instead of arriving all at once.
                style={{ transitionDelay: `${gridIdx * 55}ms` }}
                className="lug-tile group relative aspect-square overflow-hidden rounded-xl bg-gray-200 shadow-[0_4px_16px_-8px_rgba(0,6,102,0.3)] hover:shadow-[0_10px_30px_-8px_rgba(0,6,102,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8342e] focus-visible:ring-offset-2"
                aria-label={
                  item.kind === 'video'
                    ? 'Open video from Light Up Barnstaple'
                    : 'Open photo from Light Up Barnstaple'
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumbnailUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Play overlay for videos */}
                {item.kind === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors duration-200 group-hover:bg-black/15">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform duration-300 group-hover:scale-110 md:h-14 md:w-14">
                      <Play
                        className="ml-0.5 h-5 w-5 fill-[#000666] text-[#000666] md:h-6 md:w-6"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Lightbox ─────────────────────────────────────────────── */}
      {active && lightboxIndex !== null && (
        <div
          className="lug-lightbox fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 md:p-8"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Media viewer"
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close viewer"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/25 md:h-12 md:w-12"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Prev */}
          {hasPrev && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex((c) => (c === null ? c : c - 1))
              }}
              aria-label="Previous"
              className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/25 md:left-6"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Next */}
          {hasNext && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex((c) => (c === null ? c : c + 1))
              }}
              aria-label="Next"
              className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/25 md:right-6"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Media */}
          <div
            key={lightboxIndex}
            className="lug-content relative flex max-h-[92vh] w-full max-w-6xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {active.kind === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active.fullUrl}
                alt=""
                className="max-h-[92vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
            ) : (
              <video
                src={active.fullUrl}
                controls
                autoPlay
                playsInline
                className="max-h-[92vh] max-w-full rounded-xl bg-black shadow-2xl"
              />
            )}
          </div>

          {/* Counter */}
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md md:bottom-6">
            {lightboxIndex + 1} / {MEDIA.length}
          </div>
        </div>
      )}
    </>
  )
}
