'use client'

import React from 'react'
import { Float, OrbitControls, ContactShadows } from '@react-three/drei'
import { Magazine3D } from './Magazine3D'

interface MagazineExperienceProps {
  album: any
}

export function MagazineExperience({ album }: MagazineExperienceProps) {
  return (
    <>
      <Float rotation-x={-Math.PI / 6} floatIntensity={0.4} speed={1.2} rotationIntensity={0.6}>
        <Magazine3D album={album} />
      </Float>

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={10}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
      />

      <ambientLight intensity={1.8} />
      <directionalLight
        position={[2, 5, 2]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <pointLight position={[-3, 2, -2]} intensity={0.5} color="#F5F0E8" />
      {/* Extra rim light for glossy magazine effect */}
      <spotLight
        position={[4, 4, -2]}
        intensity={0.6}
        angle={0.5}
        penumbra={0.8}
        color="#ffffff"
      />

      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4.5}
      />
    </>
  )
}
