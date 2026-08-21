'use client'

import React, { useEffect, useState } from 'react'
import { AlbumViewer } from '@/components/viewer/AlbumViewer'

const FRAME_LABELS: Record<string, string> = {
  classic: 'Classic White',
  midnight: 'Midnight Black',
  vintage: 'Vintage Cream',
  modern: 'Gallery Minimal',
}

interface PolaroidPreviewState {
  images: string[]
  frame: string
  quantities?: number[]
}

/**
 * Polaroid preview.
 *
 * Reads the selection the studio handed over in sessionStorage — these prints
 * have no album record yet, which is why this is its own route rather than a
 * variant of /preview/[id]. The viewer itself is the same AlbumViewer as every
 * other style; only the `style` prop differs.
 */
export default function PolaroidPreviewPage() {
  const [state, setState] = useState<PolaroidPreviewState | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('polaroid-preview-state')
      if (raw) setState(JSON.parse(raw))
    } catch {
      // A malformed handoff falls through to the empty state below.
    }
    setReady(true)
  }, [])

  if (!ready) {
    return <div className="h-[100dvh] w-full bg-[#12100D]" aria-hidden="true" />
  }

  if (!state || state.images.length === 0) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-[#12100D] px-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#F5F0E8]/40">
          Nothing loaded
        </p>
        <p className="max-w-xs text-sm leading-relaxed text-[#F5F0E8]/60">
          Pick your prints in the studio first — the preview reads the selection
          from there.
        </p>
        <a
          href="/create/polaroid"
          className="mt-2 inline-flex min-h-[44px] items-center rounded-[2px] bg-primary px-5 font-mono text-[11px] uppercase tracking-[0.08em] text-primary-foreground"
        >
          ← Polaroid studio
        </a>
      </div>
    )
  }

  const printCount = (state.quantities ?? state.images.map(() => 1)).reduce(
    (sum, q) => sum + q,
    0
  )

  return (
    <AlbumViewer
      style="polaroid"
      images={state.images}
      frameId={state.frame}
      title="Your Polaroids"
      spec={[
        `${printCount} print${printCount === 1 ? '' : 's'} · 3.5×4.2in`,
        FRAME_LABELS[state.frame] ?? 'Classic white',
        'Matte instant stock',
      ]}
      back={{ href: '/create/polaroid', label: 'Studio' }}
      action={{ href: '/create/orders/checkout?type=polaroid', label: 'Checkout →' }}
    />
  )
}
