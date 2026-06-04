'use client'

import React, { useState } from 'react'
import Cropper from 'react-easy-crop'
import { ZoomIn, ZoomOut, Check, X } from 'lucide-react'

interface ReframeModalProps {
  imageSrc: string
  aspectRatio: number // e.g. 1 (square), 1.33 (4:3), etc.
  initialCrop?: { x: number; y: number; width: number; height: number }
  onSave: (crop: { x: number; y: number; width: number; height: number }) => void
  onClose: () => void
}

export function ReframeModal({
  imageSrc,
  aspectRatio = 1,
  initialCrop,
  onSave,
  onClose
}: ReframeModalProps) {
  // Convert standard percentage coordinates to react-easy-crop coordinates
  // react-easy-crop uses { x, y } in pixels or percentages offset from center
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const handleCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    // Save the relative crop area (percentages)
    setCroppedAreaPixels(croppedArea)
  }

  const handleDone = () => {
    if (croppedAreaPixels) {
      // Convert 0-100 percentages to 0-1 decimals
      onSave({
        x: croppedAreaPixels.x / 100,
        y: croppedAreaPixels.y / 100,
        width: croppedAreaPixels.width / 100,
        height: croppedAreaPixels.height / 100
      })
    }
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center animate-in fade-in duration-300">
      <div className="bg-paper border border-[#DDD8CE] shadow-2xl w-full max-w-2xl h-[550px] flex flex-col justify-between rounded-lg overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-[#EBE6DD] flex justify-between items-center">
          <div>
            <h3 className="font-serif text-lg text-ink font-semibold">Position Photo</h3>
            <p className="text-[10px] text-pencil uppercase tracking-wider">Drag to reframe · Scroll to zoom</p>
          </div>
          <button onClick={onClose} className="text-pencil hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Workspace */}
        <div className="relative flex-1 bg-neutral-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
            showGrid={true}
          />
        </div>

        {/* Controls and Footer */}
        <div className="p-6 bg-white border-t border-[#EBE6DD] space-y-4">
          <div className="flex items-center gap-4">
            <ZoomOut className="w-4 h-4 text-pencil" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-ink h-1 bg-[#EBE6DD] rounded-lg appearance-none cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-pencil" />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleDone}
              className="flex-1 py-3 bg-ink hover:bg-ink/90 text-white text-[10px] uppercase font-bold tracking-[0.2em] transition-colors flex items-center justify-center gap-1 shadow-md"
            >
              <Check className="w-4 h-4" />
              Save Crop Settings
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-border text-pencil hover:text-ink text-[10px] uppercase font-bold tracking-wider transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
