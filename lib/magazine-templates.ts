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

// Additional premium templates
export const EXTENDED_TEMPLATES: MagazineTemplate[] = [
  {
    id: 'wedding-eternal',
    name: 'Eternal Romance',
    category: 'Wedding',
    description: 'Soft blush palettes, romantic serif typography, and full-page imagery for your most cherished day.',
    thumbnail: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop',
    spreads: []
  },
  {
    id: 'fashion-monochrome',
    name: 'Noir Editorial',
    category: 'Fashion',
    description: 'High-contrast monochrome layout with bold asymmetric grids and a sharp editorial eye.',
    thumbnail: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop',
    spreads: []
  },
  {
    id: 'baby-tender',
    name: 'Tender Moments',
    category: 'Birthday',
    description: 'Soft pastels, warm storytelling layouts, and playful compositions for little ones.',
    thumbnail: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=800&auto=format&fit=crop',
    spreads: []
  },
  {
    id: 'portfolio-clean',
    name: 'Clean Canvas',
    category: 'Portfolio',
    description: 'A pristine, gallery-style layout that puts your work at the center of every spread.',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
    spreads: []
  },
  {
    id: 'luxury-gold',
    name: 'Gilded Moments',
    category: 'Luxury',
    description: 'Gold accents, deep blacks, and opulent spacing for events that demand the finest presentation.',
    thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=800&auto=format&fit=crop',
    spreads: []
  }
]

export const ALL_MAGAZINE_TEMPLATES: MagazineTemplate[] = [...MAGAZINE_TEMPLATES, ...EXTENDED_TEMPLATES]

// ─── Adventure Template (Highest Selling) ────────────────────────────────────
export const ADVENTURE_TEMPLATE: MagazineTemplate = {
  id: 'adventure-travel',
  name: 'Adventure',
  category: 'Travel',
  description: 'Bold editorial travel magazine with full-bleed adventure photography, expedition features, and dynamic layouts. The #1 bestselling travel template on the platform.',
  thumbnail: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop',
  spreads: []
}

// Pages for the Adventure template (10 pages, matching the screenshot layout)
export const ADVENTURE_PAGES = [
  {
    id: 'adv-cover',
    label: 'Cover',
    type: 'cover',
    bg: '#F4F1EC',
    photo: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=900&auto=format&fit=crop',
    title: 'ADVENTURE',
    subtitle: 'TRAVEL MAGAZINE',
    issue: 'ISSUE 2025',
    tags: ['EXPLORE NATURE', 'FAMILY CAMPING', 'THE LOCATION', '25'],
    footer: 'FAMILY GLAMPING / TIPS FOR TRAVEL / ADVENTURE AWAITS / FESTIVALS FOOD TRUCK',
  },
  {
    id: 'adv-contents',
    label: 'Contents',
    type: 'contents',
    bg: '#FFFFFF',
    photo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop',
    title: 'Contents',
    items: ['04 Editor\'s Note', '08 Explore Nature', '14 Family Camping', '20 Top 25 Locations', '26 Expedition Stories', '32 Glamping with Kids', '38 Tips For Travel', '44 Adventure Awaits'],
  },
  {
    id: 'adv-editors',
    label: "Editor's Note",
    type: 'editors-note',
    bg: '#FFFFFF',
    photo: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=600&auto=format&fit=crop',
    title: "Editor's Note",
    subtitle: 'Experience True Adventure',
    body: 'Welcome to this special issue dedicated to the world\'s most breathtaking adventures. From towering mountain peaks to winding coastal roads, we\'ve curated the finest travel stories to inspire your next journey. Whether you\'re a seasoned explorer or a first-time adventurer, this issue is your guide to the extraordinary.',
  },
  {
    id: 'adv-expedition',
    label: 'Expedition',
    type: 'feature-full',
    bg: '#1A1A1A',
    photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=900&auto=format&fit=crop',
    title: '26 EXPEDITION',
    subtitle: 'Into the Unknown',
    body: 'Our team embarked on a 26-day expedition through the most remote corners of the world. Follow along as we document every challenge, triumph, and breathtaking vista along the way.',
    dark: true,
  },
  {
    id: 'adv-glamping',
    label: 'Glamping',
    type: 'feature-split',
    bg: '#F9F7F4',
    photo: 'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?q=80&w=700&auto=format&fit=crop',
    photo2: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=500&auto=format&fit=crop',
    title: 'Glamping with Kids',
    subtitle: 'Where Luxury Meets the Wild',
    body: 'Discover the art of glamorous camping — where luxury canvas tents, gourmet meals, and unforgettable family memories come together under the open sky.',
  },
  {
    id: 'adv-landscape',
    label: 'Landscape',
    type: 'full-bleed',
    bg: '#0D1117',
    photo: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=1200&auto=format&fit=crop',
    title: 'WHERE THE EARTH BREATHES',
    subtitle: 'Remote wilderness photography by our field team',
    dark: true,
  },
  {
    id: 'adv-tips',
    label: 'Travel Tips',
    type: 'tips-grid',
    bg: '#FFFFFF',
    photo: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=600&auto=format&fit=crop',
    title: 'Tips for Travel',
    tips: ['Pack light, travel far', 'Golden hour photography', 'Local cuisine first', 'Digital detox recommended', 'Travel insurance essential', 'Learn key local phrases'],
  },
  {
    id: 'adv-portrait',
    label: 'Portrait',
    type: 'portrait-editorial',
    bg: '#F4F1EC',
    photo: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=700&auto=format&fit=crop',
    title: 'The Spirit of Adventure',
    subtitle: 'Portraits from the field',
    body: 'Behind every great adventure is a story of courage, curiosity, and the unquenchable thirst for discovery. Meet the explorers who live for the next horizon.',
  },
  {
    id: 'adv-awaits',
    label: 'Adventure Awaits',
    type: 'closing-feature',
    bg: '#1C1814',
    photo: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=900&auto=format&fit=crop',
    title: 'Adventure Awaits',
    subtitle: 'Your next great story begins here',
    body: 'The mountains are calling. The oceans are waiting. The forests are whispering your name. Every path not yet walked is an adventure waiting to happen.',
    dark: true,
  },
  {
    id: 'adv-back',
    label: 'Back Cover',
    type: 'back-cover',
    bg: '#2C3E50',
    photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=900&auto=format&fit=crop',
    title: 'ADVENTURE',
    subtitle: 'Travel Magazine · Issue 2025',
    dark: true,
  },
]
