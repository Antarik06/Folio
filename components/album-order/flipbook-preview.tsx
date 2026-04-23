'use client'

import React from 'react'
import { FlipBook } from '@/components/flipbook/FlipBook'
import type { FlipbookPageData } from '@/components/flipbook/types'

interface FlipbookPreviewProps {
  title: string
  pages: FlipbookPageData[]
  isLoading?: boolean
}

export function FlipbookPreview({ title, pages, isLoading = false }: FlipbookPreviewProps) {
  if (isLoading) {
    return (
      <div className="w-full aspect-[14/10] rounded-lg border border-linen bg-muted/40 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading album preview...</p>
        </div>
      </div>
    )
  }

  if (pages.length === 0) {
    return (
      <div className="w-full aspect-[14/10] rounded-lg border border-linen bg-muted/40 flex items-center justify-center">
        <div className="text-center space-y-2 px-6">
          <p className="text-lg font-serif text-foreground">Your album has no pages yet</p>
          <p className="text-sm text-muted-foreground">
            Add pages to your album in the editor before placing an order.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <FlipBook
        title={title}
        pages={pages}
        protections={{
          watermark: false,
          noRightClick: false,
          noDownload: false,
        }}
        hasCover={false}
      />
    </div>
  )
}
