import Link from 'next/link'
import { Reveal } from './reveal'
import { CornerMarks } from '@/components/folio/marks'

/**
 * The pipeline stated once, then the ask.
 *
 * The three rooms above are the same three steps — this restates them as a
 * sequence so the structure lands before someone signs up. The numbering here
 * carries real order: nothing to design until photos exist, nothing to share
 * until something is designed.
 */

const STEPS = [
  {
    n: '01',
    title: 'Collect',
    body: 'Start an event, share the code. Everyone who was there adds their frames to one shelf.',
  },
  {
    n: '02',
    title: 'Make',
    body: 'Pick a style and lay it out, or hand it to an artist. Ends as an album, prints, or a card.',
  },
  {
    n: '03',
    title: 'Send',
    body: 'Publish what you choose to a page of your own, and send the card to whoever it was for.',
  },
]

export function Closing() {
  return (
    <>
      {/* ── The pipeline ──────────────────────────────────────────────── */}
      <section className="border-t-2 border-border bg-background">
        <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 sm:py-24">
          <Reveal>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b-2 border-border pb-4">
              <h2 className="font-serif text-[clamp(1.6rem,5vw,2.4rem)] text-foreground">
                Three rooms, one pipeline
              </h2>
              <span className="ml-auto hidden font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft sm:block">
                Photos → Create → Profile
              </span>
            </div>
          </Reveal>

          <ol className="mt-8 grid gap-0 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((step, i) => (
              <Reveal as="li" key={step.n} delay={0.06 * i}>
                <div className="border-b border-border py-5 sm:border-b-0 sm:border-t-2 sm:border-t-primary sm:py-0 sm:pt-5">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[13px] font-semibold text-primary">
                      {step.n}
                    </span>
                    <h3 className="font-serif text-2xl text-foreground">{step.title}</h3>
                  </div>
                  <p className="mt-2 max-w-[38ch] text-[14px] leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── The ask ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t-2 border-border bg-[#1C1814]">
        <div className="hidden sm:block">
          <CornerMarks inset={20} opacity={0.25} />
        </div>

        <div className="mx-auto max-w-[1280px] px-5 py-20 text-center sm:px-8 sm:py-28">
          <Reveal>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary sm:text-[11px]">
              Free to start · no card
            </div>
            <h2 className="mx-auto mt-5 max-w-[18ch] font-serif text-[clamp(2.2rem,8vw,4rem)] leading-[1.02] tracking-[-0.02em] text-[#F5F0E8]">
              The day is over. The photos aren&apos;t.
            </h2>
            <p className="mx-auto mt-5 max-w-[52ch] text-[15px] leading-relaxed text-[#F5F0E8]/65">
              Put them somewhere they&apos;ll still be in ten years — and make
              something out of them while everyone still remembers.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/sign-up"
                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-[2px] bg-primary px-8 font-mono text-[12px] uppercase tracking-[0.12em] text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
              >
                Create your first shelf
              </Link>
              <Link
                href="/join"
                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-[2px] border border-[#F5F0E8]/25 px-8 font-mono text-[12px] uppercase tracking-[0.12em] text-[#F5F0E8]/80 transition-colors hover:border-[#F5F0E8]/60 hover:text-[#F5F0E8] sm:w-auto"
              >
                Join with a code
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="bg-[#1C1814] pb-10 pt-2 text-[#F5F0E8] safe-bottom">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="grid gap-8 border-t border-[#F5F0E8]/12 pt-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Link
                href="/"
                aria-label="Folio home"
                className="inline-flex min-h-[44px] items-center gap-2 font-serif text-2xl text-[#F5F0E8]"
              >
                Folio
                <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary" />
              </Link>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-[#F5F0E8]/50">
                A darkroom for everyone&apos;s photos. Collect the day, make
                something out of it, send it on.
              </p>
            </div>

            <nav aria-label="Product">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#F5F0E8]/40">
                Product
              </h3>
              <ul className="mt-2">
                {[
                  ['Photos', '#photos'],
                  ['Create', '#create'],
                  ['Profile', '#profile'],
                  ['Join an event', '/join'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="inline-flex min-h-[44px] items-center text-[13px] text-[#F5F0E8]/65 transition-colors hover:text-[#F5F0E8]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Account">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#F5F0E8]/40">
                Account
              </h3>
              <ul className="mt-2">
                {[
                  ['Sign in', '/auth/login'],
                  ['Create an account', '/auth/sign-up'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="inline-flex min-h-[44px] items-center text-[13px] text-[#F5F0E8]/65 transition-colors hover:text-[#F5F0E8]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#F5F0E8]/12 pt-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/35">
              © 2026 Folio · Handcrafted with care
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/35">
              Editorial Darkroom — Vol. 01
            </span>
          </div>
        </div>
      </footer>
    </>
  )
}
