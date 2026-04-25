'use client'

import React, { useEffect, useRef, useState } from 'react'
import { AlbumSpread, AlbumElement } from '@/components/album-editor/types'

interface PageCanvasRendererProps {
  spread: AlbumSpread
  side: 'front' | 'back'
  onRendered: (canvas: HTMLCanvasElement) => void
  width?: number
  height?: number
}

export function PageCanvasRenderer({ 
  spread, 
  side, 
  onRendered, 
  width = 700, 
  height = 1000 
}: PageCanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = async () => {
      // Background
      const pageData = side === 'front' ? spread.front : spread.back
      const background = pageData?.background || spread.background || '#FFFFFF'
      
      ctx.fillStyle = background
      ctx.fillRect(0, 0, width, height)

      const elements = pageData?.elements || []
      
      // Sort by zIndex
      const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex)

      for (const el of sorted) {
        ctx.save()
        
        // Transform
        ctx.translate(el.x, el.y)
        ctx.rotate((el.rotation * Math.PI) / 180)
        
        if (el.type === 'image') {
          await renderImage(ctx, el as any)
        } else if (el.type === 'text') {
          renderText(ctx, el as any)
        } else if (el.type === 'drawing') {
          renderDrawing(ctx, el as any)
        } else if (el.type === 'shape') {
          renderShape(ctx, el as any)
        }

        ctx.restore()
      }

      onRendered(canvas)
    }

    render()
  }, [spread, side, onRendered, width, height])

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="hidden" 
    />
  )
}

async function renderImage(ctx: CanvasRenderingContext2D, el: any) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      ctx.globalAlpha = el.opacity ?? 1
      
      // Handle cropping and fit
      ctx.drawImage(img, 0, 0, el.width, el.height)
      resolve()
    }
    img.onerror = () => resolve()
    img.src = el.src
  })
}

function renderText(ctx: CanvasRenderingContext2D, el: any) {
  ctx.fillStyle = el.fill
  ctx.font = `${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`
  ctx.textAlign = el.textAlign as CanvasTextAlign
  ctx.textBaseline = 'top'
  
  // Basic multi-line handling if needed, or just single line for now
  ctx.fillText(el.text, 0, 0)
}

function renderDrawing(ctx: CanvasRenderingContext2D, el: any) {
  if (!el.points || el.points.length < 2) return
  
  ctx.strokeStyle = el.stroke
  ctx.lineWidth = el.strokeWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  
  ctx.beginPath()
  ctx.moveTo(el.points[0], el.points[1])
  for (let i = 2; i < el.points.length; i += 2) {
    ctx.lineTo(el.points[i], el.points[i + 1])
  }
  ctx.stroke()
}

function renderShape(ctx: CanvasRenderingContext2D, el: any) {
  ctx.fillStyle = el.fill
  if (el.stroke) {
    ctx.strokeStyle = el.stroke
    ctx.lineWidth = el.strokeWidth
  }

  if (el.shapeType === 'rectangle') {
    ctx.fillRect(0, 0, el.width, el.height)
    if (el.stroke) ctx.strokeRect(0, 0, el.width, el.height)
  } else if (el.shapeType === 'circle') {
    ctx.beginPath()
    ctx.arc(el.width / 2, el.height / 2, Math.min(el.width, el.height) / 2, 0, Math.PI * 2)
    ctx.fill()
    if (el.stroke) ctx.stroke()
  }
}
