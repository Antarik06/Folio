import { clientFetch } from '@/lib/api-client'
import type {
  Card,
  CardBundle,
  CardCustomization,
  CardProfileData,
  CardStyle,
  Catalog,
  TemplateDefinition,
} from './types'

/**
 * The card engine's client. Every template, style and definition the frontend
 * draws comes from here — nothing about a card's appearance is compiled into
 * the app, which is what lets a new template appear in the picker without a
 * deploy.
 */

export interface CardWithBundle {
  card: Card
  templates: CardBundle['templates']
  styles: CardBundle['styles']
}

export const cardsApi = {
  catalog(): Promise<Catalog> {
    return clientFetch('/api/cards/catalog')
  },

  list(): Promise<CardBundle> {
    return clientFetch('/api/cards')
  },

  get(cardId: string): Promise<CardWithBundle> {
    return clientFetch(`/api/cards/${cardId}`)
  },

  create(input: {
    templateId: string
    styleId?: string
    title?: string
    customization?: Partial<CardCustomization>
  }): Promise<CardWithBundle> {
    return clientFetch('/api/cards', { method: 'POST', body: JSON.stringify(input) })
  },

  update(
    cardId: string,
    input: {
      title?: string
      styleId?: string | null
      templateId?: string
      customization?: Partial<CardCustomization>
      isPublic?: boolean
      isPrimary?: boolean
    }
  ): Promise<CardWithBundle> {
    return clientFetch(`/api/cards/${cardId}`, { method: 'PATCH', body: JSON.stringify(input) })
  },

  remove(cardId: string): Promise<void> {
    return clientFetch(`/api/cards/${cardId}`, { method: 'DELETE' })
  },

  /** Re-reads the profile into the card, deliberately and on request only. */
  regenerate(cardId: string): Promise<CardWithBundle> {
    return clientFetch(`/api/cards/${cardId}/regenerate`, { method: 'POST' })
  },

  /** Moves a card onto the template's newest version. */
  upgrade(cardId: string): Promise<CardWithBundle> {
    return clientFetch(`/api/cards/${cardId}/upgrade`, { method: 'POST' })
  },

  profile(): Promise<CardProfileData> {
    return clientFetch('/api/cards/profile')
  },

  saveProfile(data: CardProfileData): Promise<CardProfileData> {
    return clientFetch('/api/cards/profile', { method: 'PUT', body: JSON.stringify(data) })
  },
}

/* ── Admin ────────────────────────────────────────────────────────────────── */

export interface AdminTemplateRow {
  id: string
  name: string
  description: string | null
  category: string
  status: 'draft' | 'published' | 'archived'
  current_version: number
  default_style_id: string | null
  allowed_style_ids: string[]
  sort_order: number
  is_premium: boolean
  is_seed: boolean
  version_count: number
  card_count: number
  updated_at: string
}

export interface AdminStyleRow {
  id: string
  name: string
  description: string | null
  tokens: CardStyle['tokens']
  status: 'draft' | 'published' | 'archived'
  sort_order: number
  is_seed: boolean
}

export interface AdminTemplateVersion {
  id: string
  version: number
  notes: string | null
  created_at: string
  definition: TemplateDefinition
}

export const cardsAdminApi = {
  catalog(): Promise<{ templates: AdminTemplateRow[]; styles: AdminStyleRow[] }> {
    return clientFetch('/api/cards/admin/catalog')
  },

  template(
    templateId: string
  ): Promise<{ template: AdminTemplateRow; versions: AdminTemplateVersion[] }> {
    return clientFetch(`/api/cards/admin/templates/${templateId}`)
  },

  saveTemplate(input: {
    id: string
    name: string
    description?: string
    category: string
    thumbnailUrl?: string | null
    defaultStyleId?: string | null
    allowedStyleIds: string[]
    sortOrder: number
    isPremium: boolean
  }): Promise<AdminTemplateRow> {
    return clientFetch('/api/cards/admin/templates', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  createVersion(
    templateId: string,
    input: { definition: TemplateDefinition; notes?: string; publish: boolean }
  ): Promise<AdminTemplateVersion> {
    return clientFetch(`/api/cards/admin/templates/${templateId}/versions`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  setStatus(
    templateId: string,
    input: { status?: 'draft' | 'published' | 'archived'; version?: number }
  ): Promise<AdminTemplateRow> {
    return clientFetch(`/api/cards/admin/templates/${templateId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  },

  duplicate(templateId: string, newId: string): Promise<{ id: string }> {
    return clientFetch(`/api/cards/admin/templates/${templateId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ id: newId }),
    })
  },

  saveStyle(input: {
    id: string
    name: string
    description?: string
    tokens: CardStyle['tokens']
    status: 'draft' | 'published' | 'archived'
    sortOrder: number
  }): Promise<AdminStyleRow> {
    return clientFetch('/api/cards/admin/styles', { method: 'POST', body: JSON.stringify(input) })
  },
}
