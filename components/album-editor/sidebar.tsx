import React from 'react'
import {
  LayoutTemplate,
  Images,
  Shapes,
  UploadCloud,
  Type,
  Sparkles,
  PenTool,
  FolderOpen,
  Check,
  Search,
} from 'lucide-react'
import type { MagazineTemplate } from '@/lib/magazine-templates'
import type { AlbumElement, ImageElement, ShapeElement, DrawingElement } from './types'

type SidebarPanel = 'templates' | 'design' | 'elements' | 'photos' | 'uploads' | 'text' | 'ai' | 'draw' | 'projects'
type PixabayImageType = 'all' | 'photo' | 'illustration' | 'vector'

interface SidebarProps {
  activePanel: SidebarPanel
  onChangePanel: (p: SidebarPanel) => void
  onAddElement: (el: any) => void
  photos?: any[]
  onGoBack: () => void
  spreadBackground?: string
  onSetSpreadBackground?: (color: string, applyToAll?: boolean) => void
  selectedElements?: AlbumElement[]
  onAiRemoveBackground?: () => Promise<boolean>
  onAiFillColor?: (color: string) => Promise<boolean>
  
  // Drawing props
  isDrawingMode?: boolean
  onToggleDrawingMode?: (active: boolean) => void
  brushColor?: string
  onChangeBrushColor?: (color: string) => void
  brushSize?: number
  onChangeBrushSize?: (size: number) => void
  
  // Projects props
  currentAlbumId?: string
  onSwitchAlbum?: (id: string) => void
  simpleMode?: boolean
  templates?: MagazineTemplate[]
  activeTemplateId?: string | null
  onApplyTemplate?: (templateId: string) => Promise<boolean> | boolean
}

const FULL_TABS: { id: SidebarPanel; label: string; icon: any; disabled?: boolean }[] = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'design', label: 'Design', icon: LayoutTemplate },
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'photos', label: 'Photos', icon: Images },
  { id: 'uploads', label: 'Uploads', icon: UploadCloud },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'draw', label: 'Draw', icon: PenTool },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
]

const SIMPLE_TABS: { id: SidebarPanel; label: string; icon: any; disabled?: boolean }[] = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'photos', label: 'Photos', icon: Images },
  { id: 'uploads', label: 'Uploads', icon: UploadCloud },
]

const DRAG_MIME = 'application/x-folio-album-element'
const PAGE_COLORS = ['#FFFFFF', '#F8F4EC', '#F3E9DD', '#EAD7C0', '#DDE8E3', '#E7E7F3', '#FCE8E8', '#1C1814']

type ElementCategory =
  | 'all'
  | 'stickers'
  | 'shapes'
  | 'frames'
  | 'dividers'
  | 'badges'
  | 'highlights'
  | 'icons'
  | 'vectors'
  | 'illustrations'
  | 'photos'
  | 'backgrounds'

type RemoteSource = 'pixabay' | 'svgrepo' | 'pexels'

interface RemoteElementHit {
  id: string | number
  source: RemoteSource
  previewURL: string
  largeURL: string
  width?: number
  height?: number
  tags: string
  type?: string
}

interface ElementPreset {
  id: string
  label: string
  category: Exclude<ElementCategory, 'all'>
  keywords: string[]
  payload: any
  preview: React.ReactNode
}

const ELEMENT_CATEGORY_OPTIONS: Array<{ id: ElementCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'stickers', label: 'Stickers' },
  { id: 'shapes', label: 'Shapes' },
  { id: 'frames', label: 'Frames' },
  { id: 'vectors', label: 'Vectors' },
  { id: 'illustrations', label: 'Illustrations' },
  { id: 'backgrounds', label: 'Textures' },
  { id: 'icons', label: 'Icons' },
  { id: 'dividers', label: 'Dividers' },
]

const REMOTE_ELEMENT_CATEGORIES: ElementCategory[] = [
  'stickers',
  'vectors',
  'illustrations',
  'backgrounds',
  'photos',
  'shapes',
  'frames',
]
const HIDDEN_ELEMENT_CATEGORIES: ElementCategory[] = ['badges', 'highlights']

function toRemoteImageType(category: ElementCategory): PixabayImageType {
  if (category === 'vectors') return 'vector'
  if (category === 'illustrations') return 'illustration'
  if (category === 'photos') return 'photo'
  return 'all'
}

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function createIconPreset(
  id: string,
  label: string,
  keywords: string[],
  svg: string,
  color = '#1C1814',
  size = 96
): ElementPreset {
  const src = svgToDataUri(svg.replaceAll('__COLOR__', color))

  return {
    id,
    label,
    category: 'icons',
    keywords,
    payload: {
      type: 'image',
      src,
      x: 180,
      y: 220,
      width: size,
      height: size,
      rotation: 0,
      fitMode: 'fit',
    },
    preview: <img src={src} alt={label} className="h-10 w-10 object-contain" draggable={false} />,
  }
}

const ICON_PRESETS: ElementPreset[] = [
  createIconPreset(
    'icon-star-solid',
    'Star Solid',
    ['star', 'favorite', 'rating', 'sparkle'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="__COLOR__" d="M12 2.7l2.6 5.4 6 .9-4.3 4.2 1 6-5.3-2.8-5.4 2.8 1.1-6L3.4 9l6-.9L12 2.7z"/></svg>`
  ),
  createIconPreset(
    'icon-star-outline',
    'Star Outline',
    ['star', 'outline', 'favorite', 'rating'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="__COLOR__" stroke-width="2" stroke-linejoin="round" d="M12 3.3l2.5 5.1 5.7.8-4.1 4 1 5.7L12 16.1 6.9 18.9l1-5.7-4.1-4 5.7-.8L12 3.3z"/></svg>`
  ),
  createIconPreset(
    'icon-heart-solid',
    'Heart Solid',
    ['heart', 'love', 'romance', 'like'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="__COLOR__" d="M12 21s-7.5-4.6-9.5-9C.8 8.8 2.3 5 6.2 5c2.3 0 3.5 1.3 4.3 2.5C11.3 6.3 12.5 5 14.8 5 18.7 5 20.2 8.8 21.5 12c-2 4.4-9.5 9-9.5 9z"/></svg>`
  ),
  createIconPreset(
    'icon-heart-outline',
    'Heart Outline',
    ['heart', 'outline', 'love', 'line'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="__COLOR__" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M20.8 8.5c0 5.3-8.8 10.5-8.8 10.5S3.2 13.8 3.2 8.5C3.2 6 5.2 4 7.7 4c1.7 0 3.3.9 4.3 2.3C13 4.9 14.6 4 16.3 4 18.8 4 20.8 6 20.8 8.5z"/></svg>`
  ),
  createIconPreset(
    'icon-arrow-right',
    'Arrow Right',
    ['arrow', 'right', 'next', 'direction'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="__COLOR__" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M4 12h14m0 0-5-5m5 5-5 5"/></svg>`
  ),
  createIconPreset(
    'icon-arrow-left',
    'Arrow Left',
    ['arrow', 'left', 'back', 'direction'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="__COLOR__" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M20 12H6m0 0 5-5m-5 5 5 5"/></svg>`
  ),
  createIconPreset(
    'icon-arrow-up',
    'Arrow Up',
    ['arrow', 'up', 'direction'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="__COLOR__" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M12 20V6m0 0-5 5m5-5 5 5"/></svg>`
  ),
  createIconPreset(
    'icon-arrow-down',
    'Arrow Down',
    ['arrow', 'down', 'direction'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="__COLOR__" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M12 4v14m0 0-5-5m5 5 5-5"/></svg>`
  ),
  createIconPreset(
    'icon-sparkles',
    'Sparkles',
    ['sparkle', 'shine', 'magic', 'star'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="__COLOR__" d="M12 2l1.6 4.4L18 8l-4.4 1.6L12 14l-1.6-4.4L6 8l4.4-1.6L12 2zm7 9 1 2.7 2.7 1L20 15.7 19 18.5l-1-2.8-2.8-1 2.8-1L19 11zM5 13l1 2.6L8.6 16 6 17l-1 2.6L4 17l-2.6-1L4 15.6 5 13z"/></svg>`
  ),
  createIconPreset(
    'icon-lightning',
    'Lightning',
    ['lightning', 'bolt', 'flash', 'energy'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="__COLOR__" d="M13 2 4 13h6l-1 9 9-11h-6l1-9z"/></svg>`
  ),
  createIconPreset(
    'icon-location-pin',
    'Location Pin',
    ['location', 'pin', 'map', 'marker'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="__COLOR__" d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zm0-9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>`
  ),
  createIconPreset(
    'icon-camera',
    'Camera',
    ['camera', 'photo', 'picture', 'lens'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="__COLOR__" d="M7 5h2l1.1-2h3.8L15 5h2a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zm5 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>`
  ),
  createIconPreset(
    'icon-chat',
    'Chat Bubble',
    ['chat', 'bubble', 'message', 'comment'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="__COLOR__" d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>`
  ),
  createIconPreset(
    'icon-play',
    'Play Button',
    ['play', 'video', 'triangle', 'media'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="__COLOR__" d="M8 5v14l11-7z"/></svg>`
  ),
  createIconPreset(
    'icon-plus',
    'Plus',
    ['plus', 'add', 'cross'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="__COLOR__" stroke-width="2.5" stroke-linecap="round" d="M12 5v14M5 12h14"/></svg>`
  ),
  createIconPreset(
    'icon-check',
    'Check Mark',
    ['check', 'tick', 'done', 'success'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="__COLOR__" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="m5 13 4 4L19 7"/></svg>`
  ),
  createIconPreset(
    'icon-sun',
    'Sun',
    ['sun', 'weather', 'summer', 'light'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="__COLOR__"/><g stroke="__COLOR__" stroke-width="2" stroke-linecap="round"><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/><path d="m4.9 4.9 2.1 2.1"/><path d="m17 17 2.1 2.1"/><path d="m4.9 19.1 2.1-2.1"/><path d="m17 7 2.1-2.1"/></g></svg>`
  ),
  createIconPreset(
    'icon-moon',
    'Moon',
    ['moon', 'night', 'crescent'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="__COLOR__" d="M15.8 3.5a8.7 8.7 0 1 0 4.7 14.6A9.5 9.5 0 1 1 15.8 3.5z"/></svg>`
  ),
  createIconPreset(
    'icon-paper-plane',
    'Paper Plane',
    ['plane', 'send', 'paper', 'arrow'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="__COLOR__" d="M2 11.5 22 3l-8.5 20-2.7-7-7-2.5z"/></svg>`
  ),
  createIconPreset(
    'icon-flower',
    'Flower',
    ['flower', 'floral', 'petal', 'decorative'],
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="__COLOR__" d="M12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z"/><path fill="__COLOR__" d="M12 3a3 3 0 0 1 3 3c0 1-.4 1.8-1 2.4A3.8 3.8 0 0 0 12 8a3.8 3.8 0 0 0-2 .4A3 3 0 0 1 9 6a3 3 0 0 1 3-3zm0 18a3 3 0 0 0 3-3c0-1-.4-1.8-1-2.4a3.8 3.8 0 0 1-2 .4 3.8 3.8 0 0 1-2-.4A3 3 0 0 0 9 18a3 3 0 0 0 3 3zM3 12a3 3 0 0 1 3-3c1 0 1.8.4 2.4 1A3.8 3.8 0 0 0 8 12c0 .7.1 1.4.4 2A3 3 0 0 1 6 15a3 3 0 0 1-3-3zm18 0a3 3 0 0 0-3-3c-1 0-1.8.4-2.4 1 .3.6.4 1.3.4 2 0 .7-.1 1.4-.4 2 .6.6 1.4 1 2.4 1a3 3 0 0 0 3-3z"/></svg>`
  ),
]

const ELEMENT_PRESETS: ElementPreset[] = [
  {
    id: 'shape-rect-terracotta',
    label: 'Terracotta Block',
    category: 'shapes',
    keywords: ['rectangle', 'solid', 'block', 'background'],
    payload: { type: 'shape', shapeType: 'rectangle', fill: '#D54D34', x: 110, y: 120, width: 180, height: 120, rotation: 0 },
    preview: <div className="h-10 w-14 rounded-sm" style={{ backgroundColor: '#D54D34' }} />,
  },
  {
    id: 'shape-rect-sand',
    label: 'Sand Block',
    category: 'shapes',
    keywords: ['rectangle', 'paper', 'soft'],
    payload: { type: 'shape', shapeType: 'rectangle', fill: '#EAD7C0', x: 120, y: 140, width: 220, height: 140, rotation: 0 },
    preview: <div className="h-10 w-14 rounded-sm" style={{ backgroundColor: '#EAD7C0' }} />,
  },
  {
    id: 'shape-circle-bottle',
    label: 'Bottle Circle',
    category: 'shapes',
    keywords: ['circle', 'badge', 'round'],
    payload: { type: 'shape', shapeType: 'circle', fill: '#153A30', x: 150, y: 140, width: 120, height: 120, rotation: 0 },
    preview: <div className="h-10 w-10 rounded-full" style={{ backgroundColor: '#153A30' }} />,
  },
  {
    id: 'shape-circle-outline',
    label: 'Outline Circle',
    category: 'shapes',
    keywords: ['circle', 'ring', 'outline'],
    payload: { type: 'shape', shapeType: 'circle', fill: '#FFFFFF', stroke: '#1C1814', strokeWidth: 4, x: 140, y: 140, width: 120, height: 120, rotation: 0 },
    preview: <div className="h-10 w-10 rounded-full border-[3px]" style={{ borderColor: '#1C1814' }} />,
  },
  {
    id: 'shape-pill-dark',
    label: 'Dark Pill',
    category: 'shapes',
    keywords: ['pill', 'label', 'strip', 'rectangle'],
    payload: { type: 'shape', shapeType: 'rectangle', fill: '#1C1814', x: 140, y: 220, width: 280, height: 70, rotation: 0 },
    preview: <div className="h-8 w-16 rounded-full" style={{ backgroundColor: '#1C1814' }} />,
  },
  {
    id: 'frame-classic',
    label: 'Classic Frame',
    category: 'frames',
    keywords: ['photo', 'frame', 'border', 'classic'],
    payload: { type: 'shape', shapeType: 'rectangle', fill: '#FFFFFF', stroke: '#1C1814', strokeWidth: 2, x: 120, y: 120, width: 340, height: 260, rotation: 0 },
    preview: <div className="h-10 w-14 rounded-sm border-2 bg-white" style={{ borderColor: '#1C1814' }} />,
  },
  {
    id: 'frame-wide',
    label: 'Wide Frame',
    category: 'frames',
    keywords: ['photo', 'landscape', 'frame', 'wide'],
    payload: { type: 'shape', shapeType: 'rectangle', fill: '#FFFFFF', stroke: '#1C1814', strokeWidth: 3, x: 90, y: 140, width: 520, height: 300, rotation: 0 },
    preview: <div className="h-9 w-16 rounded-sm border-[3px] bg-white" style={{ borderColor: '#1C1814' }} />,
  },
  {
    id: 'frame-tall',
    label: 'Tall Frame',
    category: 'frames',
    keywords: ['portrait', 'frame', 'vertical', 'photo'],
    payload: { type: 'shape', shapeType: 'rectangle', fill: '#FFFFFF', stroke: '#1C1814', strokeWidth: 3, x: 170, y: 100, width: 280, height: 420, rotation: 0 },
    preview: <div className="h-12 w-9 rounded-sm border-[3px] bg-white" style={{ borderColor: '#1C1814' }} />,
  },
  {
    id: 'frame-dark',
    label: 'Dark Frame',
    category: 'frames',
    keywords: ['frame', 'dark', 'border'],
    payload: { type: 'shape', shapeType: 'rectangle', fill: '#1C1814', stroke: '#DCCFB9', strokeWidth: 2, x: 110, y: 130, width: 360, height: 260, rotation: 0 },
    preview: <div className="h-10 w-14 rounded-sm border-2" style={{ borderColor: '#DCCFB9', backgroundColor: '#1C1814' }} />,
  },
  {
    id: 'frame-soft',
    label: 'Soft Frame',
    category: 'frames',
    keywords: ['frame', 'soft', 'cream', 'border'],
    payload: { type: 'shape', shapeType: 'rectangle', fill: '#F8F4EC', stroke: '#A28A6A', strokeWidth: 2, x: 120, y: 120, width: 380, height: 280, rotation: 0 },
    preview: <div className="h-10 w-14 rounded-sm border-2" style={{ borderColor: '#A28A6A', backgroundColor: '#F8F4EC' }} />,
  },
  {
    id: 'divider-thin',
    label: 'Thin Divider',
    category: 'dividers',
    keywords: ['line', 'divider', 'horizontal', 'thin'],
    payload: { type: 'shape', shapeType: 'line', fill: '#1C1814', stroke: '#1C1814', strokeWidth: 2, x: 90, y: 220, width: 520, height: 0, rotation: 0 },
    preview: <div className="h-[2px] w-16 rounded-full" style={{ backgroundColor: '#1C1814' }} />,
  },
  {
    id: 'divider-bold',
    label: 'Bold Divider',
    category: 'dividers',
    keywords: ['line', 'divider', 'horizontal', 'bold'],
    payload: { type: 'shape', shapeType: 'line', fill: '#1C1814', stroke: '#1C1814', strokeWidth: 6, x: 90, y: 250, width: 520, height: 0, rotation: 0 },
    preview: <div className="h-[6px] w-16 rounded-full" style={{ backgroundColor: '#1C1814' }} />,
  },
  {
    id: 'divider-terracotta',
    label: 'Accent Divider',
    category: 'dividers',
    keywords: ['line', 'divider', 'accent', 'terracotta'],
    payload: { type: 'shape', shapeType: 'line', fill: '#D54D34', stroke: '#D54D34', strokeWidth: 4, x: 110, y: 260, width: 460, height: 0, rotation: 0 },
    preview: <div className="h-[4px] w-16 rounded-full" style={{ backgroundColor: '#D54D34' }} />,
  },
  {
    id: 'divider-diagonal',
    label: 'Diagonal Slash',
    category: 'dividers',
    keywords: ['line', 'diagonal', 'slash'],
    payload: { type: 'shape', shapeType: 'line', fill: '#1C1814', stroke: '#1C1814', strokeWidth: 4, x: 140, y: 220, width: 200, height: 100, rotation: 0 },
    preview: <div className="h-[4px] w-14 rotate-[-25deg] rounded-full" style={{ backgroundColor: '#1C1814' }} />,
  },
  {
    id: 'divider-double',
    label: 'Double Divider',
    category: 'dividers',
    keywords: ['line', 'double', 'divider'],
    payload: { type: 'shape', shapeType: 'line', fill: '#1C1814', stroke: '#1C1814', strokeWidth: 2, x: 100, y: 220, width: 480, height: 0, rotation: 0 },
    preview: (
      <div className="flex flex-col gap-1 items-center">
        <div className="h-[2px] w-16 rounded-full" style={{ backgroundColor: '#1C1814' }} />
        <div className="h-[2px] w-16 rounded-full" style={{ backgroundColor: '#1C1814' }} />
      </div>
    ),
  },
  {
    id: 'badge-dot',
    label: 'Solid Badge',
    category: 'badges',
    keywords: ['badge', 'dot', 'circle', 'marker'],
    payload: { type: 'shape', shapeType: 'circle', fill: '#D54D34', x: 180, y: 180, width: 80, height: 80, rotation: 0 },
    preview: <div className="h-8 w-8 rounded-full" style={{ backgroundColor: '#D54D34' }} />,
  },
  {
    id: 'badge-outline',
    label: 'Outline Badge',
    category: 'badges',
    keywords: ['badge', 'circle', 'outline', 'stamp'],
    payload: { type: 'shape', shapeType: 'circle', fill: '#FFFFFF', stroke: '#D54D34', strokeWidth: 4, x: 180, y: 180, width: 90, height: 90, rotation: 0 },
    preview: <div className="h-8 w-8 rounded-full border-[3px] bg-white" style={{ borderColor: '#D54D34' }} />,
  },
  {
    id: 'badge-strip',
    label: 'Label Strip',
    category: 'badges',
    keywords: ['label', 'strip', 'tag', 'rectangle'],
    payload: { type: 'shape', shapeType: 'rectangle', fill: '#153A30', x: 140, y: 200, width: 280, height: 70, rotation: 0 },
    preview: <div className="h-7 w-16 rounded-sm" style={{ backgroundColor: '#153A30' }} />,
  },
  {
    id: 'badge-ticket',
    label: 'Ticket Bar',
    category: 'badges',
    keywords: ['ticket', 'label', 'tag', 'bar'],
    payload: { type: 'shape', shapeType: 'rectangle', fill: '#1C1814', x: 120, y: 210, width: 340, height: 60, rotation: 0 },
    preview: <div className="h-6 w-16 rounded-md" style={{ backgroundColor: '#1C1814' }} />,
  },
  {
    id: 'highlight-soft-cream',
    label: 'Cream Highlight',
    category: 'highlights',
    keywords: ['highlight', 'background', 'soft', 'cream'],
    payload: { type: 'shape', shapeType: 'rectangle', fill: '#F8F4EC', x: 120, y: 320, width: 460, height: 120, rotation: 0 },
    preview: <div className="h-8 w-16 rounded-sm" style={{ backgroundColor: '#F8F4EC' }} />,
  },
  {
    id: 'highlight-sage',
    label: 'Sage Highlight',
    category: 'highlights',
    keywords: ['highlight', 'sage', 'green', 'background'],
    payload: { type: 'shape', shapeType: 'rectangle', fill: '#DDE8E3', x: 120, y: 340, width: 460, height: 120, rotation: 0 },
    preview: <div className="h-8 w-16 rounded-sm" style={{ backgroundColor: '#DDE8E3' }} />,
  },
  {
    id: 'highlight-lavender',
    label: 'Lavender Highlight',
    category: 'highlights',
    keywords: ['highlight', 'lavender', 'purple', 'background'],
    payload: { type: 'shape', shapeType: 'rectangle', fill: '#E7E7F3', x: 120, y: 340, width: 460, height: 120, rotation: 0 },
    preview: <div className="h-8 w-16 rounded-sm" style={{ backgroundColor: '#E7E7F3' }} />,
  },
  {
    id: 'highlight-dark-band',
    label: 'Dark Band',
    category: 'highlights',
    keywords: ['highlight', 'dark', 'band', 'strip'],
    payload: { type: 'shape', shapeType: 'rectangle', fill: '#1C1814', x: 70, y: 420, width: 560, height: 110, rotation: 0 },
    preview: <div className="h-8 w-16 rounded-sm" style={{ backgroundColor: '#1C1814' }} />,
  },
  ...ICON_PRESETS,
]

function isHexColor(value: string) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)
}

export function Sidebar({
  activePanel,
  onChangePanel,
  onAddElement,
  photos = [],
  onGoBack,
  spreadBackground = '#FFFFFF',
  onSetSpreadBackground,
  selectedElements = [],
  onAiRemoveBackground,
  onAiFillColor,
  isDrawingMode,
  onToggleDrawingMode,
  brushColor = '#1C1814',
  onChangeBrushColor,
  brushSize = 5,
  onChangeBrushSize,
  currentAlbumId,
  onSwitchAlbum,
  simpleMode = false,
  templates = [],
  activeTemplateId = null,
  onApplyTemplate,
}: SidebarProps) {
  const [selectedPhotoIds, setSelectedPhotoIds] = React.useState<Set<string>>(new Set())
  const [elementQuery, setElementQuery] = React.useState('')
  const [activeElementCategory, setActiveElementCategory] = React.useState<ElementCategory>('all')
  const [remoteHits, setRemoteHits] = React.useState<RemoteElementHit[]>([])
  const [remotePage, setRemotePage] = React.useState(1)
  const [remoteTotalHits, setRemoteTotalHits] = React.useState(0)
  const [remoteLoading, setRemoteLoading] = React.useState(false)
  const [remoteError, setRemoteError] = React.useState<string | null>(null)
  const [localUploads, setLocalUploads] = React.useState<Array<{
    id: string
    name: string
    src: string
    width: number
    height: number
  }>>([])
  const localUploadUrlsRef = React.useRef<string[]>([])
  const [customPageColor, setCustomPageColor] = React.useState(spreadBackground)
  const [aiFillColor, setAiFillColor] = React.useState('#D54D34')
  const [aiMessage, setAiMessage] = React.useState<string | null>(null)
  const [aiProcessing, setAiProcessing] = React.useState(false)
  const [applyingTemplateId, setApplyingTemplateId] = React.useState<string | null>(null)
  const visibleTabs = simpleMode ? SIMPLE_TABS : FULL_TABS

  const primarySelected = selectedElements[0] || null
  const canRemoveImageBackground = primarySelected?.type === 'image'
  const canApplyFillColor = primarySelected?.type === 'shape' || primarySelected?.type === 'text'

  const startDrag = (event: React.DragEvent<HTMLElement>, payload: any) => {
    const serialized = JSON.stringify(payload)
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData(DRAG_MIME, serialized)
    event.dataTransfer.setData('text/plain', serialized)
  }

  const toImageElement = React.useCallback((src: string, rawW: number, rawH: number, indexOffset = 0) => {
    const maxDim = 300
    const safeW = rawW > 0 ? rawW : 600
    const safeH = rawH > 0 ? rawH : 400
    const aspect = safeW / safeH

    let width = maxDim
    let height = maxDim / aspect
    if (height > maxDim) {
      height = maxDim
      width = maxDim * aspect
    }

    return {
      type: 'image',
      src,
      x: 100 + indexOffset * 24,
      y: 100 + indexOffset * 24,
      width,
      height,
      rotation: 0,
    }
  }, [])

  const togglePhotoSelection = React.useCallback((photoId: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev)
      if (next.has(photoId)) next.delete(photoId)
      else next.add(photoId)
      return next
    })
  }, [])

  React.useEffect(() => {
    const currentPhotoIds = new Set(photos.map((photo) => photo.id))
    setSelectedPhotoIds((prev) => {
      const next = new Set<string>()
      prev.forEach((id) => {
        if (currentPhotoIds.has(id)) next.add(id)
      })
      return next
    })
  }, [photos])

  React.useEffect(() => {
    return () => {
      localUploadUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  React.useEffect(() => {
    setCustomPageColor(spreadBackground)
  }, [spreadBackground])

  React.useEffect(() => {
    setAiMessage(null)
  }, [primarySelected?.id])

  const [aiAnalysis, setAiAnalysis] = React.useState<string | null>(null)
  const [aiAssistantLoading, setAiAssistantLoading] = React.useState(false)

  const runAiAssistant = React.useCallback(async (task: 'analyze' | 'caption') => {
    if (!selectedElements[0] || selectedElements[0].type !== 'image') {
      setAiMessage('Select an image to analyze.')
      return
    }

    setAiAssistantLoading(true)
    setAiMessage(null)
    setAiAnalysis(null)

    try {
      const imgEl = selectedElements[0] as ImageElement
      // We need to fetch the image and convert to base64
      const response = await fetch(imgEl.src)
      const blob = await response.blob()
      
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = reader.result as string
          resolve(result.split(',')[1]) // Remove prefix
        }
        reader.readAsDataURL(blob)
      })

      const prompt = task === 'caption' 
        ? 'Generate 3 short, poetic captions for this photo. One word, one short phrase, and one sentence.'
        : 'Analyze this photo. Describe the subject, lighting, and mood. What makes it special for an album?'

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'analyze-image',
          image: base64,
          prompt
        })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      setAiAnalysis(data.result)
    } catch (error: any) {
      setAiMessage(error.message || 'Failed to analyze photo.')
    } finally {
      setAiAssistantLoading(false)
    }
  }, [selectedElements])

  const runAiBackgroundRemover = React.useCallback(async () => {
    if (!onAiRemoveBackground || !canRemoveImageBackground) {
      setAiMessage('Select an image layer first.')
      return
    }

    setAiProcessing(true)
    setAiMessage(null)
    try {
      const ok = await onAiRemoveBackground()
      setAiMessage(ok ? 'Background removed on selected image.' : 'Could not remove background for this image.')
    } finally {
      setAiProcessing(false)
    }
  }, [canRemoveImageBackground, onAiRemoveBackground])

  const runAiFillColor = React.useCallback(() => {
    if (!onAiFillColor) {
      setAiMessage('Fill tool is not available right now.')
      return
    }

    const normalized = aiFillColor.toUpperCase()
    setAiProcessing(true)
    setAiMessage(null)

    void (async () => {
      try {
        const ok = await onAiFillColor(normalized)
        if (ok) {
          setAiMessage(`Fill color applied: ${normalized}`)
          return
        }

        if (primarySelected?.type === 'image') {
          setAiMessage('This image could not be recolored. Try monochrome graphics or SVG-like elements.')
          return
        }

        setAiMessage('Select a text, shape, or monochrome graphic image first.')
      } finally {
        setAiProcessing(false)
      }
    })()
  }, [aiFillColor, onAiFillColor, primarySelected?.type])

  const handleUploadFromComputer = React.useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const readFileAsImage = (file: File) =>
      new Promise<{ id: string; name: string; src: string; width: number; height: number }>((resolve) => {
        const src = URL.createObjectURL(file)
        const img = new Image()

        img.onload = () => {
          resolve({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            src,
            width: img.naturalWidth || 600,
            height: img.naturalHeight || 400,
          })
        }

        img.onerror = () => {
          resolve({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            src,
            width: 600,
            height: 400,
          })
        }

        img.src = src
      })

    const nextUploads = await Promise.all(Array.from(files).map((file) => readFileAsImage(file)))
    localUploadUrlsRef.current.push(...nextUploads.map((item) => item.src))
    setLocalUploads((prev) => [...nextUploads, ...prev])
    event.target.value = ''
  }, [])

  const addSelectedPhotos = React.useCallback(() => {
    const selected = photos.filter((photo) => selectedPhotoIds.has(photo.id))
    if (selected.length === 0) return

    selected.forEach((photo, index) => {
      onAddElement(
        toImageElement(
          photo.blob_url,
          photo.width || 600,
          photo.height || 400,
          index
        )
      )
    })
  }, [onAddElement, photos, selectedPhotoIds, toImageElement])

  const applyCustomBackground = React.useCallback(() => {
    const normalized = customPageColor.trim()
    if (!isHexColor(normalized) || !onSetSpreadBackground) return
    onSetSpreadBackground(normalized.toUpperCase())
  }, [customPageColor, onSetSpreadBackground])

  const activeSearchTerm = React.useMemo(() => {
    const normalized = elementQuery.trim()
    if (normalized.length > 0) return normalized
    
    if (activeElementCategory === 'stickers') return 'sticker'
    if (activeElementCategory === 'backgrounds') return 'texture'
    if (activeElementCategory === 'shapes') return 'shape'
    if (activeElementCategory === 'frames') return 'frame'
    if (activeElementCategory === 'illustrations') return 'illustration'
    if (activeElementCategory === 'vectors') return 'vector'
    
    return 'decorative element'
  }, [elementQuery, activeElementCategory])

  const shouldFetchRemote = React.useMemo(() => {
    if (activePanel !== 'elements') return false
    return activeElementCategory === 'all' || REMOTE_ELEMENT_CATEGORIES.includes(activeElementCategory)
  }, [activePanel, activeElementCategory])

  const toRemoteImageElement = React.useCallback((hit: RemoteElementHit) => {
    return toImageElement(
      hit.largeURL || hit.previewURL,
      hit.width || 600,
      hit.height || 600
    )
  }, [toImageElement])

  const getSourceForCategory = (category: ElementCategory): RemoteSource => {
    if (category === 'backgrounds') return 'pexels'
    if (category === 'shapes' || category === 'frames') return 'svgrepo'
    return 'pixabay'
  }

  const loadRemoteElements = React.useCallback(
    async (page: number, reset: boolean) => {
      if (!shouldFetchRemote) return

      setRemoteLoading(true)
      setRemoteError(null)

      try {
        const source = getSourceForCategory(activeElementCategory)
        const params = new URLSearchParams({
          q: activeSearchTerm,
          page: String(page),
          perPage: '24',
          category: activeElementCategory,
          source,
        })

        const response = await fetch(`/api/elements/search?${params.toString()}`)
        const data = await response.json().catch(() => null)

        if (!response.ok) {
          setRemoteError(data?.error || 'Could not load element library.')
          return
        }

        const hits = Array.isArray(data?.hits) ? (data.hits as RemoteElementHit[]) : []
        setRemoteTotalHits(Number(data?.totalHits) || 0)
        setRemotePage(page)
        setRemoteHits((prev) => {
          if (reset) return hits
          // Simple deduplication by id
          const existingIds = new Set(prev.map(h => h.id))
          const newHits = hits.filter(h => !existingIds.has(h.id))
          return [...prev, ...newHits]
        })
      } catch {
        setRemoteError('Could not load element library.')
      } finally {
        setRemoteLoading(false)
      }
    },
    [activeSearchTerm, shouldFetchRemote, activeElementCategory]
  )

  React.useEffect(() => {
    if (!shouldFetchRemote) return

    setRemoteHits([])
    setRemoteTotalHits(0)
    setRemotePage(1)

    const timer = window.setTimeout(() => {
      void loadRemoteElements(1, true)
    }, 220)

    return () => {
      window.clearTimeout(timer)
    }
  }, [activeSearchTerm, shouldFetchRemote, loadRemoteElements])

  const filteredElementPresets = React.useMemo(() => {
    const query = elementQuery.trim().toLowerCase()

    if (REMOTE_ELEMENT_CATEGORIES.includes(activeElementCategory)) {
      return []
    }

    return ELEMENT_PRESETS.filter((preset) => {
      if (HIDDEN_ELEMENT_CATEGORIES.includes(preset.category)) {
        return false
      }

      if (activeElementCategory !== 'all' && preset.category !== activeElementCategory) {
        return false
      }

      if (!query) return true

      return `${preset.label} ${preset.category} ${preset.keywords.join(' ')}`.toLowerCase().includes(query)
    })
  }, [activeElementCategory, elementQuery])

  const showRemoteSection = activeElementCategory === 'all' || REMOTE_ELEMENT_CATEGORIES.includes(activeElementCategory)
  const hasMoreRemote = remoteHits.length < remoteTotalHits

  const categoryCounts = React.useMemo(() => {
    const query = elementQuery.trim().toLowerCase()

    const matchesQuery = (preset: ElementPreset) => {
      if (!query) return true
      return `${preset.label} ${preset.category} ${preset.keywords.join(' ')}`.toLowerCase().includes(query)
    }

    const isVisiblePreset = (preset: ElementPreset) => !HIDDEN_ELEMENT_CATEGORIES.includes(preset.category)

    const localCountMap = ELEMENT_CATEGORY_OPTIONS.reduce<Record<ElementCategory, number>>((acc, option) => {
      if (option.id === 'all') {
        acc.all = ELEMENT_PRESETS.filter((preset) => isVisiblePreset(preset) && matchesQuery(preset)).length
        return acc
      }

      if (REMOTE_ELEMENT_CATEGORIES.includes(option.id)) {
        acc[option.id] = 0
        return acc
      }

      acc[option.id] = ELEMENT_PRESETS.filter(
        (preset) => isVisiblePreset(preset) && preset.category === option.id && matchesQuery(preset)
      ).length
      return acc
    }, {
      all: 0,
      stickers: 0,
      shapes: 0,
      frames: 0,
      dividers: 0,
      badges: 0,
      highlights: 0,
      icons: 0,
      vectors: 0,
      illustrations: 0,
      photos: 0,
      backgrounds: 0,
    })

    localCountMap.all = localCountMap.all + (showRemoteSection ? remoteTotalHits : 0)
    return localCountMap
  }, [elementQuery, remoteTotalHits, showRemoteSection])

  const handleApplyTemplate = React.useCallback(async (templateId: string) => {
    if (!onApplyTemplate) return

    setApplyingTemplateId(templateId)
    try {
      await onApplyTemplate(templateId)
    } finally {
      setApplyingTemplateId(null)
    }
  }, [onApplyTemplate])

  return (
    <div className="flex h-full bg-[#18191B] dark:bg-[#0F0D0B] flex-shrink-0 z-20 transition-colors">
      
      {/* Very thin left icon rail */}
      <div className="flex flex-col items-center w-[72px] border-r border-white/10 pt-4 h-full bg-black/90">
        {/* Brand or Back btn */}
        <button
          type="button"
          onClick={onGoBack}
          className="mb-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white font-serif font-bold text-lg hover:bg-white/20 transition-colors"
          title="Back"
          aria-label="Back to website"
        >
          F
        </button>

        {visibleTabs.map((t) => {
          const Icon = t.icon
          const isActive = activePanel === t.id
          
          return (
            <button
              key={t.id}
              disabled={t.disabled}
              onClick={() => !t.disabled && onChangePanel(t.id as any)}
              className={`flex flex-col items-center justify-center w-full py-3 px-1 transition-colors group relative ${
                isActive ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'
              } ${t.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isActive && (
                 <div className="absolute left-0 w-[3px] top-2 bottom-2 rounded-r bg-white" />
              )}
              <Icon className="w-[22px] h-[22px] mb-1.5 stroke-[1.5]" />
              <span className="text-[10px] font-medium tracking-wide">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Expanded properties panel */}
      <div className="w-[320px] border-r border-[#E5E5E5] dark:border-[#3a342b] bg-white dark:bg-[#171511] h-full overflow-y-auto flex flex-col p-4 z-10 shadow-[1px_0_10px_rgba(0,0,0,0.05)] transition-colors">

        {activePanel === 'templates' && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <h2 className="text-xl font-serif text-foreground mb-3">Templates</h2>
            <p className="text-xs text-muted-foreground mb-4">Pick a template style. Your current photos will be remapped automatically.</p>

            <div className="space-y-3 overflow-y-auto no-scrollbar pr-1 pb-8">
              {templates.map((template) => {
                const isActive = template.id === activeTemplateId
                const hasLayout = template.spreads.length > 0
                const isApplying = applyingTemplateId === template.id

                return (
                  <button
                    key={template.id}
                    type="button"
                    disabled={!hasLayout || isApplying}
                    onClick={() => void handleApplyTemplate(template.id)}
                    className={`w-full text-left rounded-md border p-2 transition-colors ${
                      isActive
                        ? 'border-terracotta bg-terracotta/10'
                        : 'border-black/10 dark:border-white/10 hover:border-terracotta/60'
                    } ${!hasLayout ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded mb-2 bg-black/10">
                      <img src={template.thumbnail} alt={template.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{template.name}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{template.category}</p>
                      </div>
                      {isActive ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-terracotta">Active</span>
                      ) : !hasLayout ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Soon</span>
                      ) : isApplying ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-terracotta">Applying</span>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {activePanel === 'design' && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <h2 className="text-xl font-serif text-foreground mb-3">Design</h2>
            <p className="text-xs text-muted-foreground mb-5">Set page look first, then add photos, elements, and text.</p>

            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Page color</h3>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PAGE_COLORS.map((color) => {
                    const isActive = spreadBackground.toLowerCase() === color.toLowerCase()
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => onSetSpreadBackground?.(color)}
                        className={`h-9 rounded border transition-all ${isActive ? 'ring-2 ring-terracotta border-terracotta' : 'border-black/10 dark:border-white/20 hover:scale-[1.03]'}`}
                        style={{ backgroundColor: color }}
                        title={`Set page color ${color}`}
                        aria-label={`Set page color ${color}`}
                      />
                    )
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={isHexColor(customPageColor) ? customPageColor : '#FFFFFF'}
                    onChange={(event) => {
                      setCustomPageColor(event.target.value.toUpperCase())
                      onSetSpreadBackground?.(event.target.value.toUpperCase())
                    }}
                    className="h-10 w-10 rounded border border-black/10 dark:border-white/20 bg-transparent p-1 cursor-pointer"
                    aria-label="Choose custom page color"
                  />
                  <input
                    type="text"
                    value={customPageColor}
                    onChange={(event) => setCustomPageColor(event.target.value)}
                    onBlur={applyCustomBackground}
                    className="h-10 flex-1 rounded border border-black/10 dark:border-white/20 bg-white dark:bg-[#201c16] px-3 text-sm"
                    placeholder="#FFFFFF"
                    aria-label="Page color hex value"
                  />
                  <button
                    type="button"
                    onClick={applyCustomBackground}
                    className="h-10 px-3 rounded bg-terracotta text-white text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    Apply
                  </button>
                </div>
                
                <div className="mt-3 text-right">
                  <button
                    type="button"
                    onClick={() => onSetSpreadBackground?.(spreadBackground, true)}
                    className="text-xs text-terracotta hover:underline underline-offset-2 font-medium"
                  >
                    Apply to all pages
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-black/10 dark:border-white/10 p-3">
                <h4 className="text-sm font-semibold text-foreground mb-2">Workflow tip</h4>
                <p className="text-xs text-muted-foreground">For a faster flow: choose page color in Design, place visual blocks in Elements, then add heading/body in Text.</p>
              </div>
            </div>

            <div className="mt-auto h-0" />
          </div>
        )}
        
        {activePanel === 'elements' && !simpleMode && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <h2 className="text-xl font-serif text-foreground mb-3">Elements</h2>
            <p className="text-xs text-muted-foreground mb-4">Search and filter elements, then click or drag to drop on canvas.</p>

            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={elementQuery}
                onChange={(event) => setElementQuery(event.target.value)}
                placeholder="Search elements..."
                className="h-10 w-full rounded-lg border border-black/10 dark:border-white/20 bg-white dark:bg-[#201c16] pl-9 pr-3 text-sm text-foreground"
                aria-label="Search elements"
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {ELEMENT_CATEGORY_OPTIONS.map((option) => {
                const isActive = activeElementCategory === option.id
                const count = categoryCounts[option.id]
                const showCount = !REMOTE_ELEMENT_CATEGORIES.includes(option.id)

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setActiveElementCategory(option.id)}
                    className={`px-2.5 py-1.5 rounded-full text-xs border transition-colors ${
                      isActive
                        ? 'bg-terracotta text-white border-terracotta'
                        : 'bg-white dark:bg-[#201c16] text-foreground border-black/10 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-[#2c261f]'
                    }`}
                  >
                    {showCount ? `${option.label} (${count})` : option.label}
                  </button>
                )
              })}
            </div>

            <div className="space-y-4 pb-8">
              {!REMOTE_ELEMENT_CATEGORIES.includes(activeElementCategory) && (
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Preset Elements</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {filteredElementPresets.length > 0 ? (
                      filteredElementPresets.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          className="p-2.5 bg-gray-50 dark:bg-[#201c16] hover:bg-gray-100 dark:hover:bg-[#2c261f] rounded border border-gray-200 dark:border-[#3a342b] transition-colors text-left"
                          draggable
                          onDragStart={(event) => startDrag(event, { ...preset.payload })}
                          onClick={() => onAddElement({ ...preset.payload })}
                          title={`Add ${preset.label}`}
                          aria-label={`Add ${preset.label}`}
                        >
                          <div className="h-16 rounded bg-white dark:bg-[#171511] border border-black/5 dark:border-white/10 flex items-center justify-center mb-2">
                            {preset.preview}
                          </div>
                          <div className="text-[11px] font-medium text-foreground leading-tight">{preset.label}</div>
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">{preset.category}</div>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-2 p-6 text-center border-2 border-dashed border-[#DDD8CE] dark:border-[#3a342b] rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">No matching presets</p>
                        <p className="text-xs text-muted-foreground/80">Try another keyword or category.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showRemoteSection && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Element Library</h3>
                    <span className="text-[10px] text-muted-foreground">{remoteTotalHits} found</span>
                  </div>
  
                  {remoteError && (
                    <div className="mb-2 rounded border border-red-300/60 bg-red-50 dark:bg-red-950/20 px-2 py-1.5 text-[11px] text-red-700 dark:text-red-300">
                      {remoteError}
                    </div>
                  )}
  
                  <div className="grid grid-cols-2 gap-3">
                    {remoteHits.map((hit) => {
                      const addPayload = toRemoteImageElement(hit)
                      const hitKey = `${hit.source}-${hit.id}`
  
                      return (
                        <button
                          key={hitKey}
                          type="button"
                          className="p-2 bg-gray-50 dark:bg-[#201c16] hover:bg-gray-100 dark:hover:bg-[#2c261f] rounded border border-gray-200 dark:border-[#3a342b] transition-colors text-left group"
                          draggable
                          onDragStart={(event) => startDrag(event, addPayload)}
                          onClick={() => onAddElement(addPayload)}
                          title={`Add element: ${hit.tags}`}
                          aria-label={`Add element ${hit.tags}`}
                        >
                          <div className="h-24 rounded bg-white dark:bg-[#171511] border border-black/5 dark:border-white/10 flex items-center justify-center overflow-hidden relative">
                            <img src={hit.previewURL} alt={hit.tags || 'Element'} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" draggable={false} />
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[8px] uppercase font-bold px-1 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm">
                                {hit.source}
                              </span>
                            </div>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <div className="text-[10px] text-muted-foreground truncate">{hit.tags || 'Element'}</div>
                          </div>
                        </button>
                      )
                    })}
  
                    {remoteLoading &&
                      Array.from({ length: 4 }).map((_, index) => (
                        <div key={`rem-loading-${index}`} className="h-32 rounded border border-gray-200 dark:border-[#3a342b] bg-gray-100/70 dark:bg-[#201c16] animate-pulse" />
                      ))}
                  </div>
  
                  {!remoteLoading && remoteHits.length === 0 && !remoteError && (
                    <div className="mt-2 p-6 text-center border-2 border-dashed border-[#DDD8CE] dark:border-[#3a342b] rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">No results for this search</p>
                      <p className="text-xs text-muted-foreground/80">Try another search keyword.</p>
                    </div>
                  )}
  
                  {hasMoreRemote && !remoteLoading && (
                    <button
                      type="button"
                      onClick={() => {
                        void loadRemoteElements(remotePage + 1, false)
                      }}
                      className="mt-3 w-full rounded border border-black/10 dark:border-white/20 h-9 text-xs font-medium text-foreground hover:bg-gray-50 dark:hover:bg-[#201c16] transition-colors"
                    >
                      Load more elements
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-auto h-0" />
          </div>
        )}

        {activePanel === 'photos' && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif text-foreground">Photos</h2>
              {selectedPhotoIds.size > 0 && (
                <button
                  type="button"
                  onClick={addSelectedPhotos}
                  className="text-xs px-3 py-1.5 rounded bg-terracotta text-white hover:opacity-90 transition-opacity"
                >
                  Add {selectedPhotoIds.size}
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-4">Tick multiple photos, then click Add.</p>
            <div className="grid grid-cols-2 gap-3 pb-8">
              {photos.length > 0 ? (
                photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square bg-gray-100 dark:bg-[#201c16] rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-terracotta"
                    draggable
                    onDragStart={(event) => {
                      startDrag(event, toImageElement(photo.blob_url, photo.width || 600, photo.height || 400))
                    }}
                    onClick={() => {
                      onAddElement(toImageElement(photo.blob_url, photo.width || 600, photo.height || 400))
                    }}
                  >
                    <img 
                      src={photo.thumbnail_url || photo.blob_url} 
                      alt="Uploaded" 
                      className="w-full h-full object-cover" 
                    />

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        togglePhotoSelection(photo.id)
                      }}
                      className={`absolute top-1.5 right-1.5 h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                        selectedPhotoIds.has(photo.id)
                          ? 'bg-terracotta border-terracotta text-white'
                          : 'bg-black/45 border-white/60 text-white'
                      }`}
                      title="Select photo"
                      aria-label="Select photo"
                    >
                      {selectedPhotoIds.has(photo.id) && <Check className="w-3 h-3" />}
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-6 text-center border-2 border-dashed border-[#DDD8CE] dark:border-[#3a342b] rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">No photos in this event.</p>
                  <p className="text-xs text-muted-foreground/80">Go back to the event to upload some!</p>
                </div>
              )}
            </div>

            <div className="mt-auto h-0" />
          </div>
        )}

        {activePanel === 'uploads' && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <h2 className="text-xl font-serif text-foreground mb-4">Uploads</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Upload from your computer: images, stickers, or visual elements.
            </p>

            <label className="mb-5 p-4 border-2 border-dashed border-[#DDD8CE] dark:border-[#3a342b] rounded-lg text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-[#201c16] transition-colors">
              <input
                type="file"
                accept="image/*,.svg"
                multiple
                className="hidden"
                onChange={handleUploadFromComputer}
              />
              <div className="text-sm font-medium text-foreground">Choose files</div>
              <div className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP, SVG</div>
            </label>

            {localUploads.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 pb-8">
                {localUploads.map((item) => (
                  <div
                    key={item.id}
                    className="aspect-square bg-gray-100 dark:bg-[#201c16] rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-terracotta"
                    draggable
                    onDragStart={(event) => startDrag(event, toImageElement(item.src, item.width, item.height))}
                    onClick={() => onAddElement(toImageElement(item.src, item.width, item.height))}
                  >
                    <img src={item.src} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-[#DDD8CE] dark:border-[#3a342b] rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">No local uploads yet.</p>
                <p className="text-xs text-muted-foreground/80">Upload a file and click/drag to place it on canvas.</p>
              </div>
            )}

            <div className="mt-auto h-0" />
          </div>
        )}

        {activePanel === 'text' && !simpleMode && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <h2 className="text-xl font-serif text-foreground mb-6">Text</h2>
            <p className="text-xs text-muted-foreground mb-4">Use heading, subheading, and body blocks for faster typography layout.</p>
            
            <div className="space-y-3">
              <button 
                className="w-full py-4 bg-gray-50 dark:bg-[#201c16] hover:bg-gray-100 dark:hover:bg-[#2c261f] text-foreground rounded flex items-center justify-center font-bold text-3xl font-serif transition-colors"
                draggable
                onDragStart={(event) => startDrag(event, {
                  type: 'text',
                  text: 'Add a heading',
                  fontSize: 72,
                  fontFamily: 'serif',
                  fill: '#1C1814',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  x: 50, y: 50, width: 600, height: 90, rotation: 0
                })}
                onClick={() => onAddElement({
                  type: 'text',
                  text: 'Add a heading',
                  fontSize: 72,
                  fontFamily: 'serif',
                  fill: '#1C1814',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  x: 50, y: 50, width: 600, height: 90, rotation: 0
                })}
              >
                Add a heading
              </button>
              
              <button 
                className="w-full py-3 bg-gray-50 dark:bg-[#201c16] hover:bg-gray-100 dark:hover:bg-[#2c261f] text-foreground rounded flex items-center justify-center font-semibold text-xl font-sans transition-colors"
                draggable
                onDragStart={(event) => startDrag(event, {
                  type: 'text',
                  text: 'Add a subheading',
                  fontSize: 48,
                  fontFamily: 'sans-serif',
                  fill: '#1C1814',
                  fontWeight: 'normal',
                  textAlign: 'left',
                  x: 50, y: 150, width: 400, height: 60, rotation: 0
                })}
                onClick={() => onAddElement({
                  type: 'text',
                  text: 'Add a subheading',
                  fontSize: 48,
                  fontFamily: 'sans-serif',
                  fill: '#1C1814',
                  fontWeight: 'normal',
                  textAlign: 'left',
                  x: 50, y: 150, width: 400, height: 60, rotation: 0
                })}
              >
                Add a subheading
              </button>
              
              <button 
                className="w-full py-2 bg-gray-50 dark:bg-[#201c16] hover:bg-gray-100 dark:hover:bg-[#2c261f] text-foreground rounded flex items-center justify-center text-sm font-sans transition-colors"
                draggable
                onDragStart={(event) => startDrag(event, {
                  type: 'text',
                  text: 'Add a little bit of body text',
                  fontSize: 24,
                  fontFamily: 'sans-serif',
                  fill: '#1C1814',
                  fontWeight: 'normal',
                  textAlign: 'center',
                  x: 50, y: 250, width: 400, height: 40, rotation: 0
                })}
                onClick={() => onAddElement({
                  type: 'text',
                  text: 'Add a little bit of body text',
                  fontSize: 24,
                  fontFamily: 'sans-serif',
                  fill: '#1C1814',
                  fontWeight: 'normal',
                  textAlign: 'center',
                  x: 50, y: 250, width: 400, height: 40, rotation: 0
                })}
              >
                Add a little bit of body text
              </button>

              <button
                className="w-full py-2 bg-gray-50 dark:bg-[#201c16] hover:bg-gray-100 dark:hover:bg-[#2c261f] text-foreground rounded flex items-center justify-center text-base italic font-serif transition-colors"
                draggable
                onDragStart={(event) => startDrag(event, {
                  type: 'text',
                  text: '"A meaningful quote goes here."',
                  fontSize: 34,
                  fontFamily: 'serif',
                  fill: '#1C1814',
                  fontWeight: 'normal',
                  textAlign: 'center',
                  x: 120,
                  y: 320,
                  width: 500,
                  height: 80,
                  rotation: 0,
                })}
                onClick={() => onAddElement({
                  type: 'text',
                  text: '"A meaningful quote goes here."',
                  fontSize: 34,
                  fontFamily: 'serif',
                  fill: '#1C1814',
                  fontWeight: 'normal',
                  textAlign: 'center',
                  x: 120,
                  y: 320,
                  width: 500,
                  height: 80,
                  rotation: 0,
                })}
              >
                Add a quote
              </button>
            </div>
            
          </div>
        )}

        {activePanel === 'ai' && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <h2 className="text-xl font-serif text-foreground mb-3">AI Studio</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Advanced AI tools powered by Gemini 1.5.
            </p>

            <div className="space-y-4 pb-8 overflow-y-auto no-scrollbar pr-1">
              {/* Background Remover */}
              <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 space-y-2 bg-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded bg-terracotta/20 text-terracotta">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11l-7-7-7 7M5 19l7-7 7 7" /></svg>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Background Remover</h3>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Intelligent edge detection for clean cutouts.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void runAiBackgroundRemover()
                  }}
                  disabled={aiProcessing || !canRemoveImageBackground}
                  className="w-full h-9 rounded bg-terracotta text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {aiProcessing ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : 'Remove Background'}
                </button>
              </div>

              {/* Gemini Assistant */}
              <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 space-y-3 bg-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded bg-blue-500/20 text-blue-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Gemini Vision</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => runAiAssistant('analyze')}
                    disabled={aiAssistantLoading || !canRemoveImageBackground}
                    className="h-14 rounded border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors disabled:opacity-30"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Analyze</span>
                    <span className="text-[9px] text-muted-foreground">Mood & Details</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => runAiAssistant('caption')}
                    disabled={aiAssistantLoading || !canRemoveImageBackground}
                    className="h-14 rounded border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors disabled:opacity-30"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Caption</span>
                    <span className="text-[9px] text-muted-foreground">Smart Quotes</span>
                  </button>
                </div>

                {aiAssistantLoading && (
                  <div className="p-4 flex flex-col items-center justify-center gap-2 animate-pulse">
                    <div className="w-full h-2 bg-white/10 rounded" />
                    <div className="w-2/3 h-2 bg-white/10 rounded" />
                  </div>
                )}

                {aiAnalysis && (
                  <div className="p-3 rounded bg-black/20 border border-white/5 text-[11px] leading-relaxed text-muted-foreground animate-in zoom-in-95 duration-300 max-h-48 overflow-y-auto no-scrollbar">
                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/5 sticky top-0 bg-black/20 z-10">
                      <span className="text-[9px] uppercase font-bold text-blue-400">Gemini Response</span>
                      <button 
                        onClick={() => {
                          void window.navigator.clipboard.writeText(aiAnalysis)
                          setAiMessage('Copied to clipboard!')
                        }}
                        className="text-[9px] hover:text-white"
                      >
                        Copy
                      </button>
                    </div>
                    {aiAnalysis}
                  </div>
                )}
              </div>

              {/* Recolor Tool */}
              <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Style & Color</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={aiFillColor}
                    onChange={(event) => setAiFillColor(event.target.value.toUpperCase())}
                    className="h-10 w-10 rounded border border-black/10 dark:border-white/20 bg-transparent p-1 cursor-pointer"
                    aria-label="Choose fill color"
                  />
                  <input
                    type="text"
                    value={aiFillColor}
                    onChange={(event) => setAiFillColor(event.target.value)}
                    className="flex-1 h-10 px-3 bg-white/5 rounded border border-white/10 text-xs font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={runAiFillColor}
                  disabled={aiProcessing || !primarySelected}
                  className="w-full h-9 rounded border border-black/10 dark:border-white/20 text-xs font-medium text-foreground hover:bg-gray-50 dark:hover:bg-[#201c16] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {aiProcessing ? 'Processing...' : 'Apply Fill'}
                </button>
              </div>

              {aiMessage && (
                <div className={`p-3 rounded border text-xs ${aiMessage.includes('!') ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                  {aiMessage}
                </div>
              )}
            </div>

            <div className="mt-auto h-0" />
          </div>
        )}

        {activePanel === 'draw' && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <h2 className="text-xl font-serif text-foreground mb-4">Draw</h2>
            <p className="text-xs text-muted-foreground mb-6">
              Freehand drawing tool for sketches and notes.
            </p>

            <div className="space-y-6 overflow-y-auto no-scrollbar pb-8">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Tool</h3>
                <button
                  type="button"
                  onClick={() => onToggleDrawingMode?.(!isDrawingMode)}
                  className={`w-full h-12 rounded-lg flex items-center justify-center gap-3 font-medium transition-all ${
                    isDrawingMode 
                      ? 'bg-terracotta text-white shadow-lg shadow-terracotta/20' 
                      : 'bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10'
                  }`}
                >
                  <PenTool className="w-5 h-5" />
                  {isDrawingMode ? 'Drawing Mode: ON' : 'Start Drawing'}
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Brush Size</h3>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={(e) => onChangeBrushSize?.(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-terracotta"
                  />
                  <span className="text-xs font-mono w-6 text-center">{brushSize}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Brush Color</h3>
                <div className="grid grid-cols-6 gap-2">
                  {PAGE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onChangeBrushColor?.(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        brushColor === color ? 'border-terracotta' : 'border-white/10'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <div className="relative w-8 h-8 rounded-full border border-white/10 overflow-hidden">
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => onChangeBrushColor?.(e.target.value)}
                      className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                    />
                    <div 
                      className="w-full h-full" 
                      style={{ backgroundColor: brushColor }}
                    />
                  </div>
                </div>
              </div>
              
              {isDrawingMode && (
                <div className="p-3 rounded-lg bg-terracotta/10 border border-terracotta/20 text-[11px] text-terracotta/90 leading-relaxed">
                  <p className="font-bold mb-1">PRO TIP:</p>
                  Click and drag on the canvas to draw. Lines are saved as individual layers.
                </div>
              )}
            </div>
          </div>
        )}

        {activePanel === 'projects' && (
          <ProjectsPanel currentAlbumId={currentAlbumId} onSwitchAlbum={onSwitchAlbum} />
        )}

      </div>
    </div>
  )
}

function ProjectsPanel({ currentAlbumId, onSwitchAlbum }: { currentAlbumId?: string, onSwitchAlbum?: (id: string) => void }) {
  const [albums, setAlbums] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const supabase = React.useMemo(() => {
    // Only import if needed to avoid client/server issues in some setups, 
    // but here we expect a standard supabase client
    const { createClient } = require('@/lib/supabase/client')
    return createClient()
  }, [])

  React.useEffect(() => {
    async function fetchAlbums() {
      setLoading(true)
      const { data } = await supabase
        .from('albums')
        .select('id, title, cover_image_url, created_at')
        .order('created_at', { ascending: false })
      
      setAlbums(data || [])
      setLoading(false)
    }
    void fetchAlbums()
  }, [supabase])

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
      <h2 className="text-xl font-serif text-foreground mb-4">Projects</h2>
      <p className="text-xs text-muted-foreground mb-6">
        Switch between your albums or import elements from other projects.
      </p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto no-scrollbar pb-8">
          {albums.map((album) => (
            <button
              key={album.id}
              onClick={() => onSwitchAlbum?.(album.id)}
              className={`w-full p-3 rounded-lg border text-left transition-all group ${
                currentAlbumId === album.id 
                  ? 'bg-terracotta/10 border-terracotta shadow-md' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded bg-black/40 border border-white/10 overflow-hidden flex-shrink-0">
                  {album.cover_image_url ? (
                    <img src={album.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">No Cover</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate group-hover:text-terracotta transition-colors">
                    {album.title || 'Untitled Album'}
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(album.created_at).toLocaleDateString()}
                  </p>
                  {currentAlbumId === album.id && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-terracotta/20 text-terracotta text-[9px] font-bold uppercase tracking-wider">
                      Current
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
          {albums.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
              <p className="text-sm text-muted-foreground">No other albums found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
