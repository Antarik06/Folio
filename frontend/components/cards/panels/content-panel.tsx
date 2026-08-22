'use client'

import { useMemo, useRef, useState } from 'react'
import { Frame, MonoLabel, StampButton } from '@/components/folio/primitives'
import {
  Field,
  PanelSection,
  RepeatableList,
  SliderRow,
  TagField,
  TextAreaField,
  TextField,
} from '@/components/cards/controls'
import { collectEditableFields } from '@/lib/cards/layout'
import { createResolver } from '@/lib/cards/resolver'
import { createClient } from '@/lib/supabase/client'
import type { PickablePhoto } from '@/components/cards/card-editor'
import type {
  CardCustomization,
  CardProfileData,
  CardStyle,
  TemplateDefinition,
} from '@/lib/cards/types'
import { cn } from '@/lib/utils'

/**
 * The Words panel.
 *
 * Two layers, and keeping them apart is what stops the editor turning into a
 * form with sixty inputs:
 *
 * · Your details — the profile every card of yours draws on. Only the fields
 *   this template can actually show are offered; the rest are one tap away.
 *
 * · This card's own words — per-element overrides for the handful of places a
 *   template wants a phrase rather than a fact, like an occasion's headline.
 *   These are read straight out of the template, so a new template's editable
 *   text appears here with no code change.
 */

type FieldKind = 'text' | 'area' | 'tags' | 'stats' | 'meters' | 'achievements' | 'timeline' | 'socials' | 'favourites' | 'photos'

interface FieldSpec {
  key: keyof CardProfileData | 'photos'
  label: string
  kind: FieldKind
  placeholder?: string
  hint?: string
  max?: number
}

const FIELD_SPECS: FieldSpec[] = [
  { key: 'name', label: 'Name', kind: 'text', placeholder: 'Antarik Tarafder', max: 60 },
  { key: 'username', label: 'Handle', kind: 'text', placeholder: 'antarik', max: 40 },
  { key: 'tagline', label: 'One line about you', kind: 'text', placeholder: 'Making things worth keeping', max: 90 },
  { key: 'occupation', label: 'What you do', kind: 'text', placeholder: 'Photographer', max: 80 },
  { key: 'education', label: 'Studied', kind: 'text', placeholder: 'Jadavpur University', max: 90 },
  { key: 'location', label: 'Where', kind: 'text', placeholder: 'Kolkata', max: 60 },
  { key: 'bio', label: 'About you', kind: 'area', placeholder: 'Two or three sentences. Write it the way you would say it.', max: 400 },
  { key: 'quote', label: 'A line you live by', kind: 'area', placeholder: 'Something you would actually say out loud.', max: 220 },
  { key: 'quoteAuthor', label: 'Who said it', kind: 'text', placeholder: 'Leave empty if it is yours', max: 60 },
  { key: 'currentChapter', label: 'Right now', kind: 'area', placeholder: 'What this year is about.', max: 220 },
  { key: 'nextChapter', label: 'Next', kind: 'area', placeholder: 'What you are heading towards.', max: 220 },
  { key: 'interests', label: 'Into', kind: 'tags', placeholder: 'Film photography, trains, filter coffee…', max: 16 },
  { key: 'traits', label: 'People say you are', kind: 'tags', placeholder: 'Patient, stubborn, early…', max: 12 },
  { key: 'goals', label: 'Working towards', kind: 'tags', placeholder: 'One line each', max: 8 },
  { key: 'stats', label: 'Numbers', kind: 'stats', max: 8 },
  { key: 'meters', label: 'Meters', kind: 'meters', max: 8 },
  { key: 'achievements', label: 'Proud of', kind: 'achievements', max: 10 },
  { key: 'timeline', label: 'The years', kind: 'timeline', max: 12 },
  { key: 'favourites', label: 'Favourites', kind: 'favourites', max: 10 },
  { key: 'socials', label: 'Find you at', kind: 'socials', max: 8 },
  { key: 'photos', label: 'Photographs', kind: 'photos', max: 8 },
]

export function ContentPanel({
  definition,
  profile,
  onProfileChange,
  customization,
  onCustomizationChange,
  photos,
  style,
}: {
  definition: TemplateDefinition
  profile: CardProfileData
  onProfileChange(patch: Partial<CardProfileData>): void
  customization: CardCustomization
  onCustomizationChange(patch: Partial<CardCustomization>): void
  photos: PickablePhoto[]
  style: CardStyle | null
}) {
  const [showEverything, setShowEverything] = useState(false)

  const supported = useMemo(
    () => new Set(definition.supportedFields ?? []),
    [definition.supportedFields]
  )

  const { used, rest } = useMemo(() => {
    const used: FieldSpec[] = []
    const rest: FieldSpec[] = []
    for (const spec of FIELD_SPECS) {
      ;(supported.size === 0 || supported.has(spec.key) ? used : rest).push(spec)
    }
    return { used, rest }
  }, [supported])

  const cardWords = useMemo(
    () => collectEditableFields(definition, createResolver(profile)).filter((field) => field.kind !== 'image'),
    [definition, profile]
  )

  return (
    <div className="space-y-7">
      <PanelSection
        title="Your details"
        note="Shared by all of your cards. Only what this template can show is listed."
      >
        <div className="space-y-5">
          {used.map((spec) => (
            <ProfileField
              key={String(spec.key)}
              spec={spec}
              profile={profile}
              onChange={onProfileChange}
              photos={photos}
            />
          ))}
        </div>
      </PanelSection>

      {rest.length > 0 ? (
        <PanelSection
          title="Everything else"
          note={
            showEverything
              ? 'This template will not show these, but another one might.'
              : `${rest.length} more field${rest.length === 1 ? '' : 's'} other templates can use.`
          }
          action={
            <button
              type="button"
              onClick={() => setShowEverything((value) => !value)}
              className="shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] text-primary underline-offset-4 hover:underline"
            >
              {showEverything ? 'Hide' : 'Show'}
            </button>
          }
        >
          {showEverything ? (
            <div className="space-y-5">
              {rest.map((spec) => (
                <ProfileField
                  key={String(spec.key)}
                  spec={spec}
                  profile={profile}
                  onChange={onProfileChange}
                  photos={photos}
                />
              ))}
            </div>
          ) : null}
        </PanelSection>
      ) : null}

      {cardWords.length > 0 ? (
        <PanelSection
          title="This card's own words"
          note="Overrides just here. Leave one empty and the template's own wording comes back."
        >
          <div className="space-y-4">
            {cardWords.map((field) => {
              const override = customization.content[field.id]
              const value = Array.isArray(override) ? override.join('\n') : (override ?? '')
              return (
                <Field key={field.id} label={field.label}>
                  {field.kind === 'lines' ? (
                    <TextAreaField
                      value={value}
                      rows={3}
                      placeholder={field.placeholder}
                      onChange={(next) =>
                        onCustomizationChange({
                          content: nextContent(customization.content, field.id, next, true),
                        })
                      }
                    />
                  ) : (
                    <TextField
                      value={value}
                      placeholder={field.placeholder}
                      onChange={(next) =>
                        onCustomizationChange({
                          content: nextContent(customization.content, field.id, next, false),
                        })
                      }
                    />
                  )}
                </Field>
              )
            })}
          </div>
        </PanelSection>
      ) : null}
    </div>
  )
}

/** An empty override is removed rather than stored, so the template wins again. */
function nextContent(
  content: CardCustomization['content'],
  id: string,
  value: string,
  lines: boolean
): CardCustomization['content'] {
  const next = { ...content }
  if (value.trim() === '') {
    delete next[id]
  } else {
    next[id] = lines
      ? value
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
      : value
  }
  return next
}

/* ── One profile field ────────────────────────────────────────────────────── */

function ProfileField({
  spec,
  profile,
  onChange,
  photos,
}: {
  spec: FieldSpec
  profile: CardProfileData
  onChange(patch: Partial<CardProfileData>): void
  photos: PickablePhoto[]
}) {
  switch (spec.kind) {
    case 'text':
      return (
        <Field label={spec.label} hint={spec.hint}>
          <TextField
            value={String(profile[spec.key as keyof CardProfileData] ?? '')}
            onChange={(value) => onChange({ [spec.key]: value } as Partial<CardProfileData>)}
            placeholder={spec.placeholder}
            maxLength={spec.max}
          />
        </Field>
      )

    case 'area':
      return (
        <Field label={spec.label} hint={spec.hint}>
          <TextAreaField
            value={String(profile[spec.key as keyof CardProfileData] ?? '')}
            onChange={(value) => onChange({ [spec.key]: value } as Partial<CardProfileData>)}
            placeholder={spec.placeholder}
            maxLength={spec.max}
          />
        </Field>
      )

    case 'tags':
      return (
        <Field label={spec.label} hint={spec.hint}>
          <TagField
            values={(profile[spec.key as keyof CardProfileData] as string[]) ?? []}
            onChange={(values) => onChange({ [spec.key]: values } as Partial<CardProfileData>)}
            placeholder={spec.placeholder}
            max={spec.max}
          />
        </Field>
      )

    case 'stats':
      return (
        <RepeatableList
          label={spec.label}
          items={profile.stats}
          max={spec.max}
          addLabel="Add a number"
          blank={() => ({ label: '', value: '' })}
          onChange={(stats) => onChange({ stats })}
          render={(item, update) => (
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <TextField
                value={item.value}
                onChange={(value) => update({ value })}
                placeholder="12"
                maxLength={20}
              />
              <TextField
                value={item.label}
                onChange={(label) => update({ label })}
                placeholder="Events shot"
                maxLength={30}
              />
            </div>
          )}
        />
      )

    case 'meters':
      return (
        <RepeatableList
          label={spec.label}
          items={profile.meters}
          max={spec.max}
          addLabel="Add a meter"
          blank={() => ({ label: '', value: 60 })}
          onChange={(meters) => onChange({ meters })}
          render={(item, update) => (
            <>
              <TextField
                value={item.label}
                onChange={(label) => update({ label })}
                placeholder="Punctuality"
                maxLength={30}
              />
              <SliderRow
                label="Level"
                value={item.value}
                min={0}
                max={100}
                suffix="%"
                onChange={(value) => update({ value })}
              />
            </>
          )}
        />
      )

    case 'achievements':
      return (
        <RepeatableList
          label={spec.label}
          items={profile.achievements}
          max={spec.max}
          addLabel="Add something"
          blank={() => ({ title: '', year: '', note: '' })}
          onChange={(achievements) => onChange({ achievements })}
          render={(item, update) => (
            <>
              <div className="grid grid-cols-[1fr_86px] gap-2">
                <TextField
                  value={item.title}
                  onChange={(title) => update({ title })}
                  placeholder="Shot my first wedding"
                  maxLength={80}
                />
                <TextField
                  value={item.year ?? ''}
                  onChange={(year) => update({ year })}
                  placeholder="2024"
                  maxLength={12}
                  mono
                />
              </div>
              <TextField
                value={item.note ?? ''}
                onChange={(note) => update({ note })}
                placeholder="A note, if it needs one"
                maxLength={120}
              />
            </>
          )}
        />
      )

    case 'timeline':
      return (
        <RepeatableList
          label={spec.label}
          items={profile.timeline}
          max={spec.max}
          addLabel="Add a year"
          blank={() => ({ year: '', title: '', note: '' })}
          onChange={(timeline) => onChange({ timeline })}
          render={(item, update) => (
            <>
              <div className="grid grid-cols-[86px_1fr] gap-2">
                <TextField
                  value={item.year}
                  onChange={(year) => update({ year })}
                  placeholder="2019"
                  maxLength={12}
                  mono
                />
                <TextField
                  value={item.title}
                  onChange={(title) => update({ title })}
                  placeholder="Moved to Kolkata"
                  maxLength={80}
                />
              </div>
              <TextField
                value={item.note ?? ''}
                onChange={(note) => update({ note })}
                placeholder="One more line"
                maxLength={140}
              />
            </>
          )}
        />
      )

    case 'favourites':
      return (
        <RepeatableList
          label={spec.label}
          items={profile.favourites}
          max={spec.max}
          addLabel="Add a favourite"
          blank={() => ({ label: '', value: '' })}
          onChange={(favourites) => onChange({ favourites })}
          render={(item, update) => (
            <div className="grid grid-cols-[110px_1fr] gap-2">
              <TextField
                value={item.label}
                onChange={(label) => update({ label })}
                placeholder="Film"
                maxLength={40}
              />
              <TextField
                value={item.value}
                onChange={(value) => update({ value })}
                placeholder="Portra 400"
                maxLength={80}
              />
            </div>
          )}
        />
      )

    case 'socials':
      return (
        <RepeatableList
          label={spec.label}
          items={profile.socials}
          max={spec.max}
          addLabel="Add a link"
          blank={() => ({ platform: '', handle: '' })}
          onChange={(socials) => onChange({ socials })}
          render={(item, update) => (
            <div className="grid grid-cols-[110px_1fr] gap-2">
              <TextField
                value={item.platform}
                onChange={(platform) => update({ platform })}
                placeholder="Instagram"
                maxLength={30}
              />
              <TextField
                value={item.handle}
                onChange={(handle) => update({ handle })}
                placeholder="@antarik"
                maxLength={60}
                mono
              />
            </div>
          )}
        />
      )

    case 'photos':
      return <PhotoField profile={profile} onChange={onChange} photos={photos} max={spec.max ?? 8} />

    default:
      return null
  }
}

/* ── Photographs ──────────────────────────────────────────────────────────── */

/**
 * Templates read `photos[0]`, `photos[1]` and so on, so the order *is* the
 * assignment — moving a picture to the front puts it in the hero slot of every
 * template at once. That is easier to explain than a slot picker, and it means
 * switching template never loses a photograph.
 */
function PhotoField({
  profile,
  onChange,
  photos,
  max,
}: {
  profile: CardProfileData
  onChange(patch: Partial<CardProfileData>): void
  photos: PickablePhoto[]
  max: number
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const chosen = profile.photos
  const chosenUrls = new Set(chosen.map((photo) => photo.url))

  const add = (photo: { id?: string; url: string }) => {
    if (chosen.length >= max || chosenUrls.has(photo.url)) return
    onChange({ photos: [...chosen, photo] })
  }

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= chosen.length) return
    const next = [...chosen]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange({ photos: next })
  }

  async function upload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Your session expired. Sign in and try again.')

      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `cards/${user.id}/${Date.now()}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, file, { contentType: file.type })
      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('photos').getPublicUrl(path)
      add({ url: publicUrl })
    } catch (uploadError) {
      setError((uploadError as Error).message)
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <MonoLabel size="xs">Photographs — in order</MonoLabel>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
          {chosen.length}/{max}
        </span>
      </div>

      {chosen.length > 0 ? (
        <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {chosen.map((photo, index) => (
            <figure key={`${photo.url}-${index}`} className="min-w-0">
              <div className="relative">
                <Frame src={photo.url} alt="" ratio="1/1" />
                <span className="absolute left-1 top-1 bg-foreground px-1.5 py-0.5 font-mono text-[9px] text-background">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onChange({ photos: chosen.filter((_, i) => i !== index) })}
                  aria-label="Remove photograph"
                  className="absolute right-1 top-1 bg-background/90 px-1.5 py-0.5 font-mono text-[10px] text-foreground hover:text-primary"
                >
                  ×
                </button>
              </div>
              <div className="mt-1 flex justify-between">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move earlier"
                  className="px-1 font-mono text-[12px] text-ink-soft disabled:opacity-30 hover:text-primary"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === chosen.length - 1}
                  aria-label="Move later"
                  className="px-1 font-mono text-[12px] text-ink-soft disabled:opacity-30 hover:text-primary"
                >
                  →
                </button>
              </div>
            </figure>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mb-2 border border-primary px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-primary">
          {error}
        </p>
      ) : null}

      <div className="mb-3 flex items-center gap-3">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
          }}
          className="hidden"
          id="card-photo-upload"
        />
        <StampButton
          tone="ghost"
          size="sm"
          onClick={() => fileInput.current?.click()}
          disabled={uploading || chosen.length >= max}
        >
          {uploading ? 'Uploading…' : 'Upload a photo'}
        </StampButton>
        {chosen.length >= max ? (
          <MonoLabel size="xs">Full — remove one first</MonoLabel>
        ) : null}
      </div>

      {photos.length > 0 ? (
        <>
          <MonoLabel size="xs" className="mb-1.5">
            From your library
          </MonoLabel>
          <div className="grid max-h-[220px] grid-cols-4 gap-[3px] overflow-y-auto rounded-[4px] border border-border bg-card p-[3px] sm:grid-cols-6">
            {photos.map((photo) => {
              const picked = chosenUrls.has(photo.url)
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => add({ id: photo.id, url: photo.url })}
                  disabled={picked || chosen.length >= max}
                  aria-label={photo.event_title ?? 'Photograph'}
                  className={cn('block', picked && 'opacity-40')}
                >
                  <Frame src={photo.url} alt="" ratio="1/1" selected={picked} />
                </button>
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
