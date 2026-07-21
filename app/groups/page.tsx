import Image from 'next/image'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { GroupsClient } from './groups-client'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface Group {
  id: string
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  ctaLabel?: string
  ctaHref?: string
}

type GroupRow = {
  id: string
  slug: string
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  ctaLabel: string | null
  ctaHref: string | null
}

/**
 * Server-fetch published groups ordered by `order` ascending. Each card's CTA
 * defaults to the new departmental-board detail page at /groups/{slug} unless
 * the admin explicitly set ctaLabel + ctaHref in the dashboard.
 *
 * Falls back to an empty array on DB error so the rest of the page (hero,
 * highlights, footer) still renders.
 */
async function loadPublishedGroups(): Promise<Group[]> {
  try {
   
   const rows: GroupRow[] = await prisma.group.findMany({
  where: { published: true },
  orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  select: {
    id: true,
    slug: true,
    title: true,
    description: true,
    imageSrc: true,
    imageAlt: true,
    ctaLabel: true,
    ctaHref: true,
  },
})

    return rows.map((g) => ({
  id: g.id,
  title: g.title,
  description: g.description,
  imageSrc: g.imageSrc,
  imageAlt: g.imageAlt,
  ctaLabel: g.ctaLabel ?? 'Get Involved',
  ctaHref: `/groups/${g.slug}`,
}))
  } catch (err) {
    console.error('Error loading public groups list:', err)
    return []
  }
}

interface HighlightCard {
  id: string
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  ctaLabel: string
  ctaHref: string
}

const GROUPS: Group[] = [
  {
    id: 'men',
    title: "King's Club(Men's)",
    description: "FURNISH: Furnishing men with the Word, identity and tools to become true priests of their homes and communities",
    imageSrc: '/king.png',
    imageAlt: "Men's Ministry gathering",
    ctaLabel: 'Get Involved',
    ctaHref: '#men',
  },
  {
    id: 'women',
    title: "Queen's Club (Women)",
    description: "FURNISH: Furnishing women with their royal identity, spiritual depth and Kingdom purpose from the inside out",
    imageSrc: '/queen.png',
    imageAlt: "Women's Ministry fellowship",
    ctaLabel: 'Get Involved',
    ctaHref: '#women',
  },
  {
    id: 'house-fellowship',
    title: 'House Fellowships',
    description: "FURNISH: Equipping members to open their homes — furnishing their neighbourhoods with the presence of God",
    imageSrc: '/House Fellowship.png',
    imageAlt: 'House Fellowship gathering',
    ctaLabel: 'Get Involved',
    ctaHref: '#house-fellowship',
  },
  {
    id: 'care',
    title: 'Follow-Up Team',
    description: "Top-notch, empathetic team. Welcomes new converts & newcomers immediately. Walks with them until fruits abide.",
    imageSrc: '/Care.png',
    imageAlt: 'Care Ministry',
    ctaLabel: 'Get Involved',
    ctaHref: '#care',
  },
  {
    id: 'media',
    title: 'Media & ICT',
    description: "FURNISH: Furnishing the church and the world with high-quality media tools that amplify the Gospel",
    imageSrc: '/Media.png',
    imageAlt: 'Media Ministry',
    ctaLabel: 'Get Involved',
    ctaHref: '#media',
  },
  {
    id: 'ushering',
    title: 'Ushering & Protocol',
    description: "FURNISH: Equipping every usher to serve with dignity, excellence and a deep understanding of Kingdom honour",
    imageSrc: '/Ushering.png',
    imageAlt: 'Ushering Ministry',
    ctaLabel: 'Get Involved',
    ctaHref: '#ushering',
  },
  {
    id: 'transport',
    title: 'Transport',
    description: "FURNISH: Removing every physical barrier — equipping members to gather, worship and serve without hindrance",
    imageSrc: '/Transport.png',
    imageAlt: 'Transport Ministry',
    ctaLabel: 'Get Involved',
    ctaHref: '#transport',
  },
  {
    id: 'finance',
    title: 'Finance & Stewardship',
    description: "FURNISH: Equipping members to understand and practise Biblical financial stewardship, giving and Kingdom economics",
    imageSrc: '/Finance.png',
    imageAlt: 'Finance Ministry',
    ctaLabel: 'Get Involved',
    ctaHref: '#finance',
  },
  {
    id: 'medical',
    title: 'Healing Stream(Medical)',
    description: "FURNISH: Furnishing members with health knowledge — spirit, soul AND body — equipping the whole person",
    imageSrc: '/Medical.png',
    imageAlt: 'Medical Ministry',
    ctaLabel: 'Get Involved',
    ctaHref: '#medical',
  },
  {
    id: 'information',
    title: 'Information Hub',
    description: "FURNISH: Furnishing every member with information that liberates — destroying ignorance with knowledge and opportunity",
    imageSrc: '/Information.png',
    imageAlt: 'Information Ministry',
    ctaLabel: 'Get Involved',
    ctaHref: '#information',
  },
  {
    id: 'teaching',
    title: 'Teaching Ministry',
    description: "Furnishes the new believer with the whole counsel of God. Deep Bible study, discipleship & training. Fired up for God.",
    imageSrc: '/Teaching.png',
    imageAlt: 'Teaching Ministry',
    ctaLabel: 'Get Involved',
    ctaHref: '#teaching',
  },
  {
    id: 'sanctuary',
    title: 'Sanctuary & Facilities',
    description: "FURNISH: Building and maintaining a sanctuary according to God's specification — a house built for His glory",
    imageSrc: '/Sanctuary.png',
    imageAlt: 'Sanctuary Ministry',
    ctaLabel: 'Get Involved',
    ctaHref: '#sanctuary',
  },
  {
    id: 'welfare',
    title: 'Welfare Department',
    description: "FURNISH: Furnishing every person who enters Glory Tabernacle with practical love, care and dignity",
    imageSrc: '/Connection.png',
    imageAlt: 'Connection Ministry',
    ctaLabel: 'Get Involved',
    ctaHref: '#connection',
  },
]

const HIGHLIGHT_CARDS: HighlightCard[] = [
  {
    id: 'worship-team',
    title: 'Tabernacle Worship Team',
    description: 'FURNISH: Equipping every choir member as a true worshipper — trained, anointed and spiritually rooted',
    imageSrc: '/Worship.png',
    imageAlt: 'Worship Team',
    ctaLabel: 'Get Involved',
    ctaHref: '#worship-team',
  },
   {
    id: 'prayer',
    title: 'Prayer & Intercession',
    description: "Ministers Holy Ghost baptism. Prays with and over new believers. Fills them with fire and Kingdom authority.",
    imageSrc: '/Prayer.png',
    imageAlt: 'Prayer Ministry session',
    ctaLabel: 'Get Involved',
    ctaHref: '#prayer',
  },
   {
    id: 'youth',
    title: 'Children & Youth',
    description: "FURNISH: Training children and youth in God's Word — furnishing the next generation from their earliest years",
    imageSrc: '/Youth.png',
    imageAlt: 'Youth Ministry activities',
    ctaLabel: 'Get Involved',
    ctaHref: '#youth',
  },
  {
    id: 'outreach',
    title: 'Evangelism & Outreach',
    description: "Every member is an evangelist. Aggressive, Spirit-led witnessing. Souls are won from streets, marketplace & community.",
    imageSrc: '/Outreach.png',
    imageAlt: 'Outreach Ministry',
    ctaLabel: 'Get Involved',
    ctaHref: '#outreach',
  }
]

export default async function GroupsPage() {
  const liveGroups = await loadPublishedGroups()
  // Fall back to the hardcoded GROUPS array if no published groups exist yet,
  // so the page still has content while admins are populating the database.
  const groupsToRender = liveGroups.length > 0 ? liveGroups : GROUPS

  return (
    <>
      <TopNavBar />

      <main className="bg-gradient-to-b from-white via-gray-50/30 to-white">
        {/* Hero Section */}
        <section
          aria-label="Hero"
          className="relative w-full pt-16 flex items-center overflow-hidden"
          style={{ backgroundColor: '#1A237E', minHeight: '500px' }}
        >
          {/* Background image with overlay */}
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src="/imagegallery1.png"
              alt=""
              fill
              className="object-cover scale-105"
              aria-hidden="true"
              priority
            />
            {/* Blue overlay with gradient */}
            <div
              className="absolute inset-0"
              style={{ 
                background: 'linear-gradient(135deg, rgba(26, 35, 126, 0.95) 0%, rgba(26, 35, 126, 0.85) 50%, rgba(26, 35, 126, 0.75) 100%)'
              }}
              aria-hidden="true"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 px-6 md:px-12 lg:px-20 py-24 md:py-28 max-w-7xl mx-auto w-full">
            {/* Main heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Where You Fit
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl">
              Explore our unique departments. Every member is a Transformed minister with Furnished with unique gift and you have a place to shine at Glory Tabernacle.
            </p>
          </div>
        </section>

        {/* Groups Content Section */}
        <section
          aria-label="Ministry Groups"
          className="w-full py-20 md:py-24 px-6 relative"
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }} />
          </div>

          <div className="mx-auto w-full max-w-7xl relative z-10">
            {/* Section heading for accessibility */}
            <h2 className="sr-only">Our Ministry Groups</h2>

            <GroupsClient groups={groupsToRender} highlightCards={HIGHLIGHT_CARDS} />
          </div>
        </section>
      </main>

      <Footer
        logo={{ src: '/logo.png', alt: 'RCCG Glory Tabernacle, Barnstaple' }}
        tagline="Furnish · Transform · Influence"
        columns={[
          {
            heading: 'Quick Links',
            links: [
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Sermons', href: '/sermons' },
              { label: 'Church Groups', href: '/groups' },
              { label: 'Books', href: '/books' },
              { label: 'Give', href: '/giving' },
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
          directionsHref: 'https://maps.google.com/?q=North+Devon+College+Old+Sticklepath+Hill+Barnstaple+EX31+2BQ+England',
        }}
        copyrightText={`© ${new Date().getFullYear()} RCCG Glory Tabernacle, Barnstaple. All rights reserved.`}
      />
    </>
  )
}

