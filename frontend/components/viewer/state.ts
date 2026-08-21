import { atom } from 'jotai'

/**
 * One index atom for the whole viewer.
 *
 * There used to be three — previewPageAtom, magazinePageAtom and
 * polaroidFocusAtom — each declared inside its own HUD file, which is what
 * forced the scene, the scene wrapper and the HUD to be forked per style. Both
 * remaining styles track "which page is in front", so they share one atom and
 * the fork disappears.
 */
export const viewerIndexAtom = atom(0)

export type ViewerStyle = 'book' | 'magazine'
