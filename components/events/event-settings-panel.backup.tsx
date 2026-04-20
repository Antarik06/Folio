'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { updateEventSettings, deleteEvent } from '@/lib/actions/events'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Event } from '@/lib/types/database'

type EventSettingsRecord = Record<string, any>
type EventArtPhoto = {
  id: string
  blob_url: string | null
  thumbnail_url: string | null
  created_at: string | null
}

interface EventSettingsPanelProps {
  event: Event
  photos: EventArtPhoto[]
}

function coerceSettings(value: Event['settings']): EventSettingsRecord {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as EventSettingsRecord
  }
  return {}
}

function getPhotoUrl(photo: EventArtPhoto) {
  return photo.thumbnail_url || photo.blob_url || null
}

export function EventSettingsPanel({ event, photos }: EventSettingsPanelProps) {
  const settings = useMemo(() => coerceSettings(event.settings), [event.settings])
  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
  }, [photos])

  const latestPhoto = sortedPhotos[0] || null
  const matchedCoverPhoto = useMemo(() => {
    if (!event.cover_image_url) return null
    return sortedPhotos.find((photo) => getPhotoUrl(photo) === event.cover_image_url) || null
  }, [event.cover_image_url, sortedPhotos])

  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description || '')
  const [eventDate, setEventDate] = useState(event.event_date ? String(event.event_date).slice(0, 10) : '')
  const [location, setLocation] = useState(typeof settings.location === 'string' ? settings.location : '')
  const [status, setStatus] = useState(event.status || 'draft')
  const [selectedCoverPhotoId, setSelectedCoverPhotoId] = useState<string | null>(matchedCoverPhoto?.id || null)

  const [allowGuestUploads, setAllowGuestUploads] = useState(settings.allow_guest_uploads ?? true)
  const [autoApproveGuestUploads, setAutoApproveGuestUploads] = useState(settings.auto_approve_guest_uploads ?? false)
  const [requireGuestFaceEnrollment, setRequireGuestFaceEnrollment] = useState(settings.require_guest_face_enrollment ?? false)

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [savedNotice, setSavedNotice] = useState(false)

  const saveSettings = () => {
    const normalizedTitle = title.trim()
    if (!normalizedTitle) {
      setError('Event title is required.')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await updateEventSettings(event.id, {
        title: normalizedTitle,
        description: description.trim() || null,
        eventDate: eventDate || null,
        location: location.trim() || null,
        status,
        coverPhotoId: selectedCoverPhotoId,
        allowGuestUploads,
        autoApproveGuestUploads,
        requireGuestFaceEnrollment,
      })

      if (result?.error) {
        setError(result.error)
        return
      }

      setSavedNotice(true)
      setTimeout(() => setSavedNotice(false), 2400)
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-foreground">Event Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage event details and guest upload behavior.</p>
        </div>
        <Button onClick={saveSettings} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="p-5 border border-border rounded-md bg-card space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Basic Info</h3>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Event title</label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={600}
              placeholder="Tell guests what this event is about"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Event date</label>
              <Input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Location</label>
            <Input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Venue or city"
              maxLength={180}
            />
          </div>
        </section>

        <section className="p-5 border border-border rounded-md bg-card space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Guest Upload Rules</h3>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Allow guest uploads</p>
              <p className="text-xs text-muted-foreground mt-1">Guests can add photos to this event.</p>
            </div>
            <Switch checked={allowGuestUploads} onCheckedChange={setAllowGuestUploads} />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Auto approve guest uploads</p>
              <p className="text-xs text-muted-foreground mt-1">Guest photos skip manual approval and become visible immediately.</p>
            </div>
            <Switch
              checked={autoApproveGuestUploads}
              onCheckedChange={setAutoApproveGuestUploads}
              disabled={!allowGuestUploads}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Require face enrollment</p>
              <p className="text-xs text-muted-foreground mt-1">Shows a stricter requirement hint before guests upload.</p>
            </div>
            <Switch checked={requireGuestFaceEnrollment} onCheckedChange={setRequireGuestFaceEnrollment} />
          </div>

          <div className="rounded border border-border bg-background/60 p-3 text-xs text-muted-foreground">
            Changes apply immediately to new uploads and guest-facing upload messages.
          </div>
        </section>

        <section className="p-5 border border-border rounded-md bg-card space-y-4 lg:col-span-2">
          <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Event Art Photo</h3>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={selectedCoverPhotoId === null ? 'default' : 'outline'}
              onClick={() => setSelectedCoverPhotoId(null)}
              disabled={isPending}
            >
              Use most recent upload (default)
            </Button>
            <span className="text-xs text-muted-foreground">
              {selectedCoverPhotoId === null
                ? latestPhoto
                  ? 'Default uses latest uploaded event photo.'
                  : 'No photos uploaded yet.'
                : 'Custom event art selected.'}
            </span>
          </div>

          {sortedPhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {sortedPhotos.map((photo) => {
                const src = getPhotoUrl(photo)
                if (!src) return null
                const isSelected = selectedCoverPhotoId === photo.id

                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setSelectedCoverPhotoId(photo.id)}
                    className={`overflow-hidden rounded border transition-colors ${
                      isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                    }`}
                    aria-label="Set as event art"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="Event art option" className="h-24 w-full object-cover" />
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Upload event photos first to pick custom event art.</p>
          )}
        </section>
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {savedNotice && (
        <div className="rounded border border-secondary/40 bg-secondary/10 p-3 text-sm text-secondary">Settings saved.</div>
      )}
    </div>
  )
}
