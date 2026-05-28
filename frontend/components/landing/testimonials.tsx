'use client'

import { useEffect, useRef, useState } from 'react'

const testimonials = [
  {
    quote: "I uploaded 400 photos from our wedding. An hour later, I had an album that made me cry. The AI picked moments I didn't even remember happening.",
    author: "Priya M.",
    event: "Wedding, Mumbai",
  },
  {
    quote: "We use Folio for every family trip now. Each person gets their own album with photos of themselves — my kids love flipping through their personal copies.",
    author: "Rahul S.",
    event: "Family travels, Delhi",
  },
  {
    quote: "The printed quality is exceptional. It doesn't feel like a photo book — it feels like something from an independent bookshop.",
    author: "Aisha K.",
    event: "Birthday celebration, Bangalore",
  },
]

export function Testimonials() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
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

  useEffect(() => {
    if (!isVisible) return
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [isVisible])

  return (
    <section ref={sectionRef} className="py-20 md:py-32 px-6 md:px-12 lg:px-20 bg-surface">
      <div className="max-w-4xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-12 text-center">
          Stories from our community
        </p>
        
        {/* Testimonial display */}
        <div className="relative min-h-[280px] md:min-h-[220px]">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-700 ${
                activeIndex === index 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4 pointer-events-none'
              } ${isVisible ? '' : 'opacity-0'}`}
            >
              <blockquote className="font-serif text-2xl md:text-3xl lg:text-4xl text-foreground leading-relaxed text-center italic">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              
              <div className="mt-8 text-center">
                <p className="font-sans text-sm text-foreground">
                  {testimonial.author}
                </p>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  {testimonial.event}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Dots navigation */}
        <div className="flex justify-center gap-3 mt-12">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                activeIndex === index ? 'bg-primary' : 'bg-border'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
