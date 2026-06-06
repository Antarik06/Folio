'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-md border-b border-border/40 transition-all duration-300">
        <div className="px-6 md:px-12 lg:px-20 py-5 flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <a href="/" className="font-serif text-2xl text-foreground flex items-center gap-1 group">
            <span>Folio</span>
            <span className="w-2 h-2 rounded-full bg-primary transition-all duration-500 group-hover:scale-150 group-hover:bg-secondary" />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-12 font-sans tracking-wide">
            <a href="#how-it-works" className="relative text-sm text-muted-foreground hover:text-foreground transition-colors py-1 group">
              How it works
              <span className="absolute bottom-0 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
            <a href="#products" className="relative text-sm text-muted-foreground hover:text-foreground transition-colors py-1 group">
              Products
              <span className="absolute bottom-0 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
            <a href="#pricing" className="relative text-sm text-muted-foreground hover:text-foreground transition-colors py-1 group">
              Pricing
              <span className="absolute bottom-0 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
            <Link href="/join" className="relative text-sm text-muted-foreground hover:text-foreground transition-colors py-1 group">
              Join
              <span className="absolute bottom-0 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-6">
            <ThemeToggle />
            <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link 
              href="/auth/login" 
              className="bg-primary text-primary-foreground px-6 py-2.5 text-xs font-mono uppercase tracking-[0.15em] transition-all duration-300 hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-[1px] active:translate-y-0"
            >
              Get started
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 flex flex-col items-center justify-center gap-1.5"
              aria-label="Toggle menu"
            >
              <span className={`w-5 h-px bg-foreground transition-transform ${isMenuOpen ? 'rotate-45 translate-y-1' : ''}`} />
              <span className={`w-5 h-px bg-foreground transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`w-5 h-px bg-foreground transition-transform ${isMenuOpen ? '-rotate-45 -translate-y-1' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div 
        className={`fixed inset-0 z-40 bg-background transition-all duration-300 md:hidden ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="pt-24 px-6 flex flex-col gap-8">
          <a 
            href="#how-it-works" 
            onClick={() => setIsMenuOpen(false)}
            className="font-serif text-3xl text-foreground"
          >
            How it works
          </a>
          <a 
            href="#products" 
            onClick={() => setIsMenuOpen(false)}
            className="font-serif text-3xl text-foreground"
          >
            Products
          </a>
          <a 
            href="#pricing" 
            onClick={() => setIsMenuOpen(false)}
            className="font-serif text-3xl text-foreground"
          >
            Pricing
          </a>
          <Link 
            href="/join" 
            onClick={() => setIsMenuOpen(false)}
            className="font-serif text-3xl text-foreground"
          >
            Join
          </Link>
          
          <div className="h-px bg-border my-4" />
          
          <Link 
            href="/auth/login" 
            className="text-lg text-muted-foreground"
          >
            Sign in
          </Link>
          <Link 
            href="/auth/login" 
            className="bg-primary text-primary-foreground py-4 text-center text-sm uppercase tracking-widest"
          >
            Get started
          </Link>
        </div>
      </div>
    </>
  )
}
