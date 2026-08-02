import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'

async function requireUser() {
  const token = await getSessionToken()
  if (!token) return null
  return getSessionUser(token)
}

/** GET /api/programme-gallery — list all programmes (admin, includes drafts) */
export async function GET() {
  try {
    const user = await requireUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const programmes = await prisma.programmeGallery.findMany({
      orderBy: { createdAt: 'desc' },
      include: { photos: { orderBy: { order: 'asc' } } },
    })
    return NextResponse.json({ programmes }, { status: 200 })
  } catch (error) {
    console.error('Error fetching programme galleries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/programme-gallery — create a new programme */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, published = false } = body as { name: string; published?: boolean }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Programme name is required' }, { status: 400 })
    }

    const programme = await prisma.programmeGallery.create({
      data: { name: name.trim(), published, createdBy: user.id },
      include: { photos: true },
    })

    return NextResponse.json(programme, { status: 201 })
  } catch (error) {
    console.error('Error creating programme gallery:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
