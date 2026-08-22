/**
 * The photography each style's templates are previewed with.
 *
 * Curated from Pixabay and downloaded into /public rather than hotlinked, so
 * the files are yours: swapping any of them means replacing a file in
 * public/images/templates, with no code change. Provenance for every image —
 * source id and the tags it was selected on — is in
 * public/images/templates/manifest.json.
 *
 * These are placeholders in the product sense: when a template is applied,
 * applyImagePoolToSpreads overwrites every slot with the user's own photographs.
 * They exist so the catalogue and the preview show a real album rather than
 * empty rectangles.
 */

const dir = '/images/templates'

/** Cycles a slot list so a template with more frames than photos still fills. */
function cycle(files: string[]) {
  return (index: number) => `${dir}/${files[index % files.length]}`
}

export type PhotoSet = (index: number) => string

export const STYLE_PHOTOS: Record<string, PhotoSet> = {
  wedding: cycle([
    'wedding-04.jpg', // the ceremony, wide
    'wedding-03.jpg', // bride, portrait
    'wedding-01.jpg', // groom, portrait
    'wedding-05.jpg', // mehndi detail
    'wedding-06.jpg',
    'wedding-02.jpg',
  ]),

  portrait: cycle([
    'portrait-01.jpg', // father and children
    'portrait-02.jpg', // boy, close
    'portrait-03.jpg', // baby girl
    'portrait-05.jpg', // group of boys
    'portrait-04.jpg', // sleeping child
  ]),

  travel: cycle([
    'travel-01.jpg', // Kerala houseboat
    'travel-06.jpg', // backwaters at dusk
    'travel-04.jpg', // Hawa Mahal
    'travel-02.jpg', // Bekal fort
    'travel-05.jpg', // blue mosque
    'travel-03.jpg',
  ]),

  editorial: cycle([
    'editorial-02.jpg', // red saree, portrait
    'editorial-01.jpg', // paithani silk
    'editorial-03.jpg',
    'editorial-04.jpg',
  ]),

  // The Year borrows the festival set — Diwali, Holi, Navratri, Chhath — which
  // is what a year of photographs in Bengal actually looks like.
  year: cycle([
    'festival-01.jpg', // diwali lamps
    'festival-05.jpg', // holi, colour
    'festival-02.jpg', // chhath puja, river
    'festival-03.jpg', // diya detail
    'festival-04.jpg', // navratri lamps
  ]),
}

/** Falls back to the wedding set for a style with no photography of its own. */
export function photosForStyle(styleId: string): PhotoSet {
  return STYLE_PHOTOS[styleId] ?? STYLE_PHOTOS.wedding
}
