'use client'

import { useState, type ReactNode } from 'react'
import { MonoLabel } from '@/components/folio/primitives'
import { cn } from '@/lib/utils'

/**
 * The editor's form vocabulary.
 *
 * Every control here is built to the Editorial Darkroom rules the rest of the
 * app follows — mono labels flush left, 2px radius, rules instead of shadows,
 * and a 44px touch target on anything tappable, because the card editor is a
 * phone screen first.
 */

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <MonoLabel size="xs" className="mb-1.5">
        {label}
      </MonoLabel>
      {children}
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </label>
  )
}

const inputClasses =
  'w-full rounded-[2px] border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary'

export function TextField({
  value,
  onChange,
  placeholder,
  maxLength,
  mono,
}: {
  value: string
  onChange(value: string): void
  placeholder?: string
  maxLength?: number
  mono?: boolean
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className={cn(inputClasses, 'min-h-[44px]', mono && 'font-mono')}
    />
  )
}

export function TextAreaField({
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
}: {
  value: string
  onChange(value: string): void
  placeholder?: string
  rows?: number
  maxLength?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      className={cn(inputClasses, 'resize-y py-2.5 leading-relaxed')}
    />
  )
}

/**
 * Comma or Enter commits a tag. Interests and traits are the fields people fill
 * fastest, so they must not require a button press per item.
 */
export function TagField({
  values,
  onChange,
  placeholder,
  max = 12,
}: {
  values: string[]
  onChange(values: string[]): void
  placeholder?: string
  max?: number
}) {
  const [draft, setDraft] = useState('')

  const commit = (raw: string) => {
    const additions = raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    if (additions.length === 0) return
    const next = [...values]
    for (const addition of additions) {
      if (next.length >= max) break
      if (!next.some((item) => item.toLowerCase() === addition.toLowerCase())) next.push(addition)
    }
    onChange(next)
    setDraft('')
  }

  return (
    <div className="rounded-[2px] border border-border bg-background p-2">
      {values.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {values.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              className="group inline-flex items-center gap-1.5 rounded-[2px] border border-border bg-card px-2.5 py-1.5 text-[13px] text-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label={`Remove ${value}`}
            >
              {value}
              <span className="font-mono text-[11px] text-ink-soft group-hover:text-primary">×</span>
            </button>
          ))}
        </div>
      ) : null}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault()
            commit(draft)
          } else if (event.key === 'Backspace' && draft === '' && values.length > 0) {
            onChange(values.slice(0, -1))
          }
        }}
        onBlur={() => commit(draft)}
        placeholder={values.length >= max ? `${max} is the limit` : placeholder}
        disabled={values.length >= max}
        className="min-h-[36px] w-full bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}

/**
 * A repeatable group — timeline entries, statistics, achievements. Rows are
 * added and removed inline; there is no modal, because on a phone a modal for
 * one text field is a punishment.
 */
export function RepeatableList<T>({
  label,
  items,
  onChange,
  blank,
  max = 8,
  addLabel = 'Add',
  render,
}: {
  label: ReactNode
  items: T[]
  onChange(items: T[]): void
  blank: () => T
  max?: number
  addLabel?: string
  render(item: T, update: (patch: Partial<T>) => void, index: number): ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <MonoLabel size="xs">{label}</MonoLabel>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
          {items.length}/{max}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-[2px] border border-border bg-card p-2.5"
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 space-y-2">
                {render(
                  item,
                  (patch) =>
                    onChange(items.map((existing, i) => (i === index ? { ...existing, ...patch } : existing))),
                  index
                )}
              </div>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                className="touch-target -mr-1 -mt-1 shrink-0 px-2 py-1 font-mono text-[11px] uppercase text-ink-soft transition-colors hover:text-primary"
                aria-label="Remove row"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length < max ? (
        <button
          type="button"
          onClick={() => onChange([...items, blank()])}
          className="mt-2 min-h-[44px] w-full rounded-[2px] border border-dashed border-border font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-primary hover:text-primary"
        >
          + {addLabel}
        </button>
      ) : null}
    </div>
  )
}

export function ColorField({
  label,
  value,
  onChange,
  swatches,
}: {
  label: ReactNode
  value: string
  onChange(value: string): void
  swatches?: string[]
}) {
  return (
    <div>
      <MonoLabel size="xs" className="mb-1.5">
        {label}
      </MonoLabel>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-[2px] border border-border">
          <span className="block h-full w-full" style={{ background: value }} />
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={typeof label === 'string' ? label : 'Colour'}
          />
        </label>
        {(swatches ?? []).map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => onChange(swatch)}
            aria-label={swatch}
            className={cn(
              'h-9 w-9 rounded-[2px] border transition-transform',
              value.toLowerCase() === swatch.toLowerCase()
                ? 'border-foreground scale-105'
                : 'border-border hover:scale-105'
            )}
            style={{ background: swatch }}
          />
        ))}
        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft">
          {value}
        </span>
      </div>
    </div>
  )
}

export function Choice({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: { value: string; label: string; note?: string }[]
  value: string
  onChange(value: string): void
  columns?: number
}) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              'min-h-[44px] rounded-[2px] border px-3 py-2 text-left transition-colors',
              active
                ? 'border-primary bg-primary/[0.07] text-foreground'
                : 'border-border bg-card text-foreground hover:border-foreground'
            )}
          >
            <span className="block font-mono text-[11px] uppercase tracking-[0.06em]">
              {option.label}
            </span>
            {option.note ? (
              <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
                {option.note}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function ToggleRow({
  label,
  note,
  checked,
  onChange,
}: {
  label: ReactNode
  note?: ReactNode
  checked: boolean
  onChange(checked: boolean): void
}) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span className="min-w-0">
        <span className="block text-sm text-foreground">{label}</span>
        {note ? (
          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{note}</span>
        ) : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 accent-[var(--primary)]"
      />
    </label>
  )
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: ReactNode
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange(value: number): void
}) {
  return (
    <div className="py-2">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <MonoLabel size="xs">{label}</MonoLabel>
        <span className="font-mono text-[11px] text-ink-soft">
          {Math.round(value * 100) / 100}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full accent-[var(--primary)]"
      />
    </div>
  )
}

/** A flush-left section heading inside a panel. */
export function PanelSection({
  title,
  note,
  action,
  children,
  className,
}: {
  title: ReactNode
  note?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('border-t border-border pt-5 first:border-t-0 first:pt-0', className)}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <MonoLabel tone="primary" size="xs">
            {title}
          </MonoLabel>
          {note ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{note}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
