import Image from 'next/image'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { NewsletterForm } from '@/components/church/newsletter-form'
import { TractGrid } from './tract-grid'
import { prisma } from '@/lib/prisma'
import type { Tract } from '@/lib/types/tract'

export default async function TractsPage() {
  // Fetch published tracts from database
  let tracts: Tract[] = []
  let error: string | null = null

  try {
    const rows: Tract[] = await prisma.tract.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' }
    }) as Tract[]
    tracts = rows
  } catch (err) {
    error = 'Failed to load tracts. Please try again later.'
  }

  console.table(tracts ? tracts : [])

  return (
    <>
      <TopNavBar />

      {/* Hero banner */}
      <section
        className="relative w-full pt-16 flex items-center"
        style={{ backgroundColor: 'rgba(0, 6, 102, 1)', minHeight: '540px' }}
      >
        {/* Background image */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/tracts.png"
            alt=""
            fill
            className="object-cover opacity-60"
            aria-hidden="true"
          />
          {/* Navy gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, rgba(0,6,102,0.85) 40%, rgba(0,6,102,0.3) 100%)',
            }}
            aria-hidden="true"
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[var(--container-max)] px-[var(--section-padding-x)]">
          {/* Eyebrow */}
          <p
            className="mb-4 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: 'var(--church-light-green)' }}
          >
            Gospel Resources
          </p>

          {/* Heading with left border */}
          <div
            className="border-l-4 pl-4 mb-4"
            style={{ borderColor: 'var(--church-light-green)' }}
          >
            <h1 className="text-6xl font-extrabold text-white md:text-7xl">Tracts</h1>
          </div>

          {/* Description */}
          <p className="max-w-md text-sm leading-relaxed text-white/70">
            Share the Gospel — freely download and distribute our gospel tracts. Resources built on faith, designed for reaching hearts.
          </p>
        </div>
      </section>

      {/* Tracts library */}
      <section
        className="w-full py-12 px-[var(--section-padding-x)]"
        style={{ backgroundColor: 'rgba(249, 249, 249, 1)' }}
      >
        <div className="mx-auto max-w-[var(--container-max)]">
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          ) : tracts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No tracts available at the moment. Check back soon!</p>
            </div>
          ) : (
            <TractGrid tracts={tracts} />
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
                Subscribe to receive new tracts, resources, and ministry updates straight to your inbox.
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
