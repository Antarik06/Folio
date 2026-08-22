import crypto from 'crypto'
import { query } from '../db'
import { HttpError } from '../utils/httpError'
import { ensureCatalogSeeded } from './cardCatalog'
import {
  cardProfileSchema,
  customizationSchema,
  describeZodError,
  styleTokensSchema,
  templateDefinitionSchema,
  type CardCustomization,
  type CardProfileData,
  type Capabilities,
  type TemplateDefinition,
} from '../schema/cardSchema'

/**
 * Cards — the engine's server half.
 *
 * Three jobs, and they are worth naming separately:
 *
 * · Catalogue. Which templates and styles exist, at which versions. Read
 *   constantly and written rarely, so it is cached in process.
 *
 * · Cards. One user's saved compositions. Each pins the template version and
 *   carries a snapshot of the profile it was built from, because a card that
 *   silently rewrote itself after being shared would be a bug, not a feature.
 *
 * · Boundaries. A customisation arriving from a browser is not trusted: it is
 *   filtered against the template's own declared capabilities before storage,
 *   so a user cannot move an element a designer pinned by editing a payload.
 */

const CATALOG_TTL_MS = 60_000

export interface CatalogStyle {
  id: string
  name: string
  description: string | null
  tokens: unknown
}

export interface CatalogTemplate {
  id: string
  name: string
  description: string | null
  category: string
  thumbnailUrl: string | null
  version: number
  definition: TemplateDefinition
  defaultStyleId: string | null
  allowedStyleIds: string[]
  isPremium: boolean
}

export interface Catalog {
  templates: CatalogTemplate[]
  styles: CatalogStyle[]
  categories: string[]
}

let catalogCache: { at: number; value: Catalog } | null = null

function invalidateCatalog() {
  catalogCache = null
}

async function loadCatalog(): Promise<Catalog> {
  const templatesRes = await query(
    `SELECT t.id, t.name, t.description, t.category, t.thumbnail_url,
            t.current_version, t.default_style_id, t.allowed_style_ids, t.is_premium,
            v.definition
       FROM public.card_templates t
       JOIN public.card_template_versions v
         ON v.template_id = t.id AND v.version = t.current_version
      WHERE t.status = 'published'
      ORDER BY t.sort_order, t.name`
  )

  const stylesRes = await query(
    `SELECT id, name, description, tokens
       FROM public.card_styles
      WHERE status = 'published'
      ORDER BY sort_order, name`
  )

  const templates: CatalogTemplate[] = templatesRes.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    thumbnailUrl: row.thumbnail_url,
    version: row.current_version,
    definition: row.definition,
    defaultStyleId: row.default_style_id,
    allowedStyleIds: row.allowed_style_ids ?? [],
    isPremium: row.is_premium === true,
  }))

  return {
    templates,
    styles: stylesRes.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      tokens: row.tokens,
    })),
    categories: [...new Set(templates.map((t) => t.category))],
  }
}

async function getCatalog(): Promise<Catalog> {
  await ensureCatalogSeeded()
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS) {
    return catalogCache.value
  }
  const value = await loadCatalog()
  catalogCache = { at: Date.now(), value }
  return value
}

/* ── Template version lookup ──────────────────────────────────────────────── */

async function loadTemplateVersion(
  templateId: string,
  version: number
): Promise<{ definition: TemplateDefinition; name: string } | null> {
  const res = await query(
    `SELECT v.definition, t.name
       FROM public.card_template_versions v
       JOIN public.card_templates t ON t.id = v.template_id
      WHERE v.template_id = $1 AND v.version = $2`,
    [templateId, version]
  )
  const row = res.rows[0]
  return row ? { definition: row.definition, name: row.name } : null
}

/* ── Capability enforcement ───────────────────────────────────────────────── */

interface NodeInfo {
  editable: Record<string, boolean>
  type: string
}

/** Flattens a definition into the id → node map the filters below need. */
function collectNodes(node: any, into = new Map<string, NodeInfo>()): Map<string, NodeInfo> {
  if (!node || typeof node !== 'object') return into
  if (typeof node.id === 'string') {
    into.set(node.id, { editable: node.editable ?? {}, type: node.type })
  }
  for (const child of Array.isArray(node.children) ? node.children : []) {
    collectNodes(child, into)
  }
  return into
}

/**
 * Filters a customisation down to what the template actually permits.
 *
 * The editor already hides controls a template disallows; this is the half that
 * matters, because the editor is not the only thing that can send a PATCH.
 */
export function applyCapabilityBoundaries(
  input: Partial<CardCustomization>,
  definition: TemplateDefinition
): CardCustomization {
  const parsed = customizationSchema.safeParse({
    styleId: input.styleId,
    colors: input.colors ?? {},
    fonts: input.fonts ?? {},
    content: input.content ?? {},
    images: input.images ?? {},
    visibility: input.visibility ?? {},
    transforms: input.transforms ?? {},
    elements: input.elements ?? [],
    effects: input.effects ?? {},
  })
  if (!parsed.success) {
    throw new HttpError(400, `Invalid customisation — ${describeZodError(parsed.error)}`)
  }

  const custom = parsed.data
  const caps: Capabilities = definition.capabilities
  const nodes = collectNodes(definition.root)

  const colors: Record<string, string> = {}
  for (const [key, value] of Object.entries(custom.colors)) {
    if (key === 'accent' && caps.accentColor) colors.accent = value
    else if (key === 'background' && caps.backgroundColor) colors.background = value
    else if (key === 'ink' && caps.inkColor) colors.ink = value
    else if (key === 'surface' && caps.backgroundColor) colors.surface = value
  }

  const content: CardCustomization['content'] = {}
  if (caps.customText) {
    for (const [id, value] of Object.entries(custom.content)) {
      const node = nodes.get(id)
      if (node && node.editable.content !== false) content[id] = value
    }
  }

  const images: CardCustomization['images'] = {}
  if (caps.photoReplacement) {
    for (const [id, value] of Object.entries(custom.images)) {
      const node = nodes.get(id)
      if (node && node.editable.image !== false) images[id] = value
    }
  }

  const visibility: CardCustomization['visibility'] = {}
  if (caps.sectionVisibility) {
    for (const [id, value] of Object.entries(custom.visibility)) {
      const node = nodes.get(id)
      if (node && node.editable.visibility !== false) visibility[id] = value
    }
  }

  const transforms: CardCustomization['transforms'] = {}
  for (const [id, value] of Object.entries(custom.transforms)) {
    const node = nodes.get(id)
    if (!node) continue
    const canMove = caps.reposition && node.editable.position !== false
    const canSize = caps.resize && node.editable.size !== false
    if (!canMove && !canSize) continue
    transforms[id] = {
      dx: canMove ? value.dx : 0,
      dy: canMove ? value.dy : 0,
      scale: canSize ? value.scale : 1,
      rotate: canMove ? value.rotate : 0,
    }
  }

  return {
    styleId: caps.styleSwap ? custom.styleId : undefined,
    colors,
    fonts: caps.fontChange ? custom.fonts : {},
    content,
    images,
    visibility,
    transforms,
    elements: custom.elements.slice(0, caps.maxCustomElements),
    effects: caps.imageTreatment ? custom.effects : {},
  }
}

/* ── Card profile ─────────────────────────────────────────────────────────── */

/**
 * Everyone gets a card, so everyone needs a profile behind one. This builds the
 * starting point from what Folio already knows: their name, their handle, their
 * bio, their own photographs.
 */
async function buildDefaultProfileData(userId: string): Promise<CardProfileData> {
  const profileRes = await query(
    `SELECT full_name, handle, bio, avatar_url, created_at
       FROM public.profiles WHERE id = $1`,
    [userId]
  )
  const profile = profileRes.rows[0]
  if (!profile) throw new HttpError(404, 'Profile not found.')

  const photosRes = await query(
    `SELECT p.id, COALESCE(p.blob_url, p.thumbnail_url) AS url
       FROM public.photos p
      WHERE p.uploader_id = $1 AND p.status = 'approved'
      ORDER BY p.created_at DESC
      LIMIT 6`,
    [userId]
  )

  const photos = [
    ...(profile.avatar_url ? [{ url: profile.avatar_url }] : []),
    ...photosRes.rows.filter((r: any) => !!r.url).map((r: any) => ({ id: r.id, url: r.url })),
  ].slice(0, 8)

  return cardProfileSchema.parse({
    name: profile.full_name || '',
    username: profile.handle || '',
    bio: profile.bio || '',
    photos,
  })
}

async function ensureCardProfile(userId: string): Promise<CardProfileData> {
  const res = await query('SELECT data FROM public.card_profiles WHERE user_id = $1', [userId])
  if (res.rows[0]) {
    const parsed = cardProfileSchema.safeParse(res.rows[0].data)
    // A row written by an older schema still has to render; fill the gaps.
    if (parsed.success) return parsed.data
    return cardProfileSchema.parse({ ...(res.rows[0].data ?? {}) })
  }

  const data = await buildDefaultProfileData(userId)
  await query(
    `INSERT INTO public.card_profiles (user_id, data)
          VALUES ($1, $2::jsonb)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, JSON.stringify(data)]
  )
  return data
}

/* ── Cards ────────────────────────────────────────────────────────────────── */

function newShareSlug(): string {
  return crypto.randomBytes(8).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function mapCard(row: any) {
  return {
    id: row.id,
    title: row.title,
    templateId: row.template_id,
    templateVersion: row.template_version,
    styleId: row.style_id,
    customization: row.customization ?? {},
    profileSnapshot: row.profile_snapshot ?? {},
    shareSlug: row.share_slug,
    isPublic: row.is_public,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export type Card = ReturnType<typeof mapCard>

/**
 * Gathers every template version and style a set of cards renders through.
 *
 * Cards pin versions, so the live catalogue is not enough — a card made against
 * version 2 needs version 2 shipped alongside it even after version 3 lands.
 */
async function loadRenderBundles(cards: Card[]) {
  const templateKeys = [...new Set(cards.map((c) => `${c.templateId}@${c.templateVersion}`))]
  const styleIds = [...new Set(cards.map((c) => c.styleId).filter(Boolean))] as string[]

  const templates: Record<string, { id: string; name: string; version: number; definition: unknown }> =
    {}
  if (templateKeys.length > 0) {
    const res = await query(
      `SELECT v.template_id, v.version, v.definition, t.name
         FROM public.card_template_versions v
         JOIN public.card_templates t ON t.id = v.template_id
        WHERE (v.template_id, v.version) IN (
                SELECT * FROM UNNEST($1::text[], $2::int[])
              )`,
      [
        templateKeys.map((k) => k.split('@')[0]),
        templateKeys.map((k) => Number(k.split('@')[1])),
      ]
    )
    for (const row of res.rows) {
      templates[`${row.template_id}@${row.version}`] = {
        id: row.template_id,
        name: row.name,
        version: row.version,
        definition: row.definition,
      }
    }
  }

  const styles: Record<string, CatalogStyle> = {}
  if (styleIds.length > 0) {
    const res = await query(
      `SELECT id, name, description, tokens FROM public.card_styles WHERE id = ANY($1::text[])`,
      [styleIds]
    )
    for (const row of res.rows) {
      styles[row.id] = {
        id: row.id,
        name: row.name,
        description: row.description,
        tokens: row.tokens,
      }
    }
  }

  return { templates, styles }
}

/**
 * The first card. Picks the template the catalogue leads with, so a brand new
 * account opens the Cards screen onto something finished rather than onto an
 * empty state and a decision.
 */
async function createDefaultCard(userId: string): Promise<Card | null> {
  const catalog = await getCatalog()
  const template = catalog.templates[0]
  if (!template) return null

  const snapshot = await ensureCardProfile(userId)
  const res = await query(
    `INSERT INTO public.cards
           (owner_id, title, template_id, template_version, style_id,
            customization, profile_snapshot, is_primary)
          VALUES ($1, $2, $3, $4, $5, '{}'::jsonb, $6::jsonb, TRUE)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [
      userId,
      template.name,
      template.id,
      template.version,
      template.defaultStyleId ?? catalog.styles[0]?.id ?? null,
      JSON.stringify(snapshot),
    ]
  )
  return res.rows[0] ? mapCard(res.rows[0]) : null
}

export const cardService = {
  getCatalog,

  async getProfile(userId: string) {
    await ensureCatalogSeeded()
    return ensureCardProfile(userId)
  },

  async saveProfile(userId: string, input: unknown) {
    const parsed = cardProfileSchema.safeParse(input)
    if (!parsed.success) {
      throw new HttpError(400, `Invalid profile — ${describeZodError(parsed.error)}`)
    }
    const res = await query(
      `INSERT INTO public.card_profiles (user_id, data)
            VALUES ($1, $2::jsonb)
       ON CONFLICT (user_id) DO UPDATE
            SET data = EXCLUDED.data, updated_at = NOW()
        RETURNING data`,
      [userId, JSON.stringify(parsed.data)]
    )
    return res.rows[0].data
  },

  /** Every card the user owns, plus the definitions needed to render them. */
  async listCards(userId: string) {
    await ensureCatalogSeeded()
    let res = await query(
      'SELECT * FROM public.cards WHERE owner_id = $1 ORDER BY is_primary DESC, created_at DESC',
      [userId]
    )

    if (res.rowCount === 0) {
      const created = await createDefaultCard(userId)
      if (created) {
        res = await query(
          'SELECT * FROM public.cards WHERE owner_id = $1 ORDER BY is_primary DESC, created_at DESC',
          [userId]
        )
      }
    }

    const cards = res.rows.map(mapCard)
    const bundles = await loadRenderBundles(cards)
    return { cards, ...bundles }
  },

  async getCard(userId: string, cardId: string) {
    const res = await query(
      'SELECT * FROM public.cards WHERE id = $1 AND owner_id = $2',
      [cardId, userId]
    )
    if (!res.rows[0]) throw new HttpError(404, 'Card not found.')
    const card = mapCard(res.rows[0])
    const bundles = await loadRenderBundles([card])
    return { card, ...bundles }
  },

  async createCard(
    userId: string,
    input: { templateId: string; styleId?: string; title?: string; customization?: Partial<CardCustomization> }
  ) {
    const catalog = await getCatalog()
    const template = catalog.templates.find((t) => t.id === input.templateId)
    if (!template) throw new HttpError(404, 'That template is not available.')

    const styleId = resolveStyleId(catalog, template, input.styleId)
    const snapshot = await ensureCardProfile(userId)
    const customization = applyCapabilityBoundaries(
      input.customization ?? {},
      template.definition
    )

    const res = await query(
      `INSERT INTO public.cards
             (owner_id, title, template_id, template_version, style_id, customization, profile_snapshot)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
         RETURNING *`,
      [
        userId,
        (input.title || template.name).slice(0, 80),
        template.id,
        template.version,
        styleId,
        JSON.stringify(customization),
        JSON.stringify(snapshot),
      ]
    )
    const card = mapCard(res.rows[0])
    const bundles = await loadRenderBundles([card])
    return { card, ...bundles }
  },

  async updateCard(
    userId: string,
    cardId: string,
    input: {
      title?: string
      styleId?: string | null
      templateId?: string
      customization?: Partial<CardCustomization>
      isPublic?: boolean
      isPrimary?: boolean
    }
  ) {
    const existingRes = await query(
      'SELECT * FROM public.cards WHERE id = $1 AND owner_id = $2',
      [cardId, userId]
    )
    if (!existingRes.rows[0]) throw new HttpError(404, 'Card not found.')
    const existing = mapCard(existingRes.rows[0])

    const catalog = await getCatalog()

    // Switching template re-pins to that template's current version, and the
    // customisation has to be re-filtered against the new template's rules.
    let templateId = existing.templateId
    let templateVersion = existing.templateVersion
    let definition: TemplateDefinition

    if (input.templateId && input.templateId !== existing.templateId) {
      const template = catalog.templates.find((t) => t.id === input.templateId)
      if (!template) throw new HttpError(404, 'That template is not available.')
      templateId = template.id
      templateVersion = template.version
      definition = template.definition
    } else {
      const version = await loadTemplateVersion(templateId, templateVersion)
      if (!version) throw new HttpError(410, 'The template version this card uses is gone.')
      definition = version.definition
    }

    const customization =
      input.customization !== undefined
        ? applyCapabilityBoundaries(input.customization, definition)
        : applyCapabilityBoundaries(existing.customization as CardCustomization, definition)

    let styleId = existing.styleId
    if (input.styleId !== undefined) {
      const template =
        catalog.templates.find((t) => t.id === templateId) ?? null
      styleId = input.styleId
        ? resolveStyleId(catalog, template, input.styleId)
        : template?.defaultStyleId ?? null
    }

    // Only one card may be primary; clearing the others first keeps the partial
    // unique index from rejecting the update.
    if (input.isPrimary === true) {
      await query(
        'UPDATE public.cards SET is_primary = FALSE WHERE owner_id = $1 AND id <> $2',
        [userId, cardId]
      )
    }

    const wantsPublic = input.isPublic ?? existing.isPublic
    const shareSlug = wantsPublic ? existing.shareSlug ?? newShareSlug() : existing.shareSlug

    const res = await query(
      `UPDATE public.cards
          SET title = COALESCE($3, title),
              template_id = $4,
              template_version = $5,
              style_id = $6,
              customization = $7::jsonb,
              is_public = COALESCE($8, is_public),
              is_primary = COALESCE($9, is_primary),
              share_slug = $10,
              updated_at = NOW()
        WHERE id = $1 AND owner_id = $2
    RETURNING *`,
      [
        cardId,
        userId,
        input.title?.slice(0, 80) ?? null,
        templateId,
        templateVersion,
        styleId,
        JSON.stringify(customization),
        input.isPublic ?? null,
        input.isPrimary ?? null,
        shareSlug,
      ]
    )

    const card = mapCard(res.rows[0])
    const bundles = await loadRenderBundles([card])
    return { card, ...bundles }
  },

  /** Re-snapshots the card against the profile as it stands today. */
  async regenerateCard(userId: string, cardId: string) {
    const snapshot = await ensureCardProfile(userId)
    const res = await query(
      `UPDATE public.cards
          SET profile_snapshot = $3::jsonb, updated_at = NOW()
        WHERE id = $1 AND owner_id = $2
    RETURNING *`,
      [cardId, userId, JSON.stringify(snapshot)]
    )
    if (!res.rows[0]) throw new HttpError(404, 'Card not found.')
    const card = mapCard(res.rows[0])
    const bundles = await loadRenderBundles([card])
    return { card, ...bundles }
  },

  /** Moves a card onto the template's newest version, keeping its content. */
  async upgradeCard(userId: string, cardId: string) {
    const catalog = await getCatalog()
    const existingRes = await query(
      'SELECT * FROM public.cards WHERE id = $1 AND owner_id = $2',
      [cardId, userId]
    )
    if (!existingRes.rows[0]) throw new HttpError(404, 'Card not found.')
    const existing = mapCard(existingRes.rows[0])

    const template = catalog.templates.find((t) => t.id === existing.templateId)
    if (!template) throw new HttpError(404, 'That template is no longer published.')
    if (template.version === existing.templateVersion) {
      return this.getCard(userId, cardId)
    }

    const customization = applyCapabilityBoundaries(
      existing.customization as CardCustomization,
      template.definition
    )
    await query(
      `UPDATE public.cards
          SET template_version = $3, customization = $4::jsonb, updated_at = NOW()
        WHERE id = $1 AND owner_id = $2`,
      [cardId, userId, template.version, JSON.stringify(customization)]
    )
    return this.getCard(userId, cardId)
  },

  async deleteCard(userId: string, cardId: string) {
    const res = await query('DELETE FROM public.cards WHERE id = $1 AND owner_id = $2', [
      cardId,
      userId,
    ])
    if (res.rowCount === 0) throw new HttpError(404, 'Card not found.')
  },

  /**
   * A shared card, by slug. Unauthenticated, and gated the same way the public
   * profile page is: the card must be public *and* its owner's page must be on.
   */
  async getPublicCard(slug: string) {
    await ensureCatalogSeeded()
    const res = await query(
      `SELECT c.*, p.full_name, p.handle
         FROM public.cards c
         JOIN public.profiles p ON p.id = c.owner_id
        WHERE c.share_slug = $1 AND c.is_public = TRUE AND p.page_is_public = TRUE`,
      [slug]
    )
    if (!res.rows[0]) return null

    const card = mapCard(res.rows[0])
    const bundles = await loadRenderBundles([card])
    return {
      card,
      ...bundles,
      owner: { name: res.rows[0].full_name, handle: res.rows[0].handle },
    }
  },

  /** The public cards on someone's profile page. */
  async listPublicCards(ownerId: string, limit = 12) {
    const res = await query(
      `SELECT * FROM public.cards
        WHERE owner_id = $1 AND is_public = TRUE
        ORDER BY is_primary DESC, created_at DESC
        LIMIT $2`,
      [ownerId, limit]
    )
    const cards = res.rows.map(mapCard)
    const bundles = await loadRenderBundles(cards)
    return { cards, ...bundles }
  },

  /* ── Admin ──────────────────────────────────────────────────────────────── */

  async adminListCatalog() {
    await ensureCatalogSeeded()
    const templates = await query(
      `SELECT t.*,
              (SELECT COUNT(*)::int FROM public.card_template_versions v WHERE v.template_id = t.id) AS version_count,
              (SELECT COUNT(*)::int FROM public.cards c WHERE c.template_id = t.id) AS card_count
         FROM public.card_templates t
        ORDER BY t.sort_order, t.name`
    )
    const styles = await query(
      'SELECT * FROM public.card_styles ORDER BY sort_order, name'
    )
    return { templates: templates.rows, styles: styles.rows }
  },

  async adminGetTemplate(templateId: string) {
    const template = await query('SELECT * FROM public.card_templates WHERE id = $1', [templateId])
    if (!template.rows[0]) throw new HttpError(404, 'Template not found.')
    const versions = await query(
      `SELECT id, version, notes, created_at, definition
         FROM public.card_template_versions
        WHERE template_id = $1
        ORDER BY version DESC`,
      [templateId]
    )
    return { template: template.rows[0], versions: versions.rows }
  },

  async adminUpsertStyle(input: {
    id: string
    name: string
    description?: string
    tokens: unknown
    status: 'draft' | 'published' | 'archived'
    sortOrder: number
  }) {
    const tokens = styleTokensSchema.safeParse(input.tokens)
    if (!tokens.success) {
      throw new HttpError(400, `Invalid style — ${describeZodError(tokens.error)}`)
    }

    const res = await query(
      `INSERT INTO public.card_styles (id, name, description, tokens, status, sort_order, is_seed)
            VALUES ($1, $2, $3, $4::jsonb, $5, $6, FALSE)
       ON CONFLICT (id) DO UPDATE
            SET name = EXCLUDED.name,
                description = EXCLUDED.description,
                tokens = EXCLUDED.tokens,
                status = EXCLUDED.status,
                sort_order = EXCLUDED.sort_order,
                updated_at = NOW()
        RETURNING *`,
      [
        input.id,
        input.name,
        input.description ?? null,
        JSON.stringify(tokens.data),
        input.status,
        input.sortOrder,
      ]
    )
    invalidateCatalog()
    return res.rows[0]
  },

  async adminUpsertTemplate(input: {
    id: string
    name: string
    description?: string
    category: string
    thumbnailUrl?: string | null
    defaultStyleId?: string | null
    allowedStyleIds: string[]
    sortOrder: number
    isPremium: boolean
  }) {
    const res = await query(
      `INSERT INTO public.card_templates
             (id, name, description, category, thumbnail_url, default_style_id,
              allowed_style_ids, sort_order, is_premium, is_seed, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, 'draft')
       ON CONFLICT (id) DO UPDATE
            SET name = EXCLUDED.name,
                description = EXCLUDED.description,
                category = EXCLUDED.category,
                thumbnail_url = EXCLUDED.thumbnail_url,
                default_style_id = EXCLUDED.default_style_id,
                allowed_style_ids = EXCLUDED.allowed_style_ids,
                sort_order = EXCLUDED.sort_order,
                is_premium = EXCLUDED.is_premium,
                updated_at = NOW()
        RETURNING *`,
      [
        input.id,
        input.name,
        input.description ?? null,
        input.category,
        input.thumbnailUrl ?? null,
        input.defaultStyleId ?? null,
        input.allowedStyleIds,
        input.sortOrder,
        input.isPremium,
      ]
    )
    invalidateCatalog()
    return res.rows[0]
  },

  /**
   * Adds a version. Never edits one in place — that is the whole point of the
   * table, and the reason a published card cannot change under its owner.
   */
  async adminCreateVersion(
    templateId: string,
    userId: string,
    input: { definition: unknown; notes?: string; publish: boolean }
  ) {
    const definition = templateDefinitionSchema.safeParse(input.definition)
    if (!definition.success) {
      throw new HttpError(400, `Invalid template — ${describeZodError(definition.error)}`)
    }

    const exists = await query('SELECT id FROM public.card_templates WHERE id = $1', [templateId])
    if (!exists.rows[0]) throw new HttpError(404, 'Template not found.')

    const latest = await query(
      'SELECT COALESCE(MAX(version), 0) AS version FROM public.card_template_versions WHERE template_id = $1',
      [templateId]
    )
    const nextVersion = Number(latest.rows[0].version) + 1

    const res = await query(
      `INSERT INTO public.card_template_versions (template_id, version, definition, notes, created_by)
            VALUES ($1, $2, $3::jsonb, $4, $5)
        RETURNING id, version, notes, created_at`,
      [templateId, nextVersion, JSON.stringify(definition.data), input.notes ?? null, userId]
    )

    if (input.publish) {
      await query(
        `UPDATE public.card_templates
            SET current_version = $2, status = 'published', updated_at = NOW()
          WHERE id = $1`,
        [templateId, nextVersion]
      )
    }
    invalidateCatalog()
    return res.rows[0]
  },

  async adminSetStatus(
    templateId: string,
    input: { status?: 'draft' | 'published' | 'archived'; version?: number }
  ) {
    if (input.version !== undefined) {
      const exists = await query(
        'SELECT 1 FROM public.card_template_versions WHERE template_id = $1 AND version = $2',
        [templateId, input.version]
      )
      if (exists.rowCount === 0) throw new HttpError(404, 'That version does not exist.')
    }

    const res = await query(
      `UPDATE public.card_templates
          SET status = COALESCE($2, status),
              current_version = COALESCE($3, current_version),
              updated_at = NOW()
        WHERE id = $1
    RETURNING *`,
      [templateId, input.status ?? null, input.version ?? null]
    )
    if (!res.rows[0]) throw new HttpError(404, 'Template not found.')
    invalidateCatalog()
    return res.rows[0]
  },

  /** Copies a template and its current definition into a new draft. */
  async adminDuplicateTemplate(templateId: string, newId: string, userId: string) {
    const source = await query(
      `SELECT t.*, v.definition
         FROM public.card_templates t
         JOIN public.card_template_versions v
           ON v.template_id = t.id AND v.version = t.current_version
        WHERE t.id = $1`,
      [templateId]
    )
    if (!source.rows[0]) throw new HttpError(404, 'Template not found, or it has no version yet.')
    const row = source.rows[0]

    const clash = await query('SELECT 1 FROM public.card_templates WHERE id = $1', [newId])
    if (clash.rowCount) throw new HttpError(409, 'A template with that id already exists.')

    await query(
      `INSERT INTO public.card_templates
             (id, name, description, category, thumbnail_url, default_style_id,
              allowed_style_ids, sort_order, is_premium, is_seed, status, current_version)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, 'draft', 1)`,
      [
        newId,
        `${row.name} copy`,
        row.description,
        row.category,
        row.thumbnail_url,
        row.default_style_id,
        row.allowed_style_ids,
        row.sort_order + 1,
        row.is_premium,
      ]
    )
    await query(
      `INSERT INTO public.card_template_versions (template_id, version, definition, notes, created_by)
            VALUES ($1, 1, $2::jsonb, $3, $4)`,
      [newId, JSON.stringify(row.definition), `Duplicated from ${templateId}`, userId]
    )
    invalidateCatalog()
    return { id: newId }
  },
}

/** Falls back through the template's default and then the catalogue's first. */
function resolveStyleId(
  catalog: Catalog,
  template: CatalogTemplate | null,
  requested?: string
): string | null {
  const published = new Set(catalog.styles.map((s) => s.id))
  const allowed = template?.allowedStyleIds?.length ? new Set(template.allowedStyleIds) : null

  if (requested && published.has(requested) && (!allowed || allowed.has(requested))) {
    return requested
  }
  if (template?.defaultStyleId && published.has(template.defaultStyleId)) {
    return template.defaultStyleId
  }
  return catalog.styles[0]?.id ?? null
}
