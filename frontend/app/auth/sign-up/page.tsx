'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signUp, signInWithGoogle } from '@/lib/actions/auth'
import {
  AuthShell,
  AuthField,
  AuthSubmit,
  AuthDivider,
  AuthError,
  GoogleButton,
} from '@/components/auth/auth-shell'

function SignUpPageContent() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const searchParams = useSearchParams()

  useEffect(() => {
    setMounted(true)
  }, [])

  const next = searchParams.get('next') ?? '/photos'
  const loginHref =
    mounted && next !== '/photos'
      ? `/auth/login?next=${encodeURIComponent(next)}`
      : '/auth/login'

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
    const result = await signInWithGoogle(next)
    if (result?.error) {
      setError(result.error)
      setGoogleLoading(false)
    }
  }

  if (success) {
    return (
      <AuthShell
        slip="Pending"
        title="Check your email"
        intro="We sent a confirmation link. Open it and your shelf is ready."
        footer={
          <>
            Wrong address?{' '}
            <Link
              href="/auth/sign-up"
              className="inline-block py-3 text-primary underline-offset-4 transition-colors hover:underline"
            >
              Start over
            </Link>
          </>
        }
      >
        <Link
          href={loginHref}
          className="inline-flex min-h-[52px] w-full items-center justify-center rounded-[2px] bg-primary px-6 font-mono text-[12px] uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to sign in
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      slip="New account"
      title="Start a shelf"
      intro="Free, and yours. No card, no limit on who joins."
      footer={
        <>
          Already have one?{' '}
          <Link
            href={loginHref}
            className="inline-block py-3 text-primary underline-offset-4 transition-colors hover:underline"
          >
            Sign in
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
          id="fullName"
          name="fullName"
          label="Name"
          type="text"
          autoComplete="name"
          placeholder="Meera Kapoor"
          required
        />
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
          autoComplete="new-password"
          placeholder="••••••••"
          minLength={8}
          required
          hint="8 characters minimum"
        />
        <div className="mt-2">
          <AuthSubmit pending={loading} disabled={loading || googleLoading}>
            Create account
          </AuthSubmit>
        </div>
      </form>
    </AuthShell>
  )
}

export default function SignUpPage() {
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
      <SignUpPageContent />
    </Suspense>
  )
}
