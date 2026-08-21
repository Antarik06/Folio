'use client'

import React from 'react'
import Link from 'next/link'
import { useAtom } from 'jotai'
import { viewerIndexAtom, type ViewerStyle } from './state'

export interface ViewerAction {
  href: string
  label: string
}

interface AlbumViewerControlsProps {
  style: ViewerStyle
  title: string
  /** Pages, spreads, or prints — whatever the index is stepping through. */
  count: number
  spec?: string[]
  back?: { href: string; label: string }
  action?: ViewerAction
}

/**
 * The one viewer HUD.
 *
 * Replaces PreviewUI / MagazinePreviewUI / PolaroidPreviewUI, which were the
 * same layout three times with a different back-link and CTA. Those two things
 * are now props.
 *
 * Restyled to the design's press-proof language: mono spec stamp bottom-left,
 * a single hard-edged terracotta stamp bottom-right, no pill buttons, no
 * blurred glass panels, no drop shadows. Step controls sit above the safe area
 * on phones so the home indicator never covers them.
 */
export function AlbumViewerControls({
  style,
  title,
  count,
  spec,
  back,
  action,
}: AlbumViewerControlsProps) {
  const [index, setIndex] = useAtom(viewerIndexAtom)

  const unit = style === 'magazine' ? 'Spread' : 'Page'
  const stepped = count > 1

  const go = (next: number) => setIndex(Math.min(count - 1, Math.max(0, next)))

  return (
    <nav className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 sm:p-6">
      {/* ── Top: where you came from, and what you're looking at ───────── */}
      <div className="pointer-events-auto flex items-start justify-between gap-4 sm:mt-4 sm:ml-8">
        {back ? (
          <Link
            href={back.href}
            className="inline-flex min-h-[44px] items-center rounded-[2px] border border-[#F5F0E8]/25 px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[#F5F0E8]/70 transition-colors hover:border-[#F5F0E8]/60 hover:text-[#F5F0E8] sm:text-[11px]"
          >
            ← {back.label}
          </Link>
        ) : (
          <span />
        )}

        <div className="min-w-0 text-right sm:mr-8">
          <h1 className="truncate font-serif text-lg text-[#F5F0E8] sm:text-2xl">{title}</h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F5F0E8]/40">
            {stepped ? `${unit} ${index + 1} of ${count}` : `${count} ${unit}${count === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      {/* ── Middle: step through the piece ─────────────────────────────── */}
      {stepped ? (
        <div className="pointer-events-auto flex items-center justify-center gap-3">
          <StepButton
            label={`Previous ${unit.toLowerCase()}`}
            onClick={() => go(index - 1)}
            disabled={index === 0}
          >
            ←
          </StepButton>

          {/* Individual ticks stay legible up to a point; past that the mono
              readout above already says where you are. */}
          {count <= 24 ? (
            <div
              className="flex items-center gap-1.5 border border-[#F5F0E8]/15 px-3 py-2.5"
              role="tablist"
              aria-label={`${unit} selector`}
            >
              {Array.from({ length: count }).map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === index}
                  aria-label={i === 0 ? 'Cover' : `${unit} ${i + 1}`}
                  onClick={() => go(i)}
                  className={`h-4 w-[3px] transition-colors ${
                    i === index ? 'bg-primary' : 'bg-[#F5F0E8]/25 hover:bg-[#F5F0E8]/50'
                  }`}
                />
              ))}
            </div>
          ) : null}

          <StepButton
            label={`Next ${unit.toLowerCase()}`}
            onClick={() => go(index + 1)}
            disabled={index === count - 1}
          >
            →
          </StepButton>
        </div>
      ) : (
        <span />
      )}

      {/* ── Bottom: the lab's stamp, and the one action ─────────────────── */}
      <div className="pointer-events-auto flex flex-col gap-4 sm:mb-4 sm:flex-row sm:items-end sm:justify-between sm:px-2">
        {spec && spec.length > 0 ? (
          <div className="font-mono text-[10px] uppercase leading-[1.7] tracking-[0.05em] text-[#F5F0E8]/70 sm:text-[11px]">
            {spec.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        ) : (
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/30">
            Drag to rotate
          </p>
        )}

        {action ? (
          <Link
            href={action.href}
            className="inline-flex min-h-[48px] items-center justify-center rounded-[2px] bg-primary px-6 font-mono text-[12px] uppercase tracking-[0.1em] text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
    </nav>
  )
}

function StepButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-[2px] border border-[#F5F0E8]/25 font-mono text-base text-[#F5F0E8] transition-colors hover:border-[#F5F0E8]/60 disabled:opacity-30 disabled:hover:border-[#F5F0E8]/25"
    >
      {children}
    </button>
  )
}
