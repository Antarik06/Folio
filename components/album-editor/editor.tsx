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

const DEFAULT_COVER_SPREAD = (id: string): AlbumSpread => ({
  id,
  isCover: true,
  background: '#f8f4ec',
  elements: [
    {
      id: `cover-title-${id}`,
      type: 'text',
      name: 'Cover Title',
      x: 70,
      y: 430,
      text: 'Album Cover',
      fontSize: 72,
      fontFamily: 'serif',
      fill: '#1c1814',
      rotation: 0,
      width: 560,
      height: 110,
      zIndex: 1,
      fontWeight: 'bold',
      textAlign: 'center',
      lineHeight: 1.1,
      letterSpacing: 0,
    },
  ],
  front: {
    background: '#f8f4ec',
    elements: [
      {
        id: `cover-title-${id}`,
        type: 'text',
        name: 'Cover Title',
        x: 70,
        y: 430,
        text: 'Album Cover',
        fontSize: 72,
        fontFamily: 'serif',
        fill: '#1c1814',
        rotation: 0,
        width: 560,
        height: 110,
        zIndex: 1,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 1.1,
        letterSpacing: 0,
      },
    ],
  },
  back: {
    background: '#ffffff',
    elements: [],
  },
})

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
      name: el.name || 'Photo Layer',
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

  return {
    ...el,
    name: el.name || `${el.shapeType[0].toUpperCase()}${el.shapeType.slice(1)} Layer`,
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

export function AlbumEditor({ albumId, initialSpreads, photos = [], layoutField = 'layout_data' }: EditorProps) {
  const router = useRouter()
  const fallbackSpreads = useMemo(
    () => normalizeSpreads(initialSpreads?.length ? initialSpreads : [DEFAULT_SPREAD]),
    [initialSpreads]
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
  const [activePanel, setActivePanel] = useState<'design' | 'elements' | 'photos' | 'uploads' | 'text'>('photos')
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

          const nextSpreads = [...doc.spreads]
          nextSpreads[spreadIndex] = withSpreadSide(spread, doc.activeSide, {
            ...side,
            elements: normalizeZIndex(ordered),
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

  const handleSelectSpread = useCallback((id: string) => {
    setDocumentState((doc) => ({ ...doc, activeSpreadId: id, activeSide: 'front' }))
    setSelection([])
  }, [])

  const handleChangeSide = useCallback((side: SpreadSide) => {
    setDocumentState((doc) => ({ ...doc, activeSide: side }))
    setSelection([])
  }, [])

  const setSpreadBackground = useCallback(
    (background: string) => {
      applyDocumentChange(
        (doc) => {
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F1F2F4] dark:bg-[#12100D] text-foreground font-sans transition-colors">
      <Sidebar
        activePanel={activePanel}
        onChangePanel={setActivePanel}
        onAddElement={addElement}
        photos={photos}
        onGoBack={handleBackToSite}
        spreadBackground={activeSpreadSide.background}
        onSetSpreadBackground={setSpreadBackground}
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
        />
      </div>

      <div className="fixed bottom-4 right-4 z-50 px-3 py-2 rounded-md border border-border bg-popover/95 text-popover-foreground shadow-lg text-xs font-medium backdrop-blur-sm">
        {formatSaveStatus(saveStatus, lastSavedAt)}
      </div>
    </div>
  )
}
