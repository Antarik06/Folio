'use client'

import React from 'react'
import { AlbumPreview3D } from '@/components/preview/album-preview-3d'
import { AlbumProductType } from '@/lib/product-type'

interface PreviewClientProps {
  album: any
  productType: AlbumProductType
}

export default function PreviewClient({ album, productType }: PreviewClientProps) {
  return <AlbumPreview3D album={album} productType={productType} />
}
