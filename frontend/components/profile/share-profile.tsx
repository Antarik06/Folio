'use client'

import { useEffect, useMemo, useState } from 'react'
import QRCode from 'react-qr-code'
import { MonoLabel, StampButton } from '@/components/folio/primitives'
import { profileApi } from '@/lib/profile/api'

/**
 * Sharing the whole page, as opposed to one card.
 *
 * The link is `/p/<handle>`, so it exists the moment a handle does — but it
 * only *opens* once the page is public, and this dialog refuses to hand over an
 * address that would 404 for whoever receives it. Publishing is therefore
 * offered right here rather than buried in settings: wanting to share is the
 * only moment the choice is actually live for someone.
 *
 * The QR is not decoration. Half of what this app does happens at events, with
 * a phone in hand and someone standing in front of you.
 */
export function ShareProfileDialog({
  handle,
  isPublic,
  onClose,
  onPublished,
}: {
  handle: string | null
  isPublic: boolean
  onClose(): void
  onPublished(next: { handle: string | null; page_is_public: boolean }): void
}) {
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftHandle, setDraftHandle] = useState(handle ?? '')

  const url = useMemo(() => {
    if (!handle || typeof window === 'undefined') return null
    return `${window.location.origin}/p/${handle}`
  }, [handle])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function copy() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not reach the clipboard. Copy the address by hand.')
    }
  }

  async function share() {
    if (!url) return
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'My Folio page', url })
        return
      } catch (shareError) {
        if ((shareError as Error)?.name === 'AbortError') return
      }
    }
    await copy()
  }

  /** Claims a handle and turns the page on in one request. */
  async function publish() {
    setBusy(true)
    setError(null)
    try {
      const cleaned = draftHandle.trim().toLowerCase().replace(/^@/, '')
      const next = await profileApi.updatePage({
        ...(cleaned && cleaned !== handle ? { handle: cleaned } : {}),
        page_is_public: true,
      })
      onPublished({ handle: next.handle, page_is_public: next.page_is_public })
    } catch (publishError) {
      setError((publishError as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function unpublish() {
    setBusy(true)
    setError(null)
    try {
      const next = await profileApi.updatePage({ page_is_public: false })
      onPublished({ handle: next.handle, page_is_public: next.page_is_public })
    } catch (unpublishError) {
      setError((unpublishError as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const live = isPublic && !!url

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40"
      />

      <div className="relative w-full max-w-[520px] rounded-t-[4px] border border-border bg-card p-5 sm:rounded-[4px] sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <MonoLabel tone="primary" size="xs" className="mb-1.5">
              Share your page
            </MonoLabel>
            <h2 className="font-serif text-xl leading-tight text-foreground">
              {live ? 'Anyone with this link' : 'Your page is private'}
            </h2>
          </div>
          <StampButton tone="ghost" size="sm" onClick={onClose}>
            Close
          </StampButton>
        </div>

        {live ? (
          <>
            <div className="mt-5 flex justify-center rounded-[4px] border border-border bg-[#FFFFFF] p-4">
              <QRCode value={url} size={148} bgColor="#FFFFFF" fgColor="#1C1814" />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-[2px] border border-border bg-background px-3 py-2.5 font-mono text-xs text-ink-soft">
                {url}
              </code>
              <StampButton tone="primary" size="sm" onClick={() => void copy()}>
                {copied ? 'Copied' : 'Copy'}
              </StampButton>
              <StampButton tone="ghost" size="sm" onClick={() => void share()}>
                Send
              </StampButton>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              They will see your card, the images and the albums you added — and
              nothing else. Your library, your events and your private albums
              stay where they are.
            </p>

            <div className="mt-5 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => void unpublish()}
                disabled={busy}
                className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft underline-offset-4 hover:text-primary hover:underline disabled:opacity-50"
              >
                {busy ? 'Working…' : 'Make my page private again'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Turn your page on and it gets an address you can send to anyone —
              no account needed to open it. Only what you added to your profile
              is on it.
            </p>

            <label className="mt-5 block">
              <MonoLabel size="xs" className="mb-1.5">
                Your address
              </MonoLabel>
              <div className="flex items-center rounded-[2px] border border-border bg-background focus-within:border-primary">
                <span className="whitespace-nowrap pl-3 font-mono text-sm text-ink-soft">
                  /p/
                </span>
                <input
                  value={draftHandle}
                  onChange={(event) =>
                    setDraftHandle(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                  }
                  placeholder="yourname"
                  maxLength={30}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="min-h-[46px] w-full bg-transparent px-1 font-mono text-sm text-foreground outline-none"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                3–30 characters. Lowercase letters, numbers, underscores.
              </p>
            </label>

            <div className="mt-5">
              <StampButton
                tone="primary"
                size="sm"
                onClick={() => void publish()}
                disabled={busy || draftHandle.trim().length < 3}
              >
                {busy ? 'Publishing…' : 'Publish my page'}
              </StampButton>
            </div>
          </>
        )}

        {error ? (
          <p className="mt-4 border border-primary px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
