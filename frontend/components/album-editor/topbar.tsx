'use client'

import React from 'react'
import {
  Undo2,
  Redo2,
  Grid,
  Share2,
  Download,
  ZoomIn,
  ZoomOut,
  Trash2,
  ImagePlus,
  X,
  Copy,
  Shield,
  CheckCircle2,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Space,
  FlipHorizontal2,
  FlipVertical2,
  ChevronDown,
  Save,
  Menu,
  Layers,
  SlidersHorizontal,
  MoreVertical,
} from 'lucide-react'
import { AlbumElement } from './types'
import { ThemeToggle } from '@/components/theme-toggle'
import { apiClient } from '@/lib/api-client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopbarProps {
  albumId: string
  zoom: number
  setZoom: (z: number) => void
  selectedElements: AlbumElement[]
  onUpdateElement: (id: string, partial: Partial<AlbumElement>, options?: { historyGroup?: string }) => void
  onDeleteSelected: () => void
  photos?: any[]
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSaveNow: () => void
  onExport: () => void
  onAlign: (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void
  onDistribute: (axis: 'horizontal' | 'vertical') => void
  showGrid: boolean
  onToggleGrid: () => void
  onOpenAdvancedView?: () => void
  simpleMode?: boolean
  isMobile?: boolean
  sidebarOpen?: boolean
  onToggleSidebar?: () => void
  layersOpen?: boolean
  onToggleLayers?: () => void
}

const FONT_OPTIONS = [
  { label: 'Serif', value: 'serif' },
  { label: 'Sans', value: 'sans-serif' },
  { label: 'Monospace', value: 'monospace' },
  { label: 'Cormorant', value: 'Cormorant Garamond, serif' },
  { label: 'DM Sans', value: 'DM Sans, sans-serif' },
]

export function Topbar({
  albumId,
  zoom,
  setZoom,
  selectedElements,
  onUpdateElement,
  onDeleteSelected,
  photos = [],
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSaveNow,
  onExport,
  onAlign,
  onDistribute,
  showGrid,
  onToggleGrid,
  onOpenAdvancedView,
  simpleMode = false,
  isMobile = false,
  sidebarOpen = false,
  onToggleSidebar,
  layersOpen = false,
  onToggleLayers,
}: TopbarProps) {
  const handleZoomOut = () => setZoom(Math.max(10, zoom - 10))
  const handleZoomIn = () => setZoom(Math.min(300, zoom + 10))
  const [photoPickerOpen, setPhotoPickerOpen] = React.useState(false)
  const [sharePanelOpen, setSharePanelOpen] = React.useState(false)
  const [useWatermark, setUseWatermark] = React.useState(true)
  const [disableRightClick, setDisableRightClick] = React.useState(true)
  const [hideDownloadActions, setHideDownloadActions] = React.useState(true)
  const [shareCopied, setShareCopied] = React.useState(false)
  const [shareLoading, setShareLoading] = React.useState(false)
  const [shareError, setShareError] = React.useState<string | null>(null)
  const [deliveryInstructions, setDeliveryInstructions] = React.useState('')
  const [mobileFormatOpen, setMobileFormatOpen] = React.useState(false)

  React.useEffect(() => {
    if (selectedElements.length === 0) {
      setMobileFormatOpen(false)
    }
  }, [selectedElements])

  React.useEffect(() => {
    if (sharePanelOpen) {
      apiClient.get(`/api/albums/${albumId}`)
        .then((data: any) => {
          if (data && data.delivery_instructions) {
            setDeliveryInstructions(data.delivery_instructions)
          } else {
            setDeliveryInstructions('')
          }
        })
        .catch(err => console.error(err))
    }
  }, [sharePanelOpen, albumId])

  const firstSelected = selectedElements[0]

  React.useEffect(() => {
    if (!firstSelected || firstSelected.type !== 'image') {
      setPhotoPickerOpen(false)
    }
  }, [firstSelected])

  const handleReplacePhoto = () => {
    if (!firstSelected || firstSelected.type !== 'image') {
      return
    }
    setPhotoPickerOpen((open) => !open)
  }

  const replaceWithPhoto = (photo: any) => {
    if (!firstSelected || firstSelected.type !== 'image') return
    const nextSrc = photo?.blob_url || photo?.thumbnail_url
    if (!nextSrc) return
    onUpdateElement(firstSelected.id, { src: nextSrc }, { historyGroup: 'replace-photo' })
    setPhotoPickerOpen(false)
  }

  const handleSaveInstructions = React.useCallback(async () => {
    try {
      await apiClient.patch(`/api/albums/${albumId}/delivery-instructions`, {
        deliveryInstructions
      })
    } catch (err) {
      console.error('Failed to save delivery instructions:', err)
    }
  }, [albumId, deliveryInstructions])

  const getProtectedShareLink = React.useCallback(async () => {
    // Save delivery/gifting instructions
    await handleSaveInstructions()

    const data = await apiClient.post(`/api/albums/${albumId}/share-link`, {
      protections: {
        watermark: useWatermark,
        noRightClick: disableRightClick,
        noDownload: hideDownloadActions,
      },
    }) as { shareUrl: string }

    return data.shareUrl
  }, [albumId, disableRightClick, hideDownloadActions, useWatermark])

  const handleCopyShareLink = React.useCallback(async () => {
    setShareError(null)
    setShareLoading(true)

    try {
      const link = await getProtectedShareLink()
      await navigator.clipboard.writeText(link)
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 1800)
    } catch {
      setShareError('Could not create link. Please try again.')
    } finally {
      setShareLoading(false)
    }
  }, [getProtectedShareLink])

  const handleOpenShareLink = React.useCallback(() => {
    setShareError(null)
    setShareLoading(true)
    ;(async () => {
      try {
        const link = await getProtectedShareLink()
        window.open(link, '_blank', 'noopener,noreferrer')
      } catch {
        setShareError('Could not open share view. Please try again.')
      } finally {
        setShareLoading(false)
      }
    })()
  }, [getProtectedShareLink])

  return (
    <div className="relative h-14 bg-white dark:bg-[#171511] text-foreground border-b border-[#E5E5E5] dark:border-[#3a342b] flex items-center justify-between px-3 z-10 shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.02)] gap-3">
      {simpleMode ? (
        <div className="text-sm font-medium text-muted-foreground px-2">Simple Editor</div>
      ) : (
        <div className="flex items-center gap-1 min-w-0">
          {isMobile && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`p-2 text-foreground/80 hover:text-foreground hover:bg-gray-100 dark:hover:bg-[#26211b] rounded transition-colors ${
                sidebarOpen ? 'bg-gray-100 dark:bg-[#26211b]' : ''
              }`}
              title="Toggle Sidebar"
            >
              <Menu className="w-4.5 h-4.5" strokeWidth={1.5} />
            </button>
          )}

          {isMobile && !simpleMode && onToggleLayers && (
            <button
              onClick={onToggleLayers}
              className={`p-2 text-foreground/80 hover:text-foreground hover:bg-gray-100 dark:hover:bg-[#26211b] rounded transition-colors ${
                layersOpen ? 'bg-gray-100 dark:bg-[#26211b]' : ''
              }`}
              title="Toggle Layers"
            >
              <Layers className="w-4.5 h-4.5" strokeWidth={1.5} />
            </button>
          )}

          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 text-foreground/80 hover:text-foreground hover:bg-gray-100 dark:hover:bg-[#26211b] rounded transition-colors disabled:opacity-30"
            title="Undo"
          >
            <Undo2 className="w-4.5 h-4.5" strokeWidth={1.5} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 text-foreground/80 hover:text-foreground hover:bg-gray-100 dark:hover:bg-[#26211b] rounded transition-colors disabled:opacity-30"
            title="Redo"
          >
            <Redo2 className="w-4.5 h-4.5" strokeWidth={1.5} />
          </button>

          {selectedElements.length > 0 ? (
            isMobile ? (
              <div className="flex items-center border-l border-gray-200 dark:border-[#3a342b] pl-2 gap-1.5">
                <button
                  onClick={() => setMobileFormatOpen(!mobileFormatOpen)}
                  className={`p-2 text-foreground/80 hover:text-foreground hover:bg-gray-100 dark:hover:bg-[#26211b] rounded transition-colors ${
                    mobileFormatOpen ? 'bg-gray-100 dark:bg-[#26211b]' : ''
                  }`}
                  title="Formatting options"
                >
                  <SlidersHorizontal className="w-4.5 h-4.5" strokeWidth={1.5} />
                </button>
                <button
                  onClick={onDeleteSelected}
                  className="p-2 text-[#B42318] dark:text-[#ffb4a8] hover:bg-[#FCE8E6] dark:hover:bg-[#3a1f1a] rounded transition-colors"
                  title="Delete selection"
                >
                  <Trash2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <div className="flex items-center border-l border-gray-200 dark:border-[#3a342b] pl-3 gap-1 overflow-x-auto">
                <button onClick={() => onAlign('left')} className="p-1.5 rounded hover:bg-muted" title="Align left">
                  <AlignStartHorizontal className="w-4 h-4" />
                </button>
                <button onClick={() => onAlign('center')} className="p-1.5 rounded hover:bg-muted" title="Align center">
                  <AlignCenterHorizontal className="w-4 h-4" />
                </button>
                <button onClick={() => onAlign('right')} className="p-1.5 rounded hover:bg-muted" title="Align right">
                  <AlignEndHorizontal className="w-4 h-4" />
                </button>
                <button onClick={() => onAlign('top')} className="p-1.5 rounded hover:bg-muted" title="Align top">
                  <AlignStartVertical className="w-4 h-4" />
                </button>
                <button onClick={() => onAlign('middle')} className="p-1.5 rounded hover:bg-muted" title="Align middle">
                  <AlignCenterVertical className="w-4 h-4" />
                </button>
                <button onClick={() => onAlign('bottom')} className="p-1.5 rounded hover:bg-muted" title="Align bottom">
                  <AlignEndVertical className="w-4 h-4" />
                </button>
                <button onClick={() => onDistribute('horizontal')} className="p-1.5 rounded hover:bg-muted" title="Distribute horizontally">
                  <Space className="w-4 h-4" />
                </button>
                <button onClick={() => onDistribute('vertical')} className="p-1.5 rounded hover:bg-muted" title="Distribute vertically">
                  <Space className="w-4 h-4 rotate-90" />
                </button>

                {firstSelected?.type === 'text' && (
                  <>
                    <select
                      value={firstSelected.fontFamily}
                      onChange={(event) => onUpdateElement(firstSelected.id, { fontFamily: event.target.value }, { historyGroup: 'text-style' })}
                      className="h-8 text-xs text-foreground bg-gray-50 dark:bg-[#201c16] border border-gray-200 dark:border-[#3a342b] rounded px-2"
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font.value} value={font.value}>{font.label}</option>
                      ))}
                    </select>

                    <select
                      value={firstSelected.fontWeight}
                      onChange={(event) => onUpdateElement(firstSelected.id, { fontWeight: event.target.value as 'normal' | 'bold' }, { historyGroup: 'text-style' })}
                      className="h-8 text-xs text-foreground bg-gray-50 dark:bg-[#201c16] border border-gray-200 dark:border-[#3a342b] rounded px-2"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>

                    <label className="flex items-center gap-1 text-xs px-2">
                      Size
                      <input
                        type="number"
                        min={8}
                        max={320}
                        value={firstSelected.fontSize}
                        onChange={(event) => onUpdateElement(firstSelected.id, { fontSize: Number(event.target.value) || firstSelected.fontSize }, { historyGroup: 'text-style' })}
                        className="w-16 h-8 text-xs text-foreground bg-gray-50 dark:bg-[#201c16] border border-gray-200 dark:border-[#3a342b] rounded px-1"
                      />
                    </label>

                    <label className="flex items-center gap-1 text-xs px-2">
                      Line
                      <input
                        type="number"
                        min={0.8}
                        max={3}
                        step={0.1}
                        value={firstSelected.lineHeight ?? 1.2}
                        onChange={(event) => onUpdateElement(firstSelected.id, { lineHeight: Number(event.target.value) || 1.2 }, { historyGroup: 'text-style' })}
                        className="w-14 h-8 text-xs text-foreground bg-gray-50 dark:bg-[#201c16] border border-gray-200 dark:border-[#3a342b] rounded px-1"
                      />
                    </label>

                    <label className="flex items-center gap-1 text-xs px-2">
                      Letter
                      <input
                        type="number"
                        min={-4}
                        max={20}
                        step={0.5}
                        value={firstSelected.letterSpacing ?? 0}
                        onChange={(event) => onUpdateElement(firstSelected.id, { letterSpacing: Number(event.target.value) || 0 }, { historyGroup: 'text-style' })}
                        className="w-14 h-8 text-xs text-foreground bg-gray-50 dark:bg-[#201c16] border border-gray-200 dark:border-[#3a342b] rounded px-1"
                      />
                    </label>

                    <label className="text-sm bg-gray-50 dark:bg-[#201c16] border border-gray-200 dark:border-[#3a342b] px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2c261f]">
                      <span className="sr-only">Color</span>
                      <input
                        type="color"
                        className="w-0 h-0 invisible"
                        value={firstSelected.fill}
                        onChange={(event) => onUpdateElement(firstSelected.id, { fill: event.target.value }, { historyGroup: 'text-style' })}
                      />
                      Color
                    </label>
                  </>
                )}

                {firstSelected?.type === 'image' && (
                  <>
                    <button
                      onClick={handleReplacePhoto}
                      className="inline-flex items-center gap-2 text-sm bg-gray-50 dark:bg-[#201c16] border border-gray-200 dark:border-[#3a342b] px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#2c261f]"
                    >
                      <ImagePlus className="w-4 h-4" />
                      Replace
                    </button>

                    <button
                      onClick={() => onUpdateElement(firstSelected.id, { fitMode: firstSelected.fitMode === 'fill' ? 'fit' : 'fill' }, { historyGroup: 'image-style' })}
                      className="h-8 px-2 text-xs text-foreground rounded border border-gray-200 dark:border-[#3a342b] bg-gray-50 dark:bg-[#201c16]"
                    >
                      {firstSelected.fitMode === 'fill' ? 'Fill' : 'Fit'}
                    </button>

                    <button
                      onClick={() => onUpdateElement(firstSelected.id, { flipX: !firstSelected.flipX }, { historyGroup: 'image-style' })}
                      className="p-1.5 rounded hover:bg-muted"
                      title="Flip horizontal"
                    >
                      <FlipHorizontal2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onUpdateElement(firstSelected.id, { flipY: !firstSelected.flipY }, { historyGroup: 'image-style' })}
                      className="p-1.5 rounded hover:bg-muted"
                      title="Flip vertical"
                    >
                      <FlipVertical2 className="w-4 h-4" />
                    </button>

                    <label className="flex items-center gap-1 text-xs px-2">
                      Rot
                      <input
                        type="number"
                        value={Math.round(firstSelected.rotation)}
                        onChange={(event) => onUpdateElement(firstSelected.id, { rotation: Number(event.target.value) || 0 }, { historyGroup: 'image-style' })}
                        className="w-14 h-8 text-xs text-foreground bg-gray-50 dark:bg-[#201c16] border border-gray-200 dark:border-[#3a342b] rounded px-1"
                      />
                    </label>

                    <label className="flex items-center gap-1 text-xs px-2">
                      Opacity
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={firstSelected.opacity ?? 1}
                        onChange={(event) => onUpdateElement(firstSelected.id, { opacity: Number(event.target.value) }, { historyGroup: 'image-style' })}
                      />
                    </label>

                    <label className="flex items-center gap-1 text-xs px-2">
                      Radius
                      <input
                        type="range"
                        min={0}
                        max={80}
                        step={1}
                        value={firstSelected.cornerRadius ?? 0}
                        onChange={(event) => onUpdateElement(firstSelected.id, { cornerRadius: Number(event.target.value) }, { historyGroup: 'image-style' })}
                      />
                    </label>

                    <label className="flex items-center gap-1 text-xs px-2">
                      Shadow
                      <input
                        type="range"
                        min={0}
                        max={60}
                        step={1}
                        value={firstSelected.shadowBlur ?? 0}
                        onChange={(event) => onUpdateElement(firstSelected.id, { shadowBlur: Number(event.target.value), shadowOpacity: (Number(event.target.value) || 0) > 0 ? 0.35 : 0 }, { historyGroup: 'image-style' })}
                      />
                    </label>
                  </>
                )}

                <button
                  onClick={onDeleteSelected}
                  className="inline-flex items-center gap-2 text-sm bg-[#FCE8E6] dark:bg-[#3a1f1a] border border-[#F6C8C2] dark:border-[#6b2f28] text-[#B42318] dark:text-[#ffb4a8] px-3 py-1.5 rounded hover:bg-[#FAD6D2] dark:hover:bg-[#4a251f]"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )
          ) : (
            !isMobile && (
              <div className="text-sm text-muted-foreground px-3 border-l border-gray-200 dark:border-[#3a342b]">
                No layer selected
              </div>
            )
          )}
        </div>
      )}

      <div className="flex items-center gap-3 shrink-0">
        {isMobile ? (
          <>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-foreground/80 hover:text-foreground hover:bg-gray-100 dark:hover:bg-[#26211b] rounded transition-colors" title="Actions">
                  <MoreVertical className="w-4.5 h-4.5" strokeWidth={1.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 space-y-1 p-2 bg-popover border border-border text-popover-foreground">
                {!simpleMode && (
                  <div className="flex items-center justify-between px-2 py-1.5 text-sm">
                    <span className="text-muted-foreground text-xs">Zoom</span>
                    <div className="flex items-center bg-gray-100 dark:bg-[#26211b] rounded px-1">
                      <button onClick={(e) => { e.stopPropagation(); handleZoomOut() }} className="p-1 text-muted-foreground hover:text-foreground">
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-medium w-[4ch] text-center">{zoom}%</span>
                      <button onClick={(e) => { e.stopPropagation(); handleZoomIn() }} className="p-1 text-muted-foreground hover:text-foreground">
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
                {!simpleMode && <DropdownMenuSeparator />}
                {!simpleMode && (
                  <DropdownMenuItem onSelect={onToggleGrid}>
                    <Grid className="w-4 h-4 mr-2" />
                    {showGrid ? 'Hide Grid' : 'Show Grid'}
                  </DropdownMenuItem>
                )}
                {onOpenAdvancedView && (
                  <DropdownMenuItem onSelect={onOpenAdvancedView}>
                    Advanced View
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => setSharePanelOpen(true)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Options
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onSaveNow}>
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onExport} className="bg-terracotta text-white hover:bg-terracotta/90 focus:bg-terracotta/95 focus:text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Export & Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            {!simpleMode && (
              <div className="flex items-center bg-gray-100 dark:bg-[#26211b] rounded-full px-2 py-0.5">
                <button onClick={handleZoomOut} className="p-1 text-muted-foreground hover:text-foreground">
                  <ZoomOut className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <span className="text-sm font-medium w-[4ch] text-center">{zoom}%</span>
                <button onClick={handleZoomIn} className="p-1 text-muted-foreground hover:text-foreground">
                  <ZoomIn className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            )}

            <ThemeToggle />

            {!simpleMode && (
              <button
                onClick={onToggleGrid}
                className={`flex items-center gap-2 text-sm font-medium px-2 py-1.5 rounded transition-colors ${
                  showGrid
                    ? 'text-foreground bg-gray-100 dark:bg-[#26211b]'
                    : 'text-foreground/85 hover:text-foreground hover:bg-gray-100 dark:hover:bg-[#26211b]'
                }`}
                title={showGrid ? 'Hide grid' : 'Show grid'}
              >
                <Grid className="w-4.5 h-4.5" strokeWidth={1.5} />
                Grid
              </button>
            )}

            {onOpenAdvancedView && (
              <button
                onClick={onOpenAdvancedView}
                className="flex items-center gap-2 text-sm font-medium px-2 py-1.5 rounded transition-colors text-foreground/85 hover:text-foreground hover:bg-gray-100 dark:hover:bg-[#26211b]"
                title="Open full editor"
              >
                Advanced View
              </button>
            )}

            <button
              onClick={() => setSharePanelOpen((open) => !open)}
              className={`flex items-center gap-2 text-sm font-medium px-2 py-1.5 rounded transition-colors ${
                sharePanelOpen
                  ? 'text-foreground bg-gray-100 dark:bg-[#26211b]'
                  : 'text-foreground/85 hover:text-foreground hover:bg-gray-100 dark:hover:bg-[#26211b]'
              }`}
              title="Protected share options"
            >
              <Share2 className="w-4.5 h-4.5" strokeWidth={1.5} />
              Share
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-sm font-medium bg-terracotta hover:bg-terracotta/90 text-primary-foreground px-4 py-1.5 rounded shadow-sm transition-colors">
                  <Download className="w-4.5 h-4.5" strokeWidth={1.5} />
                  Export
                  <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={onSaveNow}>
                  <Save className="w-4 h-4" />
                  Save as Draft
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onExport}>
                  <Download className="w-4 h-4" />
                  Export & Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {sharePanelOpen && (
        <div className="absolute right-4 left-4 sm:left-auto sm:right-4 top-[calc(100%+8px)] z-40 w-auto sm:w-[320px] rounded-md border border-border bg-popover text-popover-foreground shadow-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Share with protection</p>
            <button
              type="button"
              onClick={() => setSharePanelOpen(false)}
              className="p-1 rounded hover:bg-muted/80"
              aria-label="Close share options"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground mb-2">
            Generates a view-only flipbook link. Editor access is never shared.
          </p>

          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useWatermark}
                onChange={(event) => setUseWatermark(event.target.checked)}
              />
              Watermark overlay
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={disableRightClick}
                onChange={(event) => setDisableRightClick(event.target.checked)}
              />
              Disable right-click
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hideDownloadActions}
                onChange={(event) => setHideDownloadActions(event.target.checked)}
              />
              Hide export controls
            </label>
          </div>

          <div className="mt-3.5 space-y-1">
            <label className="block text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
              Gifting / Delivery Instructions
            </label>
            <textarea
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              onBlur={handleSaveInstructions}
              placeholder="E.g. Deliver to myself; or Gift wrap & deliver to mom..."
              rows={2}
              className="w-full px-2.5 py-1.5 bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary resize-none font-light"
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleCopyShareLink}
              disabled={shareLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 text-sm rounded bg-terracotta text-white px-3 py-2 hover:opacity-90"
            >
              {shareLoading ? <Shield className="w-4 h-4 animate-pulse" /> : shareCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {shareLoading ? 'Generating...' : shareCopied ? 'Copied' : 'Copy link'}
            </button>
            <button
              type="button"
              onClick={handleOpenShareLink}
              disabled={shareLoading}
              className="px-3 py-2 text-sm rounded border border-border hover:bg-muted"
            >
              Open
            </button>
          </div>

          {shareError && <p className="text-[11px] text-red-500 mt-2">{shareError}</p>}

        </div>
      )}

      {photoPickerOpen && firstSelected?.type === 'image' && (
        <div className="absolute left-4 right-4 sm:right-auto sm:w-[360px] w-auto top-[calc(100%+8px)] z-40 rounded-md border border-border bg-popover text-popover-foreground shadow-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Replace with event photo</p>
            <button
              type="button"
              onClick={() => setPhotoPickerOpen(false)}
              className="p-1 rounded hover:bg-muted/80"
              aria-label="Close photo picker"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 max-h-65 overflow-y-auto pr-1">
              {photos.map((photo) => (
                <button
                  type="button"
                  key={photo.id}
                  onClick={() => replaceWithPhoto(photo)}
                  className="aspect-square rounded overflow-hidden border border-border hover:ring-2 hover:ring-terracotta/70"
                >
                  <img
                    src={photo.thumbnail_url || photo.blob_url}
                    alt="Event photo"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground border border-dashed border-border rounded p-4 text-center">
              No event photos available yet.
            </div>
          )}
        </div>
      )}

      {/* Mobile Formatting drawer overlay panel */}
      {isMobile && mobileFormatOpen && selectedElements.length > 0 && (
        <div className="absolute left-4 right-4 top-[calc(100%+8px)] z-30 max-h-[70vh] overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-sm font-semibold">Format Element</span>
            <button
              onClick={() => setMobileFormatOpen(false)}
              className="p-1 rounded hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Alignment & Distribution */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Alignment</span>
            <div className="grid grid-cols-6 gap-1">
              <button onClick={() => onAlign('left')} className="p-2 rounded bg-muted hover:bg-muted/80 flex justify-center" title="Align left">
                <AlignStartHorizontal className="w-4 h-4" />
              </button>
              <button onClick={() => onAlign('center')} className="p-2 rounded bg-muted hover:bg-muted/80 flex justify-center" title="Align center">
                <AlignCenterHorizontal className="w-4 h-4" />
              </button>
              <button onClick={() => onAlign('right')} className="p-2 rounded bg-muted hover:bg-muted/80 flex justify-center" title="Align right">
                <AlignEndHorizontal className="w-4 h-4" />
              </button>
              <button onClick={() => onAlign('top')} className="p-2 rounded bg-muted hover:bg-muted/80 flex justify-center" title="Align top">
                <AlignStartVertical className="w-4 h-4" />
              </button>
              <button onClick={() => onAlign('middle')} className="p-2 rounded bg-muted hover:bg-muted/80 flex justify-center" title="Align middle">
                <AlignCenterVertical className="w-4 h-4" />
              </button>
              <button onClick={() => onAlign('bottom')} className="p-2 rounded bg-muted hover:bg-muted/80 flex justify-center" title="Align bottom">
                <AlignEndVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => onDistribute('horizontal')} className="p-2 text-xs rounded bg-muted hover:bg-muted/80 flex items-center justify-center gap-1" title="Distribute horizontally">
                <Space className="w-4 h-4" />
                Distribute H
              </button>
              <button onClick={() => onDistribute('vertical')} className="p-2 text-xs rounded bg-muted hover:bg-muted/80 flex items-center justify-center gap-1" title="Distribute vertically">
                <Space className="w-4 h-4 rotate-90" />
                Distribute V
              </button>
            </div>
          </div>

          {/* Text options */}
          {firstSelected?.type === 'text' && (
            <div className="space-y-3 pt-2 border-t border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Text Styling</span>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block">Font</label>
                  <select
                    value={firstSelected.fontFamily}
                    onChange={(event) => onUpdateElement(firstSelected.id, { fontFamily: event.target.value }, { historyGroup: 'text-style' })}
                    className="w-full h-9 text-xs text-foreground bg-muted border border-border rounded px-2"
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block">Weight</label>
                  <select
                    value={firstSelected.fontWeight}
                    onChange={(event) => onUpdateElement(firstSelected.id, { fontWeight: event.target.value as 'normal' | 'bold' }, { historyGroup: 'text-style' })}
                    className="w-full h-9 text-xs text-foreground bg-muted border border-border rounded px-2"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block">Size</label>
                  <input
                    type="number"
                    min={8}
                    max={320}
                    value={firstSelected.fontSize}
                    onChange={(event) => onUpdateElement(firstSelected.id, { fontSize: Number(event.target.value) || firstSelected.fontSize }, { historyGroup: 'text-style' })}
                    className="w-full h-9 text-xs text-foreground bg-muted border border-border rounded px-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block">Line Height</label>
                  <input
                    type="number"
                    min={0.8}
                    max={3}
                    step={0.1}
                    value={firstSelected.lineHeight ?? 1.2}
                    onChange={(event) => onUpdateElement(firstSelected.id, { lineHeight: Number(event.target.value) || 1.2 }, { historyGroup: 'text-style' })}
                    className="w-full h-9 text-xs text-foreground bg-muted border border-border rounded px-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block">Letter Spacing</label>
                  <input
                    type="number"
                    min={-4}
                    max={20}
                    step={0.5}
                    value={firstSelected.letterSpacing ?? 0}
                    onChange={(event) => onUpdateElement(firstSelected.id, { letterSpacing: Number(event.target.value) || 0 }, { historyGroup: 'text-style' })}
                    className="w-full h-9 text-xs text-foreground bg-muted border border-border rounded px-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs">Color</span>
                <label className="flex items-center gap-2 cursor-pointer bg-muted border border-border px-3 py-1.5 rounded hover:bg-muted/80 text-xs relative">
                  <span className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: firstSelected.fill }} />
                  <span>Choose</span>
                  <input
                    type="color"
                    className="w-0 h-0 invisible absolute"
                    value={firstSelected.fill}
                    onChange={(event) => onUpdateElement(firstSelected.id, { fill: event.target.value }, { historyGroup: 'text-style' })}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Image options */}
          {firstSelected?.type === 'image' && (
            <div className="space-y-3 pt-2 border-t border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Image Styling</span>
              
              <div className="flex gap-2">
                <button
                  onClick={handleReplacePhoto}
                  className="flex-1 inline-flex items-center justify-center gap-2 text-xs bg-muted border border-border py-2 rounded hover:bg-muted/80"
                >
                  <ImagePlus className="w-4 h-4" />
                  Replace Photo
                </button>

                <button
                  onClick={() => onUpdateElement(firstSelected.id, { fitMode: firstSelected.fitMode === 'fill' ? 'fit' : 'fill' }, { historyGroup: 'image-style' })}
                  className="flex-1 text-xs text-foreground rounded border border-border bg-muted hover:bg-muted/80 py-2"
                >
                  Mode: {firstSelected.fitMode === 'fill' ? 'Fill' : 'Fit'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateElement(firstSelected.id, { flipX: !firstSelected.flipX }, { historyGroup: 'image-style' })}
                  className="flex items-center justify-center gap-2 py-2 rounded bg-muted hover:bg-muted/80 text-xs"
                >
                  <FlipHorizontal2 className="w-4 h-4" />
                  Flip H
                </button>

                <button
                  onClick={() => onUpdateElement(firstSelected.id, { flipY: !firstSelected.flipY }, { historyGroup: 'image-style' })}
                  className="flex items-center justify-center gap-2 py-2 rounded bg-muted hover:bg-muted/80 text-xs"
                >
                  <FlipVertical2 className="w-4 h-4" />
                  Flip V
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <span className="text-xs">Rotation</span>
                <input
                  type="number"
                  value={Math.round(firstSelected.rotation)}
                  onChange={(event) => onUpdateElement(firstSelected.id, { rotation: Number(event.target.value) || 0 }, { historyGroup: 'image-style' })}
                  className="h-8 text-xs text-foreground bg-muted border border-border rounded px-2 text-right"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>Opacity</span>
                  <span className="text-muted-foreground">{Math.round((firstSelected.opacity ?? 1) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={firstSelected.opacity ?? 1}
                  onChange={(event) => onUpdateElement(firstSelected.id, { opacity: Number(event.target.value) }, { historyGroup: 'image-style' })}
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>Border Radius</span>
                  <span className="text-muted-foreground">{firstSelected.cornerRadius ?? 0}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  step={1}
                  value={firstSelected.cornerRadius ?? 0}
                  onChange={(event) => onUpdateElement(firstSelected.id, { cornerRadius: Number(event.target.value) }, { historyGroup: 'image-style' })}
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>Shadow</span>
                  <span className="text-muted-foreground">{firstSelected.shadowBlur ?? 0}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={1}
                  value={firstSelected.shadowBlur ?? 0}
                  onChange={(event) => onUpdateElement(firstSelected.id, { shadowBlur: Number(event.target.value), shadowOpacity: (Number(event.target.value) || 0) > 0 ? 0.35 : 0 }, { historyGroup: 'image-style' })}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

