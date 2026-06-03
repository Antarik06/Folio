'use client'

import { useEffect, useRef, useState } from 'react'

const features = [
  {
    number: '01',
    headline: 'Upload everything. Keep the best.',
    description: 'Our AI sifts through hundreds of photos to find the ones that matter — the glances, the laughter, the quiet moments.',
  },
  {
    number: '02',
    headline: 'An album built in minutes, made to last.',
    description: 'Intelligently arranged. Beautifully composed. A narrative emerges from your collection.',
  },
  {
    number: '03',
    headline: 'Printed, bound, and at your door.',
    description: 'Premium paper. Archival inks. A physical object to hold, to gift, to remember by.',
  },
]

export function FeatureStrip() {
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
    <section ref={sectionRef} className="py-20 md:py-32 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
      {/* Desktop: Horizontal with vertical dividers */}
      <div className="hidden md:grid md:grid-cols-3 gap-0">
        {features.map((feature, index) => (
          <div
            key={feature.number}
            className={`relative px-8 lg:px-12 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: `${index * 150}ms` }}
          >
            {/* Vertical divider */}
            {index > 0 && (
              <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
            )}
            
            {/* Watermark number */}
            <span className="font-serif text-[80px] lg:text-[100px] text-border/60 absolute -top-4 left-4 select-none leading-none">
              {feature.number}
            </span>
            
            {/* Content */}
            <div className="relative pt-16">
              <h3 className="font-sans text-lg lg:text-xl text-foreground leading-snug">
                {feature.headline}
              </h3>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: Stacked with horizontal dividers */}
      <div className="md:hidden space-y-0">
        {features.map((feature, index) => (
          <div
            key={feature.number}
            className={`relative py-10 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: `${index * 150}ms` }}
          >
            {/* Horizontal divider */}
            {index > 0 && (
              <div className="absolute top-0 left-0 right-0 h-px bg-border" />
            )}
            
            {/* Watermark number */}
            <span className="font-serif text-[60px] text-border/60 absolute -top-2 right-0 select-none leading-none">
              {feature.number}
            </span>
            
            {/* Content */}
            <div className="relative pr-16">
              <h3 className="font-sans text-lg text-foreground leading-snug">
                {feature.headline}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
