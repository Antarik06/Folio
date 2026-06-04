import AdmZip from 'adm-zip'
import { XMLParser } from 'fast-xml-parser'

const PT_TO_MM = 0.352778

export interface ParsedSlot {
  slot_id: string
  type: 'photo' | 'text' | 'decorative'
  x_mm: number
  y_mm: number
  width_mm: number
  height_mm: number
  aspect_ratio: string
  min_dpi: number
  fit_mode: 'fill' | 'fit' | 'exact'
  shape_mask: 'rectangle' | 'circle' | 'rounded' | 'custom-svg-path'
  z_index: number
  editable_by_user: boolean
  optional: boolean
  font_family?: string
  font_size_pt?: number
  font_color_cmyk?: string
  placeholder_text?: string
}

export interface ParsedPage {
  page_number: number
  page_type: 'cover' | 'inner' | 'back-cover' | 'spread'
  slots: ParsedSlot[]
}

export interface ParsedIDML {
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
  color_profile: string
  print_process: 'offset' | 'digital-inkjet' | 'photo-lab'
  pages: ParsedPage[]
}

/**
 * Extracts numeric parameters from InDesign ItemTransform matrix "a b c d tx ty"
 */
function parseTransform(transformStr?: string): { tx: number; ty: number } {
  if (!transformStr) return { tx: 0, ty: 0 }
  const parts = transformStr.trim().split(/\s+/).map(Number)
  if (parts.length === 6) {
    return { tx: parts[4], ty: parts[5] }
  }
  return { tx: 0, ty: 0 }
}

/**
 * Parses InDesign GeometricBounds string "y1 x1 y2 x2"
 */
function parseBounds(boundsStr?: string): { y1: number; x1: number; y2: number; x2: number } {
  if (!boundsStr) return { y1: 0, x1: 0, y2: 0, x2: 0 }
  const parts = boundsStr.trim().split(/\s+/).map(Number)
  if (parts.length === 4) {
    return { y1: parts[0], x1: parts[1], y2: parts[2], x2: parts[3] }
  }
  return { y1: 0, x1: 0, y2: 0, x2: 0 }
}

/**
 * Traverses an InDesign XML node tree recursively to collect Rectangles and TextFrames
 */
function collectFrames(node: any, collected: any[] = []): any[] {
  if (!node || typeof node !== 'object') return collected

  // Check if it is a Rectangle or TextFrame
  if (node['Rectangle']) {
    const rects = Array.isArray(node['Rectangle']) ? node['Rectangle'] : [node['Rectangle']]
    for (const r of rects) {
      collected.push({ type: 'Rectangle', data: r })
      collectFrames(r, collected)
    }
  }

  if (node['TextFrame']) {
    const texts = Array.isArray(node['TextFrame']) ? node['TextFrame'] : [node['TextFrame']]
    for (const t of texts) {
      collected.push({ type: 'TextFrame', data: t })
      collectFrames(t, collected)
    }
  }

  // Traverse children properties
  for (const key of Object.keys(node)) {
    if (key !== 'Rectangle' && key !== 'TextFrame') {
      const child = node[key]
      if (Array.isArray(child)) {
        for (const item of child) {
          collectFrames(item, collected)
        }
      } else if (typeof child === 'object') {
        collectFrames(child, collected)
      }
    }
  }

  return collected
}

/**
 * Parses IDML zip file in-memory and outputs a standard template schema.json
 */
export async function parseIDML(buffer: Buffer, templateId: string): Promise<ParsedIDML> {
  const zip = new AdmZip(buffer)
  const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true
  })

  // 1. Read and parse designmap.xml
  const designmapEntry = zip.getEntry('designmap.xml')
  if (!designmapEntry) {
    throw new Error('Invalid IDML structure: designmap.xml is missing.')
  }
  const designmapXml = designmapEntry.getData().toString('utf8')
  const designmapObj = xmlParser.parse(designmapXml)

  // Document preferences (Dimensions, Bleed)
  const docPref = designmapObj['Document']?.['DocumentPreference'] || {}
  const pageWidthPt = Number(docPref['@_PageWidth'] || 600)
  const pageHeightPt = Number(docPref['@_PageHeight'] || 800)
  const bleedPt = Number(docPref['@_DocumentBleedTopOrWithFacingPagesRequirement'] || 8.5) // ~3mm

  const pageWidthMm = Math.round(pageWidthPt * PT_TO_MM * 10) / 10
  const pageHeightMm = Math.round(pageHeightPt * PT_TO_MM * 10) / 10
  const bleedMm = Math.round(bleedPt * PT_TO_MM * 10) / 10

  // 2. Fetch all Spreads/Spread_*.xml files
  const spreadEntries = zip.getEntries().filter(e => e.entryName.startsWith('Spreads/Spread_'))
  const pagesList: ParsedPage[] = []
  let globalPageNum = 1

  for (const spreadEntry of spreadEntries) {
    const spreadXml = spreadEntry.getData().toString('utf8')
    const spreadObj = xmlParser.parse(spreadXml)
    const spreadNode = spreadObj['Spread']

    if (!spreadNode) continue

    // A spread typically contains 2 pages (facing pages)
    // Determine dimensions of spread
    const spreadWidthPt = pageWidthPt * 2
    const spreadHeightPt = pageHeightPt

    const allFrames = collectFrames(spreadNode)
    const pageSlots: ParsedSlot[] = []

    let zIndexCounter = 1

    for (const frame of allFrames) {
      const data = frame.data
      const name = data['@_Name'] || ''

      const isPhoto = name.match(/^(photo_slot_|img_|picture_)/i)
      const isText = frame.type === 'TextFrame' && name.match(/^(text_slot_|caption_|text_caption_|text_title_)/i)

      if (!isPhoto && !isText) {
        // Ignored or decorative
        continue
      }

      // Geometries
      const bounds = parseBounds(data['@_GeometricBounds'])
      const transform = parseTransform(data['@_ItemTransform'])

      // Apply transform offsets
      const finalX1 = bounds.x1 + transform.tx
      const finalY1 = bounds.y1 + transform.ty
      const finalX2 = bounds.x2 + transform.tx
      const finalY2 = bounds.y2 + transform.ty

      // Convert coordinate to millimeter relative to spread top-left center origin
      const xMm = (finalX1 + spreadWidthPt / 2) * PT_TO_MM
      const yMm = (finalY1 + spreadHeightPt / 2) * PT_TO_MM
      const widthMm = (finalX2 - finalX1) * PT_TO_MM
      const heightMm = (finalY2 - finalY1) * PT_TO_MM

      const aspectRatioVal = widthMm / heightMm
      let aspectRatio = 'free'
      if (Math.abs(aspectRatioVal - 1.0) < 0.05) aspectRatio = '1:1'
      else if (Math.abs(aspectRatioVal - 1.33) < 0.05) aspectRatio = '4:3'
      else if (Math.abs(aspectRatioVal - 1.5) < 0.05) aspectRatio = '3:2'
      else if (Math.abs(aspectRatioVal - 1.77) < 0.05) aspectRatio = '16:9'

      const slot: ParsedSlot = {
        slot_id: name || `${isPhoto ? 'photo' : 'text'}_slot_${zIndexCounter}`,
        type: isPhoto ? 'photo' : 'text',
        x_mm: Math.round(xMm * 100) / 100,
        y_mm: Math.round(yMm * 100) / 100,
        width_mm: Math.round(widthMm * 100) / 100,
        height_mm: Math.round(heightMm * 100) / 100,
        aspect_ratio: aspectRatio,
        min_dpi: 300,
        fit_mode: 'fill',
        shape_mask: 'rectangle',
        z_index: zIndexCounter++,
        editable_by_user: true,
        optional: true
      }

      if (isText) {
        slot.font_family = 'serif'
        slot.font_size_pt = 12
        slot.font_color_cmyk = '0,0,0,100'
        slot.placeholder_text = 'Type caption here'
      }

      pageSlots.push(slot)
    }

    // Distribute slots between the pages of this spread
    // Spread is divided vertically down the middle (pageWidthMm)
    const leftPageSlots = pageSlots.filter(s => s.x_mm < pageWidthMm).map(s => ({ ...s }))
    const rightPageSlots = pageSlots.filter(s => s.x_mm >= pageWidthMm).map(s => {
      // Offset coordinate by pageWidthMm so page coords start from top-left (0,0)
      return {
        ...s,
        x_mm: Math.round((s.x_mm - pageWidthMm) * 100) / 100
      }
    })

    // Create Page records (two pages per spread)
    pagesList.push({
      page_number: globalPageNum++,
      page_type: globalPageNum === 2 ? 'cover' : 'inner',
      slots: leftPageSlots
    })

    pagesList.push({
      page_number: globalPageNum++,
      page_type: 'inner',
      slots: rightPageSlots
    })
  }

  // Adjust page types for last pages
  if (pagesList.length > 0) {
    pagesList[0].page_type = 'cover'
    pagesList[pagesList.length - 1].page_type = 'back-cover'
  }

  return {
    template_id: templateId,
    version: '1.0.0',
    page_count: pagesList.length,
    page_size: {
      width_mm: pageWidthMm,
      height_mm: pageHeightMm,
      preset: `${pageWidthMm}x${pageHeightMm}`
    },
    bleed_mm: bleedMm,
    safe_zone_mm: 5,
    color_profile: 'ISOcoated_v2_eci.icc',
    print_process: 'digital-inkjet',
    pages: pagesList
  }
}
