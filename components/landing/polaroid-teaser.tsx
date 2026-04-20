'use client'

import Link from 'next/link'
import { Camera, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PolaroidTeaser() {
  return (
    <section className="py-24 bg-darkroom text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 transform translate-x-1/2 pointer-events-none" />
      
      <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[10px] font-mono uppercase tracking-[0.2em]">
              <Camera className="w-3 h-3 text-primary" />
              <span>New Release</span>
            </div>
            
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight">
              One shot. <br />
              One memory. <br />
              One print.
            </h2>
            
            <p className="text-lg text-white/60 max-w-md font-sans leading-relaxed">
              Introducing the Folio Polaroid Studio. A simple, elegant way to turn any photo into a classic tangible print. Choose your frame, preview the results, and have it shipped to your door.
            </p>
            
            <div className="flex flex-wrap gap-6 pt-4">
              <Button asChild size="lg" className="bg-primary text-white hover:bg-primary/90 rounded-none h-14 px-8">
                <Link href="/polaroid">
                  Launch Studio
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-darkroom bg-muted flex items-center justify-center overflow-hidden">
                       <div className="w-full h-full bg-paper/20" />
                    </div>
                  ))}
                </div>
                <span className="text-sm font-mono text-white/40 italic">Classic prints start at ₹199</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            {/* Visual representation of polaroids flying/stacked */}
            <div className="grid grid-cols-2 gap-4 transform rotate-6 scale-90 md:scale-100">
               <div className="polaroid aspect-[4/5] bg-paper shadow-2xl p-2 pb-10 transform -rotate-12 translate-y-8 animate-in fade-in slide-in-from-bottom duration-1000">
                  <div className="w-full h-full bg-black/10" />
               </div>
               <div className="polaroid aspect-[4/5] bg-paper shadow-2xl p-2 pb-10 transform rotate-6 animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
                  <div className="w-full h-full bg-black/10" />
               </div>
               <div className="polaroid aspect-[4/5] bg-paper shadow-2xl p-2 pb-10 col-span-2 mx-auto w-2/3 -translate-y-12 -rotate-2 animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
                  <div className="w-full h-full bg-black/10 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-white/20" />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
