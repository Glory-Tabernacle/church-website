import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'

async function requireUser() {
  const token = await getSessionToken()
  if (!token) return null
  return getSessionUser(token)
}

/** DELETE /api/programme-gallery/[id]/photos/[photoId] */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { photoId } = await params
  try {
    const user = await requireUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await prisma.programmeGalleryPhoto.findUnique({ where: { id: photoId } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.programmeGalleryPhoto.delete({ where: { id: photoId } })
    return NextResponse.json({ message: 'Photo deleted' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting programme gallery photo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
