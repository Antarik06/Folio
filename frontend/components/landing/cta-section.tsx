'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export function CTASection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section 
      ref={sectionRef}
      className="py-24 md:py-40 px-6 md:px-12 lg:px-20 relative overflow-hidden"
    >
      {/* Decorative scattered photos background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-12 left-[10%] w-16 h-12 bg-border/30 -rotate-6" />
        <div className="absolute top-24 right-[15%] w-20 h-14 bg-border/20 rotate-3" />
        <div className="absolute bottom-20 left-[20%] w-14 h-10 bg-border/25 rotate-6" />
        <div className="absolute bottom-32 right-[25%] w-18 h-12 bg-border/30 -rotate-3" />
      </div>
      
      <div 
        className={`max-w-3xl mx-auto text-center relative transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight">
          Your story deserves to be held.
        </h2>
        
        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
          Start building your first album today. It takes five minutes to upload, 
          and the AI handles the rest.
        </p>
        
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/login" className="block text-center w-full sm:w-auto bg-primary text-primary-foreground px-10 py-4 text-sm uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors">
            Create your album
          </Link>
          
          <a 
            href="#" 
            className="w-full sm:w-auto text-center py-4 text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            See example albums
          </a>
        </div>
        
        {/* Trust indicator */}
        <p className="mt-16 font-mono text-xs text-muted-foreground/60">
          Trusted by 12,000+ families · 50,000+ albums created
        </p>
      </div>
    </section>
  )
}
