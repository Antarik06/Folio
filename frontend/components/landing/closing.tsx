import Link from 'next/link'
import { Reveal } from './reveal'

/**
 * The ask, and a footer that stays out of the way.
 *
 * No pricing table, no testimonials, no third restatement of the pipeline —
 * the three rooms already made the case. One line, one button.
 */
export function Closing() {
  return (
    <>
      <section className="border-t border-border bg-[#1C1814]">
        <div className="mx-auto max-w-[1180px] px-6 py-28 text-center sm:px-10 sm:py-36">
          <Reveal>
            <h2 className="mx-auto max-w-[15ch] font-serif text-[clamp(2.4rem,8vw,4.2rem)] leading-[1] tracking-[-0.02em] text-[#F5F0E8]">
              Start with one day.
            </h2>

            <div className="mt-11">
              <Link
                href="/auth/sign-up"
                className="inline-flex min-h-[54px] items-center justify-center rounded-[2px] bg-primary px-9 font-mono text-[12px] uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start free
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="bg-[#1C1814] pb-10 text-[#F5F0E8] safe-bottom">
        <div className="mx-auto max-w-[1180px] px-6 sm:px-10">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-[#F5F0E8]/10 pt-7">
            <Link
              href="/"
              aria-label="Folio home"
              className="inline-flex min-h-[44px] items-center gap-2 font-serif text-xl text-[#F5F0E8]"
            >
              Folio
              <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary" />
            </Link>

            <nav aria-label="Footer" className="-mx-3 flex flex-wrap items-center">
              {[
                ['Photos', '#photos'],
                ['Create', '#create'],
                ['Profile', '#profile'],
                ['Join', '/join'],
                ['Sign in', '/auth/login'],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="inline-flex min-h-[44px] items-center px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F5F0E8]/45 transition-colors hover:text-[#F5F0E8]"
                >
                  {label}
                </Link>
              ))}
            </nav>

            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#F5F0E8]/25">
              © 2026 Folio
            </span>
          </div>
        </div>
      </footer>
    </>
  )
}
