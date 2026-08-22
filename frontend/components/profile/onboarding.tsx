'use client'

import { useEffect, useMemo, useState } from 'react'
import { MonoLabel, StampButton } from '@/components/folio/primitives'
import { CardRenderer } from '@/components/cards/card-renderer'
import { profileApi, type OnboardingAnswers } from '@/lib/profile/api'
import { normalizeProfile, type CardProfileData, type Catalog } from '@/lib/cards/types'
import { cn } from '@/lib/utils'

/**
 * The first visit.
 *
 * Six questions, one at a time, with the card being built in view the whole
 * way. That pairing is the entire design: a form asking for a "tagline" is a
 * chore, but watching the word land on a card you are about to own is not, and
 * it is also the only honest way to explain what these answers are *for*.
 *
 * Nothing here is required. Every step can be walked past, and the card simply
 * comes out quieter — a template that finds no quote does not draw an empty
 * quotation mark, it drops the block. Which is why skipping is offered plainly
 * rather than hidden: an eight-field wall would be abandoned, and an abandoned
 * profile has no centrepiece at all.
 */

export interface OnboardingPhoto {
  id: string
  url: string
  event_title?: string | null
}

type StepId = 'name' | 'work' | 'line' | 'interests' | 'photo' | 'look'

const STEPS: { id: StepId; label: string; question: string; note: string }[] = [
  {
    id: 'name',
    label: 'Who',
    question: 'What should the card say?',
    note: 'Your name as you would want it printed. The handle is the address of your page.',
  },
  {
    id: 'work',
    label: 'What',
    question: 'What do you do, and where?',
    note: 'One or both. Templates set these as the credit line beneath your name.',
  },
  {
    id: 'line',
    label: 'Voice',
    question: 'Say one thing about yourself.',
    note: 'A short line, and a longer one you keep coming back to. Either can be blank.',
  },
  {
    id: 'interests',
    label: 'Into',
    question: 'What are you into?',
    note: 'Three or four is plenty. They set as tags across the bottom of most templates.',
  },
  {
    id: 'photo',
    label: 'Face',
    question: 'Pick a photograph.',
    note: 'From what you have uploaded. You can swap it for any other later.',
  },
  {
    id: 'look',
    label: 'Look',
    question: 'Pick the look.',
    note: 'Every one of these is your answers, set differently. Nothing is locked in.',
  },
]

const SUGGESTED = [
  'Photography',
  'Film',
  'Reading',
  'Travel',
  'Music',
  'Cooking',
  'Running',
  'Design',
  'Coffee',
  'Hiking',
  'Writing',
  'Cycling',
]

export function ProfileOnboarding({
  catalog,
  photos,
  initial,
  onDone,
  onSkip,
}: {
  catalog: Catalog
  photos: OnboardingPhoto[]
  initial: { name?: string | null; handle?: string | null; bio?: string | null }
  onDone(): void
  onSkip(): void
}) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [answers, setAnswers] = useState<OnboardingAnswers>({
    name: initial.name ?? '',
    handle: initial.handle ?? '',
    tagline: '',
    occupation: '',
    location: '',
    bio: initial.bio ?? '',
    quote: '',
    interests: [],
    photoUrl: photos[0]?.url ?? '',
    templateId: catalog.templates[0]?.id,
    styleId: catalog.templates[0]?.defaultStyleId ?? undefined,
  })

  function set<K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }))
  }

  /* ── The card, as it stands ────────────────────────────────────────────── */

  const template = useMemo(
    () =>
      catalog.templates.find((entry) => entry.id === answers.templateId) ?? catalog.templates[0],
    [catalog.templates, answers.templateId]
  )

  const style = useMemo(
    () => catalog.styles.find((entry) => entry.id === answers.styleId) ?? null,
    [catalog.styles, answers.styleId]
  )

  /**
   * Placeholders stand in only while a field is empty, so the preview is never
   * a half-drawn skeleton — but they are never submitted, because a card that
   * shipped with "Your name here" on it would be worse than a blank one.
   */
  const preview: CardProfileData = useMemo(
    () =>
      normalizeProfile({
        name: answers.name || 'Your name',
        username: answers.handle || '',
        tagline: answers.tagline || '',
        occupation: answers.occupation || '',
        location: answers.location || '',
        bio: answers.bio || '',
        quote: answers.quote || '',
        interests: answers.interests ?? [],
        photos: answers.photoUrl ? [{ url: answers.photoUrl }] : [],
      }),
    [answers]
  )

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  async function finish() {
    setSaving(true)
    setError(null)
    try {
      await profileApi.onboard({
        ...answers,
        // Trimmed here as well as on the server: the placeholder above must not
        // survive into what we send.
        name: answers.name?.trim() || undefined,
        handle: answers.handle?.trim() || undefined,
      })
      onDone()
    } catch (submitError) {
      setError((submitError as Error).message)
      setSaving(false)
    }
  }

  async function skip() {
    setSaving(true)
    try {
      await profileApi.skipOnboarding()
    } catch {
      // Not worth blocking on — the flag is a convenience, not a permission.
    }
    onSkip()
  }

  // Escape is a skip, not a trap. The page behind is unusable until this is
  // answered or dismissed, so there has to be a way out that costs nothing.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) void skip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-full max-w-[1180px] flex-col px-4 py-6 sm:px-6 sm:py-10">
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-4">
          <div>
            <MonoLabel tone="primary" size="xs" className="mb-2">
              Setting up your page
            </MonoLabel>
            <h1 className="font-serif text-[clamp(1.6rem,6vw,2.4rem)] leading-[1.05] text-foreground">
              {current.question}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => void skip()}
            disabled={saving}
            className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>

        {/* ── Progress ─────────────────────────────────────────────────────── */}
        <ol className="mt-4 flex flex-wrap gap-x-1 gap-y-2">
          {STEPS.map((entry, index) => (
            <li key={entry.id} className="flex-1 basis-[80px]">
              <button
                type="button"
                onClick={() => setStep(index)}
                className="block w-full text-left"
                aria-current={index === step ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'block h-[3px] w-full transition-colors',
                    index < step && 'bg-secondary',
                    index === step && 'bg-primary',
                    index > step && 'bg-border'
                  )}
                />
                <MonoLabel
                  size="xs"
                  tone={index === step ? 'primary' : 'muted'}
                  className="mt-1.5"
                >
                  {entry.label}
                </MonoLabel>
              </button>
            </li>
          ))}
        </ol>

        {/* ── Question and preview ─────────────────────────────────────────── */}
        <div className="mt-8 grid flex-1 gap-8 lg:grid-cols-[1fr_minmax(280px,380px)] lg:gap-12">
          <div className="min-w-0">
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {current.note}
            </p>

            <div className="mt-6">
              {current.id === 'name' ? (
                <div className="grid max-w-md gap-4">
                  <Field
                    label="Name"
                    value={answers.name ?? ''}
                    onChange={(value) => set('name', value)}
                    placeholder="Ravi Menon"
                    maxLength={60}
                    autoFocus
                  />
                  <Field
                    label="Handle"
                    value={answers.handle ?? ''}
                    onChange={(value) =>
                      set('handle', value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                    }
                    placeholder="ravimenon"
                    prefix="@"
                    mono
                    maxLength={30}
                    hint="3–30 characters. Lowercase letters, numbers, underscores."
                  />
                </div>
              ) : null}

              {current.id === 'work' ? (
                <div className="grid max-w-md gap-4">
                  <Field
                    label="What you do"
                    value={answers.occupation ?? ''}
                    onChange={(value) => set('occupation', value)}
                    placeholder="Wedding photographer"
                    maxLength={80}
                    autoFocus
                  />
                  <Field
                    label="Where"
                    value={answers.location ?? ''}
                    onChange={(value) => set('location', value)}
                    placeholder="Udaipur, Rajasthan"
                    maxLength={60}
                  />
                </div>
              ) : null}

              {current.id === 'line' ? (
                <div className="grid max-w-md gap-4">
                  <Field
                    label="Your line"
                    value={answers.tagline ?? ''}
                    onChange={(value) => set('tagline', value)}
                    placeholder="Mostly film. Always early."
                    maxLength={90}
                    autoFocus
                  />
                  <Field
                    label="A line worth keeping"
                    value={answers.quote ?? ''}
                    onChange={(value) => set('quote', value)}
                    placeholder="Focus on becoming better, not perfect."
                    maxLength={220}
                    multiline
                    hint="A quote, a rule you live by, or nothing at all."
                  />
                </div>
              ) : null}

              {current.id === 'interests' ? (
                <InterestPicker
                  value={answers.interests ?? []}
                  onChange={(next) => set('interests', next)}
                />
              ) : null}

              {current.id === 'photo' ? (
                <PhotoPicker
                  photos={photos}
                  value={answers.photoUrl ?? ''}
                  onChange={(url) => set('photoUrl', url)}
                />
              ) : null}

              {current.id === 'look' ? (
                <TemplatePicker
                  catalog={catalog}
                  profile={preview}
                  templateId={answers.templateId}
                  onPick={(templateId, styleId) => {
                    set('templateId', templateId)
                    set('styleId', styleId)
                  }}
                />
              ) : null}
            </div>

            {error ? (
              <p className="mt-5 max-w-md border border-primary px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
                {error}
              </p>
            ) : null}

            {/* ── Navigation ─────────────────────────────────────────────── */}
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-5">
              {step > 0 ? (
                <StampButton tone="ghost" size="sm" onClick={() => setStep(step - 1)}>
                  ← Back
                </StampButton>
              ) : null}

              {isLast ? (
                <StampButton
                  tone="primary"
                  size="sm"
                  onClick={() => void finish()}
                  disabled={saving}
                >
                  {saving ? 'Building your card…' : 'Build my card'}
                </StampButton>
              ) : (
                <StampButton tone="ink" size="sm" onClick={() => setStep(step + 1)}>
                  Next →
                </StampButton>
              )}

              {!isLast ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft underline-offset-4 hover:text-foreground hover:underline"
                >
                  Leave blank
                </button>
              ) : null}
            </div>
          </div>

          {/* ── The card being built ───────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-10 lg:self-start">
            <MonoLabel size="xs" className="mb-2">
              Your card, so far
            </MonoLabel>
            {template ? (
              <div
                className="mx-auto w-full max-w-[320px] lg:max-w-none"
                style={{ boxShadow: '0 2px 12px var(--shadow-color)' }}
              >
                <CardRenderer
                  definition={template.definition}
                  style={style}
                  profile={preview}
                  title="Card preview"
                />
              </div>
            ) : (
              <div className="rounded-[4px] border border-dashed border-border px-4 py-10 text-center">
                <MonoLabel size="xs">No templates published</MonoLabel>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

/* ── Inputs ───────────────────────────────────────────────────────────────── */

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  prefix,
  maxLength,
  multiline,
  mono,
  autoFocus,
}: {
  label: string
  value: string
  onChange(value: string): void
  placeholder?: string
  hint?: string
  prefix?: string
  maxLength?: number
  multiline?: boolean
  mono?: boolean
  autoFocus?: boolean
}) {
  const inputClass = cn(
    'w-full bg-transparent text-foreground outline-none placeholder:text-ink-soft/60',
    mono ? 'font-mono text-sm' : 'text-base'
  )

  return (
    <label className="block">
      <MonoLabel size="xs" className="mb-1.5">
        {label}
      </MonoLabel>
      <div className="flex items-start rounded-[2px] border border-border bg-card focus-within:border-primary">
        {prefix ? (
          <span className="pl-3 pt-[13px] font-mono text-sm text-ink-soft">{prefix}</span>
        ) : null}
        {multiline ? (
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={3}
            autoFocus={autoFocus}
            className={cn(inputClass, 'resize-none px-3 py-3 leading-relaxed')}
          />
        ) : (
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            autoFocus={autoFocus}
            autoCapitalize={mono ? 'none' : undefined}
            autoCorrect={mono ? 'off' : undefined}
            spellCheck={mono ? false : undefined}
            className={cn(inputClass, 'min-h-[46px] px-3')}
          />
        )}
      </div>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </label>
  )
}

function InterestPicker({
  value,
  onChange,
}: {
  value: string[]
  onChange(next: string[]): void
}) {
  const [draft, setDraft] = useState('')

  function toggle(interest: string) {
    onChange(
      value.includes(interest)
        ? value.filter((entry) => entry !== interest)
        : [...value, interest].slice(0, 16)
    )
  }

  function addDraft() {
    const trimmed = draft.trim().slice(0, 40)
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed].slice(0, 16))
    setDraft('')
  }

  return (
    <div className="max-w-md">
      <div className="flex flex-wrap gap-2">
        {[...new Set([...value, ...SUGGESTED])].map((interest) => {
          const picked = value.includes(interest)
          return (
            <button
              key={interest}
              type="button"
              onClick={() => toggle(interest)}
              className={cn(
                'min-h-[38px] rounded-[2px] border px-3 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors',
                picked
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-ink-soft hover:border-foreground hover:text-foreground'
              )}
            >
              {interest}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addDraft()
            }
          }}
          placeholder="Something else"
          maxLength={40}
          className="min-h-[44px] flex-1 rounded-[2px] border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary"
        />
        <StampButton tone="ghost" size="sm" onClick={addDraft} disabled={!draft.trim()}>
          Add
        </StampButton>
      </div>

      <MonoLabel size="xs" className="mt-3">
        {value.length} chosen
      </MonoLabel>
    </div>
  )
}

function PhotoPicker({
  photos,
  value,
  onChange,
}: {
  photos: OnboardingPhoto[]
  value: string
  onChange(url: string): void
}) {
  if (photos.length === 0) {
    return (
      <div className="max-w-md rounded-[4px] border border-dashed border-border px-5 py-8 text-center">
        <MonoLabel size="xs">Nothing uploaded yet</MonoLabel>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
          Templates that want a photograph will leave the frame empty until you
          have one. Everything else on the card still works.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md">
      <div className="grid max-h-[320px] grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-5">
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => onChange(photo.url === value ? '' : photo.url)}
            className={cn(
              'relative aspect-square overflow-hidden bg-surface-2 outline outline-1 -outline-offset-1 transition-all',
              photo.url === value
                ? 'outline-2 outline-primary'
                : 'outline-border hover:outline-foreground'
            )}
            aria-pressed={photo.url === value}
            aria-label={photo.event_title ? `Photo from ${photo.event_title}` : 'Photo'}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
