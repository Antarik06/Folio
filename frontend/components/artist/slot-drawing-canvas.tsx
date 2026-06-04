'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Stage, Layer, Rect, Transformer, Image as KonvaImage } from 'react-konva'
import { Plus, Trash2, Check, Layout, Type, RefreshCw } from 'lucide-react'
import useImage from 'use-image'

export interface SlotDefinition {
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
  font_color_cmyk?: string
  placeholder_text?: string
}

interface SlotDrawingCanvasProps {
  pageImageUrl: string
  pageWidthMm: number
  pageHeightMm: number
  initialSlots?: SlotDefinition[]
  onSave: (slots: SlotDefinition[]) => void
  onCancel: () => void
}

interface DrawRect {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export function SlotDrawingCanvas({
  pageImageUrl,
  pageWidthMm = 210,
  pageHeightMm = 297,
  initialSlots = [],
  onSave,
  onCancel
}: SlotDrawingCanvasProps) {
  const [bgImage] = useImage(pageImageUrl, 'anonymous')
  
  // Canvas scale configuration
  const stageWidth = 600
  const stageHeight = (pageHeightMm / pageWidthMm) * stageWidth

  const [slots, setSlots] = useState<SlotDefinition[]>(initialSlots)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  
  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false)
  const [newRect, setNewRect] = useState<DrawRect | null>(null)
  
  const stageRef = useRef<any>(null)
  const transformerRef = useRef<any>(null)

  // Sync transformer selection
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return
    const stage = stageRef.current
    const transformer = transformerRef.current

    if (selectedSlotId) {
      const selectedNode = stage.findOne(`#${selectedSlotId}`)
      if (selectedNode) {
        transformer.nodes([selectedNode])
        transformer.getLayer().batchDraw()
      } else {
        transformer.nodes([])
      }
    } else {
      transformer.nodes([])
    }
  }, [selectedSlotId, slots])

  // Conversion helpers: millimeters to pixels
  const mmToPx = (mm: number, isHeight = false) => {
    const scale = isHeight ? stageHeight / pageHeightMm : stageWidth / pageWidthMm
    return mm * scale
  }

  // Conversion helpers: pixels to millimeters
  const pxToMm = (px: number, isHeight = false) => {
    const scale = isHeight ? pageHeightMm / stageHeight : pageWidthMm / stageWidth
    return Math.round(px * scale * 10) / 10
  }

  // Mouse drawing handlers
  const handleMouseDown = (e: any) => {
    // Only draw if clicking background
    const clickedOnStage = e.target === e.target.getStage() || e.target.name() === 'background-image'
    if (!clickedOnStage) return

    const pos = stageRef.current.getPointerPosition()
    if (!pos) return

    setIsDrawing(true)
    const newId = `slot_${Date.now()}`
    setNewRect({
      id: newId,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0
    })
    setSelectedSlotId(null)
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !newRect) return
    const pos = stageRef.current.getPointerPosition()
    if (!pos) return

    setNewRect(prev => {
      if (!prev) return null
      return {
        ...prev,
        width: pos.x - prev.x,
        height: pos.y - prev.y
      }
    })
  };

  const handleMouseUp = () => {
    if (!isDrawing || !newRect) return
    setIsDrawing(false)

    // Filter tiny boxes (accidental clicks)
    if (Math.abs(newRect.width) > 10 && Math.abs(newRect.height) > 10) {
      // Normalize negative dimensions from drag-up/left
      const x = newRect.width < 0 ? newRect.x + newRect.width : newRect.x
      const y = newRect.height < 0 ? newRect.y + newRect.height : newRect.y
      const w = Math.abs(newRect.width)
      const h = Math.abs(newRect.height)

      const totalSlots = slots.length
      const newSlot: SlotDefinition = {
        slot_id: `slot_${totalSlots + 1}`,
        type: 'photo',
        x_mm: pxToMm(x),
        y_mm: pxToMm(y, true),
        width_mm: pxToMm(w),
        height_mm: pxToMm(h, true),
        aspect_ratio: 'free',
        min_dpi: 300,
        fit_mode: 'fill',
        shape_mask: 'rectangle',
        z_index: totalSlots + 1,
        editable_by_user: true,
        optional: true
      }

      setSlots(prev => [...prev, newSlot])
      setSelectedSlotId(newSlot.slot_id)
    }
    setNewRect(null)
  };

  // Selection change
  const handleSlotClick = (id: string) => {
    setSelectedSlotId(id)
  };

  // Scale/Transform handler from Konva Transformer
  const handleTransformEnd = (e: any) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Reset scales and update dimensions
    node.scaleX(1)
    node.scaleY(1)

    const nextSlots = slots.map(slot => {
      if (slot.slot_id === node.id()) {
        const x = node.x()
        const y = node.y()
        const w = node.width() * scaleX
        const h = node.height() * scaleY

        return {
          ...slot,
          x_mm: pxToMm(x),
          y_mm: pxToMm(y, true),
          width_mm: pxToMm(w),
          height_mm: pxToMm(h, true)
        }
      }
      return slot
    })

    setSlots(nextSlots)
  };

  // Drag end handler
  const handleDragEnd = (e: any) => {
    const node = e.target
    const nextSlots = slots.map(slot => {
      if (slot.slot_id === node.id()) {
        return {
          ...slot,
          x_mm: pxToMm(node.x()),
          y_mm: pxToMm(node.y(), true)
        }
      }
      return slot
    })
    setSlots(nextSlots)
  };

  const handleUpdateSlotField = (id: string, field: keyof SlotDefinition, value: any) => {
    setSlots(prev => prev.map(s => {
      if (s.slot_id === id) {
        const updated = { ...s, [field]: value }
        if (field === 'type') {
          if (value === 'text') {
            updated.font_family = 'serif'
            updated.font_size_pt = 14
            updated.font_color_cmyk = '0,0,0,100'
            updated.placeholder_text = 'Write text here...'
          } else {
            delete updated.font_family
            delete updated.font_size_pt
            delete updated.font_color_cmyk
            delete updated.placeholder_text
          }
        }
        return updated
      }
      return s
    }))
  };

  const handleDeleteSlot = (id: string) => {
    setSlots(prev => prev.filter(s => s.slot_id !== id))
    setSelectedSlotId(null)
  };

  const selectedSlot = slots.find(s => s.slot_id === selectedSlotId)

  return (
    <div className="flex flex-col lg:flex-row gap-8 bg-white dark:bg-[#1A1613] p-6 border border-[#EBE6DD] dark:border-white/10 rounded-2xl shadow-sm">
      
      {/* Canvas workspace area */}
      <div className="flex-1 flex flex-col items-center">
        <div className="mb-4 text-center">
          <p className="text-xs uppercase tracking-widest text-[#B85C38] font-bold">Slot Layout Designer</p>
          <p className="text-[10px] text-[#7A6F64] dark:text-[#B7AA9C]">Click and drag on the layout preview to draw photo or text slot boundaries</p>
        </div>

        <div className="relative border border-[#EBE6DD] dark:border-white/10 shadow-lg bg-[#FAF9F6] dark:bg-black/20 rounded-xl overflow-hidden">
          <Stage
            ref={stageRef}
            width={stageWidth}
            height={stageHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <Layer>
              {/* Background design representation */}
              {bgImage && (
                <KonvaImage
                  image={bgImage}
                  width={stageWidth}
                  height={stageHeight}
                  name="background-image"
                />
              )}

              {/* Saved Slots list */}
              {slots.map(slot => {
                const isSelected = slot.slot_id === selectedSlotId
                const isText = slot.type === 'text'
                const strokeColor = isSelected ? '#C85A32' : isText ? '#4A6FA5' : '#1C1814'
                const fillColor = isText ? 'rgba(74, 111, 165, 0.15)' : 'rgba(28, 24, 20, 0.15)'

                return (
                  <Rect
                    key={slot.slot_id}
                    id={slot.slot_id}
                    x={mmToPx(slot.x_mm)}
                    y={mmToPx(slot.y_mm, true)}
                    width={mmToPx(slot.width_mm)}
                    height={mmToPx(slot.height_mm, true)}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 2 : 1.5}
                    draggable
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                    onClick={() => handleSlotClick(slot.slot_id)}
                  />
                )
              })}

              {/* Drag rectangle preview */}
              {newRect && (
                <Rect
                  x={newRect.x}
                  y={newRect.y}
                  width={newRect.width}
                  height={newRect.height}
                  stroke="#C85A32"
                  strokeWidth={1}
                  dash={[4, 4]}
                />
              )}

              {/* Konva Transformer wrapper */}
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // Prevent negative widths/heights
                  if (newBox.width < 10 || newBox.height < 10) return oldBox
                  return newBox
                }}
              />
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Editor Panel Side Drawer */}
      <div className="w-full lg:w-80 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[#EBE6DD] dark:border-white/10 pt-6 lg:pt-0 lg:pl-6">
        <div>
          <h3 className="font-serif text-lg text-[#1C1814] dark:text-[#F5F0E8] mb-4 pb-2 border-b border-[#EBE6DD] dark:border-white/5 font-bold">Slot Parameters</h3>
          
          {selectedSlot ? (
            <div className="space-y-4">
              {/* Type Select */}
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-[#7A6F64] dark:text-[#B7AA9C] mb-1">Slot Content Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateSlotField(selectedSlot.slot_id, 'type', 'photo')}
                    className={`flex-1 py-2 flex items-center justify-center gap-1.5 border text-[10px] uppercase font-bold tracking-wider transition-colors rounded-lg ${
                      selectedSlot.type === 'photo'
                        ? 'bg-[#1C1814] text-white border-[#1C1814] dark:bg-[#F5F0E8] dark:text-[#1c1814] dark:border-[#F5F0E8]'
                        : 'border-[#EBE6DD] dark:border-white/10 text-[#7A6F64] dark:text-[#B7AA9C] hover:bg-[#1C1814]/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <Layout className="w-3.5 h-3.5" />
                    Photo
                  </button>
                  <button
                    onClick={() => handleUpdateSlotField(selectedSlot.slot_id, 'type', 'text')}
                    className={`flex-1 py-2 flex items-center justify-center gap-1.5 border text-[10px] uppercase font-bold tracking-wider transition-colors rounded-lg ${
                      selectedSlot.type === 'text'
                        ? 'bg-[#1C1814] text-white border-[#1C1814] dark:bg-[#F5F0E8] dark:text-[#1c1814] dark:border-[#F5F0E8]'
                        : 'border-[#EBE6DD] dark:border-white/10 text-[#7A6F64] dark:text-[#B7AA9C] hover:bg-[#1C1814]/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    Text
                  </button>
                </div>
              </div>

              {/* Slot ID */}
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-[#7A6F64] dark:text-[#B7AA9C] mb-1">Slot Identifier</label>
                <input
                  type="text"
                  value={selectedSlot.slot_id || ''}
                  onChange={(e) => handleUpdateSlotField(selectedSlot.slot_id, 'slot_id', e.target.value)}
                  className="w-full border border-[#EBE6DD] dark:border-white/10 bg-[#FAF9F6] dark:bg-black/5 px-3 py-2 text-xs text-[#1C1814] dark:text-[#F5F0E8] focus:outline-none focus:ring-1 focus:ring-[#B85C38]/40 focus:border-[#B85C38]/40 rounded-lg transition-all"
                />
              </div>

              {/* Aspect Ratio Lock */}
              {selectedSlot.type === 'photo' && (
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-[#7A6F64] dark:text-[#B7AA9C] mb-1">Aspect Ratio Lock</label>
                  <select
                    value={selectedSlot.aspect_ratio || 'free'}
                    onChange={(e) => handleUpdateSlotField(selectedSlot.slot_id, 'aspect_ratio', e.target.value)}
                    className="w-full border border-[#EBE6DD] dark:border-white/10 bg-white dark:bg-[#120f0d] px-3 py-2 text-xs text-[#1C1814] dark:text-[#F5F0E8] focus:outline-none focus:ring-1 focus:ring-[#B85C38]/40 focus:border-[#B85C38]/40 rounded-lg transition-all"
                  >
                    <option value="free">Free aspect (unlocked)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="4:3">4:3 (Traditional)</option>
                    <option value="3:2">3:2 (Classic 35mm)</option>
                    <option value="16:9">16:9 (Widescreen)</option>
                  </select>
                </div>
              )}

              {/* Minimum Print Resolution */}
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-[#7A6F64] dark:text-[#B7AA9C] mb-1">Min Target DPI</label>
                <input
                  type="number"
                  value={selectedSlot.min_dpi ?? 300}
                  onChange={(e) => handleUpdateSlotField(selectedSlot.slot_id, 'min_dpi', Number(e.target.value))}
                  className="w-full border border-[#EBE6DD] dark:border-white/10 bg-[#FAF9F6] dark:bg-black/5 px-3 py-2 text-xs text-[#1C1814] dark:text-[#F5F0E8] focus:outline-none focus:ring-1 focus:ring-[#B85C38]/40 focus:border-[#B85C38]/40 rounded-lg transition-all"
                />
              </div>

              {/* Text specific attributes */}
              {selectedSlot.type === 'text' && (
                <div className="space-y-3 p-3 bg-[#FAF9F6] dark:bg-black/20 border border-[#EBE6DD] dark:border-white/10 rounded-xl">
                  <p className="text-[9px] uppercase font-mono tracking-widest text-[#B85C38] mb-2 font-bold">Typography Overrides</p>
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-[#7A6F64] dark:text-[#B7AA9C] mb-0.5">Font Style</label>
                    <select
                      value={selectedSlot.font_family || 'serif'}
                      onChange={(e) => handleUpdateSlotField(selectedSlot.slot_id, 'font_family', e.target.value)}
                      className="w-full border border-[#EBE6DD] dark:border-white/10 bg-white dark:bg-[#120f0d] px-2 py-1 text-xs text-[#1C1814] dark:text-[#F5F0E8] rounded-lg"
                    >
                      <option value="serif">Classic Serif</option>
                      <option value="sans-serif">Modern Sans</option>
                      <option value="mono">Monospace</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-[#7A6F64] dark:text-[#B7AA9C] mb-0.5">Size (pt)</label>
                    <input
                      type="number"
                      value={selectedSlot.font_size_pt ?? 12}
                      onChange={(e) => handleUpdateSlotField(selectedSlot.slot_id, 'font_size_pt', Number(e.target.value))}
                      className="w-full border border-[#EBE6DD] dark:border-white/10 bg-white dark:bg-[#120f0d] px-2 py-1 text-xs text-[#1C1814] dark:text-[#F5F0E8] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-[#7A6F64] dark:text-[#B7AA9C] mb-0.5">CMYK Fill Color</label>
                    <input
                      type="text"
                      value={selectedSlot.font_color_cmyk || ''}
                      onChange={(e) => handleUpdateSlotField(selectedSlot.slot_id, 'font_color_cmyk', e.target.value)}
                      className="w-full border border-[#EBE6DD] dark:border-white/10 bg-white dark:bg-[#120f0d] px-2 py-1 text-xs text-[#1C1814] dark:text-[#F5F0E8] rounded-lg"
                      placeholder="0,0,0,100"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-[#7A6F64] dark:text-[#B7AA9C] mb-0.5">Placeholder</label>
                    <input
                      type="text"
                      value={selectedSlot.placeholder_text || ''}
                      onChange={(e) => handleUpdateSlotField(selectedSlot.slot_id, 'placeholder_text', e.target.value)}
                      className="w-full border border-[#EBE6DD] dark:border-white/10 bg-white dark:bg-[#120f0d] px-2 py-1 text-xs text-[#1C1814] dark:text-[#F5F0E8] rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Geometry debug stats */}
              <div className="grid grid-cols-2 gap-2 p-3 border border-[#EBE6DD] dark:border-white/10 rounded-xl text-[10px] font-mono text-[#7A6F64] dark:text-[#B7AA9C] bg-[#FAF9F6] dark:bg-black/20">
                <div>X: {selectedSlot.x_mm} mm</div>
                <div>Y: {selectedSlot.y_mm} mm</div>
                <div>W: {selectedSlot.width_mm} mm</div>
                <div>H: {selectedSlot.height_mm} mm</div>
              </div>

              {/* Optional vs Required */}
              <label className="flex items-center gap-2 cursor-pointer pt-2 select-none">
                <input
                  type="checkbox"
                  checked={!!selectedSlot.optional}
                  onChange={(e) => handleUpdateSlotField(selectedSlot.slot_id, 'optional', e.target.checked)}
                  className="rounded border-[#EBE6DD] dark:border-white/10 text-[#B85C38] focus:ring-[#B85C38] focus:ring-offset-0"
                />
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A6F64] dark:text-[#B7AA9C]">Optional frame</span>
              </label>

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteSlot(selectedSlot.slot_id)}
                className="w-full py-2.5 flex items-center justify-center gap-1.5 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-[10px] uppercase font-bold tracking-wider transition-colors rounded-lg shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Slot Shape
              </button>
            </div>
          ) : (
            <div className="text-center py-20 text-[#7A6F64] dark:text-[#B7AA9C] text-sm italic font-serif">
              No slot selected.<br />Draw a shape or click an outline to edit.
            </div>
          )}
        </div>

        {/* Action Panel Button Bar */}
        <div className="flex gap-3 border-t border-[#EBE6DD] dark:border-white/10 pt-6 mt-6">
          <button
            onClick={() => onSave(slots)}
            className="flex-1 py-3 bg-[#B85C38] hover:bg-[#B85C38]/90 text-white text-[10px] uppercase font-bold tracking-[0.15em] transition-colors flex items-center justify-center gap-1 shadow-lg shadow-[#B85C38]/20 rounded-lg cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Apply slots
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-3 border border-[#EBE6DD] dark:border-white/10 text-[#7A6F64] dark:text-[#B7AA9C] hover:text-[#1C1814] dark:hover:text-[#F5F0E8] hover:border-[#1C1814]/20 dark:hover:border-white/20 text-[10px] uppercase font-bold tracking-wider transition-colors rounded-lg cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
