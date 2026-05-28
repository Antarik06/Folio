'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'
import { Provider } from 'jotai'
import * as THREE from 'three'
import { Experience } from '@/components/preview/Experience'
import { PreviewUI } from '@/components/preview/PreviewUI'
import { MagazineExperience } from '@/components/preview/MagazineExperience'
import { MagazinePreviewUI } from '@/components/preview/MagazinePreviewUI'
import { AlbumProductType } from '@/lib/product-type'

interface AlbumPreview3DProps {
  album: any
  productType: AlbumProductType
}

export function AlbumPreview3D({ album, productType }: AlbumPreview3DProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isMagazine = productType === 'magazine'
  const midWord = isMagazine ? 'MAGAZINE PRINT' : 'PHOTOMEMORIES'
  const endWord = isMagazine ? 'FOLIO PRESS' : 'FOLIO ALBUM'

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
                {midWord}
              </h1>
              <h1 className="shrink-0 text-white text-[8rem] font-black uppercase whitespace-nowrap">
                {album.title}
              </h1>
              <h1 className="shrink-0 text-transparent text-[8rem] font-black uppercase whitespace-nowrap outline-text">
                {endWord}
              </h1>
            </div>
          </div>
        </div>
        <Canvas
          shadows
          gl={{
            antialias: true,
            toneMapping: isMagazine ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          camera={{ position: [-0.5, 0.5, 2.5], fov: 45 }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            {isMagazine ? <MagazineExperience album={album} /> : <Experience album={album} />}
          </Suspense>
        </Canvas>

        {isMagazine ? <MagazinePreviewUI album={album} /> : <PreviewUI album={album} />}
        <Loader />
      </div>
    </Provider>
  )
}
