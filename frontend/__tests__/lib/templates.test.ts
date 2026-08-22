import { describe, it, expect } from 'vitest'
import {
  ALBUM_STYLES,
  ALL_MAGAZINE_TEMPLATES,
  TEMPLATES_BY_STYLE,
  styleForCategory,
} from '../../lib/magazine-templates'

/**
 * Guards the template catalogue.
 *
 * The previous catalogue advertised eight templates of which only three were
 * real — the rest were clones of those three under different names, and one was
 * exported but imported by nothing. These assertions make that class of drift
 * fail loudly instead of shipping.
 */

function allElements(template: (typeof ALL_MAGAZINE_TEMPLATES)[number]) {
  return template.spreads.flatMap((s: any) => [
    ...(s.front?.elements ?? []),
    ...(s.back?.elements ?? []),
  ])
}

describe('album style catalogue', () => {
  it('offers exactly five styles, each with two or three templates', () => {
    expect(ALBUM_STYLES).toHaveLength(5)

    for (const group of TEMPLATES_BY_STYLE) {
      expect(group.templates.length).toBeGreaterThanOrEqual(2)
      expect(group.templates.length).toBeLessThanOrEqual(3)
    }
  })

  it('gives every template a distinct page geometry within its style', () => {
    for (const group of TEMPLATES_BY_STYLE) {
      const shapes = group.templates.map((t) =>
        t.spreads
          .flatMap((s: any) => [s.front, s.back].filter(Boolean))
          .map((side: any) => `${side.elements.length}:${side.background}`)
          .join('|')
      )
      // Two templates in a style must not be the same layout renamed.
      expect(new Set(shapes).size).toBe(shapes.length)
    }
  })

  it('fills every photo slot and keeps element ids unique', () => {
    const seen = new Set<string>()

    for (const template of ALL_MAGAZINE_TEMPLATES) {
      const elements = allElements(template)
      expect(elements.length).toBeGreaterThan(0)

      for (const el of elements as any[]) {
        expect(seen.has(el.id), `duplicate element id ${el.id}`).toBe(false)
        seen.add(el.id)

        if (el.type === 'image') {
          // An empty slot renders as nothing on the canvas, so a template must
          // never ship one.
          expect(el.src, `${template.id} has an empty photo slot`).toBeTruthy()
          expect(el.src.startsWith('/images/templates/')).toBe(true)
        }
      }
    }
  })

  it('gives every template a cover and a thumbnail', () => {
    for (const template of ALL_MAGAZINE_TEMPLATES) {
      expect(template.spreads[0].isCover).toBe(true)
      expect(template.thumbnail).toBeTruthy()
    }
  })

  it('never drops an artist template with an unfamiliar category', () => {
    // "love" is a real category on a published album in the database.
    for (const category of ['love', 'nostalgic', 'fashion', 'baby', '', 'nonsense']) {
      const style = styleForCategory(category)
      expect(ALBUM_STYLES.map((s) => s.id)).toContain(style.id)
    }
    expect(styleForCategory('love').id).toBe('wedding')
    expect(styleForCategory('Travel').id).toBe('travel')
  })
})
