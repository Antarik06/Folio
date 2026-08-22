'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Konva from 'konva'
import { useRouter } from 'next/navigation'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api-client'
import { MagazineTemplate } from '@/lib/magazine-templates'
import { AlbumSpread, AlbumElement, AlbumPageSide, TextElement } from './types'
import { Sidebar, type SidebarPanel } from './sidebar'
import { Topbar } from './topbar'
import { Workspace } from './workspace'
import { Timeline } from './timeline'
import { SpecStrip } from './spec-strip'
import { Inspector, type AlignMode } from './inspector'
import { ReframeModal } from './reframe-modal'


interface EditorProps {
  albumId: string
  albumTitle?: string
  eventId?: string | null
  initialSpreads?: AlbumSpread[]
  photos?: any[]
  layoutField?: 'layout_data' | 'theme_config'
  coverImageUrl?: string
  initialLayoutData?: Record<string, any>
  templates?: MagazineTemplate[]
}

interface EditorDocumentState {
  spreads: AlbumSpread[]
  activeSpreadId: string | null
  activeSide: 'front' | 'back'
}

interface SaveDraftPayload {
  version: number
  updatedAt: string
  document: EditorDocumentState
}

type SaveStatus = 'saved' | 'saving' | 'error' | 'restored' | 'dirty'

function formatSaveStatus(saveStatus: SaveStatus, lastSavedAt: Date | null) {
  if (saveStatus === 'saving') return 'Saving...'
  if (saveStatus === 'error') return 'Save failed'
  if (saveStatus === 'dirty') return 'Unsaved changes'
  if (saveStatus === 'restored') return 'Recovered draft'
  if (lastSavedAt) return `Saved ${lastSavedAt.toLocaleTimeString()}`
  return 'Saved'
}

const DEFAULT_FRONT_ELEMENTS: AlbumElement[] = [
    {
      id: 'text-title',
      type: 'text',
      name: 'Album Title',
      x: 100,
      y: 100,
      text: 'Album Title',
      fontSize: 48,
      fontFamily: 'serif',
      fill: '#1c1814',
      rotation: 0,
      width: 400,
      height: 60,
      zIndex: 1,
      fontWeight: 'bold',
      textAlign: 'left',
      lineHeight: 1.2,
      letterSpacing: 0,
    },
]

const DEFAULT_SPREAD: AlbumSpread = {
  id: 'spread-1',
  isCover: false,
  background: '#ffffff',
  elements: DEFAULT_FRONT_ELEMENTS,
  front: {
    background: '#ffffff',
    elements: DEFAULT_FRONT_ELEMENTS,
  },
  back: {
    background: '#ffffff',
    elements: [],
  },
}

const DEFAULT_COVER_SPREAD = (id: string, coverImageUrl: string | undefined, width: number, height: number): AlbumSpread => {
  const elements: AlbumElement[] = []

  if (coverImageUrl) {
    elements.push({
      id: `cover-image-${id}`,
      type: 'image',
      name: 'Album Art',
      src: coverImageUrl,
      x: 0,
      y: 0,
      width: width,
      height: height,
      zIndex: 1,
      rotation: 0,
      fitMode: 'fill',
      locked: true,
    })
  }

  elements.push({
    id: `cover-title-${id}`,
    type: 'text',
    name: 'Cover Title',
    x: Math.round(width * 0.1),
    y: coverImageUrl ? Math.round(height * 0.8) : Math.round(height * 0.43), // Position lower if there's an image
    text: 'Album Cover',
    fontSize: 72,
    fontFamily: 'serif',
    fill: coverImageUrl ? '#ffffff' : '#1c1814', // Light text if image background
    rotation: 0,
    width: Math.round(width * 0.8),
    height: 110,
    zIndex: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 1.1,
    letterSpacing: 0,
  })

  return {
    id,
    isCover: true,
    background: coverImageUrl ? '#000000' : '#f8f4ec',
    elements,
    front: {
      background: coverImageUrl ? '#000000' : '#f8f4ec',
      elements,
    },
    back: {
      background: '#ffffff',
      elements: [],
    },
  }
}

const HISTORY_LIMIT = 200
const PAGE_MARGIN = 40
type SpreadSide = 'front' | 'back'

function normalizeZIndex(elements: AlbumElement[]) {
  return [...elements]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((el, index) => ({ ...el, zIndex: index + 1 }))
}

function inferImageLayerName(src: string | null | undefined) {
  if (!src) return 'Empty Photo Slot'
  const normalized = src.toLowerCase()

  if (normalized.startsWith('data:image/svg+xml') || normalized.includes('svg+xml')) {
    return 'Graphic Element'
  }

  if (normalized.startsWith('blob:')) {
    return 'Uploaded Photo'
  }

  if (normalized.includes('pixabay.com')) {
    return 'Stock Image'
  }

  if (normalized.includes('/storage/v1/object') || normalized.includes('supabase')) {
    return 'Event Photo'
  }

  return 'Image Layer'
}

function normalizeElement(el: AlbumElement): AlbumElement {
  if (el.type === 'text') {
    return {
      ...el,
      name: el.name || 'Text Layer',
      lineHeight: el.lineHeight ?? 1.2,
      letterSpacing: el.letterSpacing ?? 0,
      hidden: el.hidden ?? false,
      locked: el.locked ?? false,
    }
  }

  if (el.type === 'image') {
    return {
      ...el,
      name: !el.name || el.name === 'Photo Layer' ? inferImageLayerName(el.src) : el.name,
      fitMode: el.fitMode ?? 'fit',
      opacity: el.opacity ?? 1,
      flipX: el.flipX ?? false,
      flipY: el.flipY ?? false,
      cornerRadius: el.cornerRadius ?? 0,
      shadowBlur: el.shadowBlur ?? 0,
      shadowColor: el.shadowColor ?? '#000000',
      shadowOpacity: el.shadowOpacity ?? 0,
      hidden: el.hidden ?? false,
      locked: el.locked ?? false,
    }
  }

  if (el.type === 'drawing') {
    return {
      ...el,
      name: el.name || 'Freehand Sketch',
      hidden: el.hidden ?? false,
      locked: el.locked ?? false,
    }
  }

  return {
    ...el,
    name: el.name || (el.type === 'shape' ? `${el.shapeType[0].toUpperCase()}${el.shapeType.slice(1)} Layer` : 'Layer'),
    hidden: el.hidden ?? false,
    locked: el.locked ?? false,
  }
}

function normalizeSpreads(spreads: AlbumSpread[]) {
  return spreads.map((spread, index) => ({
    id: spread.id || `spread-${index + 1}`,
    isCover: spread.isCover ?? false,
    background:
      (spread.front?.background ?? spread.background ?? '#ffffff'),
    elements: normalizeZIndex(
      ((spread.front?.elements ?? spread.elements ?? []) as AlbumElement[]).map((el) => normalizeElement(el))
    ),
    front: {
      background: spread.front?.background ?? spread.background ?? '#ffffff',
      elements: normalizeZIndex(
        ((spread.front?.elements ?? spread.elements ?? []) as AlbumElement[]).map((el) => normalizeElement(el))
      ),
    },
    back: {
      background: spread.back?.background ?? '#ffffff',
      elements: normalizeZIndex(
        ((spread.back?.elements ?? []) as AlbumElement[]).map((el) => normalizeElement(el))
      ),
    },
  }))
}

function getSpreadSide(spread: AlbumSpread, side: SpreadSide): AlbumPageSide {
  if (side === 'front') {
    return spread.front ?? { background: spread.background, elements: spread.elements }
  }
  return spread.back ?? { background: '#ffffff', elements: [] }
}

function withSpreadSide(spread: AlbumSpread, side: SpreadSide, nextSide: AlbumPageSide): AlbumSpread {
  const front = side === 'front' ? nextSide : getSpreadSide(spread, 'front')
  const back = side === 'back' ? nextSide : getSpreadSide(spread, 'back')

  return {
    ...spread,
    background: front.background,
    elements: front.elements,
    front,
    back,
  }
}

function collectPhotoPool(currentSpreads: AlbumSpread[], photos: any[]) {
  const pool = new Map<string, string>()

  currentSpreads.forEach((spread) => {
    const sides: AlbumPageSide[] = [
      getSpreadSide(spread, 'front'),
      getSpreadSide(spread, 'back'),
    ]

    sides.forEach((side) => {
      side.elements.forEach((element) => {
        if (element.type !== 'image') return
        if (!element.src) return
        if (!pool.has(element.src)) {
          pool.set(element.src, element.src)
        }
      })
    })
  })

  photos.forEach((photo) => {
    const source = photo?.blob_url || photo?.thumbnail_url
    if (!source) return
    if (!pool.has(source)) {
      pool.set(source, source)
    }
  })

  return Array.from(pool.values())
}

function applyImagePoolToSpreads(spreads: AlbumSpread[], imagePool: string[]) {
  if (!imagePool.length) return spreads

  let cursor = 0
  const nextSource = () => {
    const value = imagePool[cursor % imagePool.length]
    cursor += 1
    return value
  }

  const swapImages = (elements: AlbumElement[]) =>
    elements.map((element) => {
      if (element.type !== 'image') return element
      return {
        ...element,
        src: nextSource(),
      }
    })

  return spreads.map((spread) => {
    const front = getSpreadSide(spread, 'front')
    const back = getSpreadSide(spread, 'back')
    const frontElements = swapImages(front.elements)
    const backElements = swapImages(back.elements)

    return {
      ...spread,
      elements: frontElements,
      front: {
        ...front,
        elements: frontElements,
      },
      back: {
        ...back,
        elements: backElements,
      },
    }
  })
}

function getDraftKey(albumId: string) {
  return `folio:album-draft:${albumId}`
}

function tryLoadDraft(albumId: string) {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(getDraftKey(albumId))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as SaveDraftPayload
    if (!parsed?.document?.spreads?.length) return null
    return parsed
  } catch {
    return null
  }
}

function measureTextHeight(el: TextElement) {
  const node = new Konva.Text({
    text: el.text,
    width: Math.max(20, el.width),
    fontSize: el.fontSize,
    fontFamily: el.fontFamily,
    fontStyle: el.fontWeight,
    lineHeight: el.lineHeight ?? 1.2,
    letterSpacing: el.letterSpacing ?? 0,
    padding: 0,
  })

  return Math.max(40, Math.ceil(node.height() + 10))
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function rgbToSaturation(r: number, g: number, b: number) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === 0) return 0
  return (max - min) / max
}

async function loadImageForProcessing(src: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Image load failed'))
    image.src = src
  })
}

async function removeBackgroundHeuristic(src: string) {
  const image = await loadImageForProcessing(src)
  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height

  if (!width || !height) {
    throw new Error('Invalid image dimensions')
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    throw new Error('Canvas is not available')
  }

  context.drawImage(image, 0, 0, width, height)

  let imageData: ImageData
  try {
    imageData = context.getImageData(0, 0, width, height)
  } catch {
    throw new Error('Image pixels are not readable (cross-origin restrictions)')
  }

  const data = imageData.data
  const borderSamples: Array<[number, number, number]> = []

  const sampleEdge = (x: number, y: number) => {
    const i = (y * width + x) * 4
    const alpha = data[i + 3]
    if (alpha < 20) return
    borderSamples.push([data[i], data[i + 1], data[i + 2]])
  }

  const step = Math.max(1, Math.floor(Math.max(width, height) / 180))
  for (let x = 0; x < width; x += step) {
    sampleEdge(x, 0)
    sampleEdge(x, height - 1)
  }
  for (let y = 0; y < height; y += step) {
    sampleEdge(0, y)
    sampleEdge(width - 1, y)
  }

  if (borderSamples.length === 0) {
    throw new Error('Could not estimate background from image edges')
  }

  const avg = borderSamples.reduce(
    (acc, sample) => ({
      r: acc.r + sample[0],
      g: acc.g + sample[1],
      b: acc.b + sample[2],
    }),
    { r: 0, g: 0, b: 0 }
  )

  const bg = {
    r: avg.r / borderSamples.length,
    g: avg.g / borderSamples.length,
    b: avg.b / borderSamples.length,
  }

  const variance = borderSamples.reduce((sum, [r, g, b]) => {
    const dist = colorDistance(r, g, b, bg.r, bg.g, bg.b)
    return sum + dist
  }, 0) / borderSamples.length

  const bgThreshold = Math.max(20, Math.min(72, 18 + variance * 1.3))
  const state = new Uint8Array(width * height)
  const queue: number[] = []

  const tryQueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const idx = y * width + x
    if (state[idx] !== 0) return

    const pixel = idx * 4
    const alpha = data[pixel + 3]
    const sat = rgbToSaturation(data[pixel], data[pixel + 1], data[pixel + 2])
    const dist = colorDistance(data[pixel], data[pixel + 1], data[pixel + 2], bg.r, bg.g, bg.b)

    const isBg =
      alpha < 16 ||
      dist <= bgThreshold ||
      (dist <= bgThreshold + 16 && sat < 0.22 && alpha < 245)

    if (!isBg) {
      state[idx] = 1
      return
    }

    state[idx] = 2
    queue.push(idx)
  }

  for (let x = 0; x < width; x += 1) {
    tryQueue(x, 0)
    tryQueue(x, height - 1)
  }

  for (let y = 0; y < height; y += 1) {
    tryQueue(0, y)
    tryQueue(width - 1, y)
  }

  while (queue.length > 0) {
    const idx = queue.pop()
    if (idx === undefined) break

    const pixel = idx * 4
    data[pixel + 3] = 0

    const x = idx % width
    const y = Math.floor(idx / width)
    tryQueue(x + 1, y)
    tryQueue(x - 1, y)
    tryQueue(x, y + 1)
    tryQueue(x, y - 1)
  }

  const feather = 26
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = y * width + x
      const pixel = idx * 4
      const alpha = data[pixel + 3]
      if (alpha === 0) continue

      const topA = data[((y - 1) * width + x) * 4 + 3]
      const rightA = data[(y * width + (x + 1)) * 4 + 3]
      const bottomA = data[((y + 1) * width + x) * 4 + 3]
      const leftA = data[(y * width + (x - 1)) * 4 + 3]
      const isBoundary = topA === 0 || rightA === 0 || bottomA === 0 || leftA === 0
      if (!isBoundary) continue

      const dist = colorDistance(data[pixel], data[pixel + 1], data[pixel + 2], bg.r, bg.g, bg.b)
      if (dist > bgThreshold + feather) continue

      const fade = Math.max(0, Math.min(1, (dist - bgThreshold) / feather))
      data[pixel + 3] = Math.round(alpha * Math.max(0.12, fade))
    }
  }

  context.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

export function AlbumEditor({
  albumId,
  albumTitle = 'Untitled album',
  eventId,
  initialSpreads,
  photos = [],
  layoutField = 'layout_data',
  coverImageUrl,
  initialLayoutData,
  templates = [],
}: EditorProps) {
  const aspectRatio = useMemo(() => {
    if (initialSpreads && initialSpreads.length > 0) {
      for (const spread of initialSpreads) {
        const elements = spread.elements || spread.front?.elements || []
        const bgEl = elements.find((el: any) => el.id?.startsWith('bg-image-') || el.name === 'Page Background')
        if (bgEl && bgEl.width && bgEl.height) {
          return bgEl.width / bgEl.height
        }
      }
    }
    if (initialLayoutData?.layout_schema?.page_size?.width_mm && initialLayoutData?.layout_schema?.page_size?.height_mm) {
      return initialLayoutData.layout_schema.page_size.width_mm / initialLayoutData.layout_schema.page_size.height_mm
    }
    return 0.7
  }, [initialSpreads, initialLayoutData])

  const SPREAD_HEIGHT = 1000
  const SPREAD_WIDTH = Math.round(SPREAD_HEIGHT * aspectRatio)

  const router = useRouter()
  const fallbackSpreads = useMemo(
    () => normalizeSpreads(initialSpreads?.length ? initialSpreads : [DEFAULT_COVER_SPREAD('spread-0', coverImageUrl, SPREAD_WIDTH, SPREAD_HEIGHT), DEFAULT_SPREAD]),
    [initialSpreads, coverImageUrl, SPREAD_WIDTH, SPREAD_HEIGHT]
  )

  const startingTemplateId =
    typeof initialLayoutData?.templateId === 'string' ? initialLayoutData.templateId : null

  const [documentState, setDocumentState] = useState<EditorDocumentState>({
    spreads: fallbackSpreads,
    activeSpreadId: fallbackSpreads[0]?.id || null,
    activeSide: 'front',
  })
  const [selection, setSelection] = useState<string[]>([])
  const [zoom, setZoomState] = useState<number>(50)
  // Mirrors `zoom` so the pinch listener can read the current value without
  // being torn down and re-attached on every frame of the gesture.
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [layoutSaveField, setLayoutSaveField] = useState<'layout_data' | 'theme_config'>(layoutField)
  const [layoutMeta, setLayoutMeta] = useState<Record<string, any>>(() => {
    const safeLayout = (initialLayoutData && typeof initialLayoutData === 'object') ? initialLayoutData : {}
    const { spreads: _spreads, activeSpreadId: _activeSpreadId, ...rest } = safeLayout
    return rest
  })
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(startingTemplateId)
  const [activePanel, setActivePanel] = useState<SidebarPanel>('photos')

  // Freehand drawing is gone: anyone needing that much control should be
  // commissioning an artist, which is what the Create tab offers. These stay
  // as fixed values because Workspace still accepts them.
  const isDrawingMode = false
  const brushColor = '#1C1814'
  const brushSize = 5
  const [showGrid, setShowGrid] = useState(true)


  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  // The album's own title, edited in place from the top bar. Held here rather
  // than read straight from the prop so a rename shows immediately instead of
  // waiting on a round trip.
  const [title, setTitle] = useState(albumTitle)
  const [renamingTitle, setRenamingTitle] = useState(false)

  // Photographs available to place. Starts as whatever the event holds and
  // grows as the user uploads more without leaving the editor.
  const [photoList, setPhotoList] = useState<any[]>(photos)
  const [uploading, setUploading] = useState(false)

  const [reframeId, setReframeId] = useState<string | null>(null)

  // Screen size listener for < 1024px (mobile + tablet)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-fit zoom calculation when the viewport changes.
  //
  // It stops once the user has set a zoom themselves. On mobile the address bar
  // collapsing fires `resize`, so re-fitting unconditionally used to throw away
  // a pinch (or a toolbar zoom) the moment the page scrolled.
  const userSetZoomRef = useRef(false)
  const viewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Fit the page to the room it has, once, and again on resize until the
    // user picks a zoom of their own. Measured from the viewport rather than
    // the window: the rails and the page rail take real width.
    const fit = () => {
      if (userSetZoomRef.current) return
      const node = viewportRef.current
      if (!node) return

      const padding = isMobile ? 24 : 56
      const availableWidth = node.clientWidth - padding
      const availableHeight = node.clientHeight - padding
      if (availableWidth <= 0 || availableHeight <= 0) return

      const scale = Math.min(availableWidth / SPREAD_WIDTH, availableHeight / SPREAD_HEIGHT)
      setZoomState(Math.max(10, Math.min(150, Math.floor(scale * 100))))
    }

    const frame = window.requestAnimationFrame(fit)
    window.addEventListener('resize', fit)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', fit)
    }
  }, [SPREAD_WIDTH, SPREAD_HEIGHT, isMobile])

  const supabase = useMemo(() => createBrowserClient(), [])
  const skipAutosaveRef = useRef(true)

  useEffect(() => {
    const rawGridPref = window.localStorage.getItem('folio:editor-show-grid')
    if (rawGridPref === null) return
    setShowGrid(rawGridPref === '1')
  }, [])

  const toggleGrid = useCallback(() => {
    setShowGrid((prev) => {
      const next = !prev
      window.localStorage.setItem('folio:editor-show-grid', next ? '1' : '0')
      return next
    })
  }, [])

  useEffect(() => {
    const recovered = tryLoadDraft(albumId)
    if (!recovered?.document?.spreads?.length) return

    const recoveredSpreads = normalizeSpreads(recovered.document.spreads)
    setDocumentState({
      spreads: recoveredSpreads,
      activeSpreadId: recovered.document.activeSpreadId || recoveredSpreads[0]?.id || null,
      activeSide: recovered.document.activeSide || 'front',
    })
    setSaveStatus('restored')
  }, [albumId])

  const historyRef = useRef<{
    past: EditorDocumentState[]
    future: EditorDocumentState[]
    lastGroup: string | null
    lastTime: number
  }>({
    past: [],
    future: [],
    lastGroup: null,
    lastTime: 0,
  })

  // Mirrors the ref's stack depths into state so the toolbar re-renders when
  // history changes. The stacks themselves stay in the ref to avoid cloning
  // whole documents on every keystroke.
  const [historyVersion, setHistoryVersion] = useState({ past: 0, future: 0 })

  const syncHistoryVersion = useCallback(() => {
    setHistoryVersion((prev) => {
      const past = historyRef.current.past.length
      const future = historyRef.current.future.length
      return prev.past === past && prev.future === future ? prev : { past, future }
    })
  }, [])

  const activeSpread = useMemo(() => {
    return documentState.spreads.find((s) => s.id === documentState.activeSpreadId) || documentState.spreads[0]
  }, [documentState])

  // 1-based position of the spread on screen, for the technical stamp above
  // the canvas. -1 (not found) falls back to the first spread.
  const activeSpreadIndex = useMemo(() => {
    const i = documentState.spreads.findIndex((sp) => sp.id === documentState.activeSpreadId)
    return (i < 0 ? 0 : i) + 1
  }, [documentState.spreads, documentState.activeSpreadId])

  const pageSizeMm = useMemo(() => {
    const size = initialLayoutData?.layout_schema?.page_size
    if (size?.width_mm && size?.height_mm) {
      return { width: size.width_mm, height: size.height_mm }
    }
    return null
  }, [initialLayoutData])

  const activeSpreadSide = useMemo(() => {
    if (!activeSpread) {
      return { background: '#ffffff', elements: [] as AlbumElement[] }
    }
    return getSpreadSide(activeSpread, documentState.activeSide)
  }, [activeSpread, documentState.activeSide])

  const activeSpreadView = useMemo(() => {
    if (!activeSpread) return null
    return {
      ...activeSpread,
      background: activeSpreadSide.background,
      elements: activeSpreadSide.elements,
    }
  }, [activeSpread, activeSpreadSide])

  const selectedElements = useMemo(() => {
    return activeSpreadSide.elements.filter((e) => selection.includes(e.id))
  }, [activeSpreadSide, selection])

  // Derived from state, not read straight off the ref: mutating historyRef does
  // not re-render, so the toolbar's undo/redo buttons stayed stuck in whatever
  // enabled state they had at mount.
  const canUndo = historyVersion.past > 0
  const canRedo = historyVersion.future > 0

  const applyDocumentChange = useCallback(
    (
      updater: (doc: EditorDocumentState) => EditorDocumentState,
      options?: { historyGroup?: string }
    ) => {
      let changed = false

      setDocumentState((previous) => {
        const next = updater(previous)
        if (next === previous) return previous

        changed = true
        const now = Date.now()
        const group = options?.historyGroup ?? null
        const canGroup =
          Boolean(group) &&
          historyRef.current.lastGroup === group &&
          now - historyRef.current.lastTime < 700

        if (!canGroup) {
          historyRef.current.past.push(previous)
          if (historyRef.current.past.length > HISTORY_LIMIT) {
            historyRef.current.past.shift()
          }
        }

        historyRef.current.future = []
        historyRef.current.lastGroup = group
        historyRef.current.lastTime = now

        return next
      })

      if (changed) {
        setSaveStatus('dirty')
        syncHistoryVersion()
      }
    },
    [syncHistoryVersion]
  )

  const undo = useCallback(() => {
    let changed = false
    setDocumentState((current) => {
      const previous = historyRef.current.past.pop()
      if (!previous) return current

      historyRef.current.future.unshift(current)
      historyRef.current.lastGroup = null
      changed = true
      return previous
    })

    if (changed) {
      setSelection([])
      setSaveStatus('dirty')
      syncHistoryVersion()
    }
  }, [syncHistoryVersion])

  const redo = useCallback(() => {
    let changed = false
    setDocumentState((current) => {
      const next = historyRef.current.future.shift()
      if (!next) return current

      historyRef.current.past.push(current)
      historyRef.current.lastGroup = null
      changed = true
      return next
    })

    if (changed) {
      setSelection([])
      setSaveStatus('dirty')
      syncHistoryVersion()
    }
  }, [syncHistoryVersion])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return
      }

      const isUndo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey
      const isRedo =
        (event.ctrlKey || event.metaKey) &&
        (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z'))

      if (isUndo) {
        event.preventDefault()
        undo()
      }

      if (isRedo) {
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])

  const persistDraft = useCallback(async () => {
    const payload: SaveDraftPayload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      document: documentState,
    }

    setSaveStatus('saving')

    try {
      window.localStorage.setItem(getDraftKey(albumId), JSON.stringify(payload))

      const draftDocument: Record<string, any> = {
        ...layoutMeta,
        spreads: documentState.spreads,
        activeSpreadId: documentState.activeSpreadId,
      }
      if (activeTemplateId) {
        draftDocument.templateId = activeTemplateId
      }

      const result = await apiClient.patch(`/api/albums/${albumId}/layout`, {
        layout: draftDocument,
        field: layoutSaveField
      })

      if (result?.album) {
        // Track layoutSaveField dynamically if returned
        const returnedField = result.album.theme_config ? 'theme_config' : 'layout_data'
        setLayoutSaveField(returnedField)
      }

      setLastSavedAt(new Date())
      setSaveStatus('saved')
      return true
    } catch {
      setSaveStatus('error')
      return false
    }
  }, [activeTemplateId, albumId, documentState, layoutMeta, layoutSaveField, supabase])

  /**
   * Leaving the editor goes to Create, not back through history.
   *
   * router.back() sent people wherever they happened to arrive from — often
   * the order desk or a share link — when the one place an album belongs to
   * is the shelf it now sits on.
   */
  const handleBackToSite = useCallback(() => {
    router.push('/create#albums')
  }, [router])

  const handleRenameAlbum = useCallback(
    async (nextTitle: string) => {
      const trimmed = nextTitle.trim()
      if (!trimmed || trimmed === title) return

      const previous = title
      setTitle(trimmed)
      setRenamingTitle(true)
      try {
        await apiClient.patch(`/api/albums/${albumId}/rename`, { title: trimmed })
      } catch (err) {
        console.error('[Editor] Rename failed:', err)
        setTitle(previous)
      } finally {
        setRenamingTitle(false)
      }
    },
    [albumId, title]
  )

  /**
   * Upload straight into the editor.
   *
   * The Photos panel has always had an upload button in its markup, but the
   * editor never passed a handler down, so it never rendered — the only way
   * to get a new photograph into a layout was to leave, upload it to the
   * event, and come back.
   */
  const handleUploadPhotos = useCallback(
    async (files: FileList) => {
      if (!files.length) return
      setUploading(true)

      try {
        for (const file of Array.from(files)) {
          if (!file.type.startsWith('image/')) continue

          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
          const path = `albums/${albumId}/uploads/${Date.now()}-${safeName}`

          const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(path, file, { contentType: file.type })
          if (uploadError) throw uploadError

          const {
            data: { publicUrl },
          } = supabase.storage.from('photos').getPublicUrl(path)

          let registered: any = null
          if (eventId) {
            // Filed against the event when there is one, so the photograph
            // joins the library rather than living only inside this layout.
            try {
              const result = await apiClient.post('/api/photos', {
                eventId,
                blobUrl: publicUrl,
                blobPathname: path,
                thumbnailUrl: publicUrl,
                originalFilename: file.name,
                fileSize: file.size,
              })
              registered = result?.photo ?? null
            } catch (err) {
              console.error('[Editor] Could not file the upload against the event:', err)
            }
          }

          setPhotoList((prev) => [
            registered ?? {
              id: `local-${path}`,
              blob_url: publicUrl,
              thumbnail_url: publicUrl,
              url: publicUrl,
              original_filename: file.name,
            },
            ...prev,
          ])
        }
      } catch (err) {
        console.error('[Editor] Upload failed:', err)
        window.alert('That upload did not go through. Check the file and try again.')
      } finally {
        setUploading(false)
      }
    },
    [albumId, eventId, supabase]
  )

  useEffect(() => {
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false
      return
    }

    const timeout = window.setTimeout(() => {
      void persistDraft()
    }, 2500)

    return () => window.clearTimeout(timeout)
  }, [documentState, persistDraft])

  const updateElement = useCallback(
    (elementId: string, changes: Partial<AlbumElement>, options?: { historyGroup?: string }) => {
      applyDocumentChange(
        (doc) => {
          const spreadIndex = doc.spreads.findIndex((sp) => sp.id === doc.activeSpreadId)
          if (spreadIndex < 0) return doc
          const spread = doc.spreads[spreadIndex]
          const side = getSpreadSide(spread, doc.activeSide)

          let changed = false
          const nextElements = side.elements.map((el) => {
            if (el.id !== elementId) return el

            if (el.locked && !('locked' in changes) && !('hidden' in changes) && !('name' in changes)) {
              return el
            }

            let nextEl = { ...el, ...changes } as AlbumElement
            if (nextEl.type === 'text') {
              nextEl = {
                ...nextEl,
                height: measureTextHeight(nextEl as TextElement),
              }
            }

            changed = true
            return normalizeElement(nextEl)
          })

          if (!changed) return doc

          const nextSpreads = [...doc.spreads]
          nextSpreads[spreadIndex] = withSpreadSide(spread, doc.activeSide, {
            ...side,
            elements: normalizeZIndex(nextElements),
          })

          return { ...doc, spreads: nextSpreads }
        },
        { historyGroup: options?.historyGroup ?? 'edit' }
      )
    },
    [applyDocumentChange]
  )

  const localizeRemoteImage = useCallback(async (elementId: string, remoteSrc: string) => {
    try {
      const response = await fetch(remoteSrc, { mode: 'cors' })
      if (!response.ok) throw new Error('Failed to fetch remote image')
      const blob = await response.blob()

      let fileExt = 'png'
      if (remoteSrc.toLowerCase().includes('.jpg') || remoteSrc.toLowerCase().includes('.jpeg')) {
        fileExt = 'jpg'
      } else if (remoteSrc.toLowerCase().includes('.svg')) {
        fileExt = 'svg'
      } else if (remoteSrc.toLowerCase().includes('.webp')) {
        fileExt = 'webp'
      }

      const randomString = Math.random().toString(36).substring(2, 15)
      const filePath = `albums/${albumId}/${randomString}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, blob, {
          contentType: blob.type || `image/${fileExt}`
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath)
      
      updateElement(elementId, { src: publicUrl })
    } catch (error) {
      console.error('Failed to localize remote image:', error)
    }
  }, [albumId, supabase, updateElement])

  const addElement = useCallback(
    (element: Omit<AlbumElement, 'id' | 'zIndex'>) => {
      const generatedId = uuidv4()
      
      applyDocumentChange(
        (doc) => {
          const spreadIndex = doc.spreads.findIndex((sp) => sp.id === doc.activeSpreadId)
          if (spreadIndex < 0) return doc

          const spread = doc.spreads[spreadIndex]
          const side = getSpreadSide(spread, doc.activeSide)
          const nextZ = Math.max(0, ...side.elements.map((el) => el.zIndex)) + 1
          const inserted = normalizeElement({
            ...element,
            id: generatedId,
            zIndex: nextZ,
          } as AlbumElement)

          const nextSpreads = [...doc.spreads]
          nextSpreads[spreadIndex] = withSpreadSide(spread, doc.activeSide, {
            ...side,
            elements: normalizeZIndex([...side.elements, inserted]),
          })

          setSelection([inserted.id])
          return { ...doc, spreads: nextSpreads }
        },
        { historyGroup: 'insert' }
      )

      if (element.type === 'image') {
        const imgEl = element as any
        if (imgEl.src && imgEl.src.startsWith('http')) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
          const isRemote = !imgEl.src.includes(supabaseUrl) && !imgEl.src.startsWith('data:')
          if (isRemote) {
            void localizeRemoteImage(generatedId, imgEl.src)
          }
        }
      }
    },
    [applyDocumentChange, localizeRemoteImage]
  )

  const addElementAt = useCallback(
    (element: Omit<AlbumElement, 'id' | 'zIndex'>, position: { x: number; y: number }) => {
      addElement({ ...element, x: position.x, y: position.y })
    },
    [addElement]
  )

  const deleteElements = useCallback(
    (elementIds: string[]) => {
      applyDocumentChange(
        (doc) => {
          const spreadIndex = doc.spreads.findIndex((sp) => sp.id === doc.activeSpreadId)
          if (spreadIndex < 0) return doc
          const spread = doc.spreads[spreadIndex]
          const side = getSpreadSide(spread, doc.activeSide)

          const nextElements = side.elements.filter((el) => !elementIds.includes(el.id))
          if (nextElements.length === side.elements.length) return doc

          const nextSpreads = [...doc.spreads]
          nextSpreads[spreadIndex] = withSpreadSide(spread, doc.activeSide, {
            ...side,
            elements: normalizeZIndex(nextElements),
          })

          setSelection((prev) => prev.filter((id) => !elementIds.includes(id)))
          return { ...doc, spreads: nextSpreads }
        },
        { historyGroup: 'delete' }
      )
    },
    [applyDocumentChange]
  )

  const addSpread = useCallback(() => {
    applyDocumentChange(
      (doc) => {
        const newId = uuidv4()
        const nextSpread: AlbumSpread = {
          id: newId,
          isCover: false,
          background: '#ffffff',
          elements: [],
          front: {
            background: '#ffffff',
            elements: [],
          },
          back: {
            background: '#ffffff',
            elements: [],
          },
        }
        return {
          ...doc,
          activeSpreadId: newId,
          activeSide: 'front',
          spreads: [...doc.spreads, nextSpread],
        }
      },
      { historyGroup: 'spread' }
    )
    setSelection([])
  }, [applyDocumentChange])

  const addCoverSpread = useCallback(() => {
    let coverSelectionId: string | null = null

    applyDocumentChange(
      (doc) => {
        const existingCover = doc.spreads.find((spread) => spread.isCover)
        if (existingCover) {
          if (doc.activeSpreadId === existingCover.id && doc.activeSide === 'front') return doc
          return {
            ...doc,
            activeSpreadId: existingCover.id,
            activeSide: 'front',
          }
        }

        const newId = uuidv4()
        const coverSpread = DEFAULT_COVER_SPREAD(newId, undefined, SPREAD_WIDTH, SPREAD_HEIGHT)
        coverSelectionId = coverSpread.elements[0]?.id || null

        const normalizedSpreads = doc.spreads.map((spread) => ({
          ...spread,
          isCover: false,
        }))

        return {
          ...doc,
          activeSpreadId: coverSpread.id,
          activeSide: 'front',
          spreads: [coverSpread, ...normalizedSpreads],
        }
      },
      { historyGroup: 'spread' }
    )

    setSelection(coverSelectionId ? [coverSelectionId] : [])
  }, [applyDocumentChange])

  const duplicateSpread = useCallback(
    (spreadId: string) => {
      applyDocumentChange(
        (doc) => {
          const index = doc.spreads.findIndex((spread) => spread.id === spreadId)
          if (index < 0) return doc

          const source = doc.spreads[index]
          const newId = uuidv4()
          // Fresh element ids, or the copy and the original would be the same
          // objects as far as selection and the transformer are concerned.
          const cloneSide = (side: AlbumPageSide | undefined): AlbumPageSide => ({
            background: side?.background ?? '#ffffff',
            elements: (side?.elements ?? []).map((el) => ({ ...el, id: uuidv4() })),
          })

          const front = cloneSide(getSpreadSide(source, 'front'))
          const copy: AlbumSpread = {
            id: newId,
            // Only one spread may be the cover, so a duplicated cover becomes
            // an ordinary page rather than a second one.
            isCover: false,
            background: source.background,
            elements: front.elements,
            front,
            back: cloneSide(getSpreadSide(source, 'back')),
          }

          const nextSpreads = [...doc.spreads]
          nextSpreads.splice(index + 1, 0, copy)

          return { ...doc, spreads: nextSpreads, activeSpreadId: newId, activeSide: 'front' }
        },
        { historyGroup: 'spread' }
      )
      setSelection([])
    },
    [applyDocumentChange]
  )

  const canDeleteSpread = useCallback(
    (spreadId: string) => {
      if (!documentState.spreads.some((spread) => spread.id === spreadId)) {
        return false
      }

      return documentState.spreads.length > 1
    },
    [documentState.spreads]
  )

  const deleteSpread = useCallback(
    (spreadId: string) => {
      if (!canDeleteSpread(spreadId)) return

      const target = documentState.spreads.find((spread) => spread.id === spreadId)
      if (!target) return

      const label = target.isCover ? 'cover page' : 'page'
      const confirmed = window.confirm(`Delete this ${label}? This action cannot be undone.`)
      if (!confirmed) return

      applyDocumentChange(
        (doc) => {
          const targetIndex = doc.spreads.findIndex((spread) => spread.id === spreadId)
          if (targetIndex < 0) return doc
          if (doc.spreads.length <= 1) return doc

          const nextSpreads = doc.spreads.filter((spread) => spread.id !== spreadId)
          const fallbackIndex = Math.min(targetIndex, nextSpreads.length - 1)
          const nextActive = nextSpreads[fallbackIndex]?.id ?? nextSpreads[0]?.id ?? null

          return {
            ...doc,
            spreads: nextSpreads,
            activeSpreadId: nextActive,
            activeSide: 'front',
          }
        },
        { historyGroup: 'spread' }
      )

      setSelection([])
    },
    [applyDocumentChange, canDeleteSpread, documentState.spreads]
  )

  const reorderSpreads = useCallback(
    (sourceId: string, targetId: string) => {
      if (sourceId === targetId) return

      applyDocumentChange(
        (doc) => {
          const fromIndex = doc.spreads.findIndex((spread) => spread.id === sourceId)
          const toIndex = doc.spreads.findIndex((spread) => spread.id === targetId)
          if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return doc

          const nextSpreads = [...doc.spreads]
          const [moved] = nextSpreads.splice(fromIndex, 1)
          nextSpreads.splice(toIndex, 0, moved)

          return {
            ...doc,
            spreads: nextSpreads,
          }
        },
        { historyGroup: 'spread-order' }
      )
    },
    [applyDocumentChange]
  )

  const setZoom = useCallback((value: number) => {
    userSetZoomRef.current = true
    setZoomState(Math.max(10, Math.min(300, Math.round(value))))
  }, [])

  /**
   * Fit the page to whatever room the canvas actually has.
   *
   * The old default was a flat 50%, which on a laptop left the page floating
   * in a third of the screen and on a wide monitor wasted half of it.
   */
  const zoomToFit = useCallback(() => {
    const node = viewportRef.current
    if (!node) return
    const padding = 48
    const available = {
      width: node.clientWidth - padding,
      height: node.clientHeight - padding,
    }
    if (available.width <= 0 || available.height <= 0) return

    const fit = Math.min(available.width / SPREAD_WIDTH, available.height / SPREAD_HEIGHT) * 100
    userSetZoomRef.current = true
    setZoomState(Math.max(10, Math.min(300, Math.floor(fit))))
  }, [SPREAD_WIDTH, SPREAD_HEIGHT])

  // Pinch-to-zoom on the canvas viewport. The container sets
  // `touch-action: pan-x pan-y`, which suppresses the browser's own pinch, so
  // without this a two-finger gesture on the canvas did nothing at all and the
  // only way to zoom on a phone was the toolbar buttons.
  const pinchRef = useRef<{ startDistance: number; startZoom: number } | null>(null)

  useEffect(() => {
    const node = viewportRef.current
    if (!node) return

    const distanceBetween = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.hypot(dx, dy)
    }

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return
      pinchRef.current = {
        startDistance: distanceBetween(event.touches),
        startZoom: zoomRef.current,
      }
    }

    const onTouchMove = (event: TouchEvent) => {
      const pinch = pinchRef.current
      if (!pinch || event.touches.length !== 2) return
      // Stop the scroll container from panning while the pinch is in progress.
      event.preventDefault()

      const distance = distanceBetween(event.touches)
      if (pinch.startDistance <= 0) return
      setZoom(pinch.startZoom * (distance / pinch.startDistance))
    }

    const endPinch = () => {
      pinchRef.current = null
    }

    // Passive must be off on touchmove for preventDefault to take effect.
    node.addEventListener('touchstart', onTouchStart, { passive: true })
    node.addEventListener('touchmove', onTouchMove, { passive: false })
    node.addEventListener('touchend', endPinch)
    node.addEventListener('touchcancel', endPinch)

    return () => {
      node.removeEventListener('touchstart', onTouchStart)
      node.removeEventListener('touchmove', onTouchMove)
      node.removeEventListener('touchend', endPinch)
      node.removeEventListener('touchcancel', endPinch)
    }
  }, [setZoom])

  const setSelectionSafe = useCallback((ids: string[]) => {
    setSelection(ids)
  }, [])

  const handleToggleLock = useCallback(
    (id: string) => {
      const target = activeSpreadSide.elements.find((el) => el.id === id)
      if (!target) return
      updateElement(id, { locked: !target.locked }, { historyGroup: 'lock-layer' })
    },
    [activeSpreadSide, updateElement]
  )

  const handleToggleHidden = useCallback(
    (id: string) => {
      const target = activeSpreadSide.elements.find((el) => el.id === id)
      if (!target) return
      updateElement(id, { hidden: !target.hidden }, { historyGroup: 'hide-layer' })
      if (!target.hidden) {
        setSelection((prev) => prev.filter((s) => s !== id))
      }
    },
    [activeSpreadSide, updateElement]
  )

  const moveLayer = useCallback(
    (id: string, direction: 'up' | 'down') => {
      applyDocumentChange(
        (doc) => {
          const spreadIndex = doc.spreads.findIndex((sp) => sp.id === doc.activeSpreadId)
          if (spreadIndex < 0) return doc
          const spread = doc.spreads[spreadIndex]
          const side = getSpreadSide(spread, doc.activeSide)

          const ordered = [...side.elements].sort((a, b) => a.zIndex - b.zIndex)
          const index = ordered.findIndex((el) => el.id === id)
          if (index < 0) return doc

          const targetIndex =
            direction === 'up'
              ? Math.min(ordered.length - 1, index + 1)
              : Math.max(0, index - 1)
          if (targetIndex === index) return doc

          const swap = ordered[targetIndex]
          ordered[targetIndex] = ordered[index]
          ordered[index] = swap

          const reordered = ordered.map((el, orderIndex) => ({
            ...el,
            zIndex: orderIndex + 1,
          }))

          const nextSpreads = [...doc.spreads]
          nextSpreads[spreadIndex] = withSpreadSide(spread, doc.activeSide, {
            ...side,
            elements: reordered,
          })
          return { ...doc, spreads: nextSpreads }
        },
        { historyGroup: 'layer-order' }
      )
    },
    [applyDocumentChange]
  )

  const alignSelection = useCallback(
    (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      applyDocumentChange(
        (doc) => {
          const spreadIndex = doc.spreads.findIndex((sp) => sp.id === doc.activeSpreadId)
          if (spreadIndex < 0) return doc
          const spread = doc.spreads[spreadIndex]
          const side = getSpreadSide(spread, doc.activeSide)
          const targets = side.elements.filter((el) => selection.includes(el.id) && !el.locked && !el.hidden)

          if (targets.length === 0) return doc

          if (targets.length === 1) {
            const target = targets[0]
            let nextX = target.x
            let nextY = target.y

            if (mode === 'left') nextX = PAGE_MARGIN
            if (mode === 'center') nextX = (SPREAD_WIDTH - target.width) / 2
            if (mode === 'right') nextX = SPREAD_WIDTH - PAGE_MARGIN - target.width
            if (mode === 'top') nextY = PAGE_MARGIN
            if (mode === 'middle') nextY = (SPREAD_HEIGHT - target.height) / 2
            if (mode === 'bottom') nextY = SPREAD_HEIGHT - PAGE_MARGIN - target.height

            const nextElements = side.elements.map((el) => {
              if (el.id !== target.id) return el
              return {
                ...el,
                x: Math.max(0, Math.min(SPREAD_WIDTH - target.width, nextX)),
                y: Math.max(0, Math.min(SPREAD_HEIGHT - target.height, nextY)),
              }
            })

            const nextSpreads = [...doc.spreads]
            nextSpreads[spreadIndex] = withSpreadSide(spread, doc.activeSide, {
              ...side,
              elements: nextElements,
            })
            return { ...doc, spreads: nextSpreads }
          }

          const minX = Math.min(...targets.map((el) => el.x))
          const maxX = Math.max(...targets.map((el) => el.x + el.width))
          const minY = Math.min(...targets.map((el) => el.y))
          const maxY = Math.max(...targets.map((el) => el.y + el.height))

          const nextElements = side.elements.map((el) => {
            if (!selection.includes(el.id) || el.locked || el.hidden) return el
            if (mode === 'left') return { ...el, x: minX }
            if (mode === 'center') return { ...el, x: minX + (maxX - minX - el.width) / 2 }
            if (mode === 'right') return { ...el, x: maxX - el.width }
            if (mode === 'top') return { ...el, y: minY }
            if (mode === 'middle') return { ...el, y: minY + (maxY - minY - el.height) / 2 }
            return { ...el, y: maxY - el.height }
          })

          const nextSpreads = [...doc.spreads]
          nextSpreads[spreadIndex] = withSpreadSide(spread, doc.activeSide, {
            ...side,
            elements: nextElements,
          })
          return { ...doc, spreads: nextSpreads }
        },
        { historyGroup: 'align' }
      )
    },
    [applyDocumentChange, selection]
  )

  const distributeSelection = useCallback(
    (axis: 'horizontal' | 'vertical') => {
      applyDocumentChange(
        (doc) => {
          const spreadIndex = doc.spreads.findIndex((sp) => sp.id === doc.activeSpreadId)
          if (spreadIndex < 0) return doc
          const spread = doc.spreads[spreadIndex]
          const side = getSpreadSide(spread, doc.activeSide)

          const targets = side.elements
            .filter((el) => selection.includes(el.id) && !el.locked && !el.hidden)
            .sort((a, b) => (axis === 'horizontal' ? a.x - b.x : a.y - b.y))

          if (targets.length < 3) return doc

          const first = targets[0]
          const last = targets[targets.length - 1]
          const totalSize = targets.reduce((sum, el) => sum + (axis === 'horizontal' ? el.width : el.height), 0)
          const span = axis === 'horizontal' ? last.x + last.width - first.x : last.y + last.height - first.y
          const gap = (span - totalSize) / (targets.length - 1)

          let cursor = axis === 'horizontal' ? first.x : first.y
          const map = new Map<string, number>()

          targets.forEach((el, index) => {
            if (index === 0) {
              cursor += axis === 'horizontal' ? el.width + gap : el.height + gap
              return
            }
            if (index === targets.length - 1) return
            map.set(el.id, cursor)
            cursor += axis === 'horizontal' ? el.width + gap : el.height + gap
          })

          const nextElements = side.elements.map((el) => {
            const value = map.get(el.id)
            if (value === undefined) return el
            return axis === 'horizontal' ? { ...el, x: value } : { ...el, y: value }
          })

          const nextSpreads = [...doc.spreads]
          nextSpreads[spreadIndex] = withSpreadSide(spread, doc.activeSide, {
            ...side,
            elements: nextElements,
          })
          return { ...doc, spreads: nextSpreads }
        },
        { historyGroup: 'distribute' }
      )
    },
    [applyDocumentChange, selection]
  )

  const handleDeleteSelection = useCallback(() => {
    if (selection.length === 0) return
    deleteElements(selection)
  }, [selection, deleteElements])

  /** Copy the selection, offset a little so it reads as a second object. */
  const duplicateSelection = useCallback(() => {
    if (selection.length === 0) return

    const created: string[] = []
    applyDocumentChange(
      (doc) => {
        const spreadIndex = doc.spreads.findIndex((sp) => sp.id === doc.activeSpreadId)
        if (spreadIndex < 0) return doc
        const spread = doc.spreads[spreadIndex]
        const side = getSpreadSide(spread, doc.activeSide)

        const targets = side.elements.filter((el) => selection.includes(el.id))
        if (targets.length === 0) return doc

        let nextZ = Math.max(0, ...side.elements.map((el) => el.zIndex))
        const copies = targets.map((el) => {
          nextZ += 1
          const id = uuidv4()
          created.push(id)
          return {
            ...el,
            id,
            zIndex: nextZ,
            locked: false,
            x: Math.min(SPREAD_WIDTH - el.width, el.x + 24),
            y: Math.min(SPREAD_HEIGHT - el.height, el.y + 24),
          } as AlbumElement
        })

        const nextSpreads = [...doc.spreads]
        nextSpreads[spreadIndex] = withSpreadSide(spread, doc.activeSide, {
          ...side,
          elements: normalizeZIndex([...side.elements, ...copies]),
        })
        return { ...doc, spreads: nextSpreads }
      },
      { historyGroup: 'duplicate' }
    )

    if (created.length > 0) setSelection(created)
  }, [applyDocumentChange, selection, SPREAD_WIDTH, SPREAD_HEIGHT])

  const handleAiRemoveBackground = useCallback(async () => {
    const target = selectedElements.find((el) => el.type === 'image')
    if (!target || target.type !== 'image') return false

    try {
      const processed = await removeBackgroundHeuristic(target.src)
      updateElement(
        target.id,
        {
          src: processed,
          fitMode: 'fit',
        },
        { historyGroup: 'ai-remove-bg' }
      )
      return true
    } catch {
      return false
    }
  }, [selectedElements, updateElement])

  const handleSelectSpread = useCallback((id: string, side: SpreadSide = 'front') => {
    setDocumentState((doc) => ({ ...doc, activeSpreadId: id, activeSide: side }))
    setSelection([])
  }, [])

  const handleApplyTemplate = useCallback(async (templateId: string) => {
    const targetTemplate = templates.find((template) => template.id === templateId)
    if (!targetTemplate || !targetTemplate.spreads.length) return false

    const normalizedTemplate = normalizeSpreads(targetTemplate.spreads)
    const imagePool = collectPhotoPool(documentState.spreads, photoList)
    const remappedSpreads = applyImagePoolToSpreads(normalizedTemplate, imagePool)

    applyDocumentChange(
      (doc) => ({
        ...doc,
        spreads: remappedSpreads,
        activeSpreadId: remappedSpreads[0]?.id || null,
        activeSide: 'front',
      }),
      { historyGroup: 'template-switch' }
    )

    setSelection([])
    setActiveTemplateId(templateId)
    setLayoutMeta((previous) => ({ ...previous, templateId, productType: 'magazine' }))
    setActivePanel('photos')
    return true
  }, [applyDocumentChange, documentState.spreads, photoList, templates])

  const setSpreadBackground = useCallback(
    (background: string, applyToAll: boolean = false) => {
      applyDocumentChange(
        (doc) => {
          if (applyToAll) {
            return {
              ...doc,
              spreads: doc.spreads.map((spread) => ({
                ...spread,
                front: { ...(spread.front ?? { elements: [] }), background },
                back: { ...(spread.back ?? { elements: [] }), background }
              }))
            }
          }

          const spreadIndex = doc.spreads.findIndex((sp) => sp.id === doc.activeSpreadId)
          if (spreadIndex < 0) return doc

          const spread = doc.spreads[spreadIndex]
          const side = getSpreadSide(spread, doc.activeSide)
          if (side.background === background) return doc

          const nextSpreads = [...doc.spreads]
          nextSpreads[spreadIndex] = withSpreadSide(spread, doc.activeSide, {
            ...side,
            background,
          })

          return {
            ...doc,
            spreads: nextSpreads,
          }
        },
        { historyGroup: 'background' }
      )
    },
    [applyDocumentChange]
  )

  if (!activeSpread) {
    return null
  }

  const reframeElement = reframeId
    ? activeSpreadSide.elements.find((el) => el.id === reframeId && el.type === 'image')
    : null

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-background font-sans text-foreground">
      <Sidebar
        activePanel={activePanel}
        onChangePanel={(panel) => {
          setActivePanel(panel)
          if (isMobile) setSidebarOpen(true)
        }}
        onAddElement={addElement}
        photos={photoList}
        onUploadPhotos={handleUploadPhotos}
        uploading={uploading}
        spreadBackground={activeSpreadSide.background}
        onSetSpreadBackground={setSpreadBackground}
        templates={templates}
        activeTemplateId={activeTemplateId}
        onApplyTemplate={handleApplyTemplate}
        elements={activeSpreadSide.elements}
        selection={selection}
        onSelect={setSelectionSafe}
        onToggleLock={handleToggleLock}
        onToggleHidden={handleToggleHidden}
        onMoveLayer={moveLayer}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* One backdrop for whichever drawer is open on a small screen. */}
      {isMobile && (sidebarOpen || inspectorOpen) ? (
        <div
          className="fixed inset-0 z-20 bg-black/40 transition-opacity"
          onClick={() => {
            setSidebarOpen(false)
            setInspectorOpen(false)
          }}
        />
      ) : null}

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Topbar
          albumTitle={title}
          onRenameAlbum={(next) => void handleRenameAlbum(next)}
          renaming={renamingTitle}
          zoom={zoom}
          setZoom={setZoom}
          onZoomToFit={zoomToFit}
          showGrid={showGrid}
          onToggleGrid={toggleGrid}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          saveLabel={formatSaveStatus(saveStatus, lastSavedAt)}
          saveTone={saveStatus === 'error' ? 'error' : saveStatus === 'saving' || saveStatus === 'dirty' ? 'busy' : 'idle'}
          saving={saveStatus === 'saving'}
          onSaveNow={() => void persistDraft()}
          onBack={handleBackToSite}
          albumId={albumId}
          isMobile={isMobile}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onToggleInspector={() => setInspectorOpen((open) => !open)}
          inspectorOpen={inspectorOpen}
        />

        <SpecStrip
          spreadIndex={activeSpreadIndex}
          spreadCount={documentState.spreads.length}
          isCover={activeSpread?.isCover}
          widthUnits={SPREAD_WIDTH}
          heightUnits={SPREAD_HEIGHT}
          pageSizeMm={pageSizeMm}
        />

        <div
          ref={viewportRef}
          className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto bg-surface-2 p-3 touch-pan-x touch-pan-y md:p-7"
          style={{
            // A faint measuring grid on the table itself, so the page reads as
            // a sheet laid on a surface rather than a floating rectangle.
            backgroundImage:
              'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            backgroundPosition: '-1px -1px',
          }}
        >
          <Workspace
            spread={activeSpreadView || activeSpread}
            zoom={zoom}
            showGrid={showGrid}
            selection={selection}
            setSelection={setSelectionSafe}
            updateElement={updateElement}
            deleteElements={deleteElements}
            onDropElement={addElementAt}
            isDrawingMode={isDrawingMode}
            brushColor={brushColor}
            brushSize={brushSize}
            photos={photoList}
          />
        </div>

        <Timeline
          spreads={documentState.spreads}
          activeSpreadId={documentState.activeSpreadId}
          activeSide={documentState.activeSide}
          pageWidth={SPREAD_WIDTH}
          pageHeight={SPREAD_HEIGHT}
          onSelectSpread={handleSelectSpread}
          onAddSpread={addSpread}
          onAddCoverSpread={addCoverSpread}
          onDuplicateSpread={duplicateSpread}
          onDeleteSpread={deleteSpread}
          canDeleteSpread={canDeleteSpread}
          onReorderSpreads={reorderSpreads}
        />
      </div>

      <Inspector
        selected={selectedElements}
        onUpdate={updateElement}
        onDelete={handleDeleteSelection}
        onDuplicate={duplicateSelection}
        onAlign={alignSelection}
        onDistribute={distributeSelection}
        onMoveLayer={moveLayer}
        onToggleLock={handleToggleLock}
        onToggleHidden={handleToggleHidden}
        onReplacePhoto={() => {
          setActivePanel('photos')
          if (isMobile) {
            setInspectorOpen(false)
            setSidebarOpen(true)
          }
        }}
        onReframe={(id) => setReframeId(id)}
        onRemoveBackground={handleAiRemoveBackground}
        pageWidth={SPREAD_WIDTH}
        pageHeight={SPREAD_HEIGHT}
        isMobile={isMobile}
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
      />

      {reframeElement && reframeElement.type === 'image' ? (
        <ReframeModal
          imageSrc={reframeElement.src}
          aspectRatio={reframeElement.width / reframeElement.height}
          initialCrop={reframeElement.crop}
          onSave={(crop) => {
            updateElement(reframeElement.id, { crop, fitMode: 'fill' }, { historyGroup: 'reframe' })
            setReframeId(null)
          }}
          onClose={() => setReframeId(null)}
        />
      ) : null}
    </div>
  )
}
