import { describe, expect, it } from 'vitest'
import { createResolver } from '@/lib/cards/resolver'
import { resolveStyle } from '@/lib/cards/style'
import { layoutText, estimateMeasurer } from '@/lib/cards/text'
import { buildCardLayout, collectEditableFields } from '@/lib/cards/layout'
import type { EngineContext } from '@/lib/cards/context'
import {
  EMPTY_CUSTOMIZATION,
  normalizeProfile,
  type CardProfileData,
  type TemplateDefinition,
} from '@/lib/cards/types'

const profile: CardProfileData = normalizeProfile({
  name: 'Antarik Tarafder',
  username: 'antarik',
  occupation: 'Photographer',
  location: 'Kolkata',
  bio: 'Shoots weddings on film. Mostly at golden hour, mostly running late.',
  quote: 'The best photograph is the one you were present for.',
  interests: ['Coding', 'Design', 'Film', 'Trains'],
  photos: [{ url: 'https://example.test/one.jpg' }, { url: 'https://example.test/two.jpg' }],
  stats: [
    { label: 'Events', value: '12' },
    { label: 'Rolls', value: '240' },
  ],
})

function contextFor(definition: TemplateDefinition): EngineContext {
  return {
    style: resolveStyle(undefined, definition, EMPTY_CUSTOMIZATION),
    resolver: createResolver(profile),
    measurer: estimateMeasurer,
    customization: EMPTY_CUSTOMIZATION,
    capabilities: definition.capabilities,
    canvas: definition.canvas,
  }
}

const capabilities: TemplateDefinition['capabilities'] = {
  accentColor: true,
  backgroundColor: true,
  inkColor: false,
  fontChange: true,
  styleSwap: true,
  customText: true,
  photoReplacement: true,
  reposition: false,
  resize: false,
  sectionVisibility: true,
  decorations: true,
  imageTreatment: true,
  maxCustomElements: 3,
}

describe('data resolver', () => {
  const resolver = createResolver(profile)

  it('reads dotted paths and array indices', () => {
    expect(resolver.text('{{profile.name}}')).toBe('Antarik Tarafder')
    expect(resolver.text('{{profile.photos[0].url}}')).toBe('https://example.test/one.jpg')
  })

  it('interpolates within surrounding text', () => {
    expect(resolver.text('by {{profile.name}} in {{profile.location}}')).toBe(
      'by Antarik Tarafder in Kolkata'
    )
  })

  it('returns raw values when the whole prop is one binding', () => {
    expect(resolver.value('{{profile.interests}}')).toEqual(['Coding', 'Design', 'Film', 'Trains'])
  })

  it('applies filters, including chains', () => {
    expect(resolver.text('{{profile.interests | take:2 | join: · }}')).toBe('Coding · Design')
    expect(resolver.text('{{profile.username | prefix:@}}')).toBe('@antarik')
    expect(resolver.text('{{profile.name | upper}}')).toBe('ANTARIK TARAFDER')
    expect(resolver.text('{{profile.education | default:Unknown}}')).toBe('Unknown')
  })

  it('drops a prefix when there is nothing to prefix', () => {
    expect(createResolver(normalizeProfile({})).text('{{profile.username | prefix:@}}')).toBe('')
  })

  it('refuses prototype traversal', () => {
    expect(resolver.text('{{profile.__proto__.constructor}}')).toBe('')
    expect(resolver.text('{{constructor}}')).toBe('')
  })

  it('never evaluates its input as code', () => {
    // A template that tried to smuggle an expression resolves to nothing rather
    // than running anything.
    expect(resolver.text('{{ (function(){ return 1 })() }}')).toBe('')
  })

  it('tests truthiness for `when` guards', () => {
    expect(resolver.test('profile.bio')).toBe(true)
    expect(resolver.test('profile.goals')).toBe(false)
    expect(resolver.test(undefined)).toBe(true)
  })
})

describe('text layout', () => {
  const style = resolveStyle(undefined, { canvas: { width: 1080, height: 1350 }, root: { type: 'stack' }, capabilities } as TemplateDefinition, {}).text('body')

  it('wraps to the width it is given', () => {
    const layout = layoutText(profile.bio, style, 400, estimateMeasurer)
    expect(layout.lines.length).toBeGreaterThan(1)
    expect(layout.height).toBeCloseTo(layout.lines.length * layout.size * layout.lineHeight, 5)
  })

  it('truncates with an ellipsis at maxLines', () => {
    const layout = layoutText(profile.bio, style, 300, estimateMeasurer, { maxLines: 2 })
    expect(layout.lines).toHaveLength(2)
    expect(layout.lines[1].endsWith('…')).toBe(true)
  })

  it('shrinks rather than wraps when asked to fit', () => {
    const heading = { ...style, size: 96 }
    const layout = layoutText('Antarik Tarafder', heading, 400, estimateMeasurer, { fit: true })
    expect(layout.lines).toHaveLength(1)
    expect(layout.size).toBeLessThan(96)
  })
})

describe('layout engine', () => {
  const definition: TemplateDefinition = {
    canvas: { width: 1080, height: 1350, padding: 80 },
    root: {
      type: 'stack',
      direction: 'vertical',
      gap: 'md',
      height: 'fill',
      children: [
        { id: 'name', type: 'text', props: { style: 'heroName', value: '{{profile.name}}' } },
        { id: 'gap', type: 'spacer', size: 'flex' },
        {
          id: 'row',
          type: 'stack',
          direction: 'horizontal',
          gap: 'sm',
          children: [
            { id: 'left', type: 'text', flex: 1, props: { value: '{{profile.bio}}' } },
            { id: 'right', type: 'text', width: 200, props: { value: '{{profile.location}}' } },
          ],
        },
        { id: 'missing', type: 'text', when: 'profile.goals', props: { value: 'Never shown' } },
      ],
    },
    capabilities,
    textStyles: {},
  }

  it('places the root inside the canvas padding', () => {
    const layout = buildCardLayout(definition, contextFor(definition))
    expect(layout.root?.rect.x).toBe(80)
    expect(layout.root?.rect.width).toBe(920)
  })

  it('drops nodes whose `when` guard fails, and their gap with them', () => {
    const layout = buildCardLayout(definition, contextFor(definition))
    const ids = layout.root!.children.map((child) => child.node.id)
    expect(ids).not.toContain('missing')
  })

  it('pushes a flex spacer to absorb the leftover height', () => {
    const layout = buildCardLayout(definition, contextFor(definition))
    const row = layout.root!.children.find((child) => child.node.id === 'row')!
    // The row sits at the bottom because the spacer above it took the slack.
    expect(row.rect.y).toBeGreaterThan(900)
  })

  it('gives a fixed-width sibling its width and flexes the other', () => {
    const layout = buildCardLayout(definition, contextFor(definition))
    const row = layout.root!.children.find((child) => child.node.id === 'row')!
    const right = row.children.find((child) => child.node.id === 'right')!
    const left = row.children.find((child) => child.node.id === 'left')!
    expect(right.rect.width).toBe(200)
    expect(Math.round(left.rect.width + right.rect.width)).toBeLessThanOrEqual(920)
    expect(left.rect.width).toBeGreaterThan(400)
  })

  it('honours a visibility override from the customisation', () => {
    const ctx = contextFor(definition)
    const hidden: EngineContext = {
      ...ctx,
      customization: { ...EMPTY_CUSTOMIZATION, visibility: { name: false } },
    }
    const layout = buildCardLayout(definition, hidden)
    expect(layout.root!.children.map((child) => child.node.id)).not.toContain('name')
  })

  it('substitutes a user content override for the template binding', () => {
    const ctx = contextFor(definition)
    const edited: EngineContext = {
      ...ctx,
      customization: { ...EMPTY_CUSTOMIZATION, content: { name: 'Someone Else' } },
    }
    const layout = buildCardLayout(definition, edited)
    const name = layout.root!.children.find((child) => child.node.id === 'name')!
    expect((name.meta as any).layout.lines[0]).toBe('Someone Else')
  })

  it('lists the fields a template lets a user edit', () => {
    const fields = collectEditableFields(definition, contextFor(definition).resolver)
    expect(fields.map((field) => field.id)).toContain('name')
    expect(fields.every((field) => field.kind === 'text' || field.kind === 'lines' || field.kind === 'image')).toBe(true)
  })
})

describe('style resolver', () => {
  const definition = {
    canvas: { width: 1080, height: 1350 },
    root: { type: 'stack' },
    capabilities,
    textStyles: { heroName: { size: 120 } },
  } as unknown as TemplateDefinition

  it('lets a template override the base style, and a user override both', () => {
    const base = resolveStyle(undefined, definition, {})
    expect(base.text('heroName').size).toBe(120)

    const customised = resolveStyle(undefined, definition, { colors: { accent: '#123456' } })
    expect(customised.color('accent')).toBe('#123456')
  })

  it('resolves token names, token paths and hex values alike', () => {
    const style = resolveStyle(undefined, definition, {})
    expect(style.color('accent')).toBe(style.colors.accent)
    expect(style.color('colors.accent')).toBe(style.colors.accent)
    expect(style.color('#ABCDEF')).toBe('#ABCDEF')
    expect(style.color('none')).toBe('transparent')
  })

  it('swaps a font by role, not by name', () => {
    const tokens = {
      colors: {
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceAlt: '#EEEEEE',
        ink: '#111111',
        inkSoft: '#777777',
        accent: '#B85C38',
        accentInk: '#FFFFFF',
        border: '#DDDDDD',
        highlight: '#3A7D6E',
      },
      fonts: { heading: 'serif', body: 'sans', mono: 'mono' },
      radius: { card: 0, image: 0, pill: 999 },
      spacing: { xs: 10, sm: 18, md: 30, lg: 52, xl: 84 },
      effects: {},
      textStyles: {
        heroName: { family: 'serif', size: 86 },
        body: { family: 'sans', size: 28 },
        label: { family: 'mono', size: 19 },
      },
    } as const

    const plain = resolveStyle(tokens as never, definition, {})
    expect(plain.text('heroName').family).toBe('serif')

    // Choosing a heading font replaces whichever family the style used for
    // headings, everywhere — and leaves body and mono roles alone.
    const swapped = resolveStyle(tokens as never, definition, { fonts: { heading: 'display' } })
    expect(swapped.text('heroName').family).toBe('display')
    expect(swapped.text('body').family).toBe('sans')
    expect(swapped.text('label').family).toBe('mono')
  })
})
