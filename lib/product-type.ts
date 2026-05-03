export type AlbumProductType = 'magazine' | 'photo_book'

function isProductType(value: unknown): value is AlbumProductType {
  return value === 'magazine' || value === 'photo_book'
}

export function inferAlbumProductType(layoutData: unknown): AlbumProductType {
  if (!layoutData || typeof layoutData !== 'object') {
    return 'photo_book'
  }

  const value = layoutData as Record<string, unknown>
  if (isProductType(value.productType)) {
    return value.productType
  }

  // Backward-compatible inference for older template-driven albums
  if (typeof value.templateId === 'string' && value.templateId.trim().length > 0) {
    return 'magazine'
  }

  return 'photo_book'
}

export function inferTemplateProductType(template: { productType?: unknown }): AlbumProductType {
  if (isProductType(template.productType)) {
    return template.productType
  }
  return 'magazine'
}

export function productTypeLabel(productType: AlbumProductType) {
  return productType === 'magazine' ? 'Magazine' : 'Photo Book'
}
