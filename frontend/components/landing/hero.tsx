'use client'

import Link from 'next/link'
import { PhotoScatter } from './photo-scatter'

/**
 * The hero.
 *
 * One thought, said once, beside a scatter of prints on the darkroom table —
 * the tilted, draggable stack carried over from the original hero, rebuilt on
 * the ink ground with empty frames.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#1C1814]">
      <div className="mx-auto grid max-w-[1180px] items-center gap-14 px-6 pb-24 pt-36 sm:px-10 sm:pb-32 sm:pt-44 lg:grid-cols-[1fr_460px] lg:gap-20">
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

        {/* Prints on the table — drag them around. */}
        <div className="w-full">
          <PhotoScatter />
        </div>
      </div>

    </section>
  )
}
