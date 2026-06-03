'use client'

import React from 'react'
import { Environment, Float, OrbitControls, ContactShadows } from '@react-three/drei'
import { Book3D } from './Book3D'

interface ExperienceProps {
  album: any
}

export function Experience({ album }: ExperienceProps) {
  return (
    <>
      <Float
        rotation-x={-Math.PI / 6}
        floatIntensity={0.5}
        speed={1.5}
        rotationIntensity={1}
      >
        <Book3D album={album} />
      </Float>
      
      <OrbitControls 
        enablePan={false} 
        minDistance={3} 
        maxDistance={10}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
      />
      
      <ambientLight intensity={1.5} />
      <directionalLight
        position={[2, 5, 2]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      
      <pointLight position={[-3, 2, -2]} intensity={0.5} color="#F5F0E8" />
      
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
