import { AlbumSpread } from '@/components/album-editor/types'

export interface MagazineTemplate {
  id: string
  name: string
  description: string
  thumbnail: string
  category: string
  spreads: AlbumSpread[]
}

export const MAGAZINE_TEMPLATES: MagazineTemplate[] = [
  {
    id: 'travel-minimalist',
    name: 'The Minimalist Traveler',
    category: 'Travel',
    description: 'Clean, spacious layout with a focus on single, impactful images and classic serif typography.',
    thumbnail: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop',
    spreads: [
      {
        id: 'tm-spread-1',
        isCover: true,
        background: '#FAF9F6',
        elements: [],
        front: {
          background: '#FAF9F6',
          elements: [
            {
              id: 'tm-cover-photo',
              type: 'image',
              src: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop',
              x: 0,
              y: 0,
              width: 700,
              height: 750,
              rotation: 0,
              zIndex: 1,
              fitMode: 'fill'
            },
            {
              id: 'tm-cover-title',
              type: 'text',
              text: 'THE ESCAPE',
              fontSize: 64,
              fontFamily: 'serif',
              fontWeight: 'bold',
              textAlign: 'center',
              fill: '#1A1A1A',
              x: 50,
              y: 800,
              width: 600,
              height: 80,
              zIndex: 2,
              rotation: 0
            }
          ]
        }
      },
      {
        id: 'tm-spread-2',
        background: '#FFFFFF',
        elements: [],
        front: {
          background: '#FFFFFF',
          elements: [
            {
              id: 'tm-p2-img',
              type: 'image',
              src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
              x: 50,
              y: 100,
              width: 600,
              height: 800,
              zIndex: 1,
              rotation: 0,
              fitMode: 'fill'
            }
          ]
        },
        back: {
          background: '#FFFFFF',
          elements: [
             {
              id: 'tm-p2-text',
              type: 'text',
              text: 'BEYOND THE HORIZON',
              fontSize: 48,
              fontFamily: 'serif',
              fontWeight: 'bold',
              textAlign: 'left',
              fill: '#000000',
              x: 80,
              y: 150,
              width: 500,
              height: 60,
              zIndex: 2,
              rotation: 0
            }
          ]
        }
      }
    ]
  },
  {
    id: 'travel-vintage',
    name: 'Vintage Wanderlust',
    category: 'Nostalgic',
    description: 'Warm tones, scrapbook-style overlapping elements, and handwritten-style typography for a nostalgic feel.',
    thumbnail: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800&auto=format&fit=crop',
    spreads: [
      {
        id: 'vw-spread-1',
        isCover: true,
        background: '#EDE6D9',
        elements: [],
        front: {
          background: '#EDE6D9',
          elements: [
             {
              id: 'vw-cover-photo',
              type: 'image',
              src: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1200&auto=format&fit=crop',
              x: 80,
              y: 100,
              width: 540,
              height: 640,
              rotation: -2,
              zIndex: 1,
              fitMode: 'fill',
              shadowBlur: 15,
              shadowColor: 'rgba(0,0,0,0.2)',
              shadowOpacity: 1
            },
            {
              id: 'vw-cover-title',
              type: 'text',
              text: 'Old World Charm',
              fontSize: 56,
              fontFamily: 'serif',
              fontWeight: 'bold',
              textAlign: 'center',
              fill: '#4A3728',
              x: 50,
              y: 780,
              width: 600,
              height: 80,
              zIndex: 2,
              rotation: 1
            }
          ]
        }
      }
    ]
  },
  {
    id: 'travel-modern',
    name: 'Urban Explorer',
    category: 'Modern',
    description: 'Bold, high-contrast urban layout with asymmetric grids and modern sans-serif fonts.',
    thumbnail: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=800&auto=format&fit=crop',
    spreads: [
      {
        id: 'ue-spread-1',
        isCover: true,
        background: '#121212',
        elements: [],
        front: {
          background: '#121212',
          elements: [
            {
              id: 'ue-cover-title',
              type: 'text',
              text: 'CITY',
              fontSize: 120,
              fontFamily: 'sans-serif',
              fontWeight: 'bold',
              textAlign: 'left',
              fill: '#FFFFFF',
              x: 50,
              y: 520,
              width: 600,
              height: 130,
              zIndex: 2,
              rotation: 0
            }
          ]
        }
      }
    ]
  }
]
