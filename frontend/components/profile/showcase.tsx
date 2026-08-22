'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { MonoLabel, StampButton } from '@/components/folio/primitives'
import { profileApi, type ProfileAlbum, type ProfilePhoto } from '@/lib/profile/api'
import { cn } from '@/lib/utils'

/**
 * The showcase — what sits under the card.
 *
 * Two things live here and they are shown the same way on purpose: a square,
 * gapless grid, which is the grammar everyone already reads as "a body of
 * work". An album is one tile with a count on it, a photograph is one tile;
 * beyond that the grid makes no argument about which matters more.
 *
 * What it does insist on is that nothing arrives here by itself. Both tabs are
 * empty until something is explicitly added, through the same picker, one item
 * at a time — the album half of that rule has been the design since the profile
 * shipped, and extending it to single frames is what lets the Photos tab exist
 * at all without turning a shared event into a publication.
 */
