'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Eye,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  ShoppingBag,
  X,
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'

/**
 * My Albums — the shelf.
 *
 * Everything the user has actually started lives here, above the catalogue of
 * things they could start. A card shows the album as it currently is: the
 * photographs already placed in the layout, drawn as a spine-and-pages block
 * rather than a rounded thumbnail, so the shelf reads as books.
 */

export interface AlbumSummary {
  id: string
  title: string
  description?: string | null
  status?: string | null
  is_published?: boolean
  event_id?: string | null
  event_title?: string | null
  cover_image_url?: string | null
  preview_images?: string[]
  spread_count?: number
  created_at?: string
  updated_at?: string
}

export function MyAlbums({ albums }: { albums: AlbumSummary[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState(albums)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<AlbumSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(
      (a) =>
        a.title?.toLowerCase().includes(needle) ||
        a.event_title?.toLowerCase().includes(needle)
    )
  }, [rows, query])

  async function handleRename(album: AlbumSummary, title: string) {
    const next = title.trim()
    if (!next || next === album.title) {
      setRenaming(null)
      return
    }

    setBusyId(album.id)
    setError(null)
    try {
      await apiClient.patch(`/api/albums/${album.id}/rename`, { title: next })
      setRows((prev) => prev.map((a) => (a.id === album.id ? { ...a, title: next } : a)))
      setRenaming(null)
      startTransition(() => router.refresh())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(album: AlbumSummary) {
    const confirmed = window.confirm(
      `Delete “${album.title}”? The photographs stay in your library, but this layout goes for good.`
    )
    if (!confirmed) return

    setBusyId(album.id)
    setError(null)
    try {
      await apiClient.delete(`/api/albums/${album.id}`)
      setRows((prev) => prev.filter((a) => a.id !== album.id))
      startTransition(() => router.refresh())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-border bg-card/60 px-6 py-14 text-center">
        <BookOpen className="mx-auto h-7 w-7 text-ink-soft/40" strokeWidth={1.25} />
        <p className="mt-5 font-serif text-2xl italic text-foreground">
          Nothing on the shelf yet
        </p>
        <p className="mx-auto mt-2.5 max-w-[42ch] text-[13px] leading-relaxed text-muted-foreground">
          Pick a shape below and the album you make appears here — with its
          spreads, its event, and a way straight back into the editor.
        </p>
        <a
          href="#templates"
          className="mt-7 inline-flex min-h-[44px] items-center rounded-[2px] bg-primary px-6 font-mono text-[11px] uppercase tracking-[0.1em] text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Pick a shape
        </a>
      </div>
    )
  }

  return (
    <div>
      {rows.length > 4 ? (
        <div className="mb-5 flex items-center gap-2 border-b border-border pb-3">
          <Search className="h-4 w-4 shrink-0 text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find an album"
            aria-label="Find an album"
            className="min-h-[36px] w-full bg-transparent font-mono text-[12px] uppercase tracking-[0.06em] text-foreground placeholder:text-ink-soft/60 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="shrink-0 text-ink-soft hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="mb-4 border border-primary px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
          {error}
        </p>
      ) : null}

      <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            busy={busyId === album.id}
            renaming={renaming?.id === album.id}
            onStartRename={() => setRenaming(album)}
            onCancelRename={() => setRenaming(null)}
            onRename={(title) => void handleRename(album, title)}
            onDelete={() => void handleDelete(album)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          No album matches “{query}”.
        </p>
      ) : null}
    </div>
  )
}

function AlbumCard({
  album,
  busy,
  renaming,
  onStartRename,
  onCancelRename,
  onRename,
  onDelete,
}: {
  album: AlbumSummary
  busy: boolean
  renaming: boolean
  onStartRename: () => void
  onCancelRename: () => void
  onRename: (title: string) => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const spreads = album.spread_count ?? 0
  const pages = spreads * 2

  return (
    <article className="group relative flex flex-col">
      {/* ── The book ─────────────────────────────────────────────────── */}
      <Link
        href={`/create/editor/${album.id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`Open ${album.title} in the editor`}
      >
        <div className="relative flex aspect-[4/3] overflow-hidden bg-surface-2 ring-1 ring-inset ring-border transition-all group-hover:ring-primary/60">
          {/* Spine */}
          <span
            aria-hidden="true"
            className="w-[10px] shrink-0 bg-foreground/85"
            style={{
              backgroundImage:
                'linear-gradient(90deg, rgba(255,255,255,0.16), rgba(0,0,0,0.25) 55%, rgba(255,255,255,0.08))',
            }}
          />
          <AlbumPreview album={album} />

          {album.is_published ? (
            <span className="absolute left-4 top-2.5 rounded-[2px] bg-secondary px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-secondary-foreground">
              Published
            </span>
          ) : null}
        </div>
      </Link>

      {/* ── The slip ─────────────────────────────────────────────────── */}
      <div className="mt-3.5 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <RenameField
              initial={album.title}
              busy={busy}
              onCancel={onCancelRename}
              onSubmit={onRename}
            />
          ) : (
            <Link
              href={`/create/editor/${album.id}`}
              className="block truncate font-serif text-xl italic leading-snug text-foreground underline-offset-4 hover:underline"
            >
              {album.title || 'Untitled album'}
            </Link>
          )}

          <div className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.1em] tabular-nums text-ink-soft">
            {spreads > 0 ? `${spreads} spread${spreads === 1 ? '' : 's'} · ${pages} pages` : 'Empty layout'}
            {album.event_title ? ` · ${album.event_title}` : ''}
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft/70">
            {formatEdited(album.updated_at || album.created_at)}
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Album options"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-[2px] text-ink-soft transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <MoreHorizontal className="h-[18px] w-[18px]" />
          </button>

          {menuOpen ? (
            <>
              <button
                type="button"
                aria-hidden="true"
                tabIndex={-1}
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-30 cursor-default"
              />
              <div className="absolute right-0 top-10 z-40 w-[190px] rounded-[3px] border border-border bg-popover p-1 shadow-lg">
                <MenuItem
                  icon={<Pencil className="h-3.5 w-3.5" />}
                  onClick={() => {
                    setMenuOpen(false)
                    onStartRename()
                  }}
                >
                  Rename
                </MenuItem>
                <MenuLink href={`/preview/${album.id}`} icon={<Eye className="h-3.5 w-3.5" />}>
                  Preview
                </MenuLink>
                <MenuLink
                  href={`/create/orders/checkout?albumId=${album.id}`}
                  icon={<ShoppingBag className="h-3.5 w-3.5" />}
                >
                  Order a print
                </MenuLink>
                <div className="my-1 border-t border-border" />
                <MenuItem
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  destructive
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete()
                  }}
                >
                  Delete
                </MenuItem>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Link
          href={`/create/editor/${album.id}`}
          className="inline-flex min-h-[38px] flex-1 items-center justify-center rounded-[2px] bg-primary px-4 font-mono text-[10px] uppercase tracking-[0.1em] text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Open editor
        </Link>
        <Link
          href={`/preview/${album.id}`}
          className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-[2px] border border-border px-4 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-foreground hover:text-foreground"
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </Link>
      </div>

      {busy ? (
        <span className="pointer-events-none absolute inset-0 bg-background/50" aria-hidden="true" />
      ) : null}
    </article>
  )
}

/**
 * The album drawn as itself: up to four photographs already placed in the
 * layout, laid out as a wide page followed by a stack. Falls back to the cover
 * photo, then to a ruled empty plate.
 */
function AlbumPreview({ album }: { album: AlbumSummary }) {
  const shots = (album.preview_images ?? []).filter(Boolean)
  const cover = album.cover_image_url

  if (shots.length === 0 && !cover) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-card">
        <span
          aria-hidden="true"
          className="h-10 w-8 border border-dashed border-ink-soft/35"
        />
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft/60">
          No pages laid out
        </span>
      </div>
    )
  }

  if (shots.length <= 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={shots[0] || cover || ''}
        alt=""
        loading="lazy"
        className="h-full w-full flex-1 object-cover"
      />
    )
  }

  const [lead, ...rest] = shots.slice(0, 4)

  return (
    <div className="flex flex-1 gap-px bg-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={lead} alt="" loading="lazy" className="h-full w-[62%] object-cover" />
      <div className="flex flex-1 flex-col gap-px">
        {rest.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={`${src}-${i}`} src={src} alt="" loading="lazy" className="min-h-0 flex-1 object-cover" />
        ))}
      </div>
    </div>
  )
}

function RenameField({
  initial,
  busy,
  onCancel,
  onSubmit,
}: {
  initial: string
  busy: boolean
  onCancel: () => void
  onSubmit: (title: string) => void
}) {
  const [value, setValue] = useState(initial)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(value)
      }}
      className="flex items-center gap-1.5"
    >
      <input
        autoFocus
        value={value}
        disabled={busy}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel()
        }}
        aria-label="Album title"
        className="min-h-[36px] w-full rounded-[2px] border border-primary bg-background px-2 font-serif text-lg italic text-foreground focus:outline-none"
      />
      <button
        type="submit"
        disabled={busy}
        className="shrink-0 rounded-[2px] bg-primary px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-primary-foreground disabled:opacity-50"
      >
        {busy ? '…' : 'Save'}
      </button>
    </form>
  )
}

function MenuItem({
  children,
  icon,
  onClick,
  destructive,
}: {
  children: React.ReactNode
  icon: React.ReactNode
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-[2px] px-2.5 py-2 text-left font-mono text-[10px] uppercase tracking-[0.08em] transition-colors hover:bg-foreground/5 ${
        destructive ? 'text-primary' : 'text-foreground'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

function MenuLink({
  children,
  icon,
  href,
}: {
  children: React.ReactNode
  icon: React.ReactNode
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-2.5 rounded-[2px] px-2.5 py-2 text-left font-mono text-[10px] uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-foreground/5"
    >
      {icon}
      {children}
    </Link>
  )
}

function formatEdited(value?: string | null): string {
  if (!value) return 'Never edited'
  const then = new Date(value)
  if (Number.isNaN(then.getTime())) return 'Never edited'

  const minutes = Math.round((Date.now() - then.getTime()) / 60000)
  if (minutes < 1) return 'Edited just now'
  if (minutes < 60) return `Edited ${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Edited ${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `Edited ${days}d ago`
  return `Edited ${then.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`
}
