'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn, signInWithGoogle } from '@/lib/actions/auth'
import {
  AuthShell,
  AuthField,
  AuthSubmit,
  AuthDivider,
  AuthError,
  GoogleButton,
} from '@/components/auth/auth-shell'

function LoginPageContent() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    setMounted(true)
  }, [])

  const next = searchParams.get('next') ?? '/photos'
  const signUpHref =
    mounted && next !== '/photos'
      ? `/auth/sign-up?next=${encodeURIComponent(next)}`
      : '/auth/sign-up'

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signIn(formData, next)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError(null)
    const result = await signInWithGoogle(next)
    if (result?.error) {
      setError(result.error)
      setGoogleLoading(false)
    }
  }

  return (
    <AuthShell
      slip="Access"
      title="Welcome back"
      intro="Your shelf is where you left it."
      footer={
        <>
          No account yet?{' '}
          <Link
            href={signUpHref}
            className="inline-block py-3 text-primary underline-offset-4 transition-colors hover:underline"
          >
            Make one
          </Link>
        </>
      }
    >
      {error ? <AuthError>{error}</AuthError> : null}

      <GoogleButton
        onClick={handleGoogleSignIn}
        loading={googleLoading}
        disabled={googleLoading || loading}
        label="Continue with Google"
      />

      <AuthDivider />

      <form action={handleSubmit} className="flex flex-col gap-4">
        <AuthField
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <AuthField
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
        <div className="mt-2">
          <AuthSubmit pending={loading} disabled={loading || googleLoading}>
            Sign in
          </AuthSubmit>
        </div>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] items-center justify-center bg-[#1C1814]">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#F5F0E8]/40">
            Loading…
          </span>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
