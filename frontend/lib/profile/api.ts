import { clientFetch } from '@/lib/api-client'
import type { Card } from '@/lib/cards/types'

/**
 * The profile page's client.
 *
 * Cards have their own client in `lib/cards/api.ts` and keep it — this one
 * covers the page around the card: who you are, what you promoted onto it, and
 * the questionnaire that builds the first one.
 */
