// Client-safe utilities for the album order feature
// (no 'server-only' import — safe to use in both server and client components)

import type { AlbumSpread } from '@/components/album-editor/types'
import type { FlipbookPageData } from '@/components/flipbook/types'

export function spreadsToFlipbookPages(spreads: AlbumSpread[]): FlipbookPageData[] {
  return spreads.map((spread) => ({
    id: spread.id,
    background: spread.background,
    elements: spread.elements,
  }))
}
