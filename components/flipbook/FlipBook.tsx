'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, Shield } from 'lucide-react'
import type { AlbumElement } from '@/components/album-editor/types'
import type { FlipbookPageData, FlipbookProtections } from './types'
import styles from './flipbook-viewer.module.css'

interface FlipBookProps {
  title: string
  pages: FlipbookPageData[]
  protections: FlipbookProtections
  hasCover?: boolean
}

const LOGICAL_PAGE_WIDTH = 700
const LOGICAL_PAGE_HEIGHT = 1000
const BOOK_WIDTH = LOGICAL_PAGE_WIDTH
const BOOK_HEIGHT = LOGICAL_PAGE_HEIGHT

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function usePageScale() {
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = React.useState(1)

  React.useLayoutEffect(() => {
    if (!viewportRef.current) return

    const element = viewportRef.current
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      const width = entry.contentRect.width || LOGICAL_PAGE_WIDTH
      const height = entry.contentRect.height || LOGICAL_PAGE_HEIGHT

      const nextScale = Math.min(width / LOGICAL_PAGE_WIDTH, height / LOGICAL_PAGE_HEIGHT)
      setScale(Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1)
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return { viewportRef, scale }
}

function renderElement(el: AlbumElement) {
  const baseStyle: React.CSSProperties = {
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    transform: `rotate(${el.rotation || 0}deg)`,
  }

  if (el.type === 'image') {
    const flipTransforms = `${el.flipX ? 'scaleX(-1)' : ''} ${el.flipY ? 'scaleY(-1)' : ''}`.trim()

    return (
      <div key={el.id} className={styles.element} style={baseStyle}>
        <img
          src={el.src}
          alt="Album"
          className={styles.imageElement}
          draggable={false}
          style={{
            objectFit: 'contain',
            opacity: el.opacity ?? 1,
            borderRadius: el.cornerRadius ?? 0,
            transform: flipTransforms || undefined,
            boxShadow:
              (el.shadowBlur ?? 0) > 0
                ? `0 0 ${el.shadowBlur}px rgba(0, 0, 0, ${el.shadowOpacity ?? 0.35})`
                : undefined,
          }}
        />
      </div>
    )
  }

  if (el.type === 'text') {
    return (
      <div key={el.id} className={styles.element} style={baseStyle}>
        <div
          className={styles.textElement}
          style={{
            color: el.fill,
            fontSize: el.fontSize,
            fontFamily: el.fontFamily,
            fontWeight: el.fontWeight,
            textAlign: el.textAlign,
            lineHeight: el.lineHeight ?? 1.2,
            letterSpacing: el.letterSpacing ?? 0,
          }}
        >
          {el.text}
        </div>
      </div>
    )
  }

  if (el.type === 'drawing') {
    return (
      <div key={el.id} className={styles.element} style={baseStyle}>
        <svg
          width={el.width}
          height={el.height}
          viewBox={`0 0 ${el.width} ${el.height}`}
          style={{ overflow: 'visible' }}
        >
          <polyline
            points={el.points.join(',')}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    )
  }

  if (el.type === 'shape') {
    if (el.shapeType === 'line') {
      const lineLength = Math.max(1, Math.hypot(el.width, el.height))
      const lineAngle = (Math.atan2(el.height, el.width) * 180) / Math.PI

      return (
        <div
          key={el.id}
          className={styles.element}
          style={{
            left: el.x,
            top: el.y,
            width: lineLength,
            height: Math.max(1, el.strokeWidth ?? 2),
            transform: `rotate(${lineAngle + (el.rotation || 0)}deg)`,
            transformOrigin: 'left center',
            backgroundColor: el.stroke || el.fill,
          }}
        />
      )
    }

    return (
      <div
        key={el.id}
        className={styles.element}
        style={{
          ...baseStyle,
          borderRadius: el.shapeType === 'circle' ? '999px' : undefined,
          backgroundColor: el.fill,
          border: el.stroke ? `${el.strokeWidth ?? 1}px solid ${el.stroke}` : undefined,
        }}
      />
    )
  }
  return null
}

function PageContent({ page }: { page: FlipbookPageData }) {
  const { viewportRef, scale } = usePageScale()

  const sorted = React.useMemo(() => {
    return [...page.elements].sort((a, b) => a.zIndex - b.zIndex)
  }, [page.elements])

  const scaledWidth = LOGICAL_PAGE_WIDTH * scale
  const scaledHeight = LOGICAL_PAGE_HEIGHT * scale

  return (
    <div className={styles.pageSurface} style={{ background: page.background }}>
      <div ref={viewportRef} className={styles.pageViewport}>
        <div className={styles.pageCanvasShell} style={{ width: scaledWidth, height: scaledHeight }}>
          <div className={styles.pageCanvas} style={{ transform: `scale(${scale})` }}>
            <div className={styles.pageInner}>
              {sorted.map((el) => renderElement(el))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const MemoPageContent = React.memo(PageContent, (prev, next) => prev.page === next.page)

export function FlipBook({ title, pages, protections, hasCover = false }: FlipBookProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const pageFlipRef = React.useRef<any>(null)
  const pageRefs = React.useRef<Array<HTMLDivElement | null>>([])
  const interactionLockRef = React.useRef(false)
  const pointerStartRef = React.useRef<{ x: number; y: number } | null>(null)
  const pointerMovedRef = React.useRef(false)

  const [currentPage, setCurrentPage] = React.useState(0)
  const [isReady, setIsReady] = React.useState(false)
  const [isFlipping, setIsFlipping] = React.useState(false)
  const [orientation, setOrientation] = React.useState<'landscape' | 'portrait'>('landscape')

  const totalPages = pages.length
  const canGoPrev = currentPage > 0
  const canGoNext = currentPage < totalPages - 1

  React.useEffect(() => {
    pageRefs.current = pageRefs.current.slice(0, pages.length)
  }, [pages.length])

  React.useEffect(() => {
    if (!protections.noDownload) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if ((event.ctrlKey || event.metaKey) && (key === 's' || key === 'p')) {
        event.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [protections.noDownload])

  React.useEffect(() => {
    let active = true
    let instance: any = null

    async function initialize() {
      if (!containerRef.current) return
      const htmlPages = pageRefs.current.filter(Boolean) as HTMLDivElement[]
      if (htmlPages.length === 0) return

      const { PageFlip } = await import('page-flip')
      if (!active || !containerRef.current) return

      instance = new PageFlip(containerRef.current, {
        width: BOOK_WIDTH,
        height: BOOK_HEIGHT,
        minWidth: 280,
        maxWidth: 1400,
        minHeight: 380,
        maxHeight: 1000,
        size: 'stretch',
        maxShadowOpacity: 0.45,
        showCover: hasCover,
        usePortrait: false, // Changed to false to allow 2-page spreads
        drawShadow: true,
        flippingTime: 800,
        startZIndex: 1,
        autoSize: true,
        mobileScrollSupport: true,
        swipeDistance: 25,
        useMouseEvents: true,
        clickEventForward: false,
      })

      instance.loadFromHTML(htmlPages)
      interactionLockRef.current = false

      instance.on('flip', (event: { data: number }) => {
        if (!active) return
        setCurrentPage(clamp(event.data ?? 0, 0, Math.max(0, totalPages - 1)))
      })

      instance.on('changeState', (event: { data: string }) => {
        if (!active) return
        const isMoving = event.data !== 'read'
        setIsFlipping(isMoving)
        interactionLockRef.current = isMoving
      })

      instance.on('changeOrientation', (event: { data: string }) => {
        if (!active) return
        setOrientation(event.data as 'landscape' | 'portrait')
      })

      pageFlipRef.current = instance
      const initial = typeof instance.getCurrentPageIndex === 'function' ? instance.getCurrentPageIndex() : 0
      setCurrentPage(clamp(initial ?? 0, 0, Math.max(0, totalPages - 1)))
      setIsReady(true)
    }

    void initialize()

    return () => {
      active = false
      setIsReady(false)
      setIsFlipping(false)
      if (instance) {
        try {
          instance.destroy()
        } catch {
          // ignore cleanup failures
        }
      }
      pageFlipRef.current = null
    }
  }, [pages, totalPages])

  const flipPrev = React.useCallback(() => {
    if (!pageFlipRef.current || !canGoPrev || isFlipping || interactionLockRef.current) return
    interactionLockRef.current = true
    pageFlipRef.current.flipPrev()
  }, [canGoPrev, isFlipping])

  const flipNext = React.useCallback(() => {
    if (!pageFlipRef.current || !canGoNext || isFlipping || interactionLockRef.current) return
    interactionLockRef.current = true
    pageFlipRef.current.flipNext()
  }, [canGoNext, isFlipping])

  const watermarkGrid = React.useMemo(() => {
    return Array.from({ length: 22 }).map((_, index) => ({
      x: (index % 5) * 240 - 70,
      y: Math.floor(index / 5) * 170 + 30,
    }))
  }, [])

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>
            Page {totalPages === 0 ? 0 : currentPage + 1} of {totalPages}
          </p>
        </div>

        <div className={styles.controls}>
          <button className={styles.button} onClick={flipPrev} disabled={!isReady || !canGoPrev || isFlipping}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className={styles.button} onClick={flipNext} disabled={!isReady || !canGoNext || isFlipping}>
            <ChevronRight className="w-4 h-4" />
          </button>

          {protections.noDownload && (
            <span className={styles.protectedTag}>
              <Shield className="w-3.5 h-3.5" />
              Protected
            </span>
          )}
        </div>
      </header>

      <div
        className={`
          ${styles.viewer} 
          ${isFlipping ? styles.viewerFlipping : ''} 
          ${orientation === 'landscape' ? styles.landscape : styles.portrait}
        `}
        onContextMenu={(event) => {
          if (protections.noRightClick) event.preventDefault()
        }}
        onPointerDown={(event) => {
          pointerStartRef.current = { x: event.clientX, y: event.clientY }
          pointerMovedRef.current = false
        }}
        onPointerMove={(event) => {
          if (!pointerStartRef.current) return
          if (
            Math.abs(event.clientX - pointerStartRef.current.x) > 8 ||
            Math.abs(event.clientY - pointerStartRef.current.y) > 8
          ) {
            pointerMovedRef.current = true
          }
        }}
        onPointerUp={() => {
          pointerStartRef.current = null
        }}
        onPointerCancel={() => {
          pointerStartRef.current = null
        }}
        onClick={(event) => {
          if (!isReady || isFlipping || interactionLockRef.current || pointerMovedRef.current || !containerRef.current) {
            pointerMovedRef.current = false
            return
          }

          const bounds = containerRef.current.getBoundingClientRect()
          const x = event.clientX - bounds.left

          if (x >= bounds.width / 2) {
            flipNext()
          } else {
            flipPrev()
          }
        }}
      >
        <div 
          className={`
            ${styles.bookWrapper} 
            ${hasCover && currentPage === 0 ? styles.closedStart : ''} 
            ${hasCover && currentPage === totalPages - 1 ? styles.closedEnd : ''}
          `}
        >
          <div ref={containerRef} className={styles.flipRoot}>
            {pages.map((page, index) => (
              <div
                key={page.id}
                ref={(node) => {
                  pageRefs.current[index] = node
                }}
                className={`${styles.page} page`}
                data-density={index === 0 ? 'hard' : 'soft'}
              >
                <MemoPageContent page={page} />
              </div>
            ))}
          </div>

          {/* Physical spine element - Moved outside flipRoot to prevent React reconciliation errors */}
          {orientation === 'landscape' && currentPage > 0 && currentPage < totalPages - 1 && (
            <div className={styles.spineLine} />
          )}
          {protections.watermark && (
            <div className={styles.watermarkLayer}>
              {watermarkGrid.map((point, index) => (
                <span
                  key={`wm-${index}`}
                  className={styles.watermarkText}
                  style={{ left: point.x, top: point.y }}
                >
                  FOLIO SHARED VIEW
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
