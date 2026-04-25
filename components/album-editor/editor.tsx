'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Konva from 'konva'
import { useRouter } from 'next/navigation'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { AlbumSpread, AlbumElement, AlbumPageSide, TextElement } from './types'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { Workspace } from './workspace'
import { Timeline } from './timeline'
import { LayersPanel } from './layers-panel'

interface EditorProps {
  albumId: string
  initialSpreads?: AlbumSpread[]
  photos?: any[]
  layoutField?: 'layout_data' | 'theme_config'
  coverImageUrl?: string
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

const DEFAULT_COVER_SPREAD = (id: string, coverImageUrl?: string): AlbumSpread => {
  const elements: AlbumElement[] = []

  if (coverImageUrl) {
    elements.push({
      id: `cover-image-${id}`,
      type: 'image',
      name: 'Album Art',
      src: coverImageUrl,
      x: 0,
      y: 0,
      width: SPREAD_WIDTH,
      height: SPREAD_HEIGHT,
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
    x: 70,
    y: coverImageUrl ? 800 : 430, // Position lower if there's an image
    text: 'Album Cover',
    fontSize: 72,
    fontFamily: 'serif',
    fill: coverImageUrl ? '#ffffff' : '#1c1814', // Light text if image background
    rotation: 0,
    width: 560,
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
const SPREAD_WIDTH = 700
const SPREAD_HEIGHT = 1000
const PAGE_MARGIN = 40
type SpreadSide = 'front' | 'back'

function normalizeZIndex(elements: AlbumElement[]) {
  return [...elements]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((el, index) => ({ ...el, zIndex: index + 1 }))
}

function inferImageLayerName(src: string) {
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

function parseHexColor(hex: string) {
  const normalized = hex.trim()

  const short = normalized.match(/^#([0-9A-Fa-f]{3})$/)
  if (short) {
    const [r, g, b] = short[1].split('')
    return {
      r: Number.parseInt(r + r, 16),
      g: Number.parseInt(g + g, 16),
      b: Number.parseInt(b + b, 16),
    }
  }

  const full = normalized.match(/^#([0-9A-Fa-f]{6})$/)
  if (full) {
    return {
      r: Number.parseInt(full[1].slice(0, 2), 16),
      g: Number.parseInt(full[1].slice(2, 4), 16),
      b: Number.parseInt(full[1].slice(4, 6), 16),
    }
  }

  return null
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

async function recolorLikelyMonochromeImage(src: string, colorHex: string) {
  const target = parseHexColor(colorHex)
  if (!target) {
    throw new Error('Invalid color format')
  }

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
  let opaqueCount = 0
  let translucentCount = 0
  let saturationTotal = 0

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]
    if (alpha < 10) continue
    opaqueCount += 1
    if (alpha < 250) translucentCount += 1
    saturationTotal += rgbToSaturation(data[i], data[i + 1], data[i + 2])
  }

  if (opaqueCount === 0) {
    throw new Error('No drawable pixels')
  }

  const alphaCoverage = opaqueCount / (width * height)
  const avgSaturation = saturationTotal / opaqueCount
  const translucentRatio = translucentCount / opaqueCount
  const likelyGraphic = alphaCoverage < 0.86 || translucentRatio > 0.03 || avgSaturation < 0.25

  if (!likelyGraphic) {
    return null
  }

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]
    if (alpha < 10) continue

    const luminance = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255
    const tone = 0.36 + luminance * 0.64

    data[i] = Math.round(target.r * tone)
    data[i + 1] = Math.round(target.g * tone)
    data[i + 2] = Math.round(target.b * tone)
  }

  context.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

export function AlbumEditor({
  albumId,
  initialSpreads,
  photos = [],
  layoutField = 'layout_data',
  coverImageUrl,
}: EditorProps) {
  const router = useRouter()
  const fallbackSpreads = useMemo(
    () => normalizeSpreads(initialSpreads?.length ? initialSpreads : [DEFAULT_COVER_SPREAD('spread-0', coverImageUrl), DEFAULT_SPREAD]),
    [initialSpreads, coverImageUrl]
  )

  const [documentState, setDocumentState] = useState<EditorDocumentState>({
    spreads: fallbackSpreads,
    activeSpreadId: fallbackSpreads[0]?.id || null,
    activeSide: 'front',
  })
  const [selection, setSelection] = useState<string[]>([])
  const [zoom, setZoomState] = useState<number>(50)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [layoutSaveField, setLayoutSaveField] = useState<'layout_data' | 'theme_config'>(layoutField)
  const [activePanel, setActivePanel] = useState<'design' | 'elements' | 'photos' | 'uploads' | 'text' | 'ai' | 'draw' | 'projects'>('photos')
  
  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [brushColor, setBrushColor] = useState('#1C1814')
  const [brushSize, setBrushSize] = useState(5)
  const [showGrid, setShowGrid] = useState(true)

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

  const activeSpread = useMemo(() => {
    return documentState.spreads.find((s) => s.id === documentState.activeSpreadId) || documentState.spreads[0]
  }, [documentState])

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

  const canUndo = historyRef.current.past.length > 0
  const canRedo = historyRef.current.future.length > 0

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
      }
    },
    []
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
    }
  }, [])

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
    }
  }, [])

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

      const draftDocument = {
        spreads: documentState.spreads,
        activeSpreadId: documentState.activeSpreadId,
      }

      const firstTry = await supabase
        .from('albums')
        .update({ [layoutSaveField]: draftDocument } as any)
        .eq('id', albumId)

      if (firstTry.error) {
        const fallbackField = layoutSaveField === 'layout_data' ? 'theme_config' : 'layout_data'
        const fallbackTry = await supabase
          .from('albums')
          .update({ [fallbackField]: draftDocument } as any)
          .eq('id', albumId)

        if (fallbackTry.error) {
          throw fallbackTry.error
        }
        setLayoutSaveField(fallbackField)
      }

      setLastSavedAt(new Date())
      setSaveStatus('saved')
      return true
    } catch {
      setSaveStatus('error')
      return false
    }
  }, [albumId, documentState, layoutSaveField, supabase])

  const handleBackToSite = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.push('/dashboard')
  }, [router])

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

  const addElement = useCallback(
    (element: Omit<AlbumElement, 'id' | 'zIndex'>) => {
      applyDocumentChange(
        (doc) => {
          const spreadIndex = doc.spreads.findIndex((sp) => sp.id === doc.activeSpreadId)
          if (spreadIndex < 0) return doc

          const spread = doc.spreads[spreadIndex]
          const side = getSpreadSide(spread, doc.activeSide)
          const nextZ = Math.max(0, ...side.elements.map((el) => el.zIndex)) + 1
          const inserted = normalizeElement({
            ...element,
            id: uuidv4(),
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
    },
    [applyDocumentChange]
  )

  const addElementAt = useCallback(
    (element: Omit<AlbumElement, 'id' | 'zIndex'>, position: { x: number; y: number }) => {
      addElement({ ...element, x: position.x, y: position.y })
    },
    [addElement]
  )

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
        const coverSpread = DEFAULT_COVER_SPREAD(newId)
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
    setZoomState(Math.max(10, Math.min(300, value)))
  }, [])

  const setSelectionSafe = useCallback((ids: string[]) => {
    setSelection(ids)
  }, [])

  const handleRenameLayer = useCallback(
    (id: string, name: string) => {
      updateElement(id, { name }, { historyGroup: 'rename-layer' })
    },
    [updateElement]
  )

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

  const handleAiFillColor = useCallback(
    async (color: string) => {
      const target = selectedElements[0]
      if (!target) return false

      if (target.type === 'text' || target.type === 'shape') {
        updateElement(target.id, { fill: color }, { historyGroup: 'ai-fill-color' })
        return true
      }

      if (target.type === 'image') {
        try {
          const processed = await recolorLikelyMonochromeImage(target.src, color)
          if (!processed) return false

          updateElement(
            target.id,
            {
              src: processed,
              fitMode: 'fit',
            },
            { historyGroup: 'ai-fill-color' }
          )
          return true
        } catch {
          return false
        }
      }

      return false
    },
    [selectedElements, updateElement]
  )

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

  const handleSelectSpread = useCallback((id: string) => {
    setDocumentState((doc) => ({ ...doc, activeSpreadId: id, activeSide: 'front' }))
    setSelection([])
    setIsDrawingMode(false)
  }, [])

  const handleChangeSide = useCallback((side: SpreadSide) => {
    setDocumentState((doc) => ({ ...doc, activeSide: side }))
    setSelection([])
    setIsDrawingMode(false)
  }, [])

  const handleSwitchAlbum = useCallback((id: string) => {
    router.push(`/editor/${id}`)
  }, [router])

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

  const handleExport = useCallback(async () => {
    const confirmed = window.confirm("Do you want to go to the order page? Designing is complete.")
    if (confirmed) {
      const saved = await persistDraft()
      if (saved) {
        router.push(`/preview/${albumId}`)
      }
    }
  }, [albumId, persistDraft, router])

  if (!activeSpread) {
    return null
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F1F2F4] dark:bg-[#12100D] text-foreground font-sans transition-colors">
      <Sidebar
        activePanel={activePanel}
        onChangePanel={(panel) => {
          setActivePanel(panel)
          if (panel !== 'draw') setIsDrawingMode(false)
        }}
        onAddElement={addElement}
        photos={photos}
        onGoBack={handleBackToSite}
        spreadBackground={activeSpreadSide.background}
        onSetSpreadBackground={setSpreadBackground}
        selectedElements={selectedElements}
        onAiFillColor={handleAiFillColor}
        onAiRemoveBackground={handleAiRemoveBackground}
  // Drawing
        isDrawingMode={isDrawingMode}
        onToggleDrawingMode={setIsDrawingMode}
        brushColor={brushColor}
        onChangeBrushColor={setBrushColor}
        brushSize={brushSize}
        onChangeBrushSize={setBrushSize}
        
        // Projects
        currentAlbumId={albumId}
        onSwitchAlbum={handleSwitchAlbum}
      />

      <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300">
        <Topbar
          albumId={albumId}
          zoom={zoom}
          setZoom={setZoom}
          selectedElements={selectedElements}
          onUpdateElement={updateElement}
          onDeleteSelected={handleDeleteSelection}
          photos={photos}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onSaveNow={() => {
            void (async () => {
              const saved = await persistDraft()
              if (saved) {
                handleBackToSite()
              }
            })()
          }}
          onExport={handleExport}
          onAlign={alignSelection}
          onDistribute={distributeSelection}
          showGrid={showGrid}
          onToggleGrid={toggleGrid}
        />

        <div className="flex-1 min-h-0 flex bg-[#E5E5E5] dark:bg-[#171411] transition-colors">
          <div className="flex-1 relative overflow-auto touch-pan-x touch-pan-y flex items-center justify-center p-8">
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
            />
          </div>

          <LayersPanel
            elements={activeSpreadSide.elements}
            selection={selection}
            onSelect={setSelectionSafe}
            onRename={handleRenameLayer}
            onToggleLock={handleToggleLock}
            onToggleHidden={handleToggleHidden}
            onMoveUp={(id) => moveLayer(id, 'up')}
            onMoveDown={(id) => moveLayer(id, 'down')}
          />
        </div>

        <Timeline
          spreads={documentState.spreads}
          activeSpreadId={documentState.activeSpreadId}
          activeSide={documentState.activeSide}
          onSelectSpread={handleSelectSpread}
          onChangeSide={handleChangeSide}
          onAddSpread={addSpread}
          onAddCoverSpread={addCoverSpread}
          onDeleteSpread={deleteSpread}
          canDeleteSpread={canDeleteSpread}
          onReorderSpreads={reorderSpreads}
        />
      </div>

      <div className="fixed bottom-4 right-4 z-50 px-3 py-2 rounded-md border border-border bg-popover/95 text-popover-foreground shadow-lg text-xs font-medium backdrop-blur-sm">
        {formatSaveStatus(saveStatus, lastSavedAt)}
      </div>
    </div>
  )
}
