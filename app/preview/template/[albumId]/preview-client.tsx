'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'
import { Provider } from 'jotai'
import * as THREE from 'three'
import { MagazineExperience } from '@/components/preview/MagazineExperience'
import { MagazinePreviewUI } from '@/components/preview/MagazinePreviewUI'

interface Props {
  album: any
}

export default function MagazinePreviewClient({ album }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <Provider>
      <div className="relative w-screen h-screen bg-[#12100D] overflow-hidden">
        {/* Scrolling background text */}
        <div className="fixed inset-0 flex items-center -rotate-2 select-none pointer-events-none opacity-[0.03]">
          <div className="relative">
            <div className="flex items-center gap-12 w-max animate-horizontal-scroll">
              <h1 className="shrink-0 text-white text-[8rem] font-black uppercase whitespace-nowrap">
                {album.title}
              </h1>
              <h1 className="shrink-0 text-transparent text-[8rem] font-black uppercase whitespace-nowrap outline-text">
                MAGAZINE PRINT
              </h1>
              <h1 className="shrink-0 text-white text-[8rem] font-black uppercase whitespace-nowrap">
                {album.title}
              </h1>
              <h1 className="shrink-0 text-transparent text-[8rem] font-black uppercase whitespace-nowrap outline-text">
                FOLIO PRESS
              </h1>
            </div>
          </div>
        </div>

        <Canvas
          shadows
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          camera={{ position: [-0.5, 0.5, 2.5], fov: 45 }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <MagazineExperience album={album} />
          </Suspense>
        </Canvas>

        <MagazinePreviewUI album={album} />
        <Loader />
      </div>
    </Provider>
  )
}
