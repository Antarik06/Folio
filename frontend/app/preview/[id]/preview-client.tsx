'use client'

import React from 'react'
import { AlbumViewer } from '@/components/viewer/AlbumViewer'
import { AlbumProductType } from '@/lib/product-type'

interface PreviewClientProps {
  album: any
  productType: AlbumProductType
}

export default function PreviewClient({ album, productType }: PreviewClientProps) {
  const style = productType === 'magazine' ? 'magazine' : 'book'
  const spreads = album?.layout_data?.spreads?.length ?? 0

  return (
    <AlbumViewer
      style={style}
      album={album}
      title={album?.title}
      spec={[
        `${spreads} ${style === 'magazine' ? 'spreads' : 'spreads'} · 12×12in`,
        'Pearl lustre stock',
        style === 'magazine' ? 'Perfect bound' : 'Linen cover',
      ]}
      back={{ href: '/photos', label: 'Photos' }}
      action={{ href: `/create/orders/${album.id}`, label: 'Order print →' }}
    />
  )
}
