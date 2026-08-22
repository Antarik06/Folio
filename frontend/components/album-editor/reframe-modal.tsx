'use client'

import React, { useMemo, useState } from 'react'
import Cropper from 'react-easy-crop'
import { Check, X, ZoomIn, ZoomOut } from 'lucide-react'

/**
 * Reframe: which part of a photograph the slot shows.
 *
 * The crop it produces is normalised 0–1 against the source image and stored
 * on the element, so it survives a save and is applied by the canvas rather
 * than only living in this dialog.
 */

interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

interface ReframeModalProps {
  imageSrc: string
  /** The slot's own shape, so the crop matches the frame it will fill. */
  aspectRatio: number
  initialCrop?: CropRect
  onSave: (crop: CropRect) => void
  onClose: () => void
}

export function ReframeModal({
  imageSrc,
  aspectRatio = 1,
  initialCrop,
  onSave,
  onClose,
}: ReframeModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<CropRect | null>(initialCrop ?? null)

  // react-easy-crop takes percentages; the element stores 0–1 decimals.
  const initialArea = useMemo(() => {
    if (!initialCrop) return undefined
    return {
      x: initialCrop.x * 100,
      y: initialCrop.y * 100,
      width: initialCrop.width * 100,
      height: initialCrop.height * 100,
    }
  }, [initialCrop])

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4">
      <div className="flex h-[min(620px,92dvh)] w-full max-w-2xl flex-col overflow-hidden rounded-[4px] border border-border bg-card shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <h3 className="font-serif text-lg italic text-foreground">Reframe</h3>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
              Drag to reposition · scroll or pinch to zoom
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-[2px] text-ink-soft transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 bg-[#14110E]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            initialCroppedAreaPercentages={initialArea}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(percent) =>
              setArea({
                x: percent.x / 100,
                y: percent.y / 100,
                width: percent.width / 100,
                height: percent.height / 100,
              })
            }
            showGrid
          />
        </div>

        <div className="shrink-0 space-y-3 border-t border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 shrink-0 text-ink-soft" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.02}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-8 flex-1 accent-[var(--primary)]"
            />
            <ZoomIn className="h-4 w-4 shrink-0 text-ink-soft" />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => area && onSave(area)}
              disabled={!area}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-[2px] bg-primary px-5 font-mono text-[11px] uppercase tracking-[0.1em] text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
              Use this framing
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] items-center justify-center rounded-[2px] border border-border px-5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
