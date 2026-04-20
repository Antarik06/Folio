export type ElementType = 'image' | 'text' | 'shape'

export interface BaseElement {
  id: string
  type: ElementType
  name?: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
  locked?: boolean
  hidden?: boolean
}

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string
  fitMode?: 'fit' | 'fill'
  opacity?: number
  flipX?: boolean
  flipY?: boolean
  cornerRadius?: number
  shadowBlur?: number
  shadowColor?: string
  shadowOpacity?: number
  crop?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
  lineHeight?: number
  letterSpacing?: number
  fill: string
}

export interface ShapeElement extends BaseElement {
  type: 'shape'
  shapeType: 'rectangle' | 'circle' | 'line'
  fill: string
  stroke?: string
  strokeWidth?: number
}

export type AlbumElement = ImageElement | TextElement | ShapeElement

export interface AlbumPageSide {
  background: string
  elements: AlbumElement[]
}

export interface AlbumSpread {
  id: string
  isCover?: boolean
  background: string
  elements: AlbumElement[]
  front?: AlbumPageSide
  back?: AlbumPageSide
}

export interface AlbumState {
  spreads: AlbumSpread[]
  activeSpreadId: string | null
  selection: string[] // array of selected element ids
  zoom: number
}
