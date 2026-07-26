import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { TestimoniesPageClient } from '@/components/church/testimonies-page-client'

/**
 * Public testimonies page — reachable at /testimonies.
 *
 *   • Reads published testimonies straight from Prisma (the existing
 *     GET /api/testimonials endpoint is auth-gated for the dashboard).
 *   • Renders them as animated Spotify-style cards.
 *   • Includes an inline submission form that POSTs to
 *     /api/testimonials/public — new entries land unpublished for
 *     admin review before appearing on the site.
 *
 * ISR: revalidates every 5 minutes so newly-approved testimonies show
 * up without a full redeploy, but we're not hitting Prisma on every
 * request. Change to `dynamic = 'force-dynamic'` if we ever want
 * approvals to appear instantly.
 */

export const metadata: Metadata = {
  title: 'Testimonies — RCCG Glory Tabernacle, Barnstaple',
  description:
    'Real stories from members and visitors of Glory Tabernacle, Barnstaple. Read what God has done, and share your own testimony.',
  openGraph: {
    title: 'Testimonies — RCCG Glory Tabernacle, Barnstaple',
    description:
      'Real stories from members and visitors of Glory Tabernacle, Barnstaple.',
    type: 'website',
  },
}

export const revalidate = 300

export interface PublicTestimony {
  id: string
  quote: string
  name: string
  memberSince: number
}

/**
 * Fetch published testimonies for the public page. Falls back to an
 * empty array on DB error so the page renders (form still works)
 * rather than 500-ing.
 */
async function loadTestimonies(): Promise<PublicTestimony[]> {
  try {
    return await prisma.testimonial.findMany({
      where: { published: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        quote: true,
        name: true,
        memberSince: true,
      },
    })
  } catch (error) {
    console.error('Error loading public testimonies:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return []
  }
}

export default async function TestimoniesPage() {
  const testimonies = await loadTestimonies()
  return <TestimoniesPageClient testimonies={testimonies} />
}
