'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import { easing } from 'maath'
import * as THREE from 'three'

// --- Constants ---
const CARD_W = 1.1
const CARD_H = 1.42   // classic polaroid proportions
const CARD_D = 0.012

const FRAME_MAP: Record<string, { hex: string; isLight: boolean }> = {
  classic:  { hex: '#FDFAF5', isLight: true  },
  midnight: { hex: '#1C1814', isLight: false },
  vintage:  { hex: '#F2E8D5', isLight: true  },
  modern:   { hex: '#FFFFFF', isLight: true  },
}

// --- Canvas texture builder ---
async function buildPolaroidCanvas(src: string, frameHex: string, isLight: boolean): Promise<HTMLCanvasElement> {
  const W = 440
  const H = 540
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = frameHex
  ctx.fillRect(0, 0, W, H)

  const padSide = 22
  const padTop  = 22
  const imgSize = W - padSide * 2   // 396 — square image area

  await new Promise<void>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const iR = img.width / img.height
      let sx = 0, sy = 0, sw = img.width, sh = img.height
      if (iR > 1) { sw = sh; sx = (img.width - sw) / 2 }
      else        { sh = sw; sy = (img.height - sh) / 2 }
      ctx.drawImage(img, sx, sy, sw, sh, padSide, padTop, imgSize, imgSize)

      // subtle top vignette
      const vg = ctx.createLinearGradient(0, padTop, 0, padTop + 40)
      vg.addColorStop(0, 'rgba(0,0,0,0.09)')
      vg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = vg
      ctx.fillRect(padSide, padTop, imgSize, 40)
      resolve()
    }
    img.onerror = () => resolve()
    img.src = src
  })

  // Subtle divider line in label area
  const labelY = padTop + imgSize + 10
  ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padSide, labelY)
  ctx.lineTo(W - padSide, labelY)
  ctx.stroke()

  return canvas
}

// --- Single polaroid card ---
interface PolaroidCardProps {
  src: string
  frameId: string
  position: [number, number, number]
  rotation: [number, number, number]
  isFocused: boolean
  onClick: () => void
}

function PolaroidCard({ src, frameId, position, rotation, isFocused, onClick }: PolaroidCardProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  const frame = FRAME_MAP[frameId] ?? FRAME_MAP.classic
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    buildPolaroidCanvas(src, frame.hex, frame.isLight).then((canvas) => {
      const tex = new THREE.CanvasTexture(canvas)
      tex.colorSpace = THREE.SRGBColorSpace
      setTexture(tex)
    })
  }, [src, frame.hex, frame.isLight])

  const cardGeo = useMemo(() => new THREE.BoxGeometry(CARD_W, CARD_H, CARD_D), [])

  const materials = useMemo(() => {
    const side  = new THREE.MeshStandardMaterial({ color: frame.hex, roughness: 0.5 })
    const front = texture
      ? new THREE.MeshStandardMaterial({ map: texture, roughness: 0.28, metalness: 0.02 })
      : new THREE.MeshStandardMaterial({ color: frame.hex, roughness: 0.5 })
    const back  = new THREE.MeshStandardMaterial({ color: frame.hex, roughness: 0.6 })
    // BoxGeometry face order: +x, -x, +y, -y, +z (front), -z (back)
    return [side, side, side, side, front, back]
  }, [frame.hex, texture])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const tp: [number, number, number] = isFocused ? [0, 0.08, 0.7] : position
    const tr: [number, number, number] = isFocused ? [0, 0, 0]      : rotation
    const ts = isFocused ? 1.18 : hovered ? 1.05 : 1.0
    easing.damp3(groupRef.current.position, tp, 0.25, delta)
    easing.damp3(groupRef.current.rotation as any, tr, 0.25, delta)
    easing.damp(groupRef.current.scale, 'x', ts, 0.18, delta)
    easing.damp(groupRef.current.scale, 'y', ts, 0.18, delta)
    easing.damp(groupRef.current.scale, 'z', ts, 0.18, delta)
  })

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh geometry={cardGeo} material={materials} castShadow receiveShadow />
    </group>
  )
}

// --- Multi-card group ---
export interface Polaroid3DProps {
  images: string[]
  frameId: string
  focusedIndex: number
  onFocus: (i: number) => void
}

export function Polaroid3D({ images, frameId, focusedIndex, onFocus }: Polaroid3DProps) {
  const n = images.length

  const positions = useMemo<[number, number, number][]>(() =>
    images.map((_, i) => {
      const t = n === 1 ? 0 : (i - (n - 1) / 2) / Math.max(1, n - 1)
      return [t * Math.min(1.8, n * 0.85), t * -0.08, -i * 0.04]
    }), [images, n])

  const rotations = useMemo<[number, number, number][]>(() =>
    images.map((_, i) => {
      const t = n === 1 ? 0 : (i - (n - 1) / 2) / Math.max(1, n - 1)
      return [0, 0, t * (Math.PI / 7.5)] as [number, number, number]
    }), [images, n])

  return (
    <group>
      {images.map((src, i) => (
        <PolaroidCard
          key={i}
          src={src}
          frameId={frameId}
          position={positions[i]}
          rotation={rotations[i]}
          isFocused={focusedIndex === i}
          onClick={() => onFocus(i)}
        />
      ))}
    </group>
  )
}
