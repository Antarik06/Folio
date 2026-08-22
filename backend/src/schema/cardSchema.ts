import { z } from 'zod'

/**
 * The card engine's contract.
 *
 * Everything the renderer will ever execute passes through here first. A
 * template definition is a *document*, never code: there is no expression
 * evaluation, no callback, no HTML. A component may only be one of the types
 * the registry knows, a colour may only be a hex value or a token name, and the
 * tree is bounded in both depth and node count so a malformed definition cannot
 * be turned into a denial of service against the renderer.
 *
 * The frontend mirrors these shapes as TypeScript in `lib/cards/types.ts`. This
 * file is the authority: the frontend types describe what it may receive, this
 * schema decides what may be stored.
 */

/* ── Primitives ───────────────────────────────────────────────────────────── */

/** Fonts are a closed set. No template may name a font the app cannot render. */
export const FONT_KEYS = ['serif', 'sans', 'mono', 'display'] as const
export type FontKey = (typeof FONT_KEYS)[number]

const fontKey = z.enum(FONT_KEYS)

const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'Expected a hex colour.')

/**
 * A colour is either a literal hex value, a token path resolved against the
 * base style (`colors.accent`, or the shorthand `accent`), or one of two
 * keywords. Anything else — including `url(...)` and CSS functions — is refused.
 */
const colorRef = z.union([
  hexColor,
  z.literal('none'),
  z.literal('transparent'),
  z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)?$/, 'Expected a style token.'),
])

const gradientStop = z.object({
  offset: z.number().min(0).max(1),
  color: colorRef,
  opacity: z.number().min(0).max(1).optional(),
})

const gradient = z.object({
  type: z.enum(['linear', 'radial']),
  angle: z.number().min(-360).max(360).optional(),
  stops: z.array(gradientStop).min(2).max(6),
})

const fill = z.union([colorRef, gradient])

/** Canvas units, a percentage of the parent, or an intrinsic keyword. */
const size = z.union([
  z.number().min(0).max(8000),
  z.string().regex(/^(auto|fill|\d+(\.\d+)?%)$/, 'Expected a number, percentage, auto or fill.'),
])

const coord = z.union([
  z.number().min(-8000).max(8000),
  z.string().regex(/^-?\d+(\.\d+)?%$/, 'Expected a number or percentage.'),
])

const edge = z.union([
  z.number().min(0).max(2000),
  z.object({
    top: z.number().min(0).max(2000).optional(),
    right: z.number().min(0).max(2000).optional(),
    bottom: z.number().min(0).max(2000).optional(),
    left: z.number().min(0).max(2000).optional(),
  }),
])

/**
 * Any string a template renders may carry `{{profile.name}}` bindings. The
 * resolver refuses unsafe paths at read time; the cap here is what stops a
 * template from carrying a megabyte of prose.
 */
const boundText = z.string().max(2000)

export const textStyleSchema = z
  .object({
    family: fontKey.optional(),
    size: z.number().min(4).max(400).optional(),
    weight: z.number().min(100).max(900).optional(),
    italic: z.boolean().optional(),
    letterSpacing: z.number().min(-20).max(60).optional(),
    lineHeight: z.number().min(0.6).max(4).optional(),
    transform: z.enum(['none', 'upper', 'lower', 'title']).optional(),
    color: colorRef.optional(),
    opacity: z.number().min(0).max(1).optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
  })
  .strict()

/* ── Base style tokens ────────────────────────────────────────────────────── */

/**
 * The roles every style must supply. Templates are written against these names,
 * which is what lets one template render under any style.
 */
export const styleTokensSchema = z
  .object({
    colors: z
      .object({
        background: hexColor,
        surface: hexColor,
        surfaceAlt: hexColor,
        ink: hexColor,
        inkSoft: hexColor,
        accent: hexColor,
        accentInk: hexColor,
        border: hexColor,
        highlight: hexColor,
      })
      .catchall(hexColor),
    fonts: z.object({
      heading: fontKey,
      body: fontKey,
      mono: fontKey,
    }),
    radius: z.object({
      card: z.number().min(0).max(200),
      image: z.number().min(0).max(200),
      pill: z.number().min(0).max(999),
    }),
    spacing: z.object({
      xs: z.number().min(0).max(200),
      sm: z.number().min(0).max(200),
      md: z.number().min(0).max(400),
      lg: z.number().min(0).max(600),
      xl: z.number().min(0).max(800),
    }),
    effects: z
      .object({
        grain: z.number().min(0).max(1).optional(),
        vignette: z.number().min(0).max(1).optional(),
        imageTreatment: z
          .enum(['none', 'grayscale', 'sepia', 'warm', 'cool', 'contrast', 'fade'])
          .optional(),
        borderWidth: z.number().min(0).max(40).optional(),
        rule: z.number().min(0).max(20).optional(),
      })
      .strict()
      .default({}),
    /** Named type roles: `heroName`, `body`, `label`… Templates reference these. */
    textStyles: z.record(z.string().max(40), textStyleSchema).default({}),
  })
  .strict()

export type StyleTokens = z.infer<typeof styleTokensSchema>

/* ── Components ───────────────────────────────────────────────────────────── */

/**
 * The registry allowlist. A definition naming anything outside this set is
 * rejected at write time, so the renderer never has to decide what to do with
 * an unknown type in front of a user.
 */
export const COMPONENT_TYPES = [
  'text',
  'image',
  'photoGrid',
  'photoStack',
  'quote',
  'tagList',
  'statGroup',
  'timeline',
  'list',
  'socialLinks',
  'divider',
  'mark',
  'shape',
  'badge',
  'meter',
  'sticker',
] as const
export type ComponentType = (typeof COMPONENT_TYPES)[number]

export const LAYOUT_TYPES = ['stack', 'grid', 'absolute', 'overlay', 'spacer'] as const

/** What a user is permitted to change on this specific node. */
const editableSchema = z
  .object({
    content: z.boolean().optional(),
    image: z.boolean().optional(),
    position: z.boolean().optional(),
    size: z.boolean().optional(),
    visibility: z.boolean().optional(),
    color: z.boolean().optional(),
  })
  .strict()

/** Props shared by every node, layout container or leaf alike. */
const commonNodeShape = {
  id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/).optional(),
  /** A binding that must resolve truthy for the node to render at all. */
  when: z.string().max(200).optional(),
  hidden: z.boolean().optional(),
  width: size.optional(),
  height: size.optional(),
  minHeight: z.number().min(0).max(8000).optional(),
  maxHeight: z.number().min(0).max(8000).optional(),
  flex: z.number().min(0).max(100).optional(),
  margin: edge.optional(),
  padding: edge.optional(),
  align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  frame: z
    .object({
      x: coord,
      y: coord,
      width: size.optional(),
      height: size.optional(),
    })
    .optional(),
  rotate: z.number().min(-180).max(180).optional(),
  opacity: z.number().min(0).max(1).optional(),
  background: fill.optional(),
  radius: z.number().min(0).max(999).optional(),
  border: z
    .object({
      width: z.number().min(0).max(40),
      color: colorRef,
      dashed: z.boolean().optional(),
      sides: z.array(z.enum(['top', 'right', 'bottom', 'left'])).max(4).optional(),
    })
    .optional(),
  shadow: z.boolean().optional(),
  editable: editableSchema.optional(),
  /** Free-form label shown in the editor's layer list. */
  label: z.string().max(60).optional(),
}

/**
 * Component props are validated per type in the renderer's registry, not here:
 * this schema guarantees the *shape* (a bounded record of primitives, arrays of
 * primitives and small objects) so unknown props are inert rather than unsafe.
 */
const propValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string().max(2000),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(propValue).max(40),
    z.record(z.string().max(40), propValue),
  ])
)

const componentNode = z
  .object({
    type: z.enum(COMPONENT_TYPES),
    props: z.record(z.string().max(40), propValue).default({}),
    ...commonNodeShape,
  })
  .strict()

export type LayoutNode = z.infer<typeof componentNode> | Record<string, unknown>

const layoutNode: z.ZodType<any> = z.lazy(() =>
  z.union([
    componentNode,
    z
      .object({
        type: z.literal('stack'),
        direction: z.enum(['vertical', 'horizontal']).default('vertical'),
        gap: z.union([z.number().min(0).max(600), z.string().max(20)]).optional(),
        justify: z.enum(['start', 'center', 'end', 'between']).optional(),
        items: z.enum(['start', 'center', 'end', 'stretch']).optional(),
        wrap: z.boolean().optional(),
        children: z.array(layoutNode).max(60).default([]),
        ...commonNodeShape,
      })
      .strict(),
    z
      .object({
        type: z.literal('grid'),
        columns: z.number().int().min(1).max(12),
        gap: z.union([z.number().min(0).max(600), z.string().max(20)]).optional(),
        rowGap: z.union([z.number().min(0).max(600), z.string().max(20)]).optional(),
        children: z.array(layoutNode).max(60).default([]),
        ...commonNodeShape,
      })
      .strict(),
    z
      .object({
        type: z.enum(['absolute', 'overlay']),
        children: z.array(layoutNode).max(60).default([]),
        ...commonNodeShape,
      })
      .strict(),
    z
      .object({
        type: z.literal('spacer'),
        size: z.union([z.number().min(0).max(2000), z.literal('flex')]).default('flex'),
        ...commonNodeShape,
      })
      .strict(),
  ])
)

/* ── Capabilities ─────────────────────────────────────────────────────────── */

/**
 * How much freedom a template hands its user. A template stays recognisable
 * because the designer decided this, not because the editor happens to lack a
 * control. Defaults are deliberately conservative.
 */
export const capabilitiesSchema = z
  .object({
    accentColor: z.boolean().default(true),
    backgroundColor: z.boolean().default(false),
    inkColor: z.boolean().default(false),
    fontChange: z.boolean().default(false),
    styleSwap: z.boolean().default(true),
    customText: z.boolean().default(true),
    photoReplacement: z.boolean().default(true),
    reposition: z.boolean().default(false),
    resize: z.boolean().default(false),
    sectionVisibility: z.boolean().default(true),
    decorations: z.boolean().default(true),
    imageTreatment: z.boolean().default(true),
    maxCustomElements: z.number().int().min(0).max(12).default(4),
  })
  .strict()

export type Capabilities = z.infer<typeof capabilitiesSchema>

/* ── Template definition ──────────────────────────────────────────────────── */

const MAX_NODES = 240
const MAX_DEPTH = 12

function walk(node: any, depth: number, counter: { nodes: number; depth: number }) {
  if (!node || typeof node !== 'object') return
  counter.nodes += 1
  counter.depth = Math.max(counter.depth, depth)
  const children = Array.isArray(node.children) ? node.children : []
  for (const child of children) walk(child, depth + 1, counter)
}

export const templateDefinitionSchema = z
  .object({
    canvas: z.object({
      width: z.number().int().min(240).max(4000),
      height: z.number().int().min(240).max(4000),
      background: fill.optional(),
      padding: edge.optional(),
    }),
    /** Template-level type roles, merged over the base style's own. */
    textStyles: z.record(z.string().max(40), textStyleSchema).default({}),
    /** Template-level token overrides, merged over the base style's colours. */
    tokens: z
      .object({
        colors: z.record(z.string().max(40), hexColor).optional(),
        effects: styleTokensSchema.shape.effects.optional(),
      })
      .strict()
      .optional(),
    root: layoutNode,
    capabilities: capabilitiesSchema.default({}),
    /** Which profile fields this template actually shows — drives the editor. */
    supportedFields: z.array(z.string().max(60)).max(60).default([]),
  })
  .strict()
  .superRefine((def, ctx) => {
    const counter = { nodes: 0, depth: 0 }
    walk(def.root, 1, counter)
    if (counter.nodes > MAX_NODES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `A template may hold at most ${MAX_NODES} nodes (found ${counter.nodes}).`,
      })
    }
    if (counter.depth > MAX_DEPTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `A template may nest at most ${MAX_DEPTH} levels deep (found ${counter.depth}).`,
      })
    }
  })

export type TemplateDefinition = z.infer<typeof templateDefinitionSchema>

/* ── Customisation ────────────────────────────────────────────────────────── */

const customElementSchema = z
  .object({
    id: z.string().max(40),
    type: z.enum(['text', 'sticker', 'badge', 'divider', 'shape', 'image']),
    value: z.string().max(280).default(''),
    x: z.number().min(-0.5).max(1.5),
    y: z.number().min(-0.5).max(1.5),
    scale: z.number().min(0.2).max(4).default(1),
    rotate: z.number().min(-180).max(180).default(0),
    color: colorRef.optional(),
    styleRole: z.string().max(40).optional(),
  })
  .strict()

export const customizationSchema = z
  .object({
    styleId: z.string().regex(/^[a-z0-9_]{2,40}$/).optional(),
    colors: z.record(z.string().max(40), hexColor).default({}),
    fonts: z
      .object({ heading: fontKey.optional(), body: fontKey.optional() })
      .strict()
      .default({}),
    /** Text overrides, keyed by node id. Arrays feed list-shaped components. */
    content: z
      .record(
        z.string().max(40),
        z.union([z.string().max(600), z.array(z.string().max(300)).max(12)])
      )
      .default({}),
    images: z
      .record(
        z.string().max(40),
        z
          .object({
            url: z.string().url().max(1000),
            offsetX: z.number().min(-1).max(1).default(0),
            offsetY: z.number().min(-1).max(1).default(0),
            scale: z.number().min(0.5).max(4).default(1),
            treatment: z
              .enum(['none', 'grayscale', 'sepia', 'warm', 'cool', 'contrast', 'fade'])
              .optional(),
          })
          .strict()
      )
      .default({}),
    visibility: z.record(z.string().max(40), z.boolean()).default({}),
    transforms: z
      .record(
        z.string().max(40),
        z
          .object({
            dx: z.number().min(-2000).max(2000).default(0),
            dy: z.number().min(-2000).max(2000).default(0),
            scale: z.number().min(0.3).max(3).default(1),
            rotate: z.number().min(-180).max(180).default(0),
          })
          .strict()
      )
      .default({}),
    elements: z.array(customElementSchema).max(12).default([]),
    effects: z
      .object({
        grain: z.boolean().optional(),
        vignette: z.boolean().optional(),
        imageTreatment: z
          .enum(['none', 'grayscale', 'sepia', 'warm', 'cool', 'contrast', 'fade'])
          .optional(),
      })
      .strict()
      .default({}),
  })
  .strict()

export type CardCustomization = z.infer<typeof customizationSchema>

/* ── Card profile ─────────────────────────────────────────────────────────── */

const photoSchema = z
  .object({
    id: z.string().max(80).optional(),
    url: z.string().url().max(1000),
    caption: z.string().max(120).optional(),
  })
  .strict()

export const cardProfileSchema = z
  .object({
    name: z.string().max(60).default(''),
    username: z.string().max(40).default(''),
    tagline: z.string().max(90).default(''),
    occupation: z.string().max(80).default(''),
    education: z.string().max(90).default(''),
    location: z.string().max(60).default(''),
    age: z.union([z.number().int().min(0).max(130), z.literal('')]).optional(),
    bio: z.string().max(400).default(''),
    quote: z.string().max(220).default(''),
    quoteAuthor: z.string().max(60).default(''),
    currentChapter: z.string().max(220).default(''),
    nextChapter: z.string().max(220).default(''),
    interests: z.array(z.string().max(40)).max(16).default([]),
    traits: z.array(z.string().max(40)).max(12).default([]),
    favourites: z
      .array(z.object({ label: z.string().max(40), value: z.string().max(80) }).strict())
      .max(10)
      .default([]),
    stats: z
      .array(z.object({ label: z.string().max(30), value: z.string().max(20) }).strict())
      .max(8)
      .default([]),
    meters: z
      .array(
        z
          .object({
            label: z.string().max(30),
            value: z.number().min(0).max(100),
          })
          .strict()
      )
      .max(8)
      .default([]),
    achievements: z
      .array(
        z
          .object({
            title: z.string().max(80),
            note: z.string().max(120).optional(),
            year: z.string().max(12).optional(),
          })
          .strict()
      )
      .max(10)
      .default([]),
    timeline: z
      .array(
        z
          .object({
            year: z.string().max(12),
            title: z.string().max(80),
            note: z.string().max(140).optional(),
          })
          .strict()
      )
      .max(12)
      .default([]),
    goals: z.array(z.string().max(120)).max(8).default([]),
    photos: z.array(photoSchema).max(12).default([]),
    socials: z
      .array(
        z
          .object({
            platform: z.string().max(30),
            handle: z.string().max(60),
            url: z.string().url().max(500).optional(),
          })
          .strict()
      )
      .max(8)
      .default([]),
  })
  .strict()

export type CardProfileData = z.infer<typeof cardProfileSchema>

/* ── API payloads ─────────────────────────────────────────────────────────── */

export const createCardSchema = z
  .object({
    templateId: z.string().regex(/^[a-z0-9_]{2,40}$/),
    styleId: z.string().regex(/^[a-z0-9_]{2,40}$/).optional(),
    title: z.string().max(80).optional(),
    customization: customizationSchema.partial().optional(),
  })
  .strict()

export const updateCardSchema = z
  .object({
    title: z.string().max(80).optional(),
    styleId: z.string().regex(/^[a-z0-9_]{2,40}$/).nullable().optional(),
    templateId: z.string().regex(/^[a-z0-9_]{2,40}$/).optional(),
    customization: customizationSchema.partial().optional(),
    isPublic: z.boolean().optional(),
    isPrimary: z.boolean().optional(),
  })
  .strict()

export const upsertStyleSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9_]{2,40}$/),
    name: z.string().min(1).max(60),
    description: z.string().max(240).optional(),
    tokens: styleTokensSchema,
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    sortOrder: z.number().int().min(0).max(999).default(0),
  })
  .strict()

export const upsertTemplateSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9_]{2,40}$/),
    name: z.string().min(1).max(60),
    description: z.string().max(240).optional(),
    category: z.string().max(40).default('general'),
    thumbnailUrl: z.string().url().max(1000).nullable().optional(),
    defaultStyleId: z.string().regex(/^[a-z0-9_]{2,40}$/).nullable().optional(),
    allowedStyleIds: z.array(z.string().regex(/^[a-z0-9_]{2,40}$/)).max(30).default([]),
    sortOrder: z.number().int().min(0).max(999).default(0),
    isPremium: z.boolean().default(false),
  })
  .strict()

export const createVersionSchema = z
  .object({
    definition: templateDefinitionSchema,
    notes: z.string().max(240).optional(),
    publish: z.boolean().default(false),
  })
  .strict()

/**
 * Turns a ZodError into the one-line message the API returns. Callers see which
 * field failed, which is the difference between a fixable error and a mystery.
 */
export function describeZodError(error: z.ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Invalid payload.'
  const path = issue.path.join('.')
  return path ? `${path}: ${issue.message}` : issue.message
}
