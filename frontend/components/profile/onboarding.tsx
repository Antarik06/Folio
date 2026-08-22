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
