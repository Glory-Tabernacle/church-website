import Image from 'next/image'
import { Clock, ExternalLink, Play } from 'lucide-react'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { NewsletterForm } from '@/components/church/newsletter-form'
import { prisma } from '@/lib/prisma'
import { SermonGrid, type PublicSermon } from './sermon-grid'

export const dynamic = 'force-dynamic'

type SermonRow = {
  id: string
  title: string
  series: string | null
  speaker: string
  date: Date
  duration: string
  description: string
  thumbnail: string
  videoUrl: string
}

function serializeSermon(sermon: SermonRow): PublicSermon {
  return {
    id: sermon.id,
    title: sermon.title,
    series: sermon.series,
    speaker: sermon.speaker,
    date: new Date(sermon.date).toISOString(),
    duration: sermon.duration,
    description: sermon.description,
    thumbnail: sermon.thumbnail,
    videoUrl: sermon.videoUrl,
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function FeaturedSermon({ sermon }: { sermon: PublicSermon }) {
  return (
    <section className="bg-white px-6 py-10 md:px-16">
      <div className="mx-auto max-w-[var(--container-max)]">
        <div className="grid overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:grid-cols-[3fr_2fr]">
          <div className="relative aspect-video md:min-h-[420px]">
            <Image
              src={sermon.thumbnail}
              alt={sermon.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 60vw"
              priority
              unoptimized
            />
            <div className="absolute inset-0 flex items-end bg-black/30 p-5">
              <a
                href={sermon.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
              >
                <Play className="h-4 w-4 fill-white" />
                Watch Latest Message
              </a>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white" style={{ backgroundColor: 'var(--church-green)' }}>
                Featured
              </span>
              {sermon.series && <span className="text-xs text-gray-500">Series: {sermon.series}</span>}
            </div>
            <h2 className="text-2xl font-extrabold leading-tight md:text-3xl" style={{ color: 'rgba(27,34,119,1)' }}>
              {sermon.title}
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">{sermon.description}</p>
            <div className="space-y-1 text-xs text-gray-500">
              <p className="font-semibold text-gray-700">{sermon.speaker}</p>
              <p className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {sermon.duration} · {formatDate(sermon.date)}
              </p>
            </div>
            <a
              href={sermon.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white"
              style={{ backgroundColor: 'rgba(27,34,119,1)' }}
            >
              Watch Sermon
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default async function SermonsPage() {
  let sermons: PublicSermon[] = []
  let loadError: string | null = null

  try {
    const rows: SermonRow[] = await prisma.sermon.findMany({
      where: { published: true },
      orderBy: { date: 'desc' },
    })
    sermons = rows.map(serializeSermon)
  } catch (error) {
    console.error('Error loading sermons:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    loadError = 'Sermons could not be loaded right now.'
  }

  const featured = sermons[0]
  const rest = sermons.slice(1)

  return (
    <>
      <TopNavBar />

      <section className="relative flex min-h-[42vh] w-full items-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1438032005730-c779502df39b?w=1920&auto=format&fit=crop&q=80"
          alt="Church interior"
          fill
          className="object-cover object-center"
          loading="eager"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[rgba(0,6,102,0.72)]" aria-hidden="true" />
        <div className="relative z-10 mx-auto w-full max-w-[var(--container-max)] px-6 py-16 md:px-16 md:py-20">
          <div className="max-w-xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              The Library
            </p>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              <span className="text-white">Words that</span>
              <br />
              <span style={{ color: 'var(--church-light-green)' }}>Resonate.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70 md:text-base">
              Explore sermons, teachings, and messages for your journey of faith.
            </p>
          </div>
        </div>
      </section>

      {loadError ? (
        <section className="bg-white px-6 py-16 md:px-16">
          <div className="mx-auto max-w-[var(--container-max)] rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {loadError}
          </div>
        </section>
      ) : featured ? (
        <FeaturedSermon sermon={featured} />
      ) : null}

      <section className="bg-white px-6 pb-12 md:px-16">
        <div className="mx-auto max-w-[var(--container-max)]">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold" style={{ color: 'rgba(27,34,119,1)' }}>
              Sermon Library
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Search by title or browse by series.
            </p>
          </div>
          <SermonGrid sermons={featured ? rest : sermons} />
        </div>
      </section>

      <section className="px-6 py-10 md:px-16" style={{ backgroundColor: 'rgba(248,250,252,1)' }}>
        <div className="mx-auto grid max-w-[var(--container-max)] grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-extrabold leading-tight md:text-3xl" style={{ color: 'rgba(27,34,119,1)' }}>
              Never Miss a Moment.
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-gray-500">
              Subscribe to receive church updates, resources, and messages.
            </p>
            <NewsletterForm />
          </div>
          <div className="relative aspect-[16/7] overflow-hidden rounded-xl">
            <Image
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80"
              alt="Community gathering"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
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
              { label: 'Media', href: '/sermons' },
              { label: 'Volunteer', href: '/volunteer' },
              { label: 'Connect', href: '/contact' },
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
        copyrightText={`© ${new Date().getFullYear()} RCCG Glory Tabernacle, Barnstaple. All rights reserved.`}
      />
    </>
  )
}
