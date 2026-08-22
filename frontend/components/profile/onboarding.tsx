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
