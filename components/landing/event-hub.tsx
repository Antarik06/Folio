'use client'

import { useEffect, useRef, useState } from 'react'

export function EventHub() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section 
      ref={sectionRef}
      className="bg-darkroom text-paper py-24 md:py-32 relative overflow-hidden film-grain"
    >
      <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-12 md:gap-20">
          {/* Left: Scattered photos collage */}
          <div 
            className={`md:w-1/2 relative h-64 md:h-96 transition-all duration-1000 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Background scattered photos - desaturated */}
            <div className="absolute top-4 left-8 w-24 h-20 bg-pencil/30 -rotate-6 grayscale" />
            <div className="absolute top-12 right-12 w-20 h-16 bg-pencil/25 rotate-3 grayscale" />
            <div className="absolute bottom-8 left-4 w-28 h-20 bg-pencil/35 rotate-6 grayscale" />
            <div className="absolute bottom-16 right-8 w-24 h-18 bg-pencil/20 -rotate-3 grayscale" />
            <div className="absolute top-20 left-20 w-20 h-16 bg-pencil/30 rotate-2 grayscale" />
            
            {/* Center highlighted photo - warm color */}
            <div 
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-28 bg-terracotta/60 border border-paper/20 transition-all duration-1000 delay-500 ${
                isVisible ? 'scale-100 rotate-0' : 'scale-90 rotate-12'
              }`}
            >
              <div className="absolute inset-3 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full bg-paper/80 mx-auto mb-2" />
                  <div className="w-12 h-1 bg-paper/40 mx-auto" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Right: Text content */}
          <div 
            className={`md:w-1/2 transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="font-serif text-4xl md:text-5xl leading-tight">
              Every photo finds its person.
            </h2>
            
            <p className="mt-6 text-base text-paper/70 leading-relaxed max-w-md">
              Invite your guests. They upload. You each get the photos of yourself — sorted by face, privately. No more scrolling through albums looking for yourself.
            </p>
            
            <div className="mt-10">
              <a 
                href="#" 
                className="text-secondary hover:text-secondary/80 transition-colors underline underline-offset-4 decoration-secondary/50 hover:decoration-secondary"
              >
                Create an event
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Horizontal scroll photos at top */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-48 overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-6 py-6 w-max">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className={`w-32 h-36 shrink-0 border border-paper/20 ${
                i === 2 ? 'bg-terracotta/60' : 'bg-pencil/30 grayscale'
              } ${
                [0, 3].includes(i) ? '-rotate-2' : [1, 4].includes(i) ? 'rotate-2' : 'rotate-0'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
