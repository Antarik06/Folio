'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/actions/auth'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    const result = await signIn(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-md w-full mx-auto">
          <Link href="/" className="inline-block mb-12">
            <span className="font-serif text-2xl tracking-tight text-foreground">Folio</span>
          </Link>
          
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-3">
            Welcome back
          </h1>
          <p className="text-muted-foreground mb-10">
            Sign in to continue crafting your stories.
          </p>
          
          {error && (
            <div className="mb-6 p-4 bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm">
              {error}
            </div>
          )}
          
          <form action={handleSubmit} className="space-y-6">
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
                className="w-full px-4 py-3 bg-surface border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                placeholder="Your password"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-4 text-sm font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          
          <p className="mt-8 text-center text-muted-foreground text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/auth/sign-up" className="text-primary hover:text-primary/80 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
      
      {/* Right Panel - Visual */}
      <div className="hidden lg:flex w-1/2 bg-card items-center justify-center p-16">
        <div className="max-w-lg">
          <blockquote className="font-serif text-3xl text-foreground italic leading-relaxed">
            &ldquo;The best thing about a picture is that it never changes, even when the people in it do.&rdquo;
          </blockquote>
          <cite className="block mt-6 text-muted-foreground text-sm not-italic">
            — Andy Warhol
          </cite>
        </div>
      </div>
    </main>
  )
}
