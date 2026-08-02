import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'

async function requireUser() {
  const token = await getSessionToken()
  if (!token) return null
  return getSessionUser(token)
}

/** POST /api/programme-gallery/[id]/photos — add a photo to a programme */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: programmeId } = await params
  try {
    const user = await requireUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { imageUrl, imageAlt, order = 0 } = body as {
      imageUrl: string
      imageAlt: string
      order?: number
    }

    if (!imageUrl?.trim()) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
    }

    const programme = await prisma.programmeGallery.findUnique({ where: { id: programmeId } })
    if (!programme) return NextResponse.json({ error: 'Programme not found' }, { status: 404 })

    const photo = await prisma.programmeGalleryPhoto.create({
      data: {
        programmeId,
        imageUrl: imageUrl.trim(),
        imageAlt: imageAlt?.trim() ?? '',
        order,
      },
    })
    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    console.error('Error adding photo to programme gallery:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
