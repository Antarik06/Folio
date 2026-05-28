'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Text, Transformer, Rect, Circle, Line } from 'react-konva'
import useImage from 'use-image'
import { AlbumSpread, AlbumElement, DrawingElement } from './types'
import Konva from 'konva'

interface URLImageProps {
  imageSrc: string
  fitMode?: 'fit' | 'fill'
  width: number
  height: number
  [key: string]: any
}

const RemoteImage = ({ imageSrc, fitMode = 'fit', width, height, ...props }: URLImageProps) => {
  const [image] = useImage(imageSrc, 'anonymous')

  let crop: { x: number; y: number; width: number; height: number } | undefined

  if (image && fitMode === 'fill') {
    const imageRatio = image.width / image.height
    const frameRatio = width / height

    if (imageRatio > frameRatio) {
      const cropWidth = image.height * frameRatio
      crop = {
        x: (image.width - cropWidth) / 2,
        y: 0,
        width: cropWidth,
        height: image.height,
      }
    } else {
      const cropHeight = image.width / frameRatio
      crop = {
        x: 0,
        y: (image.height - cropHeight) / 2,
        width: image.width,
        height: cropHeight,
      }
    }
  }

  return <KonvaImage image={image} crop={crop} width={width} height={height} {...props} />
}

interface WorkspaceProps {
  spread: AlbumSpread
  zoom: number
  showGrid: boolean
  selection: string[]
  setSelection: (ids: string[]) => void
  updateElement: (id: string, partial: Partial<AlbumElement>, options?: { historyGroup?: string }) => void
  deleteElements: (ids: string[]) => void
  onDropElement: (el: Omit<AlbumElement, 'id' | 'zIndex'>, position: { x: number; y: number }) => void
  watermarkText?: string | null
  blockContextMenu?: boolean
  isDrawingMode?: boolean
  brushColor?: string
  brushSize?: number
}

const DRAG_MIME = 'application/x-folio-album-element'
const SPREAD_WIDTH = 700
const SPREAD_HEIGHT = 1000
const SNAP_TOLERANCE = 8
const GRID_STEP = 40

const GRID_LINES = (() => {
  const lines: Array<{ axis: 'x' | 'y'; value: number; major: boolean }> = []

  for (let x = 0; x <= SPREAD_WIDTH; x += GRID_STEP) {
    lines.push({ axis: 'x', value: x, major: x % (GRID_STEP * 5) === 0 || x === SPREAD_WIDTH / 2 })
  }

  for (let y = 0; y <= SPREAD_HEIGHT; y += GRID_STEP) {
    lines.push({ axis: 'y', value: y, major: y % (GRID_STEP * 5) === 0 || y === SPREAD_HEIGHT / 2 })
  }

  return lines
})()

const QUICK_FONT_OPTIONS = [
  { label: 'Serif', value: 'serif' },
  { label: 'Sans', value: 'sans-serif' },
  { label: 'Monospace', value: 'monospace' },
  { label: 'Cormorant', value: 'Cormorant Garamond, serif' },
  { label: 'DM Sans', value: 'DM Sans, sans-serif' },
]

const WATERMARK_POINTS = (() => {
  const points: Array<{ x: number; y: number }> = []
  for (let y = 120; y <= SPREAD_HEIGHT + 120; y += 220) {
    for (let x = -220; x <= SPREAD_WIDTH + 220; x += 360) {
      points.push({ x, y })
    }
  }
  return points
})()

export function Workspace({
  spread,
  zoom,
  showGrid,
  selection,
  setSelection,
  updateElement,
  deleteElements,
  onDropElement,
  watermarkText = null,
  blockContextMenu = false,
  isDrawingMode = false,
  brushColor = '#1C1814',
  brushSize = 5,
}: WorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [nodes, setNodes] = useState<Konva.Node[]>([])
  const [guide, setGuide] = useState<{ x: number | null; y: number | null }>({ x: null, y: null })
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetId: string | null } | null>(null)

  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [currentLine, setCurrentLine] = useState<{ points: number[] } | null>(null)
  const isDrawing = useRef(false)

  const scale = zoom / 100

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return
      }
      if (editingTextId) return

      if ((e.key === 'Delete' || e.key === 'Backspace') && selection.length > 0) {
        e.preventDefault()
        deleteElements(selection)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selection, deleteElements, editingTextId])

  useEffect(() => {
    if (!contextMenu) return

    const handlePointerDown = (event: PointerEvent) => {
      if (contextMenuRef.current?.contains(event.target as Node)) return
      setContextMenu(null)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null)
      }
    }

    const handleViewportChange = () => {
      setContextMenu(null)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [contextMenu])

  const openContextMenu = (rawEvent: any, targetId: string | null) => {
    const nativeEvent = rawEvent?.evt ?? rawEvent?.nativeEvent ?? rawEvent
    nativeEvent?.preventDefault?.()

    if (blockContextMenu) {
      return
    }

    if (targetId && !selection.includes(targetId)) {
      setSelection([targetId])
    }

    if (!targetId && selection.length === 0) {
      return
    }

    const bounds = containerRef.current?.getBoundingClientRect()
    if (!bounds) return

    const clientX = Number(nativeEvent?.clientX ?? bounds.left)
    const clientY = Number(nativeEvent?.clientY ?? bounds.top)
    const menuWidth = 230
    const menuHeight = 300

    const x = Math.max(8, Math.min(bounds.width - menuWidth - 8, clientX - bounds.left))
    const y = Math.max(8, Math.min(bounds.height - menuHeight - 8, clientY - bounds.top))

    setContextMenu({ x, y, targetId })
  }

  const contextTargetId = contextMenu?.targetId ?? (selection.length === 1 ? selection[0] : null)
  const contextElement = contextTargetId
    ? spread.elements.find((el) => el.id === contextTargetId) || null
    : null

  const handleContextDelete = () => {
    const ids = contextElement
      ? selection.includes(contextElement.id) && selection.length > 1
        ? selection
        : [contextElement.id]
      : selection

    if (ids.length === 0) return
    deleteElements(ids)
    setContextMenu(null)
  }

  const handleImageCropToggle = () => {
    if (!contextElement || contextElement.type !== 'image') return
    updateElement(
      contextElement.id,
      { fitMode: contextElement.fitMode === 'fill' ? 'fit' : 'fill' },
      { historyGroup: 'image-style' }
    )
    setContextMenu(null)
  }

  const handleTextStyle = (changes: Partial<AlbumElement>) => {
    if (!contextElement || contextElement.type !== 'text') return
    updateElement(contextElement.id, changes, { historyGroup: 'text-style' })
    setContextMenu(null)
  }

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage()
    if (clickedOnEmpty) {
      setSelection([])
      setEditingTextId(null)
      setContextMenu(null)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.types.includes(DRAG_MIME) || event.dataTransfer.types.includes('text/plain')) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    const payloadRaw = event.dataTransfer.getData(DRAG_MIME) || event.dataTransfer.getData('text/plain')
    if (!payloadRaw) return

    try {
      const payload = JSON.parse(payloadRaw) as Omit<AlbumElement, 'id' | 'zIndex'>
      const bounds = event.currentTarget.getBoundingClientRect()
      const x = Math.max(0, Math.min(SPREAD_WIDTH - 10, (event.clientX - bounds.left) / scale))
      const y = Math.max(0, Math.min(SPREAD_HEIGHT - 10, (event.clientY - bounds.top) / scale))
      const elementWidth = payload.width || 10
      const elementHeight = payload.height || 10

      onDropElement(payload, {
        x: Math.max(0, Math.min(SPREAD_WIDTH - elementWidth, x - elementWidth / 2)),
        y: Math.max(0, Math.min(SPREAD_HEIGHT - elementHeight, y - elementHeight / 2)),
      })
    } catch {
      // Ignore invalid drag payloads.
    }
  }

  useEffect(() => {
    if (!stageRef.current) return
    const stage = stageRef.current

    const selectable = selection.filter((id) => {
      const element = spread.elements.find((el) => el.id === id)
      return Boolean(element && !element.hidden && !element.locked)
    })

    const selectedNodes = selectable.map((id) => stage.findOne(`#${id}`)).filter(Boolean) as Konva.Node[]
    setNodes(selectedNodes)
  }, [selection, spread.elements])

  const visibleElements = [...spread.elements]
    .filter((el) => !el.hidden)
    .sort((a, b) => a.zIndex - b.zIndex)

  const snapPosition = (target: AlbumElement, x: number, y: number) => {
    const guidesX: number[] = [40, SPREAD_WIDTH / 2, SPREAD_WIDTH - 40]
    const guidesY: number[] = [40, SPREAD_HEIGHT / 2, SPREAD_HEIGHT - 40]

    const otherElements = visibleElements.filter((el) => el.id !== target.id)
    otherElements.forEach((el) => {
      guidesX.push(el.x, el.x + el.width / 2, el.x + el.width)
      guidesY.push(el.y, el.y + el.height / 2, el.y + el.height)
    })

    let nextX = x
    let nextY = y
    let snappedGuideX: number | null = null
    let snappedGuideY: number | null = null

    const candidatesX = [
      { value: x, offset: 0 },
      { value: x + target.width / 2, offset: target.width / 2 },
      { value: x + target.width, offset: target.width },
    ]

    const candidatesY = [
      { value: y, offset: 0 },
      { value: y + target.height / 2, offset: target.height / 2 },
      { value: y + target.height, offset: target.height },
    ]

    candidatesX.forEach((candidate) => {
      guidesX.forEach((gx) => {
        if (Math.abs(candidate.value - gx) <= SNAP_TOLERANCE) {
          nextX = gx - candidate.offset
          snappedGuideX = gx
        }
      })
    })

    candidatesY.forEach((candidate) => {
      guidesY.forEach((gy) => {
        if (Math.abs(candidate.value - gy) <= SNAP_TOLERANCE) {
          nextY = gy - candidate.offset
          snappedGuideY = gy
        }
      })
    })

    return {
      x: Math.max(0, Math.min(SPREAD_WIDTH - target.width, nextX)),
      y: Math.max(0, Math.min(SPREAD_HEIGHT - target.height, nextY)),
      guideX: snappedGuideX,
      guideY: snappedGuideY,
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative flex justify-center items-center h-full w-full"
      style={{ overflow: 'visible' }}
    >
      <div
        className="bg-white dark:bg-[#1d1a15] border border-transparent dark:border-[#3a342b] shadow-xl flex transition-colors"
        style={{
          width: SPREAD_WIDTH * scale,
          height: SPREAD_HEIGHT * scale,
          position: 'relative',
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onContextMenu={(event) => {
          if (blockContextMenu) {
            event.preventDefault()
          }
        }}
      >
        <Stage
          ref={stageRef}
          width={SPREAD_WIDTH * scale}
          height={SPREAD_HEIGHT * scale}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={(e) => {
            if (isDrawingMode) {
              const pos = e.target.getStage()?.getRelativePointerPosition()
              if (pos) {
                isDrawing.current = true
                setCurrentLine({ points: [pos.x, pos.y] })
              }
              return
            }
            checkDeselect(e)
          }}
          onMouseMove={(e) => {
            if (!isDrawing.current || !isDrawingMode) return
            const stage = e.target.getStage()
            const point = stage?.getRelativePointerPosition()
            if (point && currentLine) {
              setCurrentLine({
                points: currentLine.points.concat([point.x, point.y])
              })
            }
          }}
          onMouseUp={() => {
            if (isDrawing.current && currentLine && currentLine.points.length > 2) {
              // Calculate bounds of the drawing
              const xs = currentLine.points.filter((_, i) => i % 2 === 0)
              const ys = currentLine.points.filter((_, i) => i % 2 === 1)
              const minX = Math.min(...xs)
              const minY = Math.min(...ys)
              const maxX = Math.max(...xs)
              const maxY = Math.max(...ys)
              
              // Normalize points relative to element top-left
              const normalizedPoints = currentLine.points.map((val, i) => 
                i % 2 === 0 ? val - minX : val - minY
              )

              onDropElement({
                type: 'drawing',
                name: 'Freehand Sketch',
                points: normalizedPoints,
                stroke: brushColor,
                strokeWidth: brushSize,
                x: minX,
                y: minY,
                width: Math.max(5, maxX - minX),
                height: Math.max(5, maxY - minY),
                rotation: 0,
              } as Omit<DrawingElement, 'id' | 'zIndex'>, { x: minX, y: minY })
            }
            isDrawing.current = false
            setCurrentLine(null)
          }}
          onTouchStart={(e) => {
            if (isDrawingMode) {
              const pos = e.target.getStage()?.getRelativePointerPosition()
              if (pos) {
                isDrawing.current = true
                setCurrentLine({ points: [pos.x, pos.y] })
              }
              return
            }
            checkDeselect(e)
          }}
          onContextMenu={(event) => {
            const stage = event.target.getStage()
            const targetNode = event.target
            const targetId = targetNode?.id?.() || null
            const isBackground =
              !targetId ||
              targetNode === stage ||
              targetId === 'bg-page'

            openContextMenu(event, isBackground ? null : targetId)
          }}
          className="outline-none"
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={SPREAD_WIDTH}
              height={SPREAD_HEIGHT}
              fill={spread.background}
              id="bg-page"
              stroke="#e5e5e5"
              strokeWidth={1}
            />

            {showGrid &&
              GRID_LINES.map((line) => (
                <Line
                  key={`${line.axis}-${line.value}`}
                  points={
                    line.axis === 'x'
                      ? [line.value, 0, line.value, SPREAD_HEIGHT]
                      : [0, line.value, SPREAD_WIDTH, line.value]
                  }
                  stroke={line.major ? 'rgba(28, 24, 20, 0.16)' : 'rgba(28, 24, 20, 0.08)'}
                  strokeWidth={line.major ? 1 : 0.7}
                />
              ))}

            {guide.x !== null && (
              <Line points={[guide.x, 0, guide.x, SPREAD_HEIGHT]} stroke="#B85C38" strokeWidth={1} dash={[6, 4]} />
            )}
            {guide.y !== null && (
              <Line points={[0, guide.y, SPREAD_WIDTH, guide.y]} stroke="#B85C38" strokeWidth={1} dash={[6, 4]} />
            )}

            {visibleElements.map((el) => {
              const locked = Boolean(el.locked)
              const isSelected = selection.includes(el.id)

              const onDragMove = (e: any) => {
                if (locked) return
                const snapped = snapPosition(el, e.target.x(), e.target.y())
                e.target.position({ x: snapped.x, y: snapped.y })
                setGuide({ x: snapped.guideX, y: snapped.guideY })
              }

              const onDragEnd = (e: any) => {
                if (locked) return
                const snapped = snapPosition(el, e.target.x(), e.target.y())
                setGuide({ x: null, y: null })
                updateElement(
                  el.id,
                  {
                    x: snapped.x,
                    y: snapped.y,
                  },
                  { historyGroup: 'drag' }
                )
              }

              const onTransformEnd = (e: any) => {
                if (locked) return
                const node = e.target
                const scaleX = node.scaleX()
                const scaleY = node.scaleY()
                node.scaleX(1)
                node.scaleY(1)
                setGuide({ x: null, y: null })
                updateElement(
                  el.id,
                  {
                    x: node.x(),
                    y: node.y(),
                    width: Math.max(5, node.width() * scaleX),
                    height: Math.max(5, node.height() * scaleY),
                    rotation: node.rotation(),
                  },
                  { historyGroup: 'transform' }
                )
              }

              if (el.type === 'text') {
                return (
                  <Text
                    key={el.id}
                    id={el.id}
                    text={el.text}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    fill={el.fill}
                    fontSize={el.fontSize}
                    fontFamily={el.fontFamily}
                    fontStyle={el.fontWeight}
                    align={el.textAlign}
                    lineHeight={el.lineHeight ?? 1.2}
                    letterSpacing={el.letterSpacing ?? 0}
                    rotation={el.rotation}
                    draggable={!editingTextId && !locked}
                    onClick={() => setSelection([el.id])}
                    onTap={() => setSelection([el.id])}
                    onDblClick={() => !locked && setEditingTextId(el.id)}
                    onDblTap={() => !locked && setEditingTextId(el.id)}
                    onDragMove={onDragMove}
                    onDragEnd={onDragEnd}
                    onTransformEnd={onTransformEnd}
                    visible={editingTextId !== el.id}
                    opacity={locked ? 0.7 : 1}
                    listening
                  />
                )
              }

              if (el.type === 'shape') {
                const commonProps = {
                  id: el.id,
                  x: el.x,
                  y: el.y,
                  width: el.width,
                  height: el.height,
                  fill: el.fill,
                  stroke: el.stroke,
                  strokeWidth: el.strokeWidth,
                  rotation: el.rotation,
                  draggable: !locked,
                  onClick: () => setSelection([el.id]),
                  onTap: () => setSelection([el.id]),
                  onDragMove,
                  onDragEnd,
                  onTransformEnd,
                  opacity: locked ? 0.7 : 1,
                }

                if (el.shapeType === 'rectangle') {
                  return <Rect key={el.id} {...commonProps} />
                }
                if (el.shapeType === 'circle') {
                  return <Circle key={el.id} {...commonProps} radius={Math.min(el.width, el.height) / 2} />
                }
                if (el.shapeType === 'line') {
                  return <Line key={el.id} {...commonProps} points={[0, 0, el.width, el.height]} />
                }
              }

              if (el.type === 'drawing') {
                return (
                  <Line
                    key={el.id}
                    id={el.id}
                    points={el.points}
                    x={el.x}
                    y={el.y}
                    stroke={el.stroke}
                    strokeWidth={el.strokeWidth}
                    lineCap="round"
                    lineJoin="round"
                    draggable={!locked}
                    onClick={() => setSelection([el.id])}
                    onTap={() => setSelection([el.id])}
                    onDragMove={onDragMove}
                    onDragEnd={onDragEnd}
                    onTransformEnd={onTransformEnd}
                    opacity={locked ? 0.7 : 1}
                  />
                )
              }

              if (el.type === 'image') {
                return (
                  <RemoteImage
                    key={el.id}
                    id={el.id}
                    imageSrc={el.src}
                    fitMode={el.fitMode}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    rotation={el.rotation}
                    draggable={!locked}
                    onClick={() => setSelection([el.id])}
                    onTap={() => setSelection([el.id])}
                    onDragMove={onDragMove}
                    onDragEnd={onDragEnd}
                    onTransformEnd={onTransformEnd}
                    opacity={el.opacity ?? 1}
                    scaleX={el.flipX ? -1 : 1}
                    scaleY={el.flipY ? -1 : 1}
                    offsetX={el.flipX ? el.width : 0}
                    offsetY={el.flipY ? el.height : 0}
                    cornerRadius={el.cornerRadius ?? 0}
                    shadowColor={el.shadowColor || '#000000'}
                    shadowBlur={el.shadowBlur ?? 0}
                    shadowOpacity={el.shadowOpacity ?? 0}
                    shadowEnabled={(el.shadowBlur ?? 0) > 0}
                    listening
                  />
                )
              }

              return null
            })}

            {currentLine && (
              <Line
                points={currentLine.points}
                stroke={brushColor}
                strokeWidth={brushSize}
                lineCap="round"
                lineJoin="round"
              />
            )}

            <Transformer
              nodes={nodes}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) return oldBox
                return newBox
              }}
              rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
              enabledAnchors={
                selection.length === 1 &&
                spread.elements.find((el) => el.id === selection[0])?.locked
                  ? []
                  : undefined
              }
            />
          </Layer>
        </Stage>

        {editingTextId && (
          <OverlayTextEditor
            editingId={editingTextId}
            elements={spread.elements}
            scale={scale}
            onComplete={(id, text) => {
              updateElement(id, { text }, { historyGroup: 'text' })
              setEditingTextId(null)
            }}
          />
        )}

        {watermarkText && (
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20">
            {WATERMARK_POINTS.map((point, index) => (
              <div
                key={`wm-${index}`}
                className="absolute text-black/25 dark:text-white/25 font-semibold tracking-wider"
                style={{
                  left: `${point.x * scale}px`,
                  top: `${point.y * scale}px`,
                  transform: 'rotate(-24deg)',
                  fontSize: `${Math.max(10, 14 * scale)}px`,
                  whiteSpace: 'nowrap',
                }}
              >
                {watermarkText}
              </div>
            ))}
          </div>
        )}
      </div>

      {contextMenu && !blockContextMenu && (
        <div
          ref={contextMenuRef}
          className="absolute z-40 min-w-[230px] rounded-md border border-border bg-popover text-popover-foreground shadow-xl p-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onContextMenu={(event) => event.preventDefault()}
        >
          <button
            type="button"
            onClick={handleContextDelete}
            className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted"
          >
            Delete
          </button>

          {contextElement?.type === 'image' && (
            <button
              type="button"
              onClick={handleImageCropToggle}
              className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted"
            >
              {contextElement.fitMode === 'fill' ? 'Show Full Image' : 'Crop to Frame'}
            </button>
          )}

          {contextElement?.type === 'text' && (
            <>
              <div className="my-1 border-t border-border" />
              <div className="px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">Font</div>
              {QUICK_FONT_OPTIONS.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => handleTextStyle({ fontFamily: font.value })}
                  className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted"
                >
                  {font.label}
                </button>
              ))}
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={() =>
                  handleTextStyle({
                    fontWeight: contextElement.fontWeight === 'bold' ? 'normal' : 'bold',
                  })
                }
                className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted"
              >
                {contextElement.fontWeight === 'bold' ? 'Set Normal Weight' : 'Set Bold'}
              </button>
              <button
                type="button"
                onClick={() =>
                  handleTextStyle({
                    fontSize: Math.max(8, contextElement.fontSize - 2),
                  })
                }
                className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted"
              >
                Smaller Text
              </button>
              <button
                type="button"
                onClick={() =>
                  handleTextStyle({
                    fontSize: Math.min(320, contextElement.fontSize + 2),
                  })
                }
                className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted"
              >
                Bigger Text
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function OverlayTextEditor({
  editingId,
  elements,
  scale,
  onComplete,
}: {
  editingId: string
  elements: AlbumElement[]
  scale: number
  onComplete: (id: string, text: string) => void
}) {
  const el = elements.find((e) => e.id === editingId)
  if (!el || el.type !== 'text') return null

  return (
    <textarea
      autoFocus
      defaultValue={el.text}
      onBlur={(e) => onComplete(editingId, e.target.value)}
      className="absolute bg-transparent outline-none resize-none m-0 p-0 border-none pointer-events-auto"
      style={{
        left: `${el.x * scale}px`,
        top: `${el.y * scale}px`,
        width: `${Math.max(el.width * scale, 100)}px`,
        height: `${Math.max(el.height * scale, 50)}px`,
        fontSize: `${el.fontSize * scale}px`,
        lineHeight: String(el.lineHeight ?? 1.2),
        letterSpacing: `${(el.letterSpacing ?? 0) * scale}px`,
        fontFamily: el.fontFamily,
        fontWeight: el.fontWeight,
        textAlign: el.textAlign as any,
        color: el.fill,
        transform: `rotate(${el.rotation || 0}deg)`,
        transformOrigin: 'top left',
      }}
    />
  )
}
