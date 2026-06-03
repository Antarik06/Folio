'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Users, Share2, Sparkles, Check, Heart } from 'lucide-react'

// Dummy data for photos and who captured them (their perspective)
const CONTRIBUTORS = [
  { id: 'all', name: 'All Lenses', icon: Users },
  { id: 'me', name: 'My Lens', icon: Camera },
  { id: 'sarah', name: 'Sarah’s Lens', icon: Camera },
  { id: 'alex', name: 'Alex’s Lens', icon: Camera },
]

const PHOTO_DATABASE = [
  {
    id: 1,
    img: '/images/polaroid_collage.png',
    photographer: 'sarah',
    caption: 'Sarah captured: Bonfire setup at dusk',
    aspect: 'aspect-square',
    rotate: '-rotate-2',
  },
  {
    id: 2,
    img: '/images/open_photo_album.png',
    photographer: 'alex',
    caption: 'Alex captured: Winding road to Siena',
    aspect: 'aspect-[4/3]',
    rotate: 'rotate-1',
  },
  {
    id: 3,
    img: '/images/polaroid_collage.png',
    photographer: 'me',
    caption: 'My capture: Friends laughing by the water',
    aspect: 'aspect-[3/4]',
    rotate: '-rotate-1',
  },
  {
    id: 4,
    img: '/images/open_photo_album.png',
    photographer: 'sarah',
    caption: 'Sarah captured: Wildflowers in the valley',
    aspect: 'aspect-square',
    rotate: 'rotate-3',
  },
  {
    id: 5,
    img: '/images/polaroid_collage.png',
    photographer: 'me',
    caption: 'My capture: Golden hour shadows',
    aspect: 'aspect-[3/4]',
    rotate: '-rotate-3',
  },
  {
    id: 6,
    img: '/images/open_photo_album.png',
    photographer: 'alex',
    caption: 'Alex captured: The old brick cottage',
    aspect: 'aspect-[4/3]',
    rotate: 'rotate-2',
  },
]

export function EventHub() {
  const [selectedFilter, setSelectedFilter] = useState('all')

  const filteredPhotos = PHOTO_DATABASE.filter(
    (photo) => selectedFilter === 'all' || photo.photographer === selectedFilter
  )

  return (
    <section className="bg-darkroom text-[#F5F0E8] py-24 md:py-32 relative overflow-hidden film-grain">
      {/* Background decorations */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: Emotion and storytelling copy */}
          <div className="lg:col-span-5 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] text-[#F5F0E8]/80">
              <Heart className="w-3 h-3 text-primary animate-pulse" />
              <span>Collective Storytelling</span>
            </div>

            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-[#F5F0E8]">
              Every perspective, gathered.
            </h2>

            <p className="text-lg text-[#F5F0E8]/70 font-sans leading-relaxed text-balance">
              No more pleading in group chats for photos, and no more pixelated screenshot streams. Simply invite your friends to contribute to a shared camera roll. Everyone drops in what they captured, and you get to see the whole story through each other&apos;s eyes.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-sans text-sm font-semibold text-[#F5F0E8]">Gather Together</h4>
                  <p className="text-xs text-[#F5F0E8]/50">One simple link or QR code for all your friends to drop in photos. No sign-ups required for them.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Share2 className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-sans text-sm font-semibold text-[#F5F0E8]">Share the Digital Album</h4>
                  <p className="text-xs text-[#F5F0E8]/50">Instantly generate a beautiful digital flipbook that you can share with everyone in the circle.</p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <a 
                href="/events/create" 
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary hover:text-primary/80 transition-colors border-b border-primary/30 pb-1"
              >
                Start a shared camera roll →
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Shared-Lens Simulator */}
          <div className="lg:col-span-7 bg-[#252019] border border-white/5 p-6 md:p-8 shadow-2xl relative">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-8">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Shared Roll Demo</span>
                <h3 className="font-serif text-xl text-[#F5F0E8] mt-1">Weekend Cabin Trip</h3>
              </div>
              
              {/* Lenses Filter */}
              <div className="flex flex-wrap gap-2">
                {CONTRIBUTORS.map((contributor) => {
                  const Icon = contributor.icon
                  const isSelected = selectedFilter === contributor.id
                  return (
                    <button
                      key={contributor.id}
                      onClick={() => setSelectedFilter(contributor.id)}
                      className={`px-3 py-1.5 text-xs font-sans rounded-none transition-all duration-300 flex items-center gap-1.5 ${
                        isSelected 
                          ? 'bg-primary text-white font-medium shadow-md shadow-primary/20' 
                          : 'bg-white/5 text-[#F5F0E8]/70 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{contributor.name}</span>
                      {isSelected && <Check className="w-2.5 h-2.5 ml-0.5" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 min-h-[340px] items-start">
              <AnimatePresence mode="popLayout">
                {filteredPhotos.map((photo) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', damping: 22, stiffness: 120 }}
                    key={photo.id}
                    className={`bg-[#2c261f] p-2 pb-6 shadow-lg border border-white/5 relative group cursor-pointer hover:shadow-xl hover:border-white/10 ${photo.rotate} overflow-hidden`}
                  >
                    {/* Badge indicating photographer */}
                    <div className="absolute top-3 left-3 z-20">
                      <span className="bg-darkroom/90 text-[#F5F0E8] text-[8px] font-mono font-medium uppercase tracking-wider px-1.5 py-0.5 border border-white/5">
                        {photo.photographer === 'me' ? 'Me' : photo.photographer === 'sarah' ? 'Sarah' : 'Alex'}
                      </span>
                    </div>

                    <div className={`relative w-full ${photo.aspect} bg-black/20 overflow-hidden`}>
                      <Image
                        src={photo.img}
                        alt={photo.caption}
                        fill
                        sizes="200px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 film-grain pointer-events-none" />
                    </div>
                    
                    <p className="mt-2.5 font-mono text-[9px] text-[#F5F0E8]/40 leading-none truncate px-0.5">
                      {photo.caption}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Footer status */}
            <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-[#F5F0E8]/40">
              <span>Status: Collaborative Sync Active</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>{filteredPhotos.length} moments displayed</span>
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
