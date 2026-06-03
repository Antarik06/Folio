'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="min-h-screen relative">
      <div className="hidden md:flex h-screen">
        <div className="w-[60%] flex flex-col justify-center px-12 lg:px-20">
          <h1
            className={`font-serif text-6xl lg:text-7xl xl:text-[80px] leading-[1.1] text-foreground tracking-tight max-w-2xl transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            Some moments deserve more than a screen.
          </h1>

          <p
            className={`mt-8 text-lg text-muted-foreground max-w-md transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            Upload your photos. We&apos;ll build the book.
          </p>

          <div
            className={`mt-12 flex items-center gap-6 transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            <Link href="/auth/login" className="bg-primary text-primary-foreground px-8 py-4 text-sm font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors block text-center">
              Begin
            </Link>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              See how it works
            </a>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="w-px bg-border self-stretch my-20" />

        {/* Right Side - Photo Book Image */}
        <div className="w-[40%] flex items-center justify-center p-8 lg:p-12 relative overflow-hidden">
          <div
            className={`relative w-full max-w-lg transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 rotate-[2deg] scale-100' : 'opacity-0 rotate-0 scale-95'
              }`}
          >
            {/* Main image */}
            <div className="relative aspect-[4/5] overflow-hidden border border-border">
              <Image
                src="/images/hero-book.jpg"
                alt="Beautiful photo album laying open on linen fabric"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 film-grain pointer-events-none" />
            </div>

            {/* Floating scattered photos behind */}
            <div className="absolute -top-6 -right-6 w-20 h-16 bg-surface border border-border rotate-12 opacity-60" />
            <div className="absolute -bottom-4 -left-4 w-16 h-12 bg-surface border border-border -rotate-6 opacity-50" />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen flex flex-col pt-20">
        {/* Image First on Mobile */}
        <div
          className={`w-full aspect-[4/3] relative overflow-hidden transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <Image
            src="/images/hero-book.jpg"
            alt="Beautiful photo album laying open on linen fabric"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 film-grain pointer-events-none" />
        </div>

        {/* Typography Below */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12">
          <h1
            className={`font-serif text-[40px] leading-[1.15] text-foreground tracking-tight transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
          >
            Some moments deserve more than a screen.
          </h1>

          <p
            className={`mt-6 text-base text-muted-foreground transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
          >
            Upload your photos. We&apos;ll build the book.
          </p>

          <div
            className={`mt-10 flex flex-col gap-4 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
          >
            <Link href="/auth/login" className="w-full text-center bg-primary text-primary-foreground py-4 text-sm font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors block">
              Begin
            </Link>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center">
              See how it works
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
