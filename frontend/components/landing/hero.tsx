'use client'

import Link from 'next/link'
import { Plate } from './plate'

/**
 * The hero.
 *
 * One thought, said once. The sheet of empty plates settles into place beside
 * it — unexposed, waiting. No stock photography, no feature list, no second
 * headline competing with the first.
 */

const SHEET = Array.from({ length: 9 })

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#1C1814]">
      <div className="mx-auto grid max-w-[1180px] items-center gap-14 px-6 pb-24 pt-36 sm:px-10 sm:pb-32 sm:pt-44 lg:grid-cols-[1fr_380px] lg:gap-24">
        <div>
          <h1 className="max-w-[15ch] font-serif text-[clamp(2.9rem,10vw,5.2rem)] leading-[0.95] tracking-[-0.025em] text-[#F5F0E8]">
            The day ends.
            <br />
            <span className="text-primary">The photos don&apos;t.</span>
          </h1>

          <p className="mt-8 max-w-[46ch] text-[16px] leading-relaxed text-[#F5F0E8]/60 sm:text-[17px]">
            Every photo from the day, from everyone who was there — and a way to
            turn them into something you keep.
          </p>

          <div className="mt-11 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/auth/sign-up"
              className="inline-flex min-h-[54px] items-center justify-center rounded-[2px] bg-primary px-8 font-mono text-[12px] uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start free
            </Link>
            <Link
              href="/join"
              className="inline-flex min-h-[54px] items-center justify-center px-2 font-mono text-[12px] uppercase tracking-[0.14em] text-[#F5F0E8]/50 transition-colors hover:text-[#F5F0E8] sm:px-6"
            >
              I have a code
            </Link>
          </div>
        </div>

        {/* The sheet — nine empty plates, settling in. */}
        <div className="mx-auto w-full max-w-[380px] lg:mx-0">
          <div className="grid grid-cols-3 gap-[3px]">
            {SHEET.map((_, i) => (
              <div
                key={i}
                className="settle"
                style={{ animationDelay: `${0.15 + i * 0.07}s` }}
              >
                <Plate ratio="1/1" tone="dark" />
              </div>
            ))}
          </div>
          <div className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-[#F5F0E8]/25">
            Unexposed
          </div>
        </div>
      </div>

      <style jsx>{`
        .settle {
          animation: settle 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes settle {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .settle {
            animation: none;
          }
        }
      `}</style>
    </section>
  )
}
