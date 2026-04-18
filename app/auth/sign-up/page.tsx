'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp, signInWithGoogle } from '@/lib/actions/auth'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

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

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError(null)
    const result = await signInWithGoogle()
    if (result?.error) {
      setError(result.error)
      setGoogleLoading(false)
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

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-surface border border-border text-foreground py-3.5 text-sm font-sans hover:bg-card hover:border-primary/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {googleLoading ? (
              <span className="w-[18px] h-[18px] border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-xs uppercase tracking-widest text-muted-foreground">
                or
              </span>
            </div>
          </div>
          
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
              disabled={loading || googleLoading}
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
