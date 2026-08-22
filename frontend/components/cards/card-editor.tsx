'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MonoLabel, StampButton } from '@/components/folio/primitives'
import { CardRenderer, type CardInteraction } from '@/components/cards/card-renderer'
import { TemplatePanel } from '@/components/cards/panels/template-panel'
import { ContentPanel } from '@/components/cards/panels/content-panel'
import { StylePanel } from '@/components/cards/panels/style-panel'
import { ElementsPanel } from '@/components/cards/panels/elements-panel'
import { SharePanel } from '@/components/cards/panels/share-panel'
import { cardsApi } from '@/lib/cards/api'
import {
  normalizeCustomization,
  normalizeProfile,
  type Card,
  type CardBundle,
  type CardCustomization,
  type CardProfileData,
  type CardStyle,
  type Catalog,
  type TemplateDefinition,
} from '@/lib/cards/types'
import { cn } from '@/lib/utils'

/**
 * The card editor.
 *
 * Five steps in the order people actually work: pick the look, write the words,
 * set the colours, add your own bits, then send it. On a phone the card sits
 * above the controls and stays visible while you type, because the whole point
 * is watching it change.
 *
 * Everything is autosaved. There is no Save button to forget, and no dialog
 * asking whether you meant it.
 */

export interface PickablePhoto {
  id: string
  url: string
  event_title?: string | null
}

export interface CardEditorProps {
  card: Card
  catalog: Catalog
  profile: CardProfileData
  photos: PickablePhoto[]
  /** The pinned template versions this card was created against. */
  pinned: CardBundle['templates']
  styles: CardBundle['styles']
}

type Tab = 'template' | 'content' | 'style' | 'elements' | 'share'

const TABS: { id: Tab; label: string }[] = [
  { id: 'template', label: 'Template' },
  { id: 'content', label: 'Words' },
  { id: 'style', label: 'Style' },
  { id: 'elements', label: 'Add' },
  { id: 'share', label: 'Share' },
]

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function CardEditor({ card, catalog, profile: initialProfile, photos, pinned, styles }: CardEditorProps) {
  const router = useRouter()
  const svgRef = useRef<SVGSVGElement>(null)

  const [tab, setTab] = useState<Tab>('template')
  const [title, setTitle] = useState(card.title)
  const [templateId, setTemplateId] = useState(card.templateId)
  const [styleId, setStyleId] = useState<string | null>(card.styleId)
  const [customization, setCustomization] = useState<CardCustomization>(() =>
    normalizeCustomization(card.customization)
  )
  const [profile, setProfile] = useState<CardProfileData>(() => normalizeProfile(initialProfile))
  const [isPublic, setIsPublic] = useState(card.isPublic)
  const [shareSlug, setShareSlug] = useState(card.shareSlug)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [error, setError] = useState<string | null>(null)

  /* ── What we are rendering ─────────────────────────────────────────────── */

  const template = useMemo(
    () => catalog.templates.find((entry) => entry.id === templateId) ?? catalog.templates[0],
    [catalog.templates, templateId]
  )

  /**
   * A card renders through the version it was pinned to, not through whatever
   * the catalogue is publishing today — until the user picks a new template,
   * at which point they have opted into the current one.
   */
  const definition: TemplateDefinition | null = useMemo(() => {
    if (templateId === card.templateId) {
      const key = `${card.templateId}@${card.templateVersion}`
      if (pinned[key]) return pinned[key].definition
    }
    return template?.definition ?? null
  }, [templateId, card.templateId, card.templateVersion, pinned, template])

  const style: CardStyle | null = useMemo(() => {
    const fromCatalog = catalog.styles.find((entry) => entry.id === styleId)
    if (fromCatalog) return fromCatalog
    return (styleId && styles[styleId]) || null
  }, [catalog.styles, styles, styleId])

  const allowedStyles = useMemo(() => {
    const allowed = template?.allowedStyleIds ?? []
    return allowed.length > 0
      ? catalog.styles.filter((entry) => allowed.includes(entry.id))
      : catalog.styles
  }, [catalog.styles, template])

  /* ── Saving ────────────────────────────────────────────────────────────── */

  const profileDirty = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firstRun = useRef(true)

  const save = useCallback(async () => {
    setSaveState('saving')
    setError(null)
    try {
      // The profile is shared between every card, so it is written first and
      // this card is then re-snapshotted against it. Other cards keep the
      // snapshot they were made with until their owner refreshes them.
      const savedProfile = profileDirty.current
      if (savedProfile) {
        await cardsApi.saveProfile(profile)
        profileDirty.current = false
      }

      const result = await cardsApi.update(card.id, {
        title,
        templateId,
        styleId,
        customization,
        isPublic,
      })
      setShareSlug(result.card.shareSlug)

      // Only re-snapshot when the words behind the card actually moved.
      if (savedProfile) {
        await cardsApi.regenerate(card.id)
      }

      setSaveState('saved')
    } catch (saveError) {
      setSaveState('error')
      setError((saveError as Error).message)
    }
  }, [card.id, customization, isPublic, profile, styleId, templateId, title])

  // Debounced: an editor that posted on every keystroke would feel slower, not
  // faster, and would fight the renderer for the main thread.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => void save(), 900)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [save])

  useEffect(() => () => router.refresh(), [router])

  /* ── Editing helpers ───────────────────────────────────────────────────── */

  const patchCustomization = useCallback((patch: Partial<CardCustomization>) => {
    setCustomization((current) => ({ ...current, ...patch }))
  }, [])

  const patchProfile = useCallback((patch: Partial<CardProfileData>) => {
    profileDirty.current = true
    setProfile((current) => ({ ...current, ...patch }))
  }, [])

  const movableIds = useMemo(() => {
    const ids = new Set<string>(customization.elements.map((element) => element.id))
    if (!definition?.capabilities.reposition) return ids
    const walk = (node: { id?: string; editable?: { position?: boolean }; children?: any[] }) => {
      if (node.id && node.editable?.position) ids.add(node.id)
      for (const child of node.children ?? []) walk(child)
    }
    walk(definition.root as never)
    return ids
  }, [customization.elements, definition])

  const interaction: CardInteraction = useMemo(
    () => ({
      selectedId,
      onSelect: setSelectedId,
      movableIds,
      onMove(id, dx, dy) {
        setCustomization((current) => {
          const element = current.elements.find((entry) => entry.id === id)
          if (element) {
            const canvas = definition?.canvas ?? { width: 1080, height: 1350 }
            return {
              ...current,
              elements: current.elements.map((entry) =>
                entry.id === id
                  ? {
                      ...entry,
                      x: Math.min(1.2, Math.max(-0.2, entry.x + dx / canvas.width)),
                      y: Math.min(1.2, Math.max(-0.2, entry.y + dy / canvas.height)),
                    }
                  : entry
              ),
            }
          }

          const existing = current.transforms[id] ?? { dx: 0, dy: 0, scale: 1, rotate: 0 }
          return {
            ...current,
            transforms: {
              ...current.transforms,
              [id]: { ...existing, dx: existing.dx + dx, dy: existing.dy + dy },
            },
          }
        })
      },
    }),
    [selectedId, movableIds, definition]
  )

  /* ── Preview sizing ────────────────────────────────────────────────────── */

  const previewRef = useRef<HTMLDivElement>(null)
  const [previewWidth, setPreviewWidth] = useState(320)
  const ratio = definition ? definition.canvas.width / definition.canvas.height : 0.8

  useEffect(() => {
    const container = previewRef.current
    if (!container) return

    const fit = () => {
      const available = container.clientWidth
      const maxHeight = window.innerHeight * (window.innerWidth >= 1024 ? 0.74 : 0.46)
      setPreviewWidth(Math.max(180, Math.min(available, maxHeight * ratio)))
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(container)
    window.addEventListener('resize', fit)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', fit)
    }
  }, [ratio])

  if (!definition) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <MonoLabel tone="primary">This template is no longer available</MonoLabel>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Pick another one and your words will move across unchanged.
        </p>
        <div className="mt-6">
          <StampButton href="/profile/cards" tone="primary" size="sm">
            Back to cards
          </StampButton>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-tabbar lg:pb-0">
      {/* ── Bar ───────────────────────────────────────────────────────────── */}
      <div className="sticky top-14 z-30 border-b border-border bg-background/95 backdrop-blur sm:top-16">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-2.5 sm:px-6">
          <Link
            href="/profile/cards"
            className="touch-target -ml-2 flex items-center px-2 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft transition-colors hover:text-foreground"
          >
            ← Cards
          </Link>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
            aria-label="Card name"
            className="min-w-0 flex-1 truncate bg-transparent font-serif text-lg text-foreground outline-none focus:underline focus:decoration-primary focus:underline-offset-4"
          />

          <SaveIndicator state={saveState} />
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-0 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-10 lg:py-8">
        {/* ── The card ────────────────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <div
            ref={previewRef}
            className="flex justify-center py-4 lg:py-0"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setSelectedId(null)
            }}
          >
            <div
              className="film-grain"
              style={{ boxShadow: '0 2px 10px var(--shadow-color)', lineHeight: 0 }}
            >
              <CardRenderer
                svgRef={svgRef}
                definition={definition}
                style={style}
                profile={profile}
                customization={customization}
                width={previewWidth}
                interaction={interaction}
                title={title}
              />
            </div>
          </div>

          <div className="hidden items-center justify-between border-t border-border pt-3 lg:flex">
            <MonoLabel size="xs">
              {template?.name} · {definition.canvas.width}×{definition.canvas.height}
              {style ? ` · ${style.name}` : ''}
            </MonoLabel>
            {templateId === card.templateId ? (
              <MonoLabel size="xs">v{card.templateVersion}</MonoLabel>
            ) : (
              <MonoLabel size="xs" tone="primary">
                v{template?.version} on save
              </MonoLabel>
            )}
          </div>
        </div>

        {/* ── The controls ────────────────────────────────────────────────── */}
        <div className="min-w-0">
          <div className="sticky top-[6.5rem] z-20 -mx-4 border-b border-border bg-background px-4 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:px-0">
            <div className="scrollbar-hide flex gap-1 overflow-x-auto">
              {TABS.map((entry) => {
                const active = entry.id === tab
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setTab(entry.id)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'relative shrink-0 px-3 py-3 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors',
                      active ? 'text-foreground' : 'text-ink-soft hover:text-foreground'
                    )}
                  >
                    {entry.label}
                    {active ? (
                      <span className="absolute inset-x-2 bottom-0 h-[2px] bg-primary" />
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>

          {error ? (
            <p className="mt-4 border border-primary px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
              {error}
            </p>
          ) : null}

          <div className="py-6">
            {tab === 'template' ? (
              <TemplatePanel
                catalog={catalog}
                templateId={templateId}
                onPick={(id) => {
                  setTemplateId(id)
                  const picked = catalog.templates.find((entry) => entry.id === id)
                  const allowed = picked?.allowedStyleIds ?? []
                  const stillAllowed =
                    !styleId || allowed.length === 0 || allowed.includes(styleId)
                  if (!stillAllowed || !styleId) setStyleId(picked?.defaultStyleId ?? null)
                }}
                profile={profile}
                customization={customization}
                styles={catalog.styles}
                currentStyleId={styleId}
              />
            ) : null}

            {tab === 'content' ? (
              <ContentPanel
                definition={definition}
                profile={profile}
                onProfileChange={patchProfile}
                customization={customization}
                onCustomizationChange={patchCustomization}
                photos={photos}
                style={style}
              />
            ) : null}

            {tab === 'style' ? (
              <StylePanel
                definition={definition}
                styles={allowedStyles}
                styleId={styleId}
                onStyleChange={setStyleId}
                customization={customization}
                onCustomizationChange={patchCustomization}
                profile={profile}
              />
            ) : null}

            {tab === 'elements' ? (
              <ElementsPanel
                definition={definition}
                customization={customization}
                onCustomizationChange={patchCustomization}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ) : null}

            {tab === 'share' ? (
              <SharePanel
                card={{ ...card, title, shareSlug }}
                definition={definition}
                svgRef={svgRef}
                isPublic={isPublic}
                onPublicChange={setIsPublic}
                onDeleted={() => router.push('/profile/cards')}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  const copy: Record<SaveState, string> = {
    idle: 'Autosaves',
    saving: 'Saving…',
    saved: 'Saved',
    error: 'Not saved',
  }
  return (
    <span
      className={cn(
        'shrink-0 font-mono text-[10px] uppercase tracking-[0.08em]',
        state === 'error' ? 'text-primary' : 'text-ink-soft'
      )}
      role="status"
    >
      {copy[state]}
    </span>
  )
}
