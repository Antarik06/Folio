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
    thumbnail: 'https://images.unsplash.com/photo-1544605151-6d7e6717a61d?q=80&w=800&auto=format&fit=crop',
    spreads: [
      {
        id: 'spread-cover',
        isCover: true,
        background: '#FAF9F6',
        elements: [],
        front: {
          background: '#FAF9F6',
          elements: [
            {
              id: 't-cover-photo',
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
              id: 't-cover-title',
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
            },
            {
              id: 't-cover-sub',
              type: 'text',
              text: 'ISSUE NO. 01 — WANDERLUST',
              fontSize: 14,
              fontFamily: 'sans-serif',
              fontWeight: 'normal',
              textAlign: 'center',
              fill: '#666666',
              x: 50,
              y: 890,
              width: 600,
              height: 20,
              zIndex: 3,
              rotation: 0,
              letterSpacing: 2
            }
          ]
        }
      },
      {
        id: 'spread-1',
        background: '#FFFFFF',
        elements: [],
        front: {
          background: '#FFFFFF',
          elements: [
            {
              id: 't-p1-img',
              type: 'image',
              src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
              x: 50,
              y: 50,
              width: 600,
              height: 450,
              zIndex: 1,
              rotation: 0
            },
            {
              id: 't-p1-title',
              type: 'text',
              text: 'Morning Light',
              fontSize: 32,
              fontFamily: 'serif',
              fontWeight: 'bold',
              fill: '#1A1A1A',
              x: 50,
              y: 530,
              width: 600,
              height: 40,
              zIndex: 2,
              rotation: 0,
              textAlign: 'left'
            },
            {
              id: 't-p1-body',
              type: 'text',
              text: 'The sun broke over the horizon, casting long shadows across the white sands. A perfect beginning to an endless journey. Every wave told a story of the ocean\'s deep secrets.',
              fontSize: 16,
              fontFamily: 'sans-serif',
              fontWeight: 'normal',
              fill: '#444444',
              x: 50,
              y: 580,
              width: 500,
              height: 120,
              zIndex: 3,
              rotation: 0,
              textAlign: 'left',
              lineHeight: 1.6
            }
          ]
        },
        back: {
          background: '#FFFFFF',
          elements: [
            {
              id: 't-p2-img',
              type: 'image',
              src: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1200&auto=format&fit=crop',
              x: 50,
              y: 100,
              width: 600,
              height: 800,
              zIndex: 1,
              rotation: 0,
              fitMode: 'fill'
            }
          ]
        }
      }
    ]
  },
  {
    id: 'travel-vintage',
    name: 'Vintage Wanderlust',
    category: 'Travel',
    description: 'Warm tones, scrapbook-style overlapping elements, and handwritten-style typography for a nostalgic feel.',
    thumbnail: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800&auto=format&fit=crop',
    spreads: [
      {
        id: 'v-cover',
        isCover: true,
        background: '#EDE6D9',
        elements: [],
        front: {
          background: '#EDE6D9',
          elements: [
             {
              id: 'v-cover-photo',
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
              id: 'v-cover-title',
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
    category: 'Travel',
    description: 'Bold, high-contrast urban layout with asymmetric grids and modern sans-serif fonts.',
    thumbnail: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=800&auto=format&fit=crop',
    spreads: [
      {
        id: 'u-cover',
        isCover: true,
        background: '#121212',
        elements: [],
        front: {
          background: '#121212',
          elements: [
            {
              id: 'u-cover-photo',
              type: 'image',
              src: 'https://images.unsplash.com/photo-1449156006000-bc10842247f0?q=80&w=1200&auto=format&fit=crop',
              x: 50,
              y: 50,
              width: 600,
              height: 500,
              rotation: 0,
              zIndex: 1,
              fitMode: 'fill'
            },
            {
              id: 'u-cover-title',
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
            },
            {
              id: 'u-cover-title-2',
              type: 'text',
              text: 'BRIGHTS',
              fontSize: 120,
              fontFamily: 'sans-serif',
              fontWeight: 'bold',
              textAlign: 'left',
              fill: '#FF3B30',
              x: 50,
              y: 630,
              width: 600,
              height: 130,
              zIndex: 3,
              rotation: 0
            }
          ]
        }
      }
    ]
  }
]
