'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import { useAtom } from 'jotai'
import { easing } from 'maath'
import * as THREE from 'three'
import { magazinePageAtom } from './MagazinePreviewUI'
import { getAlbumAspectRatio } from '@/lib/template-engine-utils'

// Animation constants (same as Book3D)
const insideCurveStrength = 0.18
const outsideCurveStrength = 0.05
const turningCurveStrength = 0.09

interface PageProps {
  number: number
  frontTexture: THREE.Texture
  backTexture: THREE.Texture
  opened: boolean
  bookClosed: boolean
  currentPage: number
  pageGeometry: THREE.BufferGeometry
  segmentWidth: number
  pageDepth: number
  pageGap: number
}

const MagazinePage = ({
  number,
  frontTexture,
  backTexture,
  opened,
  bookClosed,
  currentPage,
  pageGeometry,
  segmentWidth,
  pageDepth,
  pageGap
}: PageProps) => {
  const group = useRef<THREE.Group>(null!)
  const turnedAt = useRef(0)
  const lastOpened = useRef(opened)
  const skinnedMeshRef = useRef<THREE.SkinnedMesh>(null!)

  const manualSkinnedMesh = useMemo(() => {
    const bones: THREE.Bone[] = []
    const PAGE_SEGMENTS = 30
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      const bone = new THREE.Bone()
      bones.push(bone)
      bone.position.x = i === 0 ? 0 : segmentWidth
      if (i > 0) bones[i - 1].add(bone)
    }
    const skeleton = new THREE.Skeleton(bones)

    // Glossy magazine materials (low roughness, tiny metalness)
    const materials = [
      new THREE.MeshStandardMaterial({ color: '#f0f0f0', roughness: 0.15, metalness: 0.04 }),
      new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.15, metalness: 0.04 }),
      new THREE.MeshStandardMaterial({ color: '#f0f0f0', roughness: 0.15, metalness: 0.04 }),
      new THREE.MeshStandardMaterial({ color: '#f0f0f0', roughness: 0.15, metalness: 0.04 }),
      new THREE.MeshStandardMaterial({ color: '#ffffff', map: frontTexture, roughness: 0.12, metalness: 0.05 }),
      new THREE.MeshStandardMaterial({ color: '#ffffff', map: backTexture, roughness: 0.12, metalness: 0.05 }),
    ]

    const mesh = new THREE.SkinnedMesh(pageGeometry, materials)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    mesh.add(skeleton.bones[0])
    mesh.bind(skeleton)
    return mesh
  }, [frontTexture, backTexture, pageGeometry, segmentWidth])

  useFrame((_, delta) => {
    if (!skinnedMeshRef.current) return
    if (lastOpened.current !== opened) {
      turnedAt.current = Date.now()
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
    const easingFactor = 0.5
    const easingFactorFold = 0.3

    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? group.current : bones[i]
      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0
      const turningIntensity = Math.sin(i * Math.PI * (1 / bones.length)) * turningTime

      let rotationAngle =
        insideCurveStrength * insideCurveIntensity * targetRotation -
        outsideCurveStrength * outsideCurveIntensity * targetRotation +
        turningCurveStrength * turningIntensity * targetRotation

      let foldRotationAngle = (Math.sign(targetRotation) * 2 * Math.PI) / 180

      if (bookClosed) {
        rotationAngle = i === 0 ? targetRotation : 0
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
    <group ref={group} position-z={-number * (pageDepth + pageGap) + currentPage * (pageDepth + pageGap)}>
      <primitive object={manualSkinnedMesh} ref={skinnedMeshRef} />
    </group>
  )
}

interface Magazine3DProps {
  album: any
}

export function Magazine3D({ album }: Magazine3DProps) {
  const [page] = useAtom(magazinePageAtom)
  const [delayedPage, setDelayedPage] = useState(page)
  const spreads = album.layout_data?.spreads || []
  const [textures, setTextures] = useState<THREE.Texture[]>([])

  const aspectRatio = useMemo(() => getAlbumAspectRatio(album), [album])

  const PAGE_HEIGHT = 1.71
  const PAGE_WIDTH = PAGE_HEIGHT * aspectRatio
  const PAGE_DEPTH = 0.003
  const PAGE_GAP = 0.0015
  const PAGE_SEGMENTS = 30
  const segmentWidth = PAGE_WIDTH / PAGE_SEGMENTS

  const pageGeometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(
      PAGE_WIDTH,
      PAGE_HEIGHT,
      PAGE_DEPTH,
      PAGE_SEGMENTS,
      2
    )
    geo.translate(PAGE_WIDTH / 2, 0, 0)

    const position = geo.attributes.position
    const vertex = new THREE.Vector3()
    const skinIndexes = []
    const skinWeights = []

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i)
      const x = vertex.x
      const skinIndex = Math.min(PAGE_SEGMENTS - 1, Math.max(0, Math.floor(x / segmentWidth)))
      let skinWeight = (x % segmentWidth) / segmentWidth
      skinIndexes.push(skinIndex, skinIndex + 1, 0, 0)
      skinWeights.push(1 - skinWeight, skinWeight, 0, 0)
    }

    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndexes, 4))
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4))
    return geo
  }, [PAGE_WIDTH, PAGE_HEIGHT, PAGE_DEPTH, PAGE_SEGMENTS, segmentWidth])

  useEffect(() => {
    const gen = async () => {
      const results: THREE.Texture[] = []
      const H = 1500
      const W = Math.round(H * aspectRatio)

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
  }, [spreads, album, aspectRatio])

  async function renderToCanvas(pageData: any, width: number, height: number, coverImg?: string) {
    const canvas = document.createElement('canvas')
    canvas.width = width
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
          else { sh = sw / fR; sy = (img.height - sh) / 2 }
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)
          res()
        }
        img.onerror = () => res()
        img.src = coverImg
      })
    }

    const albumWidth = Math.round(1000 * aspectRatio)
    const scaleX = width / albumWidth
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
            const eR = el.width / el.height
            let sx = 0, sy = 0, sw = img.width, sh = img.height
            if (iR > eR) { sw = sh * eR; sx = (img.width - sw) / 2 }
            else { sh = sw / eR; sy = (img.height - sh) / 2 }
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, el.width * scaleX, el.height * scaleY)
            res()
          }
          img.onerror = () => res()
          img.src = el.src
        })
      } else if (el.type === 'text') {
        ctx.fillStyle = el.fill
        const fs = (el.fontSize || 20) * scaleX
        ctx.font = `${el.fontWeight || 'normal'} ${fs}px ${el.fontFamily || 'Georgia, serif'}`
        ctx.textAlign = el.textAlign as CanvasTextAlign
        ctx.textBaseline = 'top'
        let tx = 0
        if (el.textAlign === 'center') {
          tx = (el.width * scaleX) / 2
        } else if (el.textAlign === 'right') {
          tx = el.width * scaleX
        }
        ctx.fillText(el.text, tx, 0)
      } else if (el.type === 'drawing') {
        if (el.points) {
          ctx.strokeStyle = el.stroke
          ctx.lineWidth = el.strokeWidth * scaleX
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.beginPath()
          ctx.moveTo(el.points[0] * scaleX, el.points[1] * scaleY)
          for (let i = 2; i < el.points.length; i += 2) {
            ctx.lineTo(el.points[i] * scaleX, el.points[i + 1] * scaleY)
          }
          ctx.stroke()
        }
      }
      ctx.restore()
    }

    // Watermark
    const wmText = album.watermark_text || 'FOLIO PRESS'
    ctx.save()
    ctx.globalAlpha = 0.04
    ctx.fillStyle = '#000'
    const wfs = 14 * scaleX
    ctx.font = `${wfs}px Georgia, serif`

    const watermarkPoints = []
    for (let y = 120; y <= 1000 + 120; y += 220) {
      for (let x = -220; x <= albumWidth + 220; x += 360) {
        watermarkPoints.push({ x, y })
      }
    }

    for (const pt of watermarkPoints) {
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
          pageGeometry={pageGeometry}
          segmentWidth={segmentWidth}
          pageDepth={PAGE_DEPTH}
          pageGap={PAGE_GAP}
        />
      ))}
    </group>
  )
}
