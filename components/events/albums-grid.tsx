'use client'

import { useMemo, useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit3, Image as ImageIcon, PencilLine, Printer, Trash2 } from 'lucide-react'
import { deleteAlbum, renameAlbum, updateAlbumCoverPhoto } from '@/lib/actions/events'
import { inferAlbumProductType, productTypeLabel } from '@/lib/product-type'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

type Album = {
  id: string
  title: string
  subtitle: string | null
  status?: 'draft' | 'ready' | 'ordered'
  is_published?: boolean | null
  cover_photo_id: string | null
  layout_data?: Record<string, unknown> | null
  theme_config?: Record<string, unknown> | null
  updated_at: string
}

type Photo = {
  id: string
  blob_url: string | null
  thumbnail_url: string | null
}

interface AlbumsGridProps {
  albums: Album[]
  photos: Photo[]
}

function formatLastModified(updatedAt: string) {
  const date = new Date(updatedAt)
  if (Number.isNaN(date.getTime())) return 'Last modified recently'
  return `Last modified ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`
}

function getAlbumStatus(album: Album): 'draft' | 'ready' | 'ordered' {
  if (album.status === 'draft' || album.status === 'ready' || album.status === 'ordered') {
    return album.status
  }
  return album.is_published ? 'ready' : 'draft'
}

export function AlbumsGrid({ albums, photos }: AlbumsGridProps) {
  const router = useRouter()
  const [localAlbums, setLocalAlbums] = useState(albums)
  const [isPending, startTransition] = useTransition()
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Album | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [renameError, setRenameError] = useState<string | null>(null)
  const [albumArtOpen, setAlbumArtOpen] = useState(false)
  const [albumArtTarget, setAlbumArtTarget] = useState<Album | null>(null)
  const [selectedAlbumArtId, setSelectedAlbumArtId] = useState<string | null>(null)
  const [albumArtError, setAlbumArtError] = useState<string | null>(null)

  useEffect(() => {
    setLocalAlbums(albums)
  }, [albums])

  const photosById = useMemo(() => {
    return new Map(photos.map((photo) => [photo.id, photo]))
  }, [photos])

  const sortedAlbums = useMemo(() => {
    return [...localAlbums].sort((a, b) => {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [localAlbums])

  const setAlbumPatch = (albumId: string, patch: Partial<Album>) => {
    setLocalAlbums((prev) => prev.map((album) => (album.id === albumId ? { ...album, ...patch } : album)))
  }

  const openRenameDialog = (album: Album) => {
    setRenameTarget(album)
    setRenameTitle(album.title)
    setRenameError(null)
    setRenameOpen(true)
  }

  const handleRenameSubmit = () => {
    if (!renameTarget) return

    const nextTitle = renameTitle.trim()
    if (!nextTitle) {
      setRenameError('Album name cannot be empty.')
      return
    }

    if (nextTitle === renameTarget.title) {
      setRenameOpen(false)
      return
    }

    startTransition(async () => {
      const result = await renameAlbum(renameTarget.id, nextTitle)
      if (result?.error) {
        setRenameError(result.error)
        return
      }

      if (result?.album) {
        setAlbumPatch(renameTarget.id, {
          title: result.album.title,
          updated_at: result.album.updated_at,
        })
      }

      setRenameOpen(false)
      setRenameTarget(null)
      setRenameError(null)
    })
  }

  const handleSetAlbumArt = (album: Album, coverPhotoId: string | null) => {
    startTransition(async () => {
      const result = await updateAlbumCoverPhoto(album.id, coverPhotoId)
      if (result?.error) {
        window.alert(result.error)
        return
      }

      if (result?.album) {
        setAlbumPatch(album.id, {
          cover_photo_id: result.album.cover_photo_id,
          updated_at: result.album.updated_at,
        })
      }
    })
  }

  const openAlbumArtDialog = (album: Album) => {
    setAlbumArtTarget(album)
    setSelectedAlbumArtId(album.cover_photo_id ?? null)
    setAlbumArtError(null)
    setAlbumArtOpen(true)
  }

  const handleAlbumArtSave = () => {
    if (!albumArtTarget) return

    startTransition(async () => {
      const result = await updateAlbumCoverPhoto(albumArtTarget.id, selectedAlbumArtId)
      if (result?.error) {
        setAlbumArtError(result.error)
        return
      }

      if (result?.album) {
        setAlbumPatch(albumArtTarget.id, {
          cover_photo_id: result.album.cover_photo_id,
          updated_at: result.album.updated_at,
        })
      }

      setAlbumArtOpen(false)
      setAlbumArtTarget(null)
      setSelectedAlbumArtId(null)
      setAlbumArtError(null)
    })
  }

  const handleDelete = (album: Album) => {
    const ok = window.confirm(`Delete "${album.title}" permanently?`)
    if (!ok) return

    startTransition(async () => {
      const result = await deleteAlbum(album.id)
      if (result?.error) {
        window.alert(result.error)
        return
      }
      setLocalAlbums((prev) => prev.filter((item) => item.id !== album.id))
    })
  }

  if (sortedAlbums.length === 0) {
    return null
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedAlbums.map((album) => {
        const coverPhoto = album.cover_photo_id ? photosById.get(album.cover_photo_id) : null
        const coverUrl = coverPhoto?.thumbnail_url || coverPhoto?.blob_url || null

        const status = getAlbumStatus(album)
        const productType = inferAlbumProductType(album.layout_data ?? album.theme_config ?? {})
        const productLabel = productTypeLabel(productType)

        return (
          <article
            key={album.id}
            className="relative overflow-hidden rounded border border-border bg-card transition-colors hover:border-primary/50"
          >
            <Link href={`/editor/${album.id}`} className="block">
              <div className="h-40 w-full bg-muted/40 border-b border-border overflow-hidden">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverUrl}
                    alt={`${album.title} album art`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs uppercase tracking-wider text-muted-foreground">
                    No album art
                  </div>
                )}
              </div>

              <div className="p-6 pr-16">
                <h3 className="font-serif text-xl text-foreground mb-2">{album.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{album.subtitle || 'No subtitle'}</p>
                <p className="text-xs text-muted-foreground mb-4">{formatLastModified(album.updated_at)}</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs uppercase tracking-wider px-2 py-1 ${
                      status === 'ready'
                        ? 'bg-secondary/20 text-secondary'
                        : status === 'ordered'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-border text-muted-foreground'
                    }`}
                  >
                    {status}
                  </span>
                  <span className="text-xs uppercase tracking-wider px-2 py-1 bg-muted text-foreground">
                    {productLabel}
                  </span>
                </div>
              </div>
            </Link>

            {/* ORDER button — always visible on the card */}
            <div className="px-6 pb-5">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  router.push(`/dashboard/albums/${album.id}/order`)
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded border border-primary bg-primary text-primary-foreground text-sm font-medium uppercase tracking-widest hover:bg-primary/90 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Order
              </button>
            </div>

            <div className="absolute top-3 right-3 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    disabled={isPending}
                    className="h-8 w-8 rounded bg-background/90 border border-border flex items-center justify-center text-foreground hover:bg-background disabled:opacity-50"
                    title="Edit album"
                    aria-label="Edit album"
                  >
                    <PencilLine className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Album Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => router.push(`/editor/${album.id}`)}>
                    <Edit3 className="w-4 h-4" />
                    Edit album
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => openRenameDialog(album)}>
                    <PencilLine className="w-4 h-4" />
                    Rename album
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => openAlbumArtDialog(album)}>
                    <ImageIcon className="w-4 h-4" />
                    Change album art
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => router.push(`/dashboard/albums/${album.id}/order`)}>
                    <Printer className="w-4 h-4" />
                    Order print
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem variant="destructive" onClick={() => handleDelete(album)}>
                    <Trash2 className="w-4 h-4" />
                    Delete album
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </article>
        )
        })}
      </div>

      <Dialog
        open={renameOpen}
        onOpenChange={(open) => {
          setRenameOpen(open)
          if (!open) {
            setRenameTarget(null)
            setRenameError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename album</DialogTitle>
            <DialogDescription>Update the album name for this event.</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              handleRenameSubmit()
            }}
          >
            <Input
              value={renameTitle}
              onChange={(event) => {
                setRenameTitle(event.target.value)
                if (renameError) setRenameError(null)
              }}
              placeholder="Album name"
              autoFocus
              maxLength={120}
            />

            {renameError && <p className="text-sm text-destructive">{renameError}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={albumArtOpen}
        onOpenChange={(open) => {
          setAlbumArtOpen(open)
          if (!open) {
            setAlbumArtTarget(null)
            setSelectedAlbumArtId(null)
            setAlbumArtError(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Change album art</DialogTitle>
            <DialogDescription>
              Choose a cover image for {albumArtTarget?.title || 'this album'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={selectedAlbumArtId === null ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedAlbumArtId(null)
                  if (albumArtError) setAlbumArtError(null)
                }}
                disabled={isPending}
              >
                Remove album art
              </Button>
            </div>

            {photos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No event photos available.</p>
            ) : (
              <div className="max-h-[420px] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {photos.map((photo) => {
                    const thumb = photo.thumbnail_url || photo.blob_url || ''
                    const isSelected = selectedAlbumArtId === photo.id

                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => {
                          setSelectedAlbumArtId(photo.id)
                          if (albumArtError) setAlbumArtError(null)
                        }}
                        className={`relative overflow-hidden rounded border transition-colors ${
                          isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                        }`}
                        aria-label="Choose photo as album art"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb} alt="Album art option" className="h-24 w-full object-cover" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {albumArtError && <p className="text-sm text-destructive">{albumArtError}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAlbumArtOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleAlbumArtSave} disabled={isPending}>
                {isPending ? 'Saving...' : 'Save album art'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
