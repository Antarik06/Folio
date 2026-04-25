'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'
import { Experience } from '@/components/preview/Experience'
import { PreviewUI } from '@/components/preview/PreviewUI'
import { Provider } from 'jotai'
import * as THREE from 'three'

interface PreviewClientProps {
  album: any
}

export default function PreviewClient({ album }: PreviewClientProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Provider>
      <div className="relative w-screen h-screen bg-[#12100D] overflow-hidden">
        <div className="fixed inset-0 flex items-center -rotate-2 select-none pointer-events-none opacity-[0.03]">
          <div className="relative">
            <div className="flex items-center gap-12 w-max animate-horizontal-scroll">
              <h1 className="shrink-0 text-white text-[8rem] font-black uppercase whitespace-nowrap">
                {album.title}
              </h1>
              <h1 className="shrink-0 text-transparent text-[8rem] font-black uppercase whitespace-nowrap outline-text">
                PHOTOMEMORIES
              </h1>
              <h1 className="shrink-0 text-white text-[8rem] font-black uppercase whitespace-nowrap">
                {album.title}
              </h1>
              <h1 className="shrink-0 text-transparent text-[8rem] font-black uppercase whitespace-nowrap outline-text">
                FOLIO ALBUM
              </h1>
            </div>
          </div>
        </div>
        <Canvas
          shadows
          gl={{ 
            antialias: true, 
            toneMapping: THREE.NoToneMapping,
            outputColorSpace: THREE.SRGBColorSpace 
          }}
          camera={{ position: [-0.5, 0.5, 2.5], fov: 45 }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <Experience album={album} />
          </Suspense>
        </Canvas>
        
        <PreviewUI album={album} />
        <Loader />
      </div>
    </Provider>
  )
}
