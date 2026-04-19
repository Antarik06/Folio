'use client'

import React, { useRef, useState, useEffect } from 'react'

export interface PhotoFilters {
  brightness: number // 100 is normal
  contrast: number   // 100 is normal
  saturation: number // 100 is normal
  sepia: number      // 0 is normal
  warmth: number     // map to hue-rotate or sepia combos
}

const DEFAULT_FILTERS: PhotoFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  warmth: 0,
}

interface PhotoEditorProps {
  imageUrl: string
  onCancel: () => void
  onSave: (editedBlob: Blob) => Promise<void>
}

export function PhotoEditor({ imageUrl, onCancel, onSave }: PhotoEditorProps) {
  const [filters, setFilters] = useState<PhotoFilters>(DEFAULT_FILTERS)
  const [saving, setSaving] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  // Creates the CSS filter string for live preview and canvas rendering
  const getFilterString = () => {
    return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) sepia(${filters.sepia}%) hue-rotate(${filters.warmth}deg)`
  }

  // Handle saving the image using an offscreen canvas
  const handleSave = async () => {
    if (!imageRef.current) return
    setSaving(true)

    try {
      const img = imageRef.current
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not get canvas context')

      // Apply the same filters to the canvas context
      ctx.filter = getFilterString()
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Export as a blob
      canvas.toBlob(
        async (blob) => {
          if (blob) {
            await onSave(blob)
          } else {
            console.error('Failed to create blob')
          }
          setSaving(false)
        },
        'image/jpeg',
        0.95 // very high quality
      )
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  function handleReset() {
    setFilters(DEFAULT_FILTERS)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-3xl flex flex-col md:flex-row">
      {/* Top / Left: Image Preview */}
      <div className="flex-1 relative flex items-center justify-center p-4 min-h-[50vh]">
        <button 
          onClick={onCancel}
          className="absolute top-6 left-6 p-2 bg-background/50 text-foreground rounded-full hover:bg-background transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* The target image */}
        <div className="relative max-w-full max-h-full">
          {/* We use crossOrigin="anonymous" to avoid tainted canvas issues if from external storage */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={imageUrl}
            crossOrigin="anonymous"
            alt="Editing"
            className="max-w-full max-h-[80vh] object-contain shadow-2xl"
            style={{ filter: getFilterString(), transition: 'filter 0.1s ease-out' }}
          />
        </div>
      </div>

      {/* Bottom / Right: Controls */}
      <div className="w-full md:w-96 bg-card border-t md:border-t-0 md:border-l border-border p-6 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-serif text-2xl text-foreground">Edit Photo</h3>
          <button 
            onClick={handleReset}
            className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="space-y-8 flex-1">
          {/* Brightness */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs uppercase tracking-wider">
              <label>Brightness</label>
              <span className="text-muted-foreground">{filters.brightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={filters.brightness}
              onChange={(e) => setFilters(f => ({ ...f, brightness: parseInt(e.target.value) }))}
              className="w-full h-1 bg-secondary appearance-none cursor-pointer outline-none"
            />
          </div>

          {/* Contrast */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs uppercase tracking-wider">
              <label>Contrast</label>
              <span className="text-muted-foreground">{filters.contrast}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={filters.contrast}
              onChange={(e) => setFilters(f => ({ ...f, contrast: parseInt(e.target.value) }))}
              className="w-full h-1 bg-secondary appearance-none cursor-pointer outline-none"
            />
          </div>

          {/* Saturation */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs uppercase tracking-wider">
              <label>Saturation</label>
              <span className="text-muted-foreground">{filters.saturation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={filters.saturation}
              onChange={(e) => setFilters(f => ({ ...f, saturation: parseInt(e.target.value) }))}
              className="w-full h-1 bg-secondary appearance-none cursor-pointer outline-none"
            />
          </div>

          {/* Warmth (Hue Rotate) */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs uppercase tracking-wider">
              <label>Warmth</label>
              <span className="text-muted-foreground">{filters.warmth}</span>
            </div>
            <input
              type="range"
              min="-90"
              max="90"
              value={filters.warmth}
              onChange={(e) => setFilters(f => ({ ...f, warmth: parseInt(e.target.value) }))}
              className="w-full h-1 bg-secondary appearance-none cursor-pointer outline-none"
            />
          </div>

           {/* Sepia */}
           <div className="space-y-3">
            <div className="flex justify-between text-xs uppercase tracking-wider">
              <label>Vintage (Sepia)</label>
              <span className="text-muted-foreground">{filters.sepia}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.sepia}
              onChange={(e) => setFilters(f => ({ ...f, sepia: parseInt(e.target.value) }))}
              className="w-full h-1 bg-secondary appearance-none cursor-pointer outline-none"
            />
          </div>
        </div>

        <div className="pt-8 flex gap-3">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 py-4 border border-border text-foreground text-sm uppercase tracking-wider hover:bg-surface transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-4 bg-primary text-primary-foreground text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
