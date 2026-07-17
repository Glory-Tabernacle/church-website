import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { prisma } from '@/lib/prisma'
import {
  formatBadgeId,
  parseBadgeId,
  INAUGURAL_SERVICE_DATE,
  INAUGURAL_THEME,
  INAUGURAL_SERVICE_TIME,
  INAUGURAL_SERVICE_VENUE,
} from '@/lib/types/inaugural-registration'
import { CalendarDays, Clock3, MapPin, Car } from 'lucide-react'
import { InauguralProgramme } from '@/components/church/inaugural-programme'

const FORMATTED_SERVICE_DATE = INAUGURAL_SERVICE_DATE.toLocaleDateString(
  'en-GB',
  { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
)

// See app/inaugural-service/register/page.tsx for the Cloudinary transform
// rationale — same OG image is used across both pages so the link preview
// looks identical no matter which URL someone shares.
const OG_IMAGE_URL =
  'https://res.cloudinary.com/deckwmsth/image/upload/c_pad,b_rgb:000666,w_1200,h_630,q_auto,f_jpg/v1782403597/Inaugural_Service_Thumbnail_okeluk.png'

const PAGE_URL = 'https://www.glorytabernacle.co.uk/inaugural-service/programme'

export const metadata: Metadata = {
  title: 'Inaugural Service — Programme | RCCG Glory Tabernacle, Barnstaple',
  description: `Programme for the inaugural service — ${INAUGURAL_THEME.title} (${INAUGURAL_THEME.scripture}). ${FORMATTED_SERVICE_DATE} · ${INAUGURAL_SERVICE_TIME} · ${INAUGURAL_SERVICE_VENUE.name}, Barnstaple.`,
  openGraph: {
    title: `Inaugural Service — ${INAUGURAL_THEME.title}`,
    description: `${FORMATTED_SERVICE_DATE} · ${INAUGURAL_SERVICE_TIME} · ${INAUGURAL_SERVICE_VENUE.name}, Barnstaple.`,
    url: PAGE_URL,
    siteName: 'RCCG Glory Tabernacle, Barnstaple',
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: `Inaugural Service — ${INAUGURAL_THEME.title} (${INAUGURAL_THEME.scripture}), ${FORMATTED_SERVICE_DATE} at ${INAUGURAL_SERVICE_TIME}, ${INAUGURAL_SERVICE_VENUE.name}`,
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Inaugural Service — ${INAUGURAL_THEME.title}`,
    description: `${FORMATTED_SERVICE_DATE} · ${INAUGURAL_SERVICE_TIME} · ${INAUGURAL_SERVICE_VENUE.name}, Barnstaple.`,
    images: [OG_IMAGE_URL],
  },
}

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ id?: string }>
}

/**
 * Programme landing page hit when a badge's QR code is scanned. Today it's
 * a placeholder — verifies the registration ID exists, welcomes the
 * registrant by name, and tells them the schedule is coming soon. The real
 * schedule + booklet UI will replace the placeholder content below without
 * needing changes to the badge or the URL pattern.
 */
export default async function ProgrammePage({ searchParams }: PageProps) {
  const { id } = await searchParams
  const eventDate = INAUGURAL_SERVICE_DATE.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  let registrant:
    | { firstName: string; serialNumber: number; publicCode: string | null }
    | null = null
  let parsedId: string | null = null
  if (id) {
    const parsed = parseBadgeId(id)
    if (parsed) {
      try {
        // Prefer the new random publicCode column. Fall back to the legacy
        // serialNumber lookup so badges issued before randomisation still
        // resolve to the correct registrant.
        registrant = await prisma.inauguralRegistration.findUnique({
          where: { publicCode: parsed.code },
          select: { firstName: true, serialNumber: true, publicCode: true },
        })
        if (!registrant) {
          registrant = await prisma.inauguralRegistration.findUnique({
            where: { serialNumber: parsed.serial },
            select: { firstName: true, serialNumber: true, publicCode: true },
          })
        }
        if (registrant) parsedId = formatBadgeId(registrant)
      } catch (err) {
        console.error('Programme page: registrant lookup failed', err)
      }
    }
  }

  return (
    <>
      <TopNavBar />
      <main className="bg-[#f4f4f4]">
        <section className="bg-[#000666] pb-12 pt-20 md:pt-24">
          <div className="mx-auto w-full max-w-[var(--container-max)] px-[var(--section-padding-x)]">
            {/* Poster carries the title, theme, date, and venue by design,
                so we show it cleanly with NO overlay. The personalised
                welcome + registration ID live below the image, then the
                tappable info cards. */}
            <div className="overflow-hidden rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
              <Image
                src="https://res.cloudinary.com/deckwmsth/image/upload/v1782403597/Inaugural_Service_Thumbnail_okeluk.png"
                alt={`Inaugural Service — ${INAUGURAL_THEME.title} (${INAUGURAL_THEME.scripture}), ${eventDate} at ${INAUGURAL_SERVICE_TIME}, ${INAUGURAL_SERVICE_VENUE.name}`}
                width={1600}
                height={600}
                priority
                className="h-auto w-full"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </div>

            {/* Personalised welcome strip — only renders when we resolved a
                registrant from the QR's ?id= param. Otherwise we just skip
                straight to the info cards. */}
            {registrant && (
              <div className="mt-6 text-center text-white">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[rgba(163,246,156,1)]">
                  You&apos;re registered
                </p>
                <h1 className="mt-2 text-3xl font-extrabold leading-tight md:text-4xl">
                  Welcome, {registrant.firstName}
                </h1>
                {parsedId && (
                  <p className="mt-3 inline-block rounded-full border border-white/30 px-4 py-1.5 font-mono text-sm tracking-wider text-white/90">
                    {parsedId}
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[rgba(163,246,156,1)]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-white/60">Date</p>
                  <p className="font-bold leading-tight text-white">{eventDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[rgba(163,246,156,1)]" aria-hidden="true" />
                <div>
                  <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-white/60">Starts</p>
                  <p className="font-bold text-white">{INAUGURAL_SERVICE_TIME}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[rgba(163,246,156,1)]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-white/60">Venue</p>
                  <p className="font-bold leading-tight text-white">{INAUGURAL_SERVICE_VENUE.name}</p>
                  <p className="text-xs leading-tight text-white/70">{INAUGURAL_SERVICE_VENUE.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <Car className="mt-0.5 h-4 w-4 shrink-0 text-[rgba(163,246,156,1)]" aria-hidden="true" />
                <div>
                  <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-white/60">Parking</p>
                  <p className="text-xs leading-relaxed text-white/85">{INAUGURAL_SERVICE_VENUE.parkingNotes}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-[var(--section-padding-x)] py-16 md:py-20">
          <div className="mx-auto max-w-6xl">
            <InauguralProgramme
              registrantFirstName={registrant?.firstName ?? null}
            />

            <div className="mt-14 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#000666] underline-offset-4 hover:underline"
              >
                Back to homepage
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer
        logo={{ src: '/logo.png', alt: 'RCCG Glory Tabernacle, Barnstaple' }}
        tagline="Furnish  ·  Transform  ·  Influence"
        columns={[
          {
            heading: 'Quick Links',
            links: [
              { label: 'Home', href: '/' },
              { label: 'Events', href: '/events' },
              { label: 'Volunteer', href: '/volunteer' },
              { label: 'Contact', href: '/contact' },
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
          phone: '+447478137599',
          email: 'admin@glorytabernacle.co.uk',
          directionsHref: 'https://maps.google.com',
        }}
        copyrightText={`Copyright ${new Date().getFullYear()} RCCG Glory Tabernacle, Barnstaple. All rights reserved.`}
      />
    </>
  )
}
