import type { Metadata } from 'next'
import { LandingNav } from '@/components/landing/nav'
import { Hero } from '@/components/landing/hero'
import { RoomPhotos } from '@/components/landing/room-photos'
import { RoomCreate } from '@/components/landing/room-create'
import { RoomProfile } from '@/components/landing/room-profile'
import { Closing } from '@/components/landing/closing'

export const metadata: Metadata = {
  title: 'Folio — everyone’s photos, one darkroom',
  description:
    'Collect every frame from a day — yours and everyone else’s. Turn them into an album, prints, or a card worth sending. Private by default.',
}

/**
 * The landing page, structured as the app is: a darkroom hero, then the three
 * rooms in pipeline order — Photos, Create, Profile — then the ask.
 *
 * Everything below the nav and the two interactive pieces (the developing
 * contact sheet, the cycling occasion card) is a server component, so the page
 * ships almost no JavaScript for what is mostly reading.
 */
export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-background">
      <LandingNav />
      <Hero />
      <RoomPhotos />
      <RoomCreate />
      <RoomProfile />
      <Closing />
    </main>
  )
}
