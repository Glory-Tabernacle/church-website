import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  ProgrammeGalleryManager,
  type ProgrammeGalleryRow,
} from '@/components/dashboard/programme-gallery-manager'

export default async function ProgrammeGalleryDashboardPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  if (!sessionToken) redirect('/login')

  const raw = await prisma.programmeGallery.findMany({
    orderBy: { createdAt: 'desc' },
    include: { photos: { orderBy: { order: 'asc' } } },
  })

  const programmes: ProgrammeGalleryRow[] = raw.map((p) => ({
    id: p.id,
    name: p.name,
    published: p.published,
    createdAt: p.createdAt.toISOString(),
    photos: p.photos.map((ph) => ({
      id: ph.id,
      imageUrl: ph.imageUrl,
      imageAlt: ph.imageAlt,
      order: ph.order,
    })),
  }))

  return <ProgrammeGalleryManager initialProgrammes={programmes} />
}
