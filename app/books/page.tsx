import Image from 'next/image'
import Link from 'next/link'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { NewsletterForm } from '@/components/church/newsletter-form'
import { BookLibrary } from './book-library'
import { prisma } from '@/lib/prisma'
import type { Book } from '@/lib/types/book'

export const dynamic = 'force-dynamic'

export default async function BooksPage() {
  // Fetch published books from database
  let books: Book[] = []
  let error: string | null = null

  try {
    const rows: Book[] = await prisma.book.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' }
    }) as Book[]
    books = rows
  } catch (err) {
    console.error('Error fetching books:', err)
    error = 'Failed to load books. Please try again later.'
  }
  return (
    <>
      <TopNavBar />

      {/* Hero banner */}
      <section
        className="relative w-full pt-16 flex items-center"
        style={{ backgroundColor: 'rgba(0, 6, 102, 1)', minHeight: '540px' }}
      >
        {/* Background image — transparent, no black overlay */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/books.png"
            alt=""
            fill
            className="object-cover opacity-20"
            aria-hidden="true"
          />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[var(--container-max)] px-[var(--section-padding-x)]">
          {/* Eyebrow */}
          <p
            className="mb-4 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: 'var(--church-light-green)' }}
          >
            Faith Foundation
          </p>

          {/* Heading */}
          <h1 className="text-6xl font-extrabold text-white md:text-7xl">Books</h1>

          {/* Description with left border accent */}
          <div
            className="mt-6 max-w-lg border-l-4 pl-4"
            style={{ borderColor: 'var(--church-light-green)' }}
          >
            <p className="text-base leading-relaxed text-white/80">
              Resources to deepen your faith and strengthen your walk with God.
            </p>
          </div>
        </div>
      </section>

      {/* Library section */}
      <section
        className="w-full py-12 px-[var(--section-padding-x)]"
        style={{ backgroundColor: 'rgba(249, 249, 249, 1)' }}
      >
        <div className="mx-auto max-w-[var(--container-max)]">
          {/* Header row */}
          <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                className="text-2xl font-extrabold"
                style={{ color: 'var(--church-green)' }}
              >
                The Library
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Browse our collection of spirit-filled resources for every season of life.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-gray-400">
              <button className="transition-colors hover:text-gray-700" type="button">Newest First</button>
              <span className="text-gray-200">|</span>
              <button className="transition-colors hover:text-gray-700" type="button">This Year</button>
            </div>
          </div>

          {/* Client component handles grid + load more */}
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No books available at the moment. Check back soon!</p>
            </div>
          ) : (
            <BookLibrary books={books} />
          )}
        </div>
      </section>

      {/* Newsletter banner */}
      <section
        className="w-full py-12 px-[var(--section-padding-x)]"
        style={{ backgroundColor: 'rgba(235, 241, 250, 1)' }}
      >
        <div className="mx-auto max-w-[var(--container-max)]">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h2
                className="text-2xl font-extrabold md:text-3xl"
                style={{ color: 'rgba(0, 6, 102, 1)' }}
              >
                Never Miss a Moment.
              </h2>
              <p className="text-sm leading-relaxed text-gray-500">
                Subscribe to our newsletter for updates on new books, digital resources, and upcoming events.
              </p>
              <NewsletterForm />
            </div>
            <div className="relative overflow-hidden rounded-2xl" style={{ height: '220px' }}>
              <Image
                src="/fellowship.png"
                alt="Church community"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer
        logo={{ src: '/logo.png', alt: 'RCCG Glory Tabernacle, Barnstaple' }}
        tagline="Furnish  ·  Transform  ·  Influence"
        columns={[
          {
            heading: 'Quick Links',
            links: [
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Sermons', href: '/sermons' },
              { label: 'Books', href: '/books' },
              { label: 'Give', href: '/giving' },
            ],
          },
        ]}
        socialLinks={[
          { platform: 'instagram', href: 'https://www.instagram.com/rccgglorytabernaclebarnstaple?igsh=MWtiZDR3bmVydXp5OA%3D%3D&utm_source=qr' },
          { platform: 'youtube', href: 'https://www.youtube.com/@glorytabernaclehq' },
          { platform: 'facebook', href: 'https://www.facebook.com/share/1BZ95ArbRf/?mibextid=wwXIfr' },
          { platform: 'x', href: 'https://x.com/rccggthq' },
          { platform: 'tiktok', href: 'https://www.tiktok.com/@rccgglorytabernaclebarns?_r=1&_t=ZN-965RffiNMP8X' },
        ]}
        contactInfo={{
          address: 'North Devon College, Old Sticklepath Hill Barnstaple EX31 2BQ England',
          phone: '+1 (555) 123-4567',
          email: 'info@rccgglory.org',
          directionsHref: 'https://maps.google.com',
        }}
        copyrightText={`© ${new Date().getFullYear()} RCCG Glory Tabernacle, Barnstaple. All rights reserved.`}
      />
    </>
  )
}
