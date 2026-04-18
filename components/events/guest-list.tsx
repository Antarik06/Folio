'use client'

import { useState, useTransition } from 'react'
import { removeGuest } from '@/lib/actions/events'

interface GuestWithEnrollment {
  id: string
  user_id?: string | null
  name?: string | null
  email?: string
  role?: string
  face_enrolled?: boolean
  face_reference_url?: string | null
  joined_at?: string
}

interface GuestListProps {
  guests: GuestWithEnrollment[]
  eventId: string
  inviteCode: string | null
  isHost: boolean
}

export function GuestList({ guests, eventId, inviteCode, isHost }: GuestListProps) {
  const [codeCopied, setCodeCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  const siteUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const inviteLink = inviteCode ? `${siteUrl}/join/${inviteCode}` : ''

  function copyCode() {
    if (!inviteCode) return
    navigator.clipboard.writeText(inviteCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  function copyLink() {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  function handleRemove(guestId: string) {
    setActionError(null)
    startTransition(async () => {
      const result = await removeGuest(guestId, eventId)
      if (result?.error) {
        setActionError(result.error)
      } else {
        setRemovedIds((prev) => new Set([...prev, guestId]))
      }
      setConfirmRemoveId(null)
    })
  }

  const visibleGuests = guests.filter((g) => !removedIds.has(g.id))
  const enrolledCount = visibleGuests.filter((g) => g.face_enrolled).length
  const pendingCount = visibleGuests.length - enrolledCount

  return (
    <div className="space-y-8">

      {/* ── SHARE SECTION ────────────────────────────────────────── */}
      {isHost && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Link Share */}
          <div className="lg:col-span-3 border border-border bg-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl text-foreground">Invite via Link</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-8 max-w-md leading-relaxed">
                Send this link to your guests. They can join the event instantly, enroll their face, and start exploring photos.
              </p>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">
                Shareable Link
              </label>
              <div className="flex group relative">
                <div className="flex-1 px-4 py-3.5 bg-surface border border-border border-r-0 font-mono text-sm text-foreground truncate min-w-0 transition-colors group-hover:border-primary/30">
                  {inviteCode ? inviteLink : 'Generating link...'}
                </div>
                <button
                  onClick={copyLink}
                  disabled={!inviteCode}
                  className="flex-shrink-0 px-6 py-3.5 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {linkCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Code Share (VIP Ticket Style) */}
          <div className="lg:col-span-2 relative bg-primary text-primary-foreground p-8 flex flex-col justify-between overflow-hidden">
            {/* Ticket Cutouts & Perforation */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-8 h-8 rounded-full bg-background" />
            <div className="absolute top-1/2 -translate-y-1/2 -right-4 w-8 h-8 rounded-full bg-background" />
            <div className="absolute left-6 right-6 top-1/2 border-t border-dashed border-primary-foreground/20" />

            {/* Top half */}
            <div className="relative z-10 text-center pb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/60 mb-2">Event Access</p>
              <h3 className="font-serif text-2xl">VIP Pass</h3>
            </div>

            {/* Bottom half */}
            <div className="relative z-10 text-center pt-8">
              <div className="mb-6">
                {inviteCode ? (
                  <span className="font-mono text-4xl tracking-[0.3em] font-medium ml-[0.3em]">
                    {inviteCode}
                  </span>
                ) : (
                  <span className="text-sm text-primary-foreground/50 animate-pulse">Generating...</span>
                )}
              </div>

              <button
                onClick={copyCode}
                disabled={!inviteCode}
                className="w-full py-3.5 bg-primary-foreground text-primary text-xs font-bold hover:bg-primary-foreground/90 transition-colors uppercase tracking-[0.15em]"
              >
                {codeCopied ? 'Copied to Clipboard' : 'Copy Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GUEST ACCESS TABLE ──────────────────────────────────── */}
      <div>
        {/* Section header + stats */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm uppercase tracking-wider text-muted-foreground">
            Photo Access
          </h3>
          {visibleGuests.length > 0 && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                {enrolledCount} can see their photos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-border" />
                {pendingCount} pending
              </span>
            </div>
          )}
        </div>

        {actionError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {actionError}
          </div>
        )}

        {visibleGuests.length > 0 ? (
          <div className="border border-border divide-y divide-border">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-2.5 bg-surface">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Guest</span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground text-center">Photo Access</span>
              {isHost && <span className="text-xs uppercase tracking-wider text-muted-foreground text-right">Actions</span>}
            </div>

            {visibleGuests.map((guest) => {
              const initials = (guest.name || guest.email || 'G')[0].toUpperCase()
              const enrolled = guest.face_enrolled ?? false
              const isConfirming = confirmRemoveId === guest.id

              return (
                <div
                  key={guest.id}
                  className={`grid gap-4 items-center px-5 py-4 bg-card transition-colors ${
                    isHost ? 'grid-cols-[1fr_auto_auto]' : 'grid-cols-[1fr_auto]'
                  } ${isConfirming ? 'bg-red-500/5' : 'hover:bg-surface'}`}
                >
                  {/* Guest info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 flex-shrink-0 bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="font-serif text-sm text-primary">{initials}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate leading-none mb-1">
                        {guest.name || 'Guest'}
                      </p>
                      {guest.email && (
                        <p className="text-xs text-muted-foreground truncate mb-1">
                          {guest.email}
                        </p>
                      )}
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                        {guest.role || 'guest'}
                        {guest.joined_at && (
                          <>
                            <span>·</span>
                            joined {new Date(guest.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Access status */}
                  <div className="flex justify-center">
                    {enrolled ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary/10 border border-secondary/20 text-secondary text-xs whitespace-nowrap">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Has Access
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-background border border-border text-muted-foreground text-xs whitespace-nowrap">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pending Enroll
                      </div>
                    )}
                  </div>

                  {/* Remove action (host only) */}
                  {isHost && (
                    <div className="flex items-center justify-end gap-2">
                      {isConfirming ? (
                        <>
                          <button
                            onClick={() => setConfirmRemoveId(null)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleRemove(guest.id)}
                            disabled={isPending}
                            className="text-xs bg-red-500 text-white px-3 py-1.5 hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            {isPending ? 'Removing…' : 'Confirm'}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmRemoveId(guest.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
                          title="Remove guest"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6h7m3-10l5 5m0-5l-5 5" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-card border border-border">
            <svg className="w-12 h-12 mx-auto text-border mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="font-serif text-xl text-foreground mb-2">No guests yet</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Share the invite link or code above. As guests join, they&apos;ll appear here.
            </p>
          </div>
        )}

        {/* Access legend */}
        {visibleGuests.length > 0 && (
          <div className="mt-4 p-4 bg-surface border border-border flex flex-col sm:flex-row gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 flex-shrink-0 bg-secondary/10 border border-secondary/20" />
              <span><strong className="text-foreground">Has Access</strong> — Face enrolled. AI matches their photos &amp; they see host-shared moments.</span>
            </div>
            <div className="hidden sm:block">|</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 flex-shrink-0 bg-background border border-border" />
              <span><strong className="text-foreground">Pending Enroll</strong> — Joined but hasn&apos;t taken a selfie yet.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
