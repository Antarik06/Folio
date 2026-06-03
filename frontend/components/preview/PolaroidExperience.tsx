'use client'

import React from 'react'
import { Float, OrbitControls, ContactShadows } from '@react-three/drei'
import { Polaroid3D } from './Polaroid3D'
import { useAtom } from 'jotai'
import { polaroidFocusAtom } from './PolaroidPreviewUI'

interface PolaroidExperienceProps {
  images: string[]
  frameId: string
}

export function PolaroidExperience({ images, frameId }: PolaroidExperienceProps) {
  const [focused, setFocused] = useAtom(polaroidFocusAtom)

  return (
    <>
      <Float
        floatIntensity={images.length === 1 ? 0.6 : 0.2}
        speed={1.4}
        rotationIntensity={images.length === 1 ? 0.8 : 0.2}
      >
        <Polaroid3D
          images={images}
          frameId={frameId}
          focusedIndex={focused}
          onFocus={setFocused}
        />
      </Float>

      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={9}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.6}
      />

      <ambientLight intensity={2.0} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <pointLight position={[-4, 3, -2]} intensity={0.6} color="#FFF5E0" />
      <spotLight
        position={[0, 7, 3]}
        intensity={0.9}
        angle={0.35}
        penumbra={0.6}
        castShadow
      />

      <ContactShadows
        position={[0, -1.4, 0]}
        opacity={0.35}
        scale={10}
        blur={2.5}
        far={4.5}
      />
    </>
  )
}
