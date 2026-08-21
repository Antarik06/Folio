'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  ContactShadows,
  Float,
  Loader,
  OrbitControls,
} from '@react-three/drei'
import { Provider, useAtom } from 'jotai'
import * as THREE from 'three'
import { BookScene } from './scenes/book'
import { MagazineScene } from './scenes/magazine'
import { PolaroidScene } from './scenes/polaroid'
import { viewerIndexAtom, type ViewerStyle } from './state'
import { AlbumViewerControls, type ViewerAction } from './AlbumViewerControls'
import { CornerMarks } from '@/components/folio/marks'

/**
 * The one 3D viewer.
 *
 * This replaces six files — Experience / MagazineExperience /
 * PolaroidExperience and PreviewUI / MagazinePreviewUI / PolaroidPreviewUI —
 * that were copy-pasted per style, each with its own page atom, its own
 * identical HUD, and its own near-identical lighting rig. A new style now
 * extends the `style` union and adds one entry to STAGES; it does not fork
 * this file.
 *
 * The three scene meshes stay in ./scenes because they are genuinely
 * different geometry (a curved page-turn simulation, a glossy magazine, a
 * scattered print stack) rather than the same thing with different props.
 *
 * Presentation follows the design's 3D Album Preview screen: a dark stage with
 * registration marks at all four corners, a real cast shadow, a mono spec
 * stamp, and a hard-edged terracotta order stamp — the decoration IS the
 * production marks.
 */

interface StageConfig {
  /** Tone mapping suits glossy stock differently from matte. */
  toneMapping: THREE.ToneMapping
  float: { intensity: number; speed: number; rotation: number; rotationX?: number }
  orbit: { min: number; max: number; minPolar: number; maxPolar: number }
  ambient: number
  directional: number
  /** Glossy styles get an extra rim light. */
  rim?: { position: [number, number, number]; intensity: number; angle: number; penumbra: number }
  point: { position: [number, number, number]; intensity: number; color: string }
  shadow: { opacity: number; blur: number }
}

const STAGES: Record<ViewerStyle, StageConfig> = {
  book: {
    toneMapping: THREE.NoToneMapping,
    float: { intensity: 0.5, speed: 1.5, rotation: 1, rotationX: -Math.PI / 6 },
    orbit: { min: 3, max: 10, minPolar: Math.PI / 4, maxPolar: Math.PI / 1.5 },
    ambient: 1.5,
    directional: 1.0,
    point: { position: [-3, 2, -2], intensity: 0.5, color: '#F5F0E8' },
    shadow: { opacity: 0.4, blur: 2 },
  },
  magazine: {
    toneMapping: THREE.ACESFilmicToneMapping,
    float: { intensity: 0.4, speed: 1.2, rotation: 0.6, rotationX: -Math.PI / 6 },
    orbit: { min: 3, max: 10, minPolar: Math.PI / 4, maxPolar: Math.PI / 1.5 },
    ambient: 1.8,
    directional: 1.2,
    rim: { position: [4, 4, -2], intensity: 0.6, angle: 0.5, penumbra: 0.8 },
    point: { position: [-3, 2, -2], intensity: 0.5, color: '#F5F0E8' },
    shadow: { opacity: 0.4, blur: 2 },
  },
  polaroid: {
    toneMapping: THREE.NoToneMapping,
    float: { intensity: 0.2, speed: 1.4, rotation: 0.2 },
    orbit: { min: 2.5, max: 9, minPolar: Math.PI / 6, maxPolar: Math.PI / 1.6 },
    ambient: 2.0,
    directional: 1.4,
    rim: { position: [0, 7, 3], intensity: 0.9, angle: 0.35, penumbra: 0.6 },
    point: { position: [-4, 3, -2], intensity: 0.6, color: '#FFF5E0' },
    shadow: { opacity: 0.35, blur: 2.5 },
  },
}

export interface AlbumViewerProps {
  style: ViewerStyle
  /** Album record — required for `book` and `magazine`. */
  album?: any
  /** Print sources — required for `polaroid`. */
  images?: string[]
  /** Polaroid frame preset id. */
  frameId?: string
  /** Headline shown in the HUD. Falls back to the album title. */
  title?: string
  /** Mono spec stamp lines, e.g. ["24 SPREADS · 12×12in", "LINEN COVER"]. */
  spec?: string[]
  /** Where the back link goes, and what it says. */
  back?: { href: string; label: string }
  /** The single terracotta stamp bottom-right. */
  action?: ViewerAction
}

export function AlbumViewer(props: AlbumViewerProps) {
  const [mounted, setMounted] = useState(false)

  // Three.js needs a real DOM; rendering the canvas during SSR throws.
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="h-[100dvh] w-full bg-[#12100D]" aria-hidden="true" />
  }

  return (
    <Provider>
      <ViewerStage {...props} />
    </Provider>
  )
}

function ViewerStage({
  style,
  album,
  images = [],
  frameId = 'classic',
  title,
  spec,
  back,
  action,
}: AlbumViewerProps) {
  const stage = STAGES[style]

  const itemCount =
    style === 'polaroid'
      ? images.length
      : (album?.layout_data?.spreads?.length ?? 0) + 1

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#12100D]">
      {/* Press-proof framing. Hidden on phones, where the HUD already
          occupies the corners. */}
      <div className="hidden sm:block">
        <CornerMarks inset={16} />
      </div>

      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: stage.toneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ position: [-0.5, 0.5, 2.5], fov: 45 }}
        // Cap the pixel ratio at 2: phones report up to 4, which quadruples
        // the fragment cost of a full-screen WebGL canvas for no visible gain.
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Scene
            style={style}
            album={album}
            images={images}
            frameId={frameId}
            stage={stage}
          />
        </Suspense>
      </Canvas>

      <AlbumViewerControls
        style={style}
        title={title ?? album?.title ?? 'Preview'}
        count={itemCount}
        spec={spec}
        back={back}
        action={action}
      />

      <Loader />
    </div>
  )
}

function Scene({
  style,
  album,
  images,
  frameId,
  stage,
}: {
  style: ViewerStyle
  album: any
  images: string[]
  frameId: string
  stage: StageConfig
}) {
  const [index, setIndex] = useAtom(viewerIndexAtom)

  // A lone print should drift more than a stack; a stack should stay put.
  const solo = style === 'polaroid' && images.length === 1
  const floatIntensity = solo ? 0.6 : stage.float.intensity
  const rotationIntensity = solo ? 0.8 : stage.float.rotation

  return (
    <>
      <Float
        rotation-x={stage.float.rotationX}
        floatIntensity={floatIntensity}
        speed={stage.float.speed}
        rotationIntensity={rotationIntensity}
      >
        {style === 'book' ? <BookScene album={album} /> : null}
        {style === 'magazine' ? <MagazineScene album={album} /> : null}
        {style === 'polaroid' ? (
          <PolaroidScene
            images={images}
            frameId={frameId}
            focusedIndex={index}
            onFocus={setIndex}
          />
        ) : null}
      </Float>

      <OrbitControls
        enablePan={false}
        minDistance={stage.orbit.min}
        maxDistance={stage.orbit.max}
        minPolarAngle={stage.orbit.minPolar}
        maxPolarAngle={stage.orbit.maxPolar}
      />

      <ambientLight intensity={stage.ambient} />
      <directionalLight
        position={[2, 5, 2]}
        intensity={stage.directional}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <pointLight
        position={stage.point.position}
        intensity={stage.point.intensity}
        color={stage.point.color}
      />
      {stage.rim ? (
        <spotLight
          position={stage.rim.position}
          intensity={stage.rim.intensity}
          angle={stage.rim.angle}
          penumbra={stage.rim.penumbra}
          castShadow={style === 'polaroid'}
          color="#ffffff"
        />
      ) : null}

      <ContactShadows
        position={[0, style === 'polaroid' ? -1.4 : -1.5, 0]}
        opacity={stage.shadow.opacity}
        scale={10}
        blur={stage.shadow.blur}
        far={4.5}
      />
    </>
  )
}
