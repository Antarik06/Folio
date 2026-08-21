import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata = {
  title: 'Sign-in failed — Folio',
}

/**
 * Where auth/callback sends a failed code exchange.
 *
 * The callback route has always redirected here on failure, but the page did
 * not exist — so a Google sign-in that failed landed the user on a 404 with no
 * way back.
 */
export default function AuthErrorPage() {
  return (
    <AuthShell
      slip="Failed"
      title="That didn't go through"
      intro="The sign-in link expired or was already used. Starting again usually fixes it."
      footer={
        <>
          Need an account?{' '}
          <Link
            href="/auth/sign-up"
            className="inline-block py-3 text-primary underline-offset-4 transition-colors hover:underline"
          >
            Make one
          </Link>
        </>
      }
    >
      <Link
        href="/auth/login"
        className="inline-flex min-h-[52px] w-full items-center justify-center rounded-[2px] bg-primary px-6 font-mono text-[12px] uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Try again
      </Link>
    </AuthShell>
  )
}
