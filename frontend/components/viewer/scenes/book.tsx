'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import { useAtom } from 'jotai'
import { easing } from 'maath'
import * as THREE from 'three'
import { previewPageAtom } from './PreviewUI'
import { getAlbumAspectRatio } from '@/lib/template-engine-utils'

// Animation constants
const insideCurveStrength = 0.18
const outsideCurveStrength = 0.05
const turningCurveStrength = 0.09

interface PageProps {
  number: number
  frontTexture: THREE.Texture
  backTexture: THREE.Texture
  totalPageCount: number
  opened: boolean
  bookClosed: boolean
  currentPage: number
  pageGeometry: THREE.BufferGeometry
  segmentWidth: number
  pageDepth: number
  pageGap: number
}

const Page = ({
  number,
  frontTexture,
  backTexture,
  totalPageCount,
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
    const bones = []
    const PAGE_SEGMENTS = 30
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      let bone = new THREE.Bone()
      bones.push(bone)
      if (i === 0) bone.position.x = 0
      else bone.position.x = segmentWidth
      if (i > 0) bones[i - 1].add(bone)
    }
    const skeleton = new THREE.Skeleton(bones)

    const materials = [
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1.0, metalness: 0 }),
      new THREE.MeshStandardMaterial({ color: '#111', roughness: 1.0, metalness: 0 }),
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1.0, metalness: 0 }),
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1.0, metalness: 0 }),
      new THREE.MeshStandardMaterial({ color: '#ffffff', map: frontTexture, roughness: 1.0, metalness: 0 }),
      new THREE.MeshStandardMaterial({ color: '#ffffff', map: backTexture, roughness: 1.0, metalness: 0 }),
    ]

    const mesh = new THREE.SkinnedMesh(pageGeometry, materials)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    mesh.add(skeleton.bones[0])
    mesh.bind(skeleton)
    return mesh
  }, [frontTexture, backTexture, pageGeometry, segmentWidth])

  useFrame((state, delta) => {
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
      targetRotation += (number * 0.3 * Math.PI) / 180
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
        if (i === 0) {
          rotationAngle = targetRotation
          foldRotationAngle = 0
        } else {
          rotationAngle = 0
          foldRotationAngle = 0
        }
      }

      easing.dampAngle(target.rotation, 'y', rotationAngle, easingFactor, delta)

      const foldIntensity = i > 8 ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime : 0
      easing.dampAngle(target.rotation, 'x', foldRotationAngle * foldIntensity, easingFactorFold, delta)
    }
  })

  return (
    <group ref={group} position-z={-number * (pageDepth + pageGap) + currentPage * (pageDepth + pageGap)}>
      <primitive object={manualSkinnedMesh} ref={skinnedMeshRef} />
    </group>
  )
}

interface Book3DProps {
  album: any
}

export function Book3D({ album }: Book3DProps) {
  const [page] = useAtom(previewPageAtom)
  const [delayedPage, setDelayedPage] = useState(page)
  const spreads = album.layout_data?.spreads || []
  
  // Textures state
  const [textures, setTextures] = useState<THREE.Texture[]>([])

  const aspectRatio = useMemo(() => getAlbumAspectRatio(album), [album])

  const PAGE_HEIGHT = 1.71
  const PAGE_WIDTH = PAGE_HEIGHT * aspectRatio
  const PAGE_DEPTH = 0.004
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
    // Guards an async generation pass that outlives its effect. Without it, a
    // spread change mid-render resolved into setTextures() for stale data (or
    // onto an unmounted component) and stranded the textures it had built.
    let cancelled = false
    const created: THREE.Texture[] = []

    const disposeCreated = () => {
      created.forEach((tex) => tex.dispose())
      created.length = 0
    }

    const generateTextures = async () => {
      const H = 1500
      const W = Math.round(H * aspectRatio)

      // Loop through all spreads (Spread 0 is the cover)
      for (const spread of spreads) {
        const frontCanvas = await renderToCanvas(spread.front, W, H, spread.isCover ? album.cover_image_url : undefined)
        if (cancelled) return
        const backCanvas = await renderToCanvas(spread.back, W, H)
        if (cancelled) return

        const frontTex = new THREE.CanvasTexture(frontCanvas)
        const backTex = new THREE.CanvasTexture(backCanvas)
        frontTex.colorSpace = backTex.colorSpace = THREE.SRGBColorSpace
        created.push(frontTex, backTex)
      }

      // Final Back Cover (Exterior)
      const finalCanvas = await renderToCanvas({}, W, H)
      if (cancelled) return
      const finalBackTex = new THREE.CanvasTexture(finalCanvas)
      finalBackTex.colorSpace = THREE.SRGBColorSpace
      created.push(finalBackTex)

      if (cancelled) return
      setTextures([...created, finalBackTex])
    }

    void generateTextures()

    return () => {
      cancelled = true
      // Each page texture is a full-size RGBA canvas (several MB of VRAM), and
      // two are built per spread. Recreating them without disposing leaked the
      // entire previous set on every album change.
      disposeCreated()
    }
  }, [spreads, album, aspectRatio])

  async function renderToCanvas(pageData: any, width: number, height: number, coverImg?: string) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    // Background
    ctx.fillStyle = pageData.background || '#F5F0E8'
    ctx.fillRect(0, 0, width, height)

    // Handle Cover Image with object-fit: cover logic
    if (coverImg) {
      await new Promise<void>((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const imgRatio = img.width / img.height
          const frameRatio = width / height
          let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height
          // Always fill the canvas, cropping excess
          if (imgRatio > frameRatio) {
            sWidth = img.height * frameRatio
            sx = (img.width - sWidth) / 2
          } else {
            sHeight = img.width / frameRatio
            sy = (img.height - sHeight) / 2
          }
          sx = Math.max(0, sx)
          sy = Math.max(0, sy)
          sWidth = Math.max(1, sWidth)
          sHeight = Math.max(1, sHeight)
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height)
          resolve()
        }
        img.onerror = () => resolve()
        img.src = coverImg
      })
    }

    const albumWidth = Math.round(1000 * aspectRatio)
    const scaleX = width / albumWidth
    const scaleY = height / 1000

    const elements = pageData.elements || []
    for (const el of elements) {
      ctx.save()
      
      ctx.translate(el.x * scaleX, el.y * scaleY)
      ctx.rotate((el.rotation * Math.PI) / 180)
      
      if (el.type === 'image') {
        await new Promise<void>((resolve) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            ctx.globalAlpha = el.opacity ?? 1
            
            // Image Fill Logic
            const imgRatio = img.width / img.height
            const elRatio = el.width / el.height
            
            let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height
            
            if (imgRatio > elRatio) {
              sWidth = img.height * elRatio
              sx = (img.width - sWidth) / 2
            } else {
              sHeight = img.width / elRatio
              sy = (img.height - sHeight) / 2
            }
            
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, el.width * scaleX, el.height * scaleY)
            resolve()
          }
          img.onerror = () => resolve()
          img.src = el.src
        })
      } else if (el.type === 'text') {
        ctx.fillStyle = el.fill
        const fontSize = (el.fontSize || 20) * scaleX
        const fontFamily = el.fontFamily || 'Cormorant Garamond, serif'
        ctx.font = `${el.fontWeight || 'normal'} ${fontSize}px ${fontFamily}`
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

    // Render Watermark (if any)
    const watermarkText = album.watermark_text || "FOLIO SHARED VIEW"
    if (watermarkText) {
      ctx.save()
      ctx.globalAlpha = 0.05
      ctx.fillStyle = '#000000'
      const fontSize = 14 * scaleX
      ctx.font = `${fontSize}px Georgia, serif`
      
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
        ctx.fillText(watermarkText, 0, 0)
        ctx.restore()
      }
      ctx.restore()
    }

    return canvas
  }

  useEffect(() => {
    let timeout: any
    const goToPage = () => {
      setDelayedPage((delayed) => {
        if (page === delayed) return delayed
        timeout = setTimeout(goToPage, Math.abs(page - delayed) > 2 ? 50 : 150)
        return page > delayed ? delayed + 1 : delayed - 1
      })
    }
    goToPage()
    return () => clearTimeout(timeout)
  }, [page])

  if (textures.length === 0) return null

  const bookPages = []
  for (let i = 0; i < textures.length; i += 2) {
    bookPages.push({
      front: textures[i],
      back: textures[i + 1]
    })
  }

  return (
    <group rotation-y={-Math.PI / 2}>
      {bookPages.map((pageData, index) => (
        <Page
          key={index}
          number={index}
          frontTexture={pageData.front}
          backTexture={pageData.back}
          totalPageCount={bookPages.length}
          currentPage={delayedPage}
          opened={delayedPage > index}
          bookClosed={delayedPage === 0 || delayedPage === bookPages.length}
          pageGeometry={pageGeometry}
          segmentWidth={segmentWidth}
          pageDepth={PAGE_DEPTH}
          pageGap={PAGE_GAP}
        />
      ))}
    </group>
  )
}
