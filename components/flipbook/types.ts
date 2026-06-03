import { AlbumElement } from '@/components/album-editor/types'

export interface FlipbookPageData {
  id: string
  background: string
  elements: AlbumElement[]
}

export interface FlipbookProtections {
  watermark: boolean
  noRightClick: boolean
  noDownload: boolean
}
