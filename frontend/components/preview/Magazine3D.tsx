'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import { useAtom } from 'jotai'
import { easing } from 'maath'
import * as THREE from 'three'
import { magazinePageAtom } from './MagazinePreviewUI'

// --- Animation constants (same as Book3D) ---
const easingFactor      = 0.5
const easingFactorFold  = 0.3
const insideCurveStrength  = 0.18
const outsideCurveStrength = 0.05
const turningCurveStrength = 0.09

// --- Magazine dimensions (portrait A5-ish, slightly wider than book) ---
const PAGE_WIDTH    = 1.28
const PAGE_HEIGHT   = 1.71
const PAGE_DEPTH    = 0.003
const PAGE_GAP      = 0.0015
const PAGE_SEGMENTS = 30
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS

// --- Shared skinned geometry (identical setup to Book3D) ---
const pageGeometry = new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_DEPTH, PAGE_SEGMENTS, 2)
pageGeometry.translate(PAGE_WIDTH / 2, 0, 0)

const pos      = pageGeometry.attributes.position
const vertex   = new THREE.Vector3()
const skinIdx: number[]  = []
const skinWts: number[]  = []

for (let i = 0; i < pos.count; i++) {
  vertex.fromBufferAttribute(pos, i)
  const x         = vertex.x
  const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH))
  const skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH
  skinIdx.push(skinIndex, skinIndex + 1, 0, 0)
  skinWts.push(1 - skinWeight, skinWeight, 0, 0)
}

pageGeometry.setAttribute('skinIndex',  new THREE.Uint16BufferAttribute(skinIdx, 4))
pageGeometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWts, 4))

// --- Page component (glossy magazine materials) ---
interface PageProps {
  number: number
  frontTexture: THREE.Texture
  backTexture: THREE.Texture
  opened: boolean
  bookClosed: boolean
  currentPage: number
}

const MagazinePage = ({ number, frontTexture, backTexture, opened, bookClosed, currentPage }: PageProps) => {
  const group           = useRef<THREE.Group>(null!)
  const turnedAt        = useRef(0)
  const lastOpened      = useRef(opened)
  const skinnedMeshRef  = useRef<THREE.SkinnedMesh>(null!)

  const manualSkinnedMesh = useMemo(() => {
    const bones: THREE.Bone[] = []
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      const bone = new THREE.Bone()
      bones.push(bone)
      bone.position.x = i === 0 ? 0 : SEGMENT_WIDTH
      if (i > 0) bones[i - 1].add(bone)
    }
    const skeleton = new THREE.Skeleton(bones)

    // Glossy magazine materials (low roughness, tiny metalness)
    const materials = [
      new THREE.MeshStandardMaterial({ color: '#f0f0f0', roughness: 0.15, metalness: 0.04 }),
      new THREE.MeshStandardMaterial({ color: '#111',    roughness: 0.15, metalness: 0.04 }),
      new THREE.MeshStandardMaterial({ color: '#f0f0f0', roughness: 0.15, metalness: 0.04 }),
      new THREE.MeshStandardMaterial({ color: '#f0f0f0', roughness: 0.15, metalness: 0.04 }),
      new THREE.MeshStandardMaterial({ color: '#ffffff', map: frontTexture, roughness: 0.12, metalness: 0.05 }),
      new THREE.MeshStandardMaterial({ color: '#ffffff', map: backTexture,  roughness: 0.12, metalness: 0.05 }),
    ]

    const mesh = new THREE.SkinnedMesh(pageGeometry, materials)
    mesh.castShadow    = true
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    mesh.add(skeleton.bones[0])
    mesh.bind(skeleton)
    return mesh
  }, [frontTexture, backTexture])

  useFrame((_, delta) => {
    if (!skinnedMeshRef.current) return
    if (lastOpened.current !== opened) {
      turnedAt.current   = Date.now()
      lastOpened.current = opened
    }
    let turningTime = Math.min(400, Date.now() - turnedAt.current) / 400
    turningTime = Math.sin(turningTime * Math.PI)

    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2
    if (!bookClosed) {
      targetRotation += (number * 0.8 * Math.PI) / 180
    } else {
      // Add a tiny fanning effect even when closed to eliminate Z-fighting (flickering)
      targetRotation += (number * 0.15 * Math.PI) / 180
    }

    const bones = skinnedMeshRef.current.skeleton.bones
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? group.current : bones[i]
      const insideCurveIntensity  = i < 8  ? Math.sin(i * 0.2 + 0.25) : 0
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0
      const turningIntensity      = Math.sin(i * Math.PI * (1 / bones.length)) * turningTime

      let rotationAngle =
        insideCurveStrength  * insideCurveIntensity  * targetRotation -
        outsideCurveStrength * outsideCurveIntensity * targetRotation +
        turningCurveStrength * turningIntensity      * targetRotation

      let foldRotationAngle = (Math.sign(targetRotation) * 2 * Math.PI) / 180

      if (bookClosed) {
        rotationAngle     = i === 0 ? targetRotation : 0
        foldRotationAngle = 0
      }

      easing.dampAngle(target.rotation, 'y', rotationAngle, easingFactor, delta)

      const foldIntensity = i > 8
        ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
        : 0
      easing.dampAngle(target.rotation, 'x', foldRotationAngle * foldIntensity, easingFactorFold, delta)
    }
  })

  return (
    <group ref={group} position-z={-number * (PAGE_DEPTH + PAGE_GAP) + currentPage * (PAGE_DEPTH + PAGE_GAP)}>
      <primitive object={manualSkinnedMesh} ref={skinnedMeshRef} />
    </group>
  )
}

// --- Watermark helper ---
const WATERMARK_POINTS = (() => {
  const pts: { x: number; y: number }[] = []
  for (let y = 120; y <= 1120; y += 220)
    for (let x = -220; x <= 920; x += 360)
      pts.push({ x, y })
  return pts
})()

// --- Main Magazine3D component ---
interface Magazine3DProps {
  album: any
}

export function Magazine3D({ album }: Magazine3DProps) {
  const [page]         = useAtom(magazinePageAtom)
  const [delayedPage, setDelayedPage] = useState(page)
  const spreads = album.layout_data?.spreads || []
  const [textures, setTextures] = useState<THREE.Texture[]>([])

  useEffect(() => {
    const gen = async () => {
      const results: THREE.Texture[] = []
      const W = 1050
      const H = 1500

      for (const spread of spreads) {
        const ft = new THREE.CanvasTexture(
          await renderToCanvas(spread.front, W, H, spread.isCover ? album.cover_image_url : undefined)
        )
        const bt = new THREE.CanvasTexture(await renderToCanvas(spread.back, W, H))
        ft.colorSpace = bt.colorSpace = THREE.SRGBColorSpace
        results.push(ft, bt)
      }

      const finalBack = new THREE.CanvasTexture(await renderToCanvas({}, W, H))
      finalBack.colorSpace = THREE.SRGBColorSpace
      results.push(finalBack, finalBack)
      setTextures(results)
    }
    gen()
  }, [spreads, album])

  async function renderToCanvas(pageData: any, width: number, height: number, coverImg?: string) {
    const canvas = document.createElement('canvas')
    canvas.width  = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    ctx.fillStyle = pageData?.background || '#F5F0E8'
    ctx.fillRect(0, 0, width, height)

    if (coverImg) {
      await new Promise<void>((res) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const iR = img.width / img.height
          const fR = width / height
          let sx = 0, sy = 0, sw = img.width, sh = img.height
          if (iR > fR) { sw = sh * fR; sx = (img.width - sw) / 2 }
          else         { sh = sw / fR; sy = (img.height - sh) / 2 }
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)
          res()
        }
        img.onerror = () => res()
        img.src = coverImg
      })
    }

    const scaleX = width  / 700
    const scaleY = height / 1000

    for (const el of pageData?.elements ?? []) {
      ctx.save()
      ctx.translate(el.x * scaleX, el.y * scaleY)
      ctx.rotate((el.rotation * Math.PI) / 180)

      if (el.type === 'image') {
        await new Promise<void>((res) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            ctx.globalAlpha = el.opacity ?? 1
            const iR = img.width / img.height
            const eR = el.width  / el.height
            let sx = 0, sy = 0, sw = img.width, sh = img.height
            if (iR > eR) { sw = sh * eR; sx = (img.width - sw) / 2 }
            else         { sh = sw / eR; sy = (img.height - sh) / 2 }
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, el.width * scaleX, el.height * scaleY)
            res()
          }
          img.onerror = () => res()
          img.src = el.src
        })
      } else if (el.type === 'text') {
        ctx.fillStyle  = el.fill
        const fs       = (el.fontSize || 20) * scaleX
        ctx.font       = `${el.fontWeight || 'normal'} ${fs}px ${el.fontFamily || 'Georgia, serif'}`
        ctx.textAlign  = el.textAlign as CanvasTextAlign
        ctx.textBaseline = 'top'
        ctx.fillText(el.text, 0, 0)
      }
      ctx.restore()
    }

    // Watermark
    const wmText = album.watermark_text || 'FOLIO PRESS'
    ctx.save()
    ctx.globalAlpha = 0.04
    ctx.fillStyle   = '#000'
    const wfs = 14 * scaleX
    ctx.font = `${wfs}px Georgia, serif`
    for (const pt of WATERMARK_POINTS) {
      ctx.save()
      ctx.translate(pt.x * scaleX, pt.y * scaleY)
      ctx.rotate(-24 * Math.PI / 180)
      ctx.fillText(wmText, 0, 0)
      ctx.restore()
    }
    ctx.restore()

    return canvas
  }

  useEffect(() => {
    let timeout: any
    const go = () => {
      setDelayedPage((dp) => {
        if (page === dp) return dp
        timeout = setTimeout(go, Math.abs(page - dp) > 2 ? 50 : 150)
        return page > dp ? dp + 1 : dp - 1
      })
    }
    go()
    return () => clearTimeout(timeout)
  }, [page])

  if (textures.length === 0) return null

  const pages = []
  for (let i = 0; i < textures.length; i += 2)
    pages.push({ front: textures[i], back: textures[i + 1] })

  return (
    <group rotation-y={-Math.PI / 2}>
      {pages.map((pd, idx) => (
        <MagazinePage
          key={idx}
          number={idx}
          frontTexture={pd.front}
          backTexture={pd.back}
          currentPage={delayedPage}
          opened={delayedPage > idx}
          bookClosed={delayedPage === 0 || delayedPage === pages.length}
        />
      ))}
    </group>
  )
}
