import { readPsd } from 'ag-psd'

export interface ParsedSlot {
  slot_id: string
  type: 'photo' | 'text'
  x_mm: number
  y_mm: number
  width_mm: number
  height_mm: number
  aspect_ratio: string
  min_dpi: number
  fit_mode: 'fill' | 'fit' | 'exact'
  shape_mask: 'rectangle' | 'circle' | 'rounded'
  z_index: number
  editable_by_user: boolean
  optional: boolean
  font_family?: string
  font_size_pt?: number
  font_color_hex?: string
  placeholder_text?: string
}

export interface ParsedPage {
  page_number: number
  page_type: 'cover' | 'inner' | 'back-cover'
  slots: ParsedSlot[]
}

export interface ParsedPSDLayout {
  template_id: string
  version: string
  page_count: number
  page_size: {
    width_mm: number
    height_mm: number
    preset: string
  }
  bleed_mm: number
  safe_zone_mm: number
  pages: ParsedPage[]
  previews: string[] // dataUrls
}

/**
 * Traverses layers recursively to identify photo slots and text layers
 */
function extractLayersRecursive(
  layers: any[],
  dpi: number,
  pxToMm: number,
  slots: ParsedSlot[],
  zIndexRef: { current: number },
  usedSlotIds: Set<string>
) {
  for (const layer of layers) {
    const name = layer.name || ''
    const lowerName = name.toLowerCase()

    const isSlot = lowerName.match(/(slot|photo|image|placeholder|pic)/i)
    const isText = !!layer.text

    if (isSlot || isText) {
      const xMm = layer.left * pxToMm
      const yMm = layer.top * pxToMm
      const widthMm = (layer.right - layer.left) * pxToMm
      const heightMm = (layer.bottom - layer.top) * pxToMm

      const aspectRatioVal = widthMm / heightMm
      let aspectRatio = 'free'
      if (Math.abs(aspectRatioVal - 1.0) < 0.05) aspectRatio = '1:1'
      else if (Math.abs(aspectRatioVal - 1.33) < 0.05) aspectRatio = '4:3'
      else if (Math.abs(aspectRatioVal - 1.5) < 0.05) aspectRatio = '3:2'
      else if (Math.abs(aspectRatioVal - 1.77) < 0.05) aspectRatio = '16:9'

      let slotIdBase = name || `${isText ? 'text' : 'photo'}_slot_${zIndexRef.current}`
      slotIdBase = slotIdBase.trim()
      let slotId = slotIdBase
      let counter = 1
      while (usedSlotIds.has(slotId)) {
        slotId = `${slotIdBase}_${counter++}`
      }
      usedSlotIds.add(slotId)

      const slot: ParsedSlot = {
        slot_id: slotId,
        type: isText ? 'text' : 'photo',
        x_mm: Math.round(xMm * 100) / 100,
        y_mm: Math.round(yMm * 100) / 100,
        width_mm: Math.round(widthMm * 100) / 100,
        height_mm: Math.round(heightMm * 100) / 100,
        aspect_ratio: aspectRatio,
        min_dpi: 300,
        fit_mode: 'fill',
        shape_mask: 'rectangle',
        z_index: zIndexRef.current++,
        editable_by_user: true,
        optional: true,
      }

      if (isText) {
        slot.font_family = 'serif'
        slot.font_size_pt = 12
        slot.font_color_hex = '#000000'
        slot.placeholder_text = layer.text?.text || 'Type text here'

        if (layer.text?.style) {
          const style = layer.text.style
          if (style.fontSize) {
            slot.font_size_pt = Math.round(style.fontSize)
          }
          if (style.fontName) {
            slot.font_family = style.fontName
          }
          if (style.fillColor) {
            const c = style.fillColor
            if (Array.isArray(c) && c.length >= 3) {
              const r = Math.round(c[0] > 1 ? c[0] : c[0] * 255)
              const g = Math.round(c[1] > 1 ? c[1] : c[1] * 255)
              const b = Math.round(c[2] > 1 ? c[2] : c[2] * 255)
              slot.font_color_hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
            }
          }
        }
      }

      slots.push(slot)
    }

    if (layer.children && layer.children.length > 0) {
      extractLayersRecursive(layer.children, dpi, pxToMm, slots, zIndexRef, usedSlotIds)
    }
  }
}

/**
 * Recursively marks slot and text layers as hidden so we can render a clean background
 */
function hideSlotsAndTextLayers(layers: any[]) {
  for (const layer of layers) {
    const name = layer.name || ''
    const lowerName = name.toLowerCase()
    const isSlot = lowerName.match(/(slot|photo|image|placeholder|pic)/i)
    const isText = !!layer.text

    if (isSlot || isText) {
      layer.hidden = true
    }

    if (layer.children) {
      hideSlotsAndTextLayers(layer.children)
    }
  }
}

/**
 * Manual recursive composition of visible PSD layers onto a canvas context
 */
function drawPsdLayers(layers: any[], ctx: CanvasRenderingContext2D) {
  // Draw bottom layers first (PSD stores top layers at index 0)
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i]
    if (layer.hidden) continue

    if (layer.children && layer.children.length > 0) {
      drawPsdLayers(layer.children, ctx)
    } else if (layer.canvas) {
      ctx.save()
      if (layer.opacity !== undefined) {
        ctx.globalAlpha = layer.opacity
      }
      ctx.drawImage(layer.canvas, layer.left ?? 0, layer.top ?? 0)
      ctx.restore()
    }
  }
}

/**
 * Parses PSD file array buffer client-side and outputs template layout schema and page preview dataUrls
 */
export async function parsePSDFile(file: File, templateId: string): Promise<ParsedPSDLayout> {
  const arrayBuffer = await file.arrayBuffer()
  const psd = readPsd(arrayBuffer, { skipLayerImageData: false, skipThumbnail: true })

  // Determine DPI
  const dpi = psd.imageResources?.resolutionInfo?.horizontalResolution || 300
  const pxToMm = 25.4 / dpi

  const docWidthMm = psd.width * pxToMm
  const docHeightMm = psd.height * pxToMm

  // Detect spreads (Landscape double-page spreads)
  const isSpread = psd.width / psd.height > 1.2
  const pageWidthMm = isSpread ? docWidthMm / 2 : docWidthMm
  const pageHeightMm = docHeightMm

  const slots: ParsedSlot[] = []
  const zIndexRef = { current: 1 }
  const usedSlotIds = new Set<string>()

  if (psd.children) {
    extractLayersRecursive(psd.children, dpi, pxToMm, slots, zIndexRef, usedSlotIds)
  }

  // Split slots between pages if spread
  const pages: ParsedPage[] = []
  if (isSpread) {
    const leftSlots = slots.filter((s) => s.x_mm < pageWidthMm)
    const rightSlots = slots
      .filter((s) => s.x_mm >= pageWidthMm)
      .map((s) => ({
        ...s,
        x_mm: Math.round((s.x_mm - pageWidthMm) * 100) / 100,
      }))

    pages.push({
      page_number: 1,
      page_type: 'cover',
      slots: leftSlots,
    })

    pages.push({
      page_number: 2,
      page_type: 'inner',
      slots: rightSlots,
    })
  } else {
    pages.push({
      page_number: 1,
      page_type: 'cover',
      slots,
    })
  }

  // Adjust page types for last page
  if (pages.length > 0) {
    pages[pages.length - 1].page_type = 'back-cover'
  }

  // Render clean background preview images
  // Clone layers or hide slots in the existing ones
  if (psd.children) {
    hideSlotsAndTextLayers(psd.children)
  }

  // Draw composition
  const mainCanvas = document.createElement('canvas')
  mainCanvas.width = psd.width
  mainCanvas.height = psd.height
  const ctx = mainCanvas.getContext('2d')
  if (ctx && psd.children) {
    drawPsdLayers(psd.children, ctx)
  }

  const previews: string[] = []

  if (isSpread) {
    // Slices into Left Page and Right Page
    const leftCanvas = document.createElement('canvas')
    leftCanvas.width = psd.width / 2
    leftCanvas.height = psd.height
    const leftCtx = leftCanvas.getContext('2d')
    if (leftCtx) {
      leftCtx.drawImage(
        mainCanvas,
        0,
        0,
        psd.width / 2,
        psd.height,
        0,
        0,
        psd.width / 2,
        psd.height
      )
      previews.push(leftCanvas.toDataURL('image/png'))
    }

    const rightCanvas = document.createElement('canvas')
    rightCanvas.width = psd.width / 2
    rightCanvas.height = psd.height
    const rightCtx = rightCanvas.getContext('2d')
    if (rightCtx) {
      rightCtx.drawImage(
        mainCanvas,
        psd.width / 2,
        0,
        psd.width / 2,
        psd.height,
        0,
        0,
        psd.width / 2,
        psd.height
      )
      previews.push(rightCanvas.toDataURL('image/png'))
    }
  } else {
    previews.push(mainCanvas.toDataURL('image/png'))
  }

  return {
    template_id: templateId,
    version: '1.0.0',
    page_count: pages.length,
    page_size: {
      width_mm: Math.round(pageWidthMm * 10) / 10,
      height_mm: Math.round(pageHeightMm * 10) / 10,
      preset: `${Math.round(pageWidthMm)}x${Math.round(pageHeightMm)}`,
    },
    bleed_mm: 3,
    safe_zone_mm: 5,
    pages,
    previews,
  }
}
