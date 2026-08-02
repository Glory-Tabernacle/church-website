import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'

async function requireUser() {
  const token = await getSessionToken()
  if (!token) return null
  return getSessionUser(token)
}

/** PUT /api/programme-gallery/[id] — update name or published status */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, published } = body as { name?: string; published?: boolean }

    const existing = await prisma.programmeGallery.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await prisma.programmeGallery.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(published !== undefined && { published }),
      },
      include: { photos: { orderBy: { order: 'asc' } } },
    })
    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('Error updating programme gallery:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** DELETE /api/programme-gallery/[id] — delete programme + all photos */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await prisma.programmeGallery.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.programmeGallery.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting programme gallery:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
