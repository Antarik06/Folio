'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { MonoLabel, SpecPill, StampButton } from '@/components/folio/primitives'
import { CardRenderer } from '@/components/cards/card-renderer'
import { cardsApi } from '@/lib/cards/api'
import { canShareFiles, downloadCard, shareCard } from '@/lib/cards/export'
import type { Card, CardBundle } from '@/lib/cards/types'
import { cn } from '@/lib/utils'

/**
 * The centrepiece.
 *
 * The profile used to open with a list of albums and keep the card in a rail at
 * the bottom, which had it exactly backwards: the albums are things you made,
 * the card is *you*. So this sits directly under the masthead at the largest
 * size the column allows, and everything else on the page reads as what is
 * underneath it.
 *
 * The three actions beside it are the three things anyone actually wants from a
 * card — change it, save it, send it — and they are deliberately flat rather
 * than nested in a menu. Export renders from the live SVG on this page, so the
 * file is exactly the card being looked at, at whatever size was asked for.
 */

const SCALES = [
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 3, label: '3×' },
]
