'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Text, Transformer, Rect, Circle, Line } from 'react-konva'
import useImage from 'use-image'
import { AlbumSpread, AlbumElement } from './types'
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
}: WorkspaceProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const [nodes, setNodes] = useState<Konva.Node[]>([])
  const [guide, setGuide] = useState<{ x: number | null; y: number | null }>({ x: null, y: null })

  const [editingTextId, setEditingTextId] = useState<string | null>(null)

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

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage()
    if (clickedOnEmpty) {
      setSelection([])
      setEditingTextId(null)
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
    <div className="relative flex justify-center items-center h-full w-full" style={{ overflow: 'visible' }}>
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
          onMouseDown={checkDeselect}
          onTouchStart={checkDeselect}
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
                  key: el.id,
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
                  return <Rect {...commonProps} />
                }
                if (el.shapeType === 'circle') {
                  return <Circle {...commonProps} radius={Math.min(el.width, el.height) / 2} />
                }
                if (el.shapeType === 'line') {
                  return <Line {...commonProps} points={[0, 0, el.width, el.height]} />
                }
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
