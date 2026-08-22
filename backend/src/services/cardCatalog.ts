import crypto from 'crypto'
import { query } from '../db'
import { SEED_STYLES } from './cardStyles'
import { SEED_TEMPLATES } from './cardTemplates'
import { styleTokensSchema, templateDefinitionSchema, describeZodError } from '../schema/cardSchema'

/**
 * Keeps the shipped catalogue in step with the database.
 *
 * Runs once on boot. Seeded rows (is_seed = TRUE) are re-synced from
 * cardStyles.ts / cardTemplates.ts; anything a designer created in the admin
 * panel is left alone. A template whose definition has changed gets a *new
 * version* rather than an edit in place, so cards already pinned to version 2
 * keep rendering as version 2 — the promise in §11 of the card spec.
 */

function fingerprint(value: unknown): string {
  return crypto.createHash('sha1').update(JSON.stringify(value)).digest('hex')
}

async function syncStyles(): Promise<number> {
  let touched = 0

  for (const style of SEED_STYLES) {
    const parsed = styleTokensSchema.safeParse(style.tokens)
    if (!parsed.success) {
      // A broken seed must be loud: it would otherwise ship a catalogue entry
      // that renders as a blank card for every user who picks it.
      throw new Error(`Seed style "${style.id}" is invalid — ${describeZodError(parsed.error)}`)
    }

    const res = await query(
      `INSERT INTO public.card_styles (id, name, description, tokens, status, sort_order, is_seed)
            VALUES ($1, $2, $3, $4::jsonb, 'published', $5, TRUE)
       ON CONFLICT (id) DO UPDATE
            SET name = EXCLUDED.name,
                description = EXCLUDED.description,
                tokens = EXCLUDED.tokens,
                sort_order = EXCLUDED.sort_order,
                updated_at = NOW()
          WHERE card_styles.is_seed = TRUE
            AND card_styles.tokens IS DISTINCT FROM EXCLUDED.tokens
      RETURNING id`,
      [style.id, style.name, style.description, JSON.stringify(parsed.data), style.sortOrder]
    )
    if (res.rowCount) touched += 1
  }

  return touched
}

async function syncTemplates(): Promise<number> {
  let newVersions = 0

  for (const template of SEED_TEMPLATES) {
    const parsed = templateDefinitionSchema.safeParse(template.definition)
    if (!parsed.success) {
      throw new Error(
        `Seed template "${template.id}" is invalid — ${describeZodError(parsed.error)}`
      )
    }
    const definition = parsed.data

    await query(
      `INSERT INTO public.card_templates
             (id, name, description, category, status, default_style_id,
              allowed_style_ids, sort_order, is_seed)
            VALUES ($1, $2, $3, $4, 'published', $5, $6, $7, TRUE)
       ON CONFLICT (id) DO UPDATE
            SET name = EXCLUDED.name,
                description = EXCLUDED.description,
                category = EXCLUDED.category,
                default_style_id = EXCLUDED.default_style_id,
                allowed_style_ids = EXCLUDED.allowed_style_ids,
                sort_order = EXCLUDED.sort_order,
                updated_at = NOW()
          WHERE card_templates.is_seed = TRUE`,
      [
        template.id,
        template.name,
        template.description,
        template.category,
        template.defaultStyleId,
        template.allowedStyleIds ?? [],
        template.sortOrder,
      ]
    )

    // Only publish a new version when the layout actually changed.
    const latest = await query(
      `SELECT version, definition
         FROM public.card_template_versions
        WHERE template_id = $1
        ORDER BY version DESC
        LIMIT 1`,
      [template.id]
    )

    const current = latest.rows[0]
    if (current && fingerprint(current.definition) === fingerprint(definition)) {
      continue
    }

    const nextVersion = (current?.version ?? 0) + 1
    await query(
      `INSERT INTO public.card_template_versions (template_id, version, definition, notes)
            VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (template_id, version) DO NOTHING`,
      [template.id, nextVersion, JSON.stringify(definition), 'Shipped with the app']
    )
    await query(
      `UPDATE public.card_templates
          SET current_version = $2, status = 'published', updated_at = NOW()
        WHERE id = $1 AND is_seed = TRUE`,
      [template.id, nextVersion]
    )
    newVersions += 1
  }

  return newVersions
}

/**
 * Carries the pre-engine share_cards rows forward.
 *
 * The old feature had exactly two looks, and both survive as templates, so an
 * occasion card someone made last month keeps its photograph, its words and
 * its date — it simply renders through the engine now. Idempotent through
 * cards.legacy_share_card_id, so it is safe on every boot.
 */
async function importLegacyShareCards(): Promise<number> {
  const legacy = await query(
    `SELECT sc.id, sc.owner_id, sc.kind, sc.headline, sc.subline, sc.occasion_date,
            sc.photo_url, sc.is_public, sc.created_at,
            p.full_name, p.handle
       FROM public.share_cards sc
       JOIN public.profiles p ON p.id = sc.owner_id
      WHERE NOT EXISTS (
              SELECT 1 FROM public.cards c WHERE c.legacy_share_card_id = sc.id
            )`
  )

  if (legacy.rowCount === 0) return 0

  let imported = 0
  for (const row of legacy.rows) {
    const isOccasion = row.kind !== 'profile'
    const templateId = isOccasion ? 'occasion_01' : 'minimal_01'

    const versionRes = await query(
      'SELECT current_version FROM public.card_templates WHERE id = $1',
      [templateId]
    )
    const version = versionRes.rows[0]?.current_version
    if (!version) continue

    const subline =
      row.subline || (row.occasion_date ? formatDottedDate(row.occasion_date) : '')

    const customization = {
      content: isOccasion
        ? { headline: row.headline, subline }
        : { name: row.full_name || row.headline, role: subline },
      images: row.photo_url
        ? {
            [isOccasion ? 'photo' : 'hero']: {
              url: row.photo_url,
              offsetX: 0,
              offsetY: 0,
              scale: 1,
            },
          }
        : {},
    }

    const snapshot = {
      name: row.full_name || row.headline || '',
      username: row.handle || '',
      photos: row.photo_url ? [{ url: row.photo_url }] : [],
    }

    await query(
      `INSERT INTO public.cards
             (owner_id, title, template_id, template_version, style_id,
              customization, profile_snapshot, is_public, legacy_share_card_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10)
       ON CONFLICT (legacy_share_card_id) DO NOTHING`,
      [
        row.owner_id,
        row.headline || 'Card',
        templateId,
        version,
        isOccasion ? 'paper' : 'ivory',
        JSON.stringify(customization),
        JSON.stringify(snapshot),
        row.is_public === true,
        row.id,
        row.created_at,
      ]
    )
    imported += 1
  }

  return imported
}

function formatDottedDate(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())} · ${pad(d.getMonth() + 1)} · ${d.getFullYear()}`
}

let seedPromise: Promise<void> | null = null

/**
 * Idempotent, and safe to call from several places — the promise is shared, so
 * concurrent callers wait on one run rather than racing each other.
 */
export function ensureCatalogSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const styles = await syncStyles()
      const versions = await syncTemplates()
      const imported = await importLegacyShareCards()
      console.log(
        `[cards] Catalogue ready — ${SEED_STYLES.length} styles (${styles} updated), ` +
          `${SEED_TEMPLATES.length} templates (${versions} new version${versions === 1 ? '' : 's'})` +
          (imported ? `, ${imported} legacy card${imported === 1 ? '' : 's'} imported` : '')
      )
    })().catch((err) => {
      // Let the next caller retry rather than caching the failure forever.
      seedPromise = null
      throw err
    })
  }
  return seedPromise
}
