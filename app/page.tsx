export const dynamic = 'force-dynamic'

import { TopNavBar } from '@/components/church/nav-bar'
import { HeroSection } from '@/components/church/hero'
import { LiveStreamSection } from '@/components/church/live-stream-section'
import { InauguralServiceCta } from '@/components/church/inaugural-service-cta'
import {
  EventAnnouncementModal,
  type AnnouncementEvent,
} from '@/components/church/event-announcement-modal'
import { AboutSection } from '@/components/church/about-section'
import {
  MinistriesSection,
  type MinistryCard,
} from '@/components/church/ministries-section'
import {
  ImageGallerySection,
  type GalleryItem,
} from '@/components/church/image-gallery-section'
import { EventsSection } from '@/components/church/events-section'
import { SermonsSection } from '@/components/church/sermons-section'
import { ServiceDaysSection } from '@/components/church/service-days-section'
import { UpcomingEncountersSection } from '@/components/church/upcoming-encounters-section'
import { TestimonialsSection } from '@/components/church/testimonials-section'
import { MembershipSection } from '@/components/church/membership-section'
import { BooksSection } from '@/components/church/books-section'
import { GlobalConnectionSection } from '@/components/church/global-connection-section'
import { SupportSection } from '@/components/church/support-section'
import {
  ProgrammeGallerySection,
  type ProgrammeGalleryItem,
} from '@/components/church/programme-gallery-section'
import { YouthScripturesSection } from '@/components/church/youth-scriptures-section'
import { Footer } from '@/components/church/footer'
import { prisma } from '@/lib/prisma'
import type { ChurchEvent } from '@/components/church/event-card'
import type { Sermon } from '@/components/church/sermon-card'
import type { HeroSlide } from '@/components/church/hero'

const FALLBACK_HERO_SLIDES: HeroSlide[] = [
  {
    backgroundImage: '/Carousel%202.png',
    eyebrow: 'Welcome to RCCG Glory Tabernacle, Barnstaple',
    headline: 'A Place of',
    headlineAccent: 'Transformation',
    headlineLine2: 'Within and Without',
  },
  {
    backgroundImage: '/Carousel%203.png',
    eyebrow: 'Furnished unto every good work',
    headline: 'Building a',
    headlineAccent: 'Transformed',
    headlineLine2: 'People to Influence the World around them',
  },
  {
    backgroundImage: '/Carousel%204.png',
    eyebrow: "A people in pursuit of God's presence",
    headline: 'His purpose,',
    headlineAccent: 'And His glory',
    headlineLine2: 'To Influence All Nations',
  },
]

type HeroImageRow = {
  imageUrl: string
  imageAlt: string
}
type GalleryPhotoRow = {
  imageUrl: string
  imageAlt: string
  dateTaken: Date
  title: string
  description: string
}

type HomepageEventRow = {
  id: string
  title: string
  date: Date
  time: string | null
  location: string | null
  description: string
  imageSrc: string | null
  registrationHref: string | null
}
type HomepageBookRow = {
  id: string
  title: string
  author: string
  description: string
  coverImage: string
  purchaseUrl: string | null
}
type MinistryCardRow = {
  slug: string
  title: string
  tag: string | null
  imageSrc: string
  imageAlt: string
}
async function loadHeroSlides(): Promise<HeroSlide[]> {
  try {
    const images: HeroImageRow[] = await prisma.heroCarouselImage.findMany({
      where: { published: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    })

    if (images.length === 0) {
      return FALLBACK_HERO_SLIDES
    }

    return images.map((image, index) => ({
  ...FALLBACK_HERO_SLIDES[index % FALLBACK_HERO_SLIDES.length],
  backgroundImage: image.imageUrl,
  backgroundAlt: image.imageAlt,
}))
  } catch (err) {
    console.error('Error loading hero carousel images:', err)
    return FALLBACK_HERO_SLIDES
  }
}

/**
 * Format a Date as DD/MM/YYYY for the gallery card.
 */
function formatGalleryDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

/**
 * Server-fetch published gallery photos and map them to GalleryItem shape.
 * Failures are swallowed (logged) so a DB outage cannot break the homepage —
 * the gallery section will simply be hidden in that case.
 */
async function loadGalleryItems(): Promise<GalleryItem[]> {
  try {
    const photos: GalleryPhotoRow[] = await prisma.gallery.findMany({
      where: { published: true },
      orderBy: [{ dateTaken: 'desc' }, { createdAt: 'desc' }],
    })

    return photos.map((p) => ({
  imageSrc: p.imageUrl,
  imageAlt: p.imageAlt,
  date: formatGalleryDate(p.dateTaken),
  title: p.title,
  description: p.description,
}))
  } catch (err) {
    console.error('Error loading homepage gallery items:', err)
    return []
  }
}

/**
 * Format a Date as YYYY-MM-DD (the format event-card.tsx expects).
 */
function toIsoDateString(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Server-fetch the next 6 upcoming published events for the homepage strip.
 * Returns an empty array on error so the homepage cannot crash.
 */
async function loadHomepageEvents(): Promise<ChurchEvent[]> {
  try {
    const events: HomepageEventRow[] = await prisma.event.findMany({
      where: {
        published: true,
        date: { gte: new Date() },
      },
      orderBy: { date: 'asc' },
      take: 6,
    })

   return events.map((e) => ({
  id: e.id,
  title: e.title,
  date: toIsoDateString(e.date),
  time: e.time ?? 'TBA',
  location: e.location ?? 'TBA',
  description: e.description,
  image: e.imageSrc ?? undefined,
  registrationHref: e.registrationHref ?? undefined,
}))
  } catch (err) {
    console.error('Error loading homepage events:', err)
    return []
  }
}

/**
 * Combine an Event row's `date` (stored as UTC midnight of the event's
 * day) with its free-text `time` string ("1:00 PM", "13:00", etc.) into
 * one Date pointing at the exact moment the event actually starts, in
 * Europe/London time.
 *
 * Without this, the live-stream countdown counts down to UTC midnight of
 * the event's day — so a "1:00 PM tomorrow" event shows a countdown of
 * hours-until-midnight rather than hours-until-1pm, which the admin
 * team spotted as visibly wrong.
 *
 * Falls back to the raw date if the time string is missing or
 * unparseable, so time-less events still get a sensible countdown.
 */
function combineEventStart(date: Date, timeStr: string | null): Date {
  if (!timeStr) return date
  // Accept "13:00", "1:00 pm", "1 pm", "1:00PM", "9am", etc.
  const match = timeStr.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/)
  if (!match) return date
  let hours = Number(match[1])
  const minutes = Number(match[2] ?? 0)
  const ampm = match[3]
  if (ampm === 'pm' && hours < 12) hours += 12
  if (ampm === 'am' && hours === 12) hours = 0
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return date

  // Extract Y-M-D from the DB date using UTC parts — `date` was stored
  // as UTC midnight of the intended day, so `getUTCFullYear()` etc. give
  // us the correct wall-calendar day regardless of server timezone.
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()

  // We now have the London LOCAL wall time (year-month-day hours:minutes).
  // Convert to the correct UTC instant by asking Intl how the same UTC
  // candidate reads in London, then applying the offset delta. This
  // handles BST vs GMT automatically without hardcoded rules or a
  // timezone library dependency.
  const candidateUtcMs = Date.UTC(year, month, day, hours, minutes)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(candidateUtcMs))
  const p = (t: string): number => Number(parts.find((pt) => pt.type === t)?.value ?? 0)
  const londonWallMs = Date.UTC(p('year'), p('month') - 1, p('day'), p('hour'), p('minute'), p('second'))
  const offsetMs = londonWallMs - candidateUtcMs
  return new Date(candidateUtcMs - offsetMs)
}

/**
 * Minimal shape of an Event row used by both the announcement modal
 * and the live-stream section.
 */
interface NextUpcomingEvent {
  id: string
  title: string
  description: string
  date: Date
  time: string | null
  location: string | null
  imageSrc: string | null
  registrationHref: string | null
}

/**
 * Find the next upcoming published event (any future date).
 * Returns null when none exist or on DB error.
 *
 * Both the EventAnnouncementModal (which only renders if the event is within
 * 14 days) and the LiveStreamSection (which counts down to the next event)
 * derive from this single fetch.
 */
async function loadNextUpcomingEvent(): Promise<NextUpcomingEvent | null> {
  try {
    const event = await prisma.event.findFirst({
      where: {
        published: true,
        date: { gte: new Date() },
      },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        time: true,
        location: true,
        imageSrc: true,
        registrationHref: true,
      },
    })
    return event
  } catch (err) {
    console.error('Error loading next upcoming event:', err)
    return null
  }
}

/**
 * Server-fetch published testimonials for the homepage TestimonialsSection.
 * Returns an empty array on DB error so the homepage can't crash.
 */
async function loadHomepageTestimonials(): Promise<
  Array<{ quote: string; name: string; memberSince: number }>
> {
  try {
    const rows = await prisma.testimonial.findMany({
      where: { published: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      select: { quote: true, name: true, memberSince: true },
    })
    return rows
  } catch (err) {
    console.error('Error loading homepage testimonials:', err)
    return []
  }
}

/**
 * Shape consumed by the homepage BooksSection (matches the component's
 * existing props rather than the raw Prisma row).
 */
interface HomepageBookCard {
  imageSrc: string
  imageAlt: string
  title: string
  author: string
  description: string
  purchaseHref: string
}

/**
 * Server-fetch up to 3 published books that admins have flagged as
 * featured ("Books of the Month"). Returns:
 *   { featured, secondary }  where featured is the slot-1 book (or null
 *   if there are none) and secondary is the next two books.
 *
 * Falls back to empty/null on DB error so the homepage can't crash.
 */
async function loadHomepageBooks(): Promise<{
  featured: HomepageBookCard | null
  secondary: HomepageBookCard[]
}> {
  try {
    const rows: HomepageBookRow[]  = await prisma.book.findMany({
      where: { published: true, featured: true },
      orderBy: [{ featuredOrder: 'asc' }, { createdAt: 'desc' }],
      take: 3,
      select: {
        id: true,
        title: true,
        author: true,
        description: true,
        coverImage: true,
        purchaseUrl: true,
      },
    })

    const cards: HomepageBookCard[] = rows.map((b) => ({
      imageSrc: b.coverImage,
      imageAlt: `${b.title} book cover`,
      title: b.title,
      author: b.author,
      description: b.description,
      // Prefer the admin-set purchase URL, otherwise link to the public
      // /books page where the visitor can find it.
      purchaseHref: b.purchaseUrl ?? '/books',
    }))

    return {
      featured: cards[0] ?? null,
      secondary: cards.slice(1, 3),
    }
  } catch (err) {
    console.error('Error loading homepage featured books:', err)
    return { featured: null, secondary: [] }
  }
}

/**
 * Server-fetch published groups for the homepage MinistriesSection carousel.
 * Each card links to /groups/[slug]. Tag falls back to uppercased title when
 * the admin hasn't set an explicit tag.
 *
 * Returns an empty array on DB error so the homepage cannot crash.
 */
async function loadMinistryCards(): Promise<MinistryCard[]> {
  try {
    const rows: MinistryCardRow[]  = await prisma.group.findMany({
      where: { published: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      select: {
        slug: true,
        title: true,
        tag: true,
        imageSrc: true,
        imageAlt: true,
      },
    })

    return rows.map((g) => ({
      imageSrc: g.imageSrc,
      imageAlt: g.imageAlt,
      tag: g.tag ?? g.title.toUpperCase(),
      title: g.title,
      href: `/groups/${g.slug}`,
    }))
  } catch (err) {
    console.error('Error loading homepage ministry cards:', err)
    return []
  }
}

/**
 * Map a NextUpcomingEvent to AnnouncementEvent shape, but only if the
 * event is within the next 14 days. Returns null otherwise so the modal
 * stays hidden for events that are too far out.
 */
function toAnnouncementEvent(
  event: NextUpcomingEvent | null
): AnnouncementEvent | null {
  if (!event) return null
  const fourteenDaysFromNow = Date.now() + 14 * 24 * 60 * 60 * 1000
  if (event.date.getTime() > fourteenDaysFromNow) return null

  return {
    date: event.date.toISOString(),
    time: event.time ?? 'TBA',
    title: event.title,
    description: event.description,
    location: event.location ?? 'TBA',
    imageSrc: event.imageSrc ?? undefined,
    ctaLabel: event.registrationHref ? 'Register Now' : undefined,
    ctaHref: event.registrationHref ?? undefined,
    // Stable per-event storage key so dismissals don't carry across events.
    storageKey: `event-announcement-${event.id}`,
  }
}

/**
 * Server-fetch the most recent 3 published sermons for the homepage.
 * Maps DB rows to the SermonCard shape used by SermonsSection. Failures
 * fall back to an empty array so the homepage can't crash.
 *
 * The newest sermon is marked `featured: true` so its card visually
 * stands out — same as the previous hardcoded behaviour.
 */
async function loadHomepageSermons(): Promise<Sermon[]> {
  try {
    const rows = await prisma.sermon.findMany({
      where: { published: true },
      orderBy: { date: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        speaker: true,
        date: true,
        series: true,
        thumbnail: true,
        videoUrl: true,
        duration: true,
      },
    })

    return rows.map((s, i) => ({
      id: s.id,
      title: s.title,
      speaker: s.speaker,
      date: s.date.toISOString().slice(0, 10),
      series: s.series ?? undefined,
      thumbnailSrc: s.thumbnail,
      videoHref: s.videoUrl,
      duration: s.duration,
      featured: i === 0,
    }))
  } catch (err) {
    console.error('Error loading homepage sermons:', err)
    return []
  }
}

/**
 * Server-fetch published youth daily scriptures for the weekly card
 * plus a horizontal carousel of previous weeks.
 * Returns an empty array on DB error so the homepage can't crash.
 */
async function loadYouthScriptures(): Promise<Array<{ reference: string; text: string; videoUrl: string | null; date: string }>> {
  try {
    const rows = await prisma.dailyScripture.findMany({
      where: { published: true },
      orderBy: { date: 'desc' },
      take: 13,
    })
    return rows.map((s) => ({
      reference: s.reference,
      text: s.text,
      videoUrl: s.videoUrl,
      date: s.date.toISOString(),
    }))
  } catch (err) {
    console.error('Error loading youth scriptures:', err)
    return []
  }
}

/**
 * Fetch the most-recently-published programme gallery for the homepage
 * book-page-flip carousel. Returns null if none published or no photos yet.
 */
async function loadLatestProgrammeGallery(): Promise<ProgrammeGalleryItem | null> {
  try {
    const programme = await prisma.programmeGallery.findFirst({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      include: { photos: { orderBy: { order: 'asc' } } },
    })
    if (!programme || programme.photos.length === 0) return null
    return {
      id: programme.id,
      name: programme.name,
      photos: programme.photos.map((p) => ({
        id: p.id,
        imageUrl: p.imageUrl,
        imageAlt: p.imageAlt,
        order: p.order,
      })),
    }
  } catch (err) {
    console.error('Error loading programme gallery:', err)
    return null
  }
}

// Fallback / placeholder data kept for reference; only used if the DB
// fetch returns zero published sermons.
const SERMONS_FALLBACK: Sermon[] = [
  {
    id: 'serm-1',
    title: 'Finding Hope in Desert Seasons',
    speaker: 'Pastor John Adeyemi',
    date: '2025-07-20',
    series: 'The Wilderness',
    thumbnailSrc: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&auto=format&fit=crop',
    videoHref: '#',
    duration: '52 min',
    featured: true,
  },
  {
    id: 'serm-2',
    title: 'The Power of Stillness',
    speaker: 'Pastor David Reed',
    date: '2025-07-13',
    thumbnailSrc: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop',
    videoHref: '#',
    duration: '42 min',
  },
  {
    id: 'serm-3',
    title: 'Cultivating the Soul',
    speaker: 'Pastor Sarah Chen',
    date: '2025-07-06',
    thumbnailSrc: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop',
    videoHref: '#',
    duration: '38 min',
  },
]

export default async function Home() {
  const [
    heroSlides,
    galleryItems,
    homepageEvents,
    nextEvent,
    ministryCards,
    testimonials,
    homepageBooks,
    homepageSermons,
    youthScriptures,
    latestProgrammeGallery,
  ] = await Promise.all([
    loadHeroSlides(),
    loadGalleryItems(),
    loadHomepageEvents(),
    loadNextUpcomingEvent(),
    loadMinistryCards(),
    loadHomepageTestimonials(),
    loadHomepageBooks(),
    loadHomepageSermons(),
    loadYouthScriptures(),
    loadLatestProgrammeGallery(),
  ])
  const announcementEvent = toAnnouncementEvent(nextEvent)
  // If admins haven't added any sermons yet, fall back to the bundled
  // placeholders so the section never looks empty during onboarding.
  const sermonsToRender =
    homepageSermons.length > 0 ? homepageSermons : SERMONS_FALLBACK

  return (
    <>
      <TopNavBar />
      {announcementEvent && <EventAnnouncementModal event={announcementEvent} />}
      <HeroSection
        slides={heroSlides}
        primaryCta={{ label: 'Plan a Visit', href: '/about' }}
        secondaryCta={{ label: 'Watch Sermons', href: '/sermons' }}
      />
      {nextEvent && (
        <LiveStreamSection
          thumbnailSrc={nextEvent.imageSrc ?? '/livestream.png'}
          thumbnailAlt={`${nextEvent.title} thumbnail`}
          isLive={false}
          youtubeLiveHref="https://www.youtube.com/@RCCGGloryTabernacle/live"
          // Combine the DB date (UTC midnight) with the admin's free-text
          // time ("1:00 PM") in Europe/London so the countdown targets
          // the actual event start, not midnight of that day.
          nextServiceDate={combineEventStart(nextEvent.date, nextEvent.time).toISOString()}
          subtext={`${nextEvent.title} begins in:`}
          eventId={nextEvent.id}
        />
      )}
      {/* Inaugural service CTA — high-priority, sits right after the
          countdown so it gets a prominent slot above the About section. */}
      <InauguralServiceCta />
      <AboutSection
        eyebrow="Our Foundation"
        heading="A Tabernacle for His Glory"
        body="The Tabernacle: A Tabernacle is not merely a building"
        pillars={[
          {
            title: 'Furnish',
            description: 'We equip every believer with the Word, spiritual gifts, and tools for Kingdom living',
          },
          {
            title: 'Transform',
            description: 'Genuine renewal — in the individual, the family, the community.',
          },
          {
            title: 'Influence',
            description: 'Influencing every sphere of society with His Kingdom',
          },
        ]}
        yearsOfMinistry={74}
        image={{
          src: '/fellowship.png',
          alt: 'RCCG Glory Tabernacle, Barnstaple fellowship',
          width: 700,
          height: 600,
        }}
      />
      {latestProgrammeGallery && (
        <ProgrammeGallerySection programme={latestProgrammeGallery} />
      )}
      {ministryCards.length > 0 && <MinistriesSection ministries={ministryCards} />}
      {galleryItems.length > 0 && <ImageGallerySection items={galleryItems} />}
      {homepageEvents.length > 0 && (
        <EventsSection
          heading="Upcoming Events"
          events={homepageEvents}
          viewAllHref="/events"
        />
      )}
      <SermonsSection
        heading="Recent Sermons"
        sermons={sermonsToRender}
        viewAllHref="/sermons"
      />
      <ServiceDaysSection />
      <UpcomingEncountersSection />
      {testimonials.length > 0 && (
        <TestimonialsSection testimonials={testimonials} />
      )}
      <MembershipSection />
      {youthScriptures.length > 0 && (
        <YouthScripturesSection scriptures={youthScriptures} />
      )}
      {homepageBooks.featured && (
        <BooksSection
        featured={homepageBooks.featured}
        secondary={homepageBooks.secondary}
        />
      )}
      <GlobalConnectionSection />
      <SupportSection
        heading="Support the Mission"
        body="Your generosity fuels our community programs, global missions, and the upkeep of this sanctuary. Partner with us as we spread the message of hope."
        primaryCta={{ label: 'Give Online', href: '/giving' }}
      />
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
              { label: 'Connect', href: '/connect' },
            ],
          },
          {
            heading: 'Contact',
            links: [
              { label: 'Contact Us', href: '/contact' },
              { label: 'Small Groups', href: '/groups' },
              { label: 'Prayer Request', href: '/prayer' },
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
