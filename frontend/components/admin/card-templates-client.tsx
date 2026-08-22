'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  LabelledBlock,
  MonoLabel,
  PageMasthead,
  SpecPill,
  StampButton,
} from '@/components/folio/primitives'
import { CardRenderer } from '@/components/cards/card-renderer'
import {
  Choice,
  Field,
  PanelSection,
  TextAreaField,
  TextField,
  ToggleRow,
} from '@/components/cards/controls'
import {
  cardsAdminApi,
  type AdminStyleRow,
  type AdminTemplateRow,
  type AdminTemplateVersion,
} from '@/lib/cards/api'
import { normalizeProfile, type CardProfileData, type TemplateDefinition } from '@/lib/cards/types'
import { cn } from '@/lib/utils'

/**
 * Card templates — the designer's side of the engine.
 *
 * A template is a document, so this screen edits a document: the definition on
 * the right, the card it produces on the left, updating as you type. Saving
 * never edits a version in place — it adds one, and publishing is a separate
 * decision — so a template can be reworked while thousands of cards keep
 * rendering the version they were made with.
 */

/** A stand-in person, so a template can be judged before anyone has used it. */
const SPECIMEN: CardProfileData = normalizeProfile({
  name: 'Ada Lovelace',
  username: 'ada',
  tagline: 'The first to see what the machine could be',
  occupation: 'Mathematician',
  education: 'Taught at home, in the mornings',
  location: 'London',
  bio: 'Wrote the first algorithm intended for a machine, and argued that the machine might one day compose music.',
  quote: 'That brain of mine is something more than merely mortal.',
  quoteAuthor: 'Ada Lovelace',
  currentChapter: 'Translating Menabrea, and adding notes three times as long as the paper.',
  nextChapter: 'A general theory of operations on symbols.',
  interests: ['Mathematics', 'Music', 'Horses', 'Poetical science', 'Engines'],
  traits: ['Precise', 'Restless', 'Certain'],
  stats: [
    { label: 'Notes', value: '7' },
    { label: 'Engines', value: '1' },
    { label: 'Years ahead', value: '100' },
  ],
  meters: [
    { label: 'Rigour', value: 96 },
    { label: 'Patience', value: 58 },
    { label: 'Imagination', value: 99 },
  ],
  achievements: [
    { title: 'Note G', year: '1843', note: 'The first published algorithm' },
    { title: 'Translated Menabrea', year: '1843' },
  ],
  timeline: [
    { year: '1815', title: 'Born in London' },
    { year: '1833', title: 'Met Charles Babbage', note: 'And the Difference Engine' },
    { year: '1843', title: 'Published the Notes' },
  ],
  socials: [{ platform: 'Letters', handle: 'to C. Babbage, Esq.' }],
  photos: [
    { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900' },
    { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900' },
    { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900' },
  ],
})

type Mode = { kind: 'list' } | { kind: 'template'; id: string } | { kind: 'style'; id: string | null }

export function CardTemplatesClient({
  initialTemplates,
  initialStyles,
}: {
  initialTemplates: AdminTemplateRow[]
  initialStyles: AdminStyleRow[]
}) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [styles, setStyles] = useState(initialStyles)
  const [mode, setMode] = useState<Mode>({ kind: 'list' })
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    try {
      const catalog = await cardsAdminApi.catalog()
      setTemplates(catalog.templates)
      setStyles(catalog.styles)
    } catch (reloadError) {
      setError((reloadError as Error).message)
    }
  }

  if (mode.kind === 'template') {
    return (
      <TemplateEditor
        templateId={mode.id}
        styles={styles}
        onBack={() => {
          setMode({ kind: 'list' })
          void reload()
        }}
      />
    )
  }

  if (mode.kind === 'style') {
    return (
      <StyleEditor
        style={styles.find((entry) => entry.id === mode.id) ?? null}
        templates={templates}
        onBack={() => {
          setMode({ kind: 'list' })
          void reload()
        }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12">
      <PageMasthead
        eyebrow="Admin — Cards"
        title="Card templates"
        meta={`${templates.length} templates · ${styles.length} base styles`}
        rule="ink"
        actions={
          <>
            <StampButton href="/admin" tone="ghost" size="sm">
              ← Admin
            </StampButton>
            <StampButton tone="ghost" size="sm" onClick={() => setMode({ kind: 'style', id: null })}>
              New style
            </StampButton>
            <StampButton
              tone="primary"
              size="sm"
              onClick={() => setMode({ kind: 'template', id: '' })}
            >
              New template
            </StampButton>
          </>
        }
      />

      {error ? (
        <p className="mt-4 border border-primary px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
          {error}
        </p>
      ) : null}

      <LabelledBlock label="Templates" className="mt-10">
        <div className="overflow-x-auto rounded-[4px] border border-border bg-card">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-border">
                {['Template', 'Category', 'Status', 'Version', 'Cards', ''].map((heading) => (
                  <th key={heading} className="px-3 py-2.5">
                    <MonoLabel size="xs">{heading}</MonoLabel>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-3">
                    <div className="font-serif text-base text-foreground">{template.name}</div>
                    <MonoLabel size="xs">{template.id}</MonoLabel>
                  </td>
                  <td className="px-3 py-3">
                    <MonoLabel size="xs">{template.category}</MonoLabel>
                  </td>
                  <td className="px-3 py-3">
                    <SpecPill
                      tone={
                        template.status === 'published'
                          ? 'secondary'
                          : template.status === 'draft'
                            ? 'primary'
                            : 'muted'
                      }
                      className="px-2 py-1"
                    >
                      {template.status}
                    </SpecPill>
                  </td>
                  <td className="px-3 py-3">
                    <MonoLabel size="xs">
                      v{template.current_version} of {template.version_count}
                    </MonoLabel>
                  </td>
                  <td className="px-3 py-3">
                    <MonoLabel size="xs">{template.card_count}</MonoLabel>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setMode({ kind: 'template', id: template.id })}
                      className="font-mono text-[11px] uppercase tracking-[0.06em] text-primary underline-offset-4 hover:underline"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LabelledBlock>

      <LabelledBlock label="Base styles" className="mt-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {styles.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => setMode({ kind: 'style', id: style.id })}
              className="overflow-hidden rounded-[2px] border border-border text-left transition-colors hover:border-foreground"
            >
              <div className="flex h-16" aria-hidden="true">
                <span className="flex-[3]" style={{ background: style.tokens?.colors?.background }} />
                <span className="flex-1" style={{ background: style.tokens?.colors?.ink }} />
                <span className="flex-1" style={{ background: style.tokens?.colors?.accent }} />
                <span className="flex-1" style={{ background: style.tokens?.colors?.highlight }} />
              </div>
              <div className="px-3 py-2">
                <div className="font-serif text-base text-foreground">{style.name}</div>
                <MonoLabel size="xs">
                  {style.id} · {style.status}
                  {style.is_seed ? ' · shipped' : ''}
                </MonoLabel>
              </div>
            </button>
          ))}
        </div>
      </LabelledBlock>
    </div>
  )
}

/* ── Template editor ──────────────────────────────────────────────────────── */

const BLANK_DEFINITION = {
  canvas: { width: 1080, height: 1350, background: 'background', padding: 80 },
  textStyles: {},
  root: {
    type: 'stack',
    direction: 'vertical',
    gap: 'md',
    height: 'fill',
    children: [
      {
        id: 'hero',
        type: 'image',
        width: 'fill',
        editable: { image: true },
        props: { src: '{{profile.photos[0].url}}', fit: 'cover', ratio: 1.6, radius: 'image' },
      },
      {
        id: 'name',
        type: 'text',
        props: { style: 'heroName', value: '{{profile.name | default:Your name}}', fit: true },
      },
      {
        id: 'role',
        type: 'text',
        props: { style: 'subtitle', parts: ['{{profile.occupation}}', '{{profile.location}}'] },
      },
      { type: 'spacer', size: 'flex' },
      {
        id: 'credit',
        type: 'text',
        props: { style: 'handle', value: '{{profile.username | prefix:@}}' },
      },
    ],
  },
  capabilities: {
    accentColor: true,
    backgroundColor: true,
    inkColor: false,
    fontChange: true,
    styleSwap: true,
    customText: true,
    photoReplacement: true,
    reposition: false,
    resize: false,
    sectionVisibility: true,
    decorations: true,
    imageTreatment: true,
    maxCustomElements: 3,
  },
  supportedFields: ['name', 'occupation', 'location', 'photos', 'username'],
}

function TemplateEditor({
  templateId,
  styles,
  onBack,
}: {
  templateId: string
  styles: AdminStyleRow[]
  onBack(): void
}) {
  const isNew = templateId === ''

  const [meta, setMeta] = useState({
    id: '',
    name: '',
    description: '',
    category: 'general',
    defaultStyleId: styles[0]?.id ?? '',
    sortOrder: 500,
    isPremium: false,
  })
  const [source, setSource] = useState(() => JSON.stringify(BLANK_DEFINITION, null, 2))
  const [versions, setVersions] = useState<AdminTemplateVersion[]>([])
  const [row, setRow] = useState<AdminTemplateRow | null>(null)
  const [previewStyleId, setPreviewStyleId] = useState(styles[0]?.id ?? '')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) return
    void (async () => {
      try {
        const data = await cardsAdminApi.template(templateId)
        setRow(data.template)
        setVersions(data.versions)
        setMeta({
          id: data.template.id,
          name: data.template.name,
          description: data.template.description ?? '',
          category: data.template.category,
          defaultStyleId: data.template.default_style_id ?? styles[0]?.id ?? '',
          sortOrder: data.template.sort_order,
          isPremium: data.template.is_premium,
        })
        setPreviewStyleId(data.template.default_style_id ?? styles[0]?.id ?? '')
        const current =
          data.versions.find((version) => version.version === data.template.current_version) ??
          data.versions[0]
        if (current) setSource(JSON.stringify(current.definition, null, 2))
      } catch (loadError) {
        setError((loadError as Error).message)
      }
    })()
  }, [isNew, templateId, styles])

  // The preview is driven by the text in the box, so a syntax error shows up as
  // a message rather than as a blank card with no explanation.
  const parsed = useMemo(() => {
    try {
      return { definition: JSON.parse(source) as TemplateDefinition, problem: null as string | null }
    } catch (parseError) {
      return { definition: null, problem: (parseError as Error).message }
    }
  }, [source])

  const previewStyle = useMemo(() => {
    const found = styles.find((entry) => entry.id === previewStyleId)
    return found ? { id: found.id, name: found.name, tokens: found.tokens } : null
  }, [styles, previewStyleId])

  async function saveMeta() {
    setBusy('meta')
    setError(null)
    setMessage(null)
    try {
      await cardsAdminApi.saveTemplate({
        id: meta.id,
        name: meta.name,
        description: meta.description || undefined,
        category: meta.category,
        defaultStyleId: meta.defaultStyleId || null,
        allowedStyleIds: [],
        sortOrder: meta.sortOrder,
        isPremium: meta.isPremium,
      })
      setMessage('Details saved.')
    } catch (saveError) {
      setError((saveError as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function saveVersion(publish: boolean) {
    if (!parsed.definition) {
      setError('The definition is not valid JSON.')
      return
    }
    setBusy(publish ? 'publish' : 'draft')
    setError(null)
    setMessage(null)
    try {
      if (isNew) await saveMeta()
      const version = await cardsAdminApi.createVersion(meta.id, {
        definition: parsed.definition,
        notes: notes || undefined,
        publish,
      })
      setVersions((current) => [version, ...current])
      setNotes('')
      setMessage(
        publish ? `Version ${version.version} is live.` : `Version ${version.version} saved as a draft.`
      )
    } catch (saveError) {
      setError((saveError as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function setStatus(status: 'draft' | 'published' | 'archived', version?: number) {
    setBusy('status')
    setError(null)
    try {
      const updated = await cardsAdminApi.setStatus(meta.id, { status, version })
      setRow(updated)
      setMessage(`Now ${updated.status}, showing v${updated.current_version}.`)
    } catch (statusError) {
      setError((statusError as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function duplicate() {
    const newId = window.prompt('An id for the copy (lowercase, numbers, underscores):')
    if (!newId) return
    setBusy('duplicate')
    setError(null)
    try {
      await cardsAdminApi.duplicate(meta.id, newId)
      setMessage(`Copied to ${newId}. Open it from the list.`)
    } catch (duplicateError) {
      setError((duplicateError as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12">
      <PageMasthead
        eyebrow="Admin — Cards"
        title={isNew ? 'New template' : meta.name || meta.id}
        meta={
          row
            ? `${row.status} · v${row.current_version} of ${row.version_count} · ${row.card_count} card${row.card_count === 1 ? '' : 's'} using it`
            : 'Not saved yet'
        }
        rule="ink"
        actions={
          <StampButton tone="ghost" size="sm" onClick={onBack}>
            ← All templates
          </StampButton>
        }
      />

      {error ? (
        <p className="mt-4 border border-primary px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 border border-secondary px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-secondary">
          {message}
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-10">
        {/* ── Live proof ─────────────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <MonoLabel size="xs" className="mb-2">
            Proof — a specimen profile
          </MonoLabel>
          {parsed.definition ? (
            <div style={{ boxShadow: '0 2px 10px var(--shadow-color)', lineHeight: 0 }}>
              <CardRenderer
                definition={parsed.definition}
                style={previewStyle}
                profile={SPECIMEN}
                title="Proof"
              />
            </div>
          ) : (
            <div className="rounded-[4px] border border-dashed border-primary px-4 py-10 text-center">
              <MonoLabel tone="primary" size="xs">
                {parsed.problem}
              </MonoLabel>
            </div>
          )}

          <div className="mt-3">
            <MonoLabel size="xs" className="mb-1.5">
              Preview under
            </MonoLabel>
            <select
              value={previewStyleId}
              onChange={(event) => setPreviewStyleId(event.target.value)}
              className="min-h-[44px] w-full rounded-[2px] border border-border bg-background px-3 font-mono text-[12px] text-foreground outline-none focus:border-primary"
            >
              {styles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── The document ───────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-7">
          <PanelSection title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Id" hint="Lowercase, numbers and underscores. Permanent.">
                <TextField
                  value={meta.id}
                  onChange={(id) => setMeta({ ...meta, id })}
                  placeholder="retro_film_01"
                  mono
                />
              </Field>
              <Field label="Name">
                <TextField
                  value={meta.name}
                  onChange={(name) => setMeta({ ...meta, name })}
                  placeholder="Retro Film"
                />
              </Field>
              <Field label="Category">
                <TextField
                  value={meta.category}
                  onChange={(category) => setMeta({ ...meta, category })}
                  placeholder="editorial"
                />
              </Field>
              <Field label="Default style">
                <select
                  value={meta.defaultStyleId}
                  onChange={(event) => setMeta({ ...meta, defaultStyleId: event.target.value })}
                  className="min-h-[44px] w-full rounded-[2px] border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                >
                  {styles.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <TextField
                  value={meta.description}
                  onChange={(description) => setMeta({ ...meta, description })}
                  placeholder="What this template is for, in one line."
                />
              </Field>
            </div>
            <div className="mt-4">
              <ToggleRow
                label="Premium"
                note="Marks the template as paid. It still appears in the catalogue."
                checked={meta.isPremium}
                onChange={(isPremium) => setMeta({ ...meta, isPremium })}
              />
            </div>
            <div className="mt-4">
              <StampButton tone="ghost" size="sm" onClick={() => void saveMeta()} disabled={busy !== null}>
                {busy === 'meta' ? 'Saving…' : 'Save details'}
              </StampButton>
            </div>
          </PanelSection>

          <PanelSection
            title="Definition"
            note="Canvas, layout tree, capabilities. Validated on the server before it is stored — a template can never carry code."
          >
            <textarea
              value={source}
              onChange={(event) => setSource(event.target.value)}
              spellCheck={false}
              rows={26}
              className="w-full rounded-[2px] border border-border bg-background p-3 font-mono text-[12px] leading-relaxed text-foreground outline-none focus:border-primary"
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="What changed">
                <TextField
                  value={notes}
                  onChange={setNotes}
                  placeholder="Tightened the masthead"
                  maxLength={240}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <StampButton
                  tone="ghost"
                  size="sm"
                  onClick={() => void saveVersion(false)}
                  disabled={busy !== null || !parsed.definition || !meta.id}
                >
                  {busy === 'draft' ? 'Saving…' : 'Save as draft'}
                </StampButton>
                <StampButton
                  tone="primary"
                  size="sm"
                  onClick={() => void saveVersion(true)}
                  disabled={busy !== null || !parsed.definition || !meta.id}
                >
                  {busy === 'publish' ? 'Publishing…' : 'Publish'}
                </StampButton>
              </div>
            </div>
          </PanelSection>

          {!isNew ? (
            <PanelSection
              title="Versions"
              note="Cards keep the version they were made with. Changing what is live never rewrites one."
            >
              <ul className="divide-y divide-border rounded-[2px] border border-border bg-card">
                {versions.map((version) => {
                  const live = row?.current_version === version.version
                  return (
                    <li
                      key={version.id}
                      className="flex flex-wrap items-center gap-3 px-3 py-2.5"
                    >
                      <MonoLabel size="xs" tone={live ? 'primary' : 'muted'} className="w-14 shrink-0">
                        v{version.version}
                      </MonoLabel>
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {version.notes || '—'}
                      </span>
                      <MonoLabel size="xs" className="shrink-0">
                        {new Date(version.created_at).toLocaleDateString()}
                      </MonoLabel>
                      <button
                        type="button"
                        onClick={() => setSource(JSON.stringify(version.definition, null, 2))}
                        className="shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-soft hover:text-foreground"
                      >
                        Load
                      </button>
                      {live ? (
                        <SpecPill tone="secondary" className="px-2 py-1">
                          Live
                        </SpecPill>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void setStatus('published', version.version)}
                          disabled={busy !== null}
                          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] text-primary hover:underline"
                        >
                          Make live
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                <StampButton tone="ghost" size="sm" onClick={() => void duplicate()} disabled={busy !== null}>
                  Duplicate
                </StampButton>
                {row?.status === 'published' ? (
                  <StampButton
                    tone="outline"
                    size="sm"
                    onClick={() => void setStatus('archived')}
                    disabled={busy !== null}
                  >
                    Archive
                  </StampButton>
                ) : (
                  <StampButton
                    tone="ghost"
                    size="sm"
                    onClick={() => void setStatus('published')}
                    disabled={busy !== null}
                  >
                    Publish template
                  </StampButton>
                )}
              </div>
            </PanelSection>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/* ── Style editor ─────────────────────────────────────────────────────────── */

const COLOR_ROLES = [
  'background',
  'surface',
  'surfaceAlt',
  'ink',
  'inkSoft',
  'accent',
  'accentInk',
  'border',
  'highlight',
] as const

function StyleEditor({
  style,
  templates,
  onBack,
}: {
  style: AdminStyleRow | null
  templates: AdminTemplateRow[]
  onBack(): void
}) {
  const [id, setId] = useState(style?.id ?? '')
  const [name, setName] = useState(style?.name ?? '')
  const [description, setDescription] = useState(style?.description ?? '')
  const [status, setStatus] = useState(style?.status ?? 'draft')
  const [tokens, setTokens] = useState(() =>
    JSON.stringify(style?.tokens ?? BLANK_STYLE_TOKENS, null, 2)
  )
  const [previewTemplateId, setPreviewTemplateId] = useState(
    templates.find((template) => template.status === 'published')?.id ?? ''
  )
  const [preview, setPreview] = useState<TemplateDefinition | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!previewTemplateId) return
    void (async () => {
      try {
        const data = await cardsAdminApi.template(previewTemplateId)
        const current =
          data.versions.find((version) => version.version === data.template.current_version) ??
          data.versions[0]
        setPreview(current?.definition ?? null)
      } catch {
        setPreview(null)
      }
    })()
  }, [previewTemplateId])

  const parsed = useMemo(() => {
    try {
      return { tokens: JSON.parse(tokens), problem: null as string | null }
    } catch (parseError) {
      return { tokens: null, problem: (parseError as Error).message }
    }
  }, [tokens])

  function setColor(role: string, value: string) {
    if (!parsed.tokens) return
    const next = {
      ...parsed.tokens,
      colors: { ...(parsed.tokens.colors ?? {}), [role]: value },
    }
    setTokens(JSON.stringify(next, null, 2))
  }

  async function save() {
    if (!parsed.tokens) {
      setError('The tokens are not valid JSON.')
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await cardsAdminApi.saveStyle({
        id,
        name,
        description: description || undefined,
        tokens: parsed.tokens,
        status: status as 'draft' | 'published' | 'archived',
        sortOrder: style?.sort_order ?? 500,
      })
      setMessage('Style saved.')
    } catch (saveError) {
      setError((saveError as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12">
      <PageMasthead
        eyebrow="Admin — Cards"
        title={style ? style.name : 'New base style'}
        meta={style?.is_seed ? 'Shipped with the app — edits here are overwritten on deploy' : 'Custom style'}
        rule="ink"
        actions={
          <StampButton tone="ghost" size="sm" onClick={onBack}>
            ← All templates
          </StampButton>
        }
      />

      {error ? (
        <p className="mt-4 border border-primary px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 border border-secondary px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-secondary">
          {message}
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-10">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <MonoLabel size="xs" className="mb-2">
            The same template, under this style
          </MonoLabel>
          {preview && parsed.tokens ? (
            <div style={{ boxShadow: '0 2px 10px var(--shadow-color)', lineHeight: 0 }}>
              <CardRenderer
                definition={preview}
                style={{ id: id || 'draft', name: name || 'Draft', tokens: parsed.tokens }}
                profile={SPECIMEN}
                title="Proof"
              />
            </div>
          ) : (
            <div className="rounded-[4px] border border-dashed border-border px-4 py-10 text-center">
              <MonoLabel size="xs">{parsed.problem ?? 'Pick a template to preview against'}</MonoLabel>
            </div>
          )}

          <div className="mt-3">
            <select
              value={previewTemplateId}
              onChange={(event) => setPreviewTemplateId(event.target.value)}
              className="min-h-[44px] w-full rounded-[2px] border border-border bg-background px-3 font-mono text-[12px] text-foreground outline-none focus:border-primary"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="min-w-0 space-y-7">
          <PanelSection title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Id" hint="Lowercase, numbers and underscores.">
                <TextField value={id} onChange={setId} placeholder="retro" mono />
              </Field>
              <Field label="Name">
                <TextField value={name} onChange={setName} placeholder="Retro" />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <TextField
                  value={description}
                  onChange={setDescription}
                  placeholder="Toned paper, heavy grain, every photograph aged."
                />
              </Field>
            </div>
            <div className="mt-4">
              <MonoLabel size="xs" className="mb-1.5">
                Status
              </MonoLabel>
              <Choice
                columns={3}
                value={status}
                onChange={(value) => setStatus(value as typeof status)}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Published' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
            </div>
          </PanelSection>

          {parsed.tokens ? (
            <PanelSection title="Palette" note="The nine roles every template is written against.">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {COLOR_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-2.5">
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[2px] border border-border">
                      <span
                        className="block h-full w-full"
                        style={{ background: parsed.tokens.colors?.[role] ?? '#000000' }}
                      />
                      <input
                        type="color"
                        value={parsed.tokens.colors?.[role] ?? '#000000'}
                        onChange={(event) => setColor(role, event.target.value)}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        aria-label={role}
                      />
                    </span>
                    <span className="min-w-0">
                      <MonoLabel size="xs" className="truncate">
                        {role}
                      </MonoLabel>
                      <span className="block font-mono text-[10px] text-ink-soft">
                        {parsed.tokens.colors?.[role]}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </PanelSection>
          ) : null}

          <PanelSection
            title="Tokens"
            note="Fonts, radius, spacing, effects and the named type roles. Validated on the server."
          >
            <textarea
              value={tokens}
              onChange={(event) => setTokens(event.target.value)}
              spellCheck={false}
              rows={24}
              className="w-full rounded-[2px] border border-border bg-background p-3 font-mono text-[12px] leading-relaxed text-foreground outline-none focus:border-primary"
            />
            <div className="mt-4">
              <StampButton tone="primary" size="sm" onClick={() => void save()} disabled={busy || !id || !name}>
                {busy ? 'Saving…' : 'Save style'}
              </StampButton>
            </div>
          </PanelSection>
        </div>
      </div>
    </div>
  )
}

const BLANK_STYLE_TOKENS = {
  colors: {
    background: '#F5F0E8',
    surface: '#FDFAF5',
    surfaceAlt: '#EBE4D8',
    ink: '#1C1814',
    inkSoft: '#736859',
    accent: '#B85C38',
    accentInk: '#FDFAF5',
    border: '#D8D1C4',
    highlight: '#3A7D6E',
  },
  fonts: { heading: 'serif', body: 'sans', mono: 'mono' },
  radius: { card: 0, image: 0, pill: 999 },
  spacing: { xs: 10, sm: 18, md: 30, lg: 52, xl: 84 },
  effects: { grain: 0.05, vignette: 0, imageTreatment: 'none', borderWidth: 2, rule: 2 },
  textStyles: {
    heroName: { family: 'serif', size: 86, lineHeight: 1, letterSpacing: -1.2, color: '#1C1814' },
    subtitle: { family: 'sans', size: 31, lineHeight: 1.3, color: '#736859' },
    body: { family: 'sans', size: 28, lineHeight: 1.55, color: '#1C1814' },
    label: {
      family: 'mono',
      size: 19,
      letterSpacing: 2.4,
      transform: 'upper',
      color: '#736859',
    },
    handle: { family: 'mono', size: 22, letterSpacing: 1.6, color: '#736859' },
  },
}
