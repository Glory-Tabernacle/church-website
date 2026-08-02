'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Edit2, Images } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import {
  ConfirmDeleteModal,
  useConfirmDelete,
} from '@/components/ui/confirm-delete-modal'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProgrammeGalleryPhotoRow {
  id: string
  imageUrl: string
  imageAlt: string
  order: number
}

export interface ProgrammeGalleryRow {
  id: string
  name: string
  published: boolean
  createdAt: string
  photos: ProgrammeGalleryPhotoRow[]
}

interface ProgrammeGalleryManagerProps {
  initialProgrammes: ProgrammeGalleryRow[]
}

// ---------------------------------------------------------------------------
// Main manager
// ---------------------------------------------------------------------------

export function ProgrammeGalleryManager({ initialProgrammes }: ProgrammeGalleryManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [programmes, setProgrammes] = useState<ProgrammeGalleryRow[]>(initialProgrammes)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const { isOpen: deleteIsOpen, pendingItem: deleteId, openDelete, closeDelete } = useConfirmDelete<string>()
  const [deleteItemName, setDeleteItemName] = useState<string | null>(null)

  async function refetch() {
    const res = await fetch('/api/programme-gallery', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      setProgrammes(data.programmes ?? [])
    }
  }

  async function handleTogglePublish(prog: ProgrammeGalleryRow) {
    setTogglingId(prog.id)
    const prev = prog.published
    setProgrammes((ps) => ps.map((p) => p.id === prog.id ? { ...p, published: !prev } : p))
    try {
      const res = await fetch(`/api/programme-gallery/${prog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !prev }),
      })
      if (!res.ok) throw new Error()
      toast({ title: !prev ? 'Programme published' : 'Programme unpublished', variant: 'success', duration: 3000 })
      await refetch()
      router.refresh()
    } catch {
      setProgrammes((ps) => ps.map((p) => p.id === prog.id ? { ...p, published: prev } : p))
      toast({ title: 'Could not update publish status', variant: 'error', duration: 4000 })
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/programme-gallery/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setProgrammes((ps) => ps.filter((p) => p.id !== id))
      toast({ title: 'Programme deleted', variant: 'success', duration: 3000 })
      router.refresh()
    } catch {
      toast({ title: 'Delete failed', variant: 'error', duration: 4000 })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgba(27,34,119,1)' }}>
            Programme Gallery
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a named programme, upload photos — the most-recently-published one
            shows on the homepage as a book-page-flip carousel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          New Programme
        </button>
      </div>

      {programmes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Images className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-base font-bold text-gray-500">No programmes yet</p>
          <p className="mt-1 text-sm text-gray-400">Create one to start uploading photos.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {programmes.map((prog) => (
            <ProgrammeCard
              key={prog.id}
              programme={prog}
              isToggling={togglingId === prog.id}
              onEdit={() => setEditingId(prog.id)}
              onDelete={() => { setDeleteItemName(prog.name); openDelete(prog.id) }}
              onToggle={() => handleTogglePublish(prog)}
              onPhotosChange={refetch}
            />
          ))}
        </div>
      )}

      <ConfirmDeleteModal
        open={deleteIsOpen}
        itemName={deleteItemName ?? undefined}
        onConfirm={async () => {
          if (deleteId) await handleDelete(deleteId)
          closeDelete()
          setDeleteItemName(null)
        }}
        onCancel={() => { closeDelete(); setDeleteItemName(null) }}
      />

      {creating && (
        <ProgrammeFormModal
          onClose={() => setCreating(false)}
          onSaved={async () => { setCreating(false); await refetch(); router.refresh() }}
        />
      )}

      {editingId && (
        <ProgrammeFormModal
          existing={programmes.find((p) => p.id === editingId)}
          onClose={() => setEditingId(null)}
          onSaved={async () => { setEditingId(null); await refetch(); router.refresh() }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Programme card
// ---------------------------------------------------------------------------

function ProgrammeCard({
  programme,
  isToggling,
  onEdit,
  onDelete,
  onToggle,
  onPhotosChange,
}: {
  programme: ProgrammeGalleryRow
  isToggling: boolean
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  onPhotosChange: () => void
}) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large (max 5 MB)', variant: 'error', duration: 4000 })
      return
    }
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'programme-gallery')
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { url } = await uploadRes.json()

      const addRes = await fetch(`/api/programme-gallery/${programme.id}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: url,
          imageAlt: file.name.replace(/\.[^.]+$/, ''),
          order: programme.photos.length,
        }),
      })
      if (!addRes.ok) throw new Error('Failed to save photo')
      toast({ title: 'Photo added', variant: 'success', duration: 2500 })
      onPhotosChange()
    } catch {
      toast({ title: 'Could not add photo', variant: 'error', duration: 4000 })
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  async function handleDeletePhoto(photoId: string) {
    setDeletingPhotoId(photoId)
    try {
      const res = await fetch(
        `/api/programme-gallery/${programme.id}/photos/${photoId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error()
      toast({ title: 'Photo removed', variant: 'success', duration: 2500 })
      onPhotosChange()
    } catch {
      toast({ title: 'Could not remove photo', variant: 'error', duration: 4000 })
    } finally {
      setDeletingPhotoId(null)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <Images className="h-5 w-5 text-blue-700" />
          <div>
            <h3 className="text-base font-bold text-gray-900">{programme.name}</h3>
            <p className="text-xs text-gray-400">
              {programme.photos.length} photo{programme.photos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Publish toggle */}
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-600">
            <input
              type="checkbox"
              checked={programme.published}
              disabled={isToggling}
              onChange={onToggle}
              className="h-4 w-4 rounded border-gray-300 text-blue-700"
            />
            {isToggling ? 'Saving…' : programme.published ? 'Published' : 'Draft'}
          </label>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Rename
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Photos grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {programme.photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={photo.imageUrl}
                alt={photo.imageAlt}
                fill
                className="object-cover"
                sizes="160px"
                unoptimized
              />
              <button
                type="button"
                onClick={() => handleDeletePhoto(photo.id)}
                disabled={deletingPhotoId === photo.id}
                aria-label="Remove photo"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Upload tile */}
          <label
            className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-blue-400 hover:bg-blue-50 ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            {isUploading ? (
              <svg className="h-6 w-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                <Plus className="h-6 w-6 text-gray-400" />
                <span className="mt-1 text-[0.6rem] font-semibold text-gray-400">Add photo</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create / rename modal
// ---------------------------------------------------------------------------

function ProgrammeFormModal({
  existing,
  onClose,
  onSaved,
}: {
  existing?: ProgrammeGalleryRow
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const { toast } = useToast()
  const [name, setName] = useState(existing?.name ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) { setError('Programme name is required'); return }
    setSubmitting(true)
    setError('')
    try {
      const url = existing ? `/api/programme-gallery/${existing.id}` : '/api/programme-gallery'
      const method = existing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to save')
      }
      toast({ title: existing ? 'Programme renamed' : 'Programme created', variant: 'success', duration: 3000 })
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {existing ? 'Rename Programme' : 'New Programme'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Programme name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Inaugural Service 2026"
              required
              maxLength={200}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : existing ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
