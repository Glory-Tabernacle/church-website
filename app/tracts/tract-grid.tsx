'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Download, Share2, FileText, ExternalLink, X } from 'lucide-react'
import type { Tract } from '@/lib/types/tract'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// For display purposes, we'll map the database Tract to a display format
interface DisplayTract {
  id: string
  imageSrc: string
  imageAlt: string
  category: string
  title: string
  description: string
  documentUrl: string
}

/**
 * Maps a database Tract record to the DisplayTract format used by the UI
 */
function mapTractToDisplay(tract: Tract): DisplayTract {
  return {
    id: tract.id,
    imageSrc: tract.coverImage,
    imageAlt: tract.title,
    category: tract.category,
    title: tract.title,
    description: tract.description,
    documentUrl: tract.documentUrl,
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Tracts',
  Theology: 'Theology',
  Evangelism: 'Evangelism',
  Discipleship: 'Discipleship',
  'Prayer & Intercession': 'Prayer & Intercession',
  'Christian Living': 'Christian Living',
  Salvation: 'Salvation',
  'Faith & Doctrine': 'Faith & Doctrine',
  'End Times': 'End Times',
  Other: 'Other',
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/**
 * Convert a title like "The Power of Prayer" → "the-power-of-prayer". Used
 * for filenames + share fallbacks. Only ASCII letters/digits/hyphens.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'tract'
}

/**
 * Build a Cloudinary "force download" URL by injecting `fl_attachment:<slug>`
 * into the URL path. Cloudinary serves the file with a
 * `Content-Disposition: attachment; filename="<slug>.pdf"` header, which
 * makes the browser save it under a human-readable name instead of the
 * cryptic public ID.
 *
 * For NEW uploads (image/upload/...file.pdf) Cloudinary auto-appends the
 * `.pdf` extension. For legacy raw/upload/... URLs without an extension,
 * we include `.pdf` directly in the attachment value so the file still
 * lands on disk with the right extension.
 *
 * Falls back to the original URL if the input doesn't look like a
 * Cloudinary URL (so non-Cloudinary uploads still work, just with the
 * default filename).
 */
function buildDownloadUrl(documentUrl: string, title: string): string {
  const slug = slugify(title)
  // Match BOTH `/upload/` and `/raw/upload/` etc. — insert the flag right
  // after the `/upload/` segment so version/public-id stay intact.
  const match = documentUrl.match(/^(https:\/\/[^/]+\/[^/]+\/[^/]+\/upload\/)(.+)$/)
  if (!match) return documentUrl
  // If the original URL already ends in .pdf (image/upload) we let
  // Cloudinary append the extension. If not (legacy raw uploads) we add
  // .pdf to the attachment value ourselves so the downloaded file isn't
  // extensionless.
  const attachment = /\.pdf$/i.test(documentUrl) ? slug : `${slug}.pdf`
  return `${match[1]}fl_attachment:${attachment}/${match[2]}`
}

// ---------------------------------------------------------------------------
// Single tract card
// ---------------------------------------------------------------------------

function TractCard({ tract, index }: { tract: DisplayTract; index: number }) {
  const [visible, setVisible] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Staggered slide-in on mount via IntersectionObserver
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const downloadUrl = buildDownloadUrl(tract.documentUrl, tract.title)
  const slug = slugify(tract.title)

  async function handleShare() {
    // Share the tract's public page (the /tracts list) — visitors land
    // there and find this specific tract by title. We don't currently have
    // per-tract URLs, so this is the most useful surface to link.
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/tracts#${slug}`
        : `/tracts#${slug}`
    const shareData = {
      title: tract.title,
      text: tract.description,
      url: shareUrl,
    }
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await navigator.share(shareData)
        return
      }
    } catch {
      // user dismissed the native share sheet — silently fall through
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareFeedback('Link copied!')
    } catch {
      setShareFeedback('Copy this URL: ' + shareUrl)
    }
    setTimeout(() => setShareFeedback(null), 2500)
  }

  return (
    <>
      <div
        ref={ref}
        id={slug}
        className="flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-500"
        style={{
          boxShadow: '0px 4px 20px 0px rgba(0,0,0,0.07)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transitionDelay: `${index * 80}ms`,
          maxWidth: 'calc(100% - 16px)',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Image */}
        <div className="relative w-full overflow-hidden rounded-t-2xl" style={{ height: '180px' }}>
          {imageError ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 text-gray-400 mb-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              <span className="text-gray-400 text-xs">Image unavailable</span>
            </div>
          ) : (
            <Image
              src={tract.imageSrc}
              alt={tract.imageAlt}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={index < 4}
              onError={() => setImageError(true)}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3
            className="text-sm font-extrabold leading-snug"
            style={{ color: 'rgba(0, 6, 102, 1)' }}
          >
            {tract.title}
          </h3>
          <p className="flex-1 text-xs leading-relaxed text-gray-500 line-clamp-3">
            {tract.description}
          </p>

          {/* Primary actions: Read Tract + Share side by side */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setViewerOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--church-green)' }}
              aria-label={`Read ${tract.title}`}
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Read Tract
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border-2 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-gray-50"
              style={{
                color: 'var(--church-green)',
                borderColor: 'var(--church-green)',
              }}
              aria-label={`Share ${tract.title}`}
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              Share
            </button>
          </div>

          {/* Share feedback — appears for a couple seconds after fallback */}
          {shareFeedback && (
            <p className="text-[11px] text-green-700 text-center" role="status">
              {shareFeedback}
            </p>
          )}

          {/* Download PDF */}
          <a
            href={downloadUrl}
            download={`${slug}.pdf`}
            className="group/dl mt-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold transition-all duration-300"
            style={{ color: 'var(--church-green)' }}
          >
            <Download
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover/dl:translate-y-0.5"
            />
            <span className="underline underline-offset-2 transition-all duration-300 group-hover/dl:tracking-wide">
              Download PDF
            </span>
          </a>
        </div>
      </div>

      {viewerOpen && (
        <PdfViewerModal
          title={tract.title}
          documentUrl={tract.documentUrl}
          downloadUrl={downloadUrl}
          downloadName={`${slug}.pdf`}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// PDF viewer modal — enterprise-styled overlay with a built-in toolbar
// (open in new tab, download, close). The PDF itself renders in an iframe;
// every modern browser ships a PDF viewer that handles zoom + paging.
// ---------------------------------------------------------------------------

function PdfViewerModal({
  title,
  documentUrl,
  downloadUrl,
  downloadName,
  onClose,
}: {
  title: string
  documentUrl: string
  downloadUrl: string
  downloadName: string
  onClose: () => void
}) {
  // Close on Escape, lock body scroll while open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  // Mobile browsers (iOS Safari + Android Chrome especially) don't render
  // PDFs inside a bare <iframe> reliably — the iframe stays blank or shows
  // a "download" icon instead of the actual content. To keep the modal
  // usable on phones we route mobile users through Google's Docs Viewer:
  // it fetches the PDF server-side and serves back an HTML rendering of
  // each page, which every mobile browser can scroll through natively.
  //
  // Desktop keeps the direct-iframe path — it's faster and lets users
  // use the browser's built-in zoom + find controls.
  const [useMobileFallback, setUseMobileFallback] = useState(false)
  useEffect(() => {
    const isMobile =
      window.matchMedia('(max-width: 767px)').matches ||
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    setUseMobileFallback(isMobile)
  }, [])

  // #toolbar=0 hides Chrome's built-in PDF toolbar on desktop so our
  // chrome stays clean. Other desktop browsers ignore the fragment and
  // show their own toolbar — fine.
  const desktopSrc = `${documentUrl}#toolbar=0&navpanes=0&view=FitH`
  // gview embeds the PDF as scrollable HTML pages, which works on iOS
  // Safari + Android Chrome where iframe-src-PDF doesn't.
  const mobileSrc = `https://docs.google.com/gview?url=${encodeURIComponent(documentUrl)}&embedded=true`
  const iframeSrc = useMobileFallback ? mobileSrc : desktopSrc

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — PDF viewer`}
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[92vh] sm:max-w-5xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <header
          className="flex items-center justify-between gap-3 px-4 py-3 text-white sm:px-5"
          style={{ backgroundColor: 'rgba(0, 6, 102, 1)' }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
              aria-hidden="true"
            >
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                Tract
              </p>
              <h2 className="truncate text-sm font-bold sm:text-base">{title}</h2>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-lg border border-white/25 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10 sm:inline-flex"
              aria-label="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Open in new tab
            </a>
            <a
              href={downloadUrl}
              download={downloadName}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--church-green)' }}
              aria-label="Download PDF"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Download
            </a>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close PDF viewer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* PDF iframe */}
        <div className="flex-1 bg-gray-100">
          <iframe
            src={iframeSrc}
            title={`${title} — PDF`}
            className="block h-full w-full border-0"
            allow="fullscreen"
          />
        </div>

        {/* Mobile-only footer (the "Open in new tab" button is hidden on
            mobile in the header to save space; surface it here instead). */}
        <footer className="flex items-center justify-between gap-2 border-t border-gray-200 bg-white px-4 py-2.5 sm:hidden">
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Open in new tab
          </a>
          <p className="text-[11px] text-gray-500">Tap outside to close</p>
        </footer>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grid with filter tabs
// ---------------------------------------------------------------------------

interface TractGridProps {
  tracts: Tract[]
}

export function TractGrid({ tracts }: TractGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [sort, setSort] = useState<string>('newest')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Map database tracts to display format
  const displayTracts = tracts.map(mapTractToDisplay)

  // Apply category and search filters
  const filtered = displayTracts.filter((t) => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory
    const matchesSearch = searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Handle empty state
  if (displayTracts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No tracts available at the moment. Check back soon!</p>
      </div>
    )
  }

  return (
    <>
      {/* Search Bar */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Tracts
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4">
        {/* Category tabs */}
        <div className="flex items-center gap-6 overflow-x-auto">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveCategory(key)}
              className="shrink-0 pb-1 text-xs font-bold uppercase tracking-widest transition-colors duration-200"
              style={{
                color: activeCategory === key ? 'var(--church-green)' : 'rgba(150,150,150,1)',
                borderBottom: activeCategory === key ? '2px solid var(--church-green)' : '2px solid transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-medium">Sort by:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-600 focus:outline-none"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((tract, i) => (
          <TractCard key={tract.id} tract={tract} index={i} />
        ))}
      </div>
    </>
  )
}
