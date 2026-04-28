'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'
import { Provider } from 'jotai'
import * as THREE from 'three'
import { PolaroidExperience } from '@/components/preview/PolaroidExperience'
import { PolaroidPreviewUI } from '@/components/preview/PolaroidPreviewUI'

const FRAME_LABELS: Record<string, string> = {
  classic:  'Classic White',
  midnight: 'Midnight Black',
  vintage:  'Vintage Cream',
  modern:   'Gallery Minimal',
}

export default function PolaroidPreviewPage() {
  const [state, setState] = useState<{ images: string[]; frame: string; quantities?: number[] } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = sessionStorage.getItem('polaroid-preview-state')
      if (raw) setState(JSON.parse(raw))
    } catch (_) {}
  }, [])

  if (!mounted || !state || state.images.length === 0) {
    return (
      <div className="w-screen h-screen bg-[#0E0C0A] flex items-center justify-center">
        <p className="text-white/40 font-mono text-sm uppercase tracking-widest">Loading preview…</p>
      </div>
    )
  }

  return (
    <Provider>
      <div className="relative w-screen h-screen bg-[#0E0C0A] overflow-hidden">
        {/* Scrolling background text */}
        <div className="fixed inset-0 flex items-center -rotate-2 select-none pointer-events-none opacity-[0.03]">
          <div className="flex items-center gap-12 w-max animate-horizontal-scroll">
            <h1 className="shrink-0 text-white text-[8rem] font-black uppercase whitespace-nowrap">
              POLAROID PRINT
            </h1>
            <h1 className="shrink-0 text-transparent text-[8rem] font-black uppercase whitespace-nowrap outline-text">
              FOLIO STUDIO
            </h1>
            <h1 className="shrink-0 text-white text-[8rem] font-black uppercase whitespace-nowrap">
              POLAROID PRINT
            </h1>
            <h1 className="shrink-0 text-transparent text-[8rem] font-black uppercase whitespace-nowrap outline-text">
              FOLIO STUDIO
            </h1>
          </div>
        </div>

        <Canvas
          shadows
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          camera={{ position: [0, 0.2, state.images.length > 3 ? 5.5 : 4], fov: 46 }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <PolaroidExperience images={state.images} frameId={state.frame} />
          </Suspense>
        </Canvas>

        <PolaroidPreviewUI
          imageCount={state.images.length}
          frameLabel={FRAME_LABELS[state.frame]}
          totalPrice={(state.quantities ?? state.images.map(() => 1)).reduce((s, q) => s + q, 0) * 199}
        />
        <Loader />
      </div>
    </Provider>
  )
}
