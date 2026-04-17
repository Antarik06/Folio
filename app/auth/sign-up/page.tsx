'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    const result = await signUp(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-8">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-8 border border-secondary flex items-center justify-center">
            <svg className="w-8 h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-serif text-4xl text-foreground mb-4">Check your email</h1>
          <p className="text-muted-foreground mb-8">
            We&apos;ve sent you a confirmation link. Click it to activate your account and start creating.
          </p>
          <Link 
            href="/auth/login"
            className="inline-block bg-primary text-primary-foreground px-8 py-4 text-sm font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors"
          >
            Back to login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex">
      {/* Left Panel - Visual */}
      <div className="hidden lg:flex w-1/2 bg-card items-center justify-center p-16">
        <div className="max-w-lg">
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <span className="text-5xl font-serif text-border">01</span>
              <div>
                <h3 className="font-serif text-xl text-foreground mb-1">Upload</h3>
                <p className="text-muted-foreground text-sm">Share your photos from any device</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-5xl font-serif text-border">02</span>
              <div>
                <h3 className="font-serif text-xl text-foreground mb-1">Curate</h3>
                <p className="text-muted-foreground text-sm">AI selects your best moments</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-5xl font-serif text-border">03</span>
              <div>
                <h3 className="font-serif text-xl text-foreground mb-1">Design</h3>
                <p className="text-muted-foreground text-sm">Customize your album layout</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-5xl font-serif text-border">04</span>
              <div>
                <h3 className="font-serif text-xl text-foreground mb-1">Receive</h3>
                <p className="text-muted-foreground text-sm">A book delivered to your door</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-md w-full mx-auto">
          <Link href="/" className="inline-block mb-12">
            <span className="font-serif text-2xl tracking-tight text-foreground">Folio</span>
          </Link>
          
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-3">
            Start your story
          </h1>
          <p className="text-muted-foreground mb-10">
            Create an account to begin crafting beautiful photo books.
          </p>
          
          {error && (
            <div className="mb-6 p-4 bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm">
              {error}
            </div>
          )}
          
          <form action={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-sans uppercase tracking-wider text-muted-foreground mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="w-full px-4 py-3 bg-surface border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                placeholder="Your name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-sans uppercase tracking-wider text-muted-foreground mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 bg-surface border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-sans uppercase tracking-wider text-muted-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full px-4 py-3 bg-surface border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                placeholder="Min. 8 characters"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-4 text-sm font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          
          <p className="mt-8 text-center text-muted-foreground text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
