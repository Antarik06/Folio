import type { TemplateDefinition } from '../schema/cardSchema'

/**
 * The shipped templates.
 *
 * A template is a layout document and nothing else — it names colours by token
 * and type by role, so the base style underneath decides how it actually looks.
 * "Editorial on Paper" and "Editorial on Midnight" are the same rows in this
 * file.
 *
 * Nothing here is special-cased in the renderer. A twelfth template is another
 * entry in this array, or a row inserted from the admin panel; neither needs a
 * frontend deploy.
 */

export interface SeedTemplate {
  id: string
  name: string
  description: string
  category: string
  defaultStyleId: string
  allowedStyleIds?: string[]
  sortOrder: number
  definition: TemplateDefinition
}

/* ── Authoring shorthands ─────────────────────────────────────────────────── */
/* These only build plain objects; the stored definition is pure JSON. */

type Node = Record<string, any>

const text = (id: string, props: Node, node: Node = {}): Node => ({
  id,
  type: 'text',
  props,
  ...node,
})

const label = (id: string, props: Node, node: Node = {}): Node =>
  text(id, { style: 'label', ...props }, node)

const rule = (id: string, props: Node = {}, node: Node = {}): Node => ({
  id,
  type: 'divider',
  props: { weight: 1, color: 'border', ...props },
  ...node,
})

const stack = (props: Node, children: Node[]): Node => ({
  type: 'stack',
  direction: 'vertical',
  children,
  ...props,
})

const row = (props: Node, children: Node[]): Node => ({
  type: 'stack',
  direction: 'horizontal',
  children,
  ...props,
})

const flexSpacer = (): Node => ({ type: 'spacer', size: 'flex' })

const scrim = (
  from: number,
  to: number,
  color = '#000000',
  opacity = 0.88
): Node => ({
  type: 'linear',
  angle: 180,
  stops: [
    { offset: 0, color, opacity: 0 },
    { offset: from, color, opacity: opacity * 0.25 },
    { offset: to, color, opacity },
  ],
})

/** The credit line every card carries, so a Folio card reads as one. */
const creditRow = (id: string, tone = 'inkSoft'): Node =>
  row({ id, items: 'center', justify: 'between' }, [
    text(`${id}Handle`, {
      style: 'handle',
      parts: ['{{profile.username | prefix:@}}', '{{profile.location}}'],
      color: tone,
    }),
    { id: `${id}Mark`, type: 'mark', props: { kind: 'cross', size: 26, color: tone } },
  ])

/* ── 01 Minimal ───────────────────────────────────────────────────────────── */

const minimal: TemplateDefinition = {
  canvas: { width: 1080, height: 1350, background: 'background', padding: 86 },
  textStyles: {},
  root: stack({ gap: 'lg', height: 'fill' }, [
    {
      id: 'hero',
      type: 'image',
      props: {
        src: '{{profile.photos[0].url}}',
        fit: 'cover',
        ratio: 1.45,
        radius: 'image',
      },
      editable: { image: true, visibility: false },
      width: 'fill',
    },
    stack({ gap: 'xs' }, [
      text('name', { style: 'heroName', value: '{{profile.name | default:Your name}}', fit: true }),
      text('role', {
        style: 'subtitle',
        parts: ['{{profile.occupation}}', '{{profile.location}}'],
      }),
    ]),
    rule('rule1', { color: 'border' }),
    text('bio', {
      style: 'body',
      value: '{{profile.bio}}',
      maxLines: 3,
    }, { when: 'profile.bio' }),
    {
      id: 'interests',
      type: 'tagList',
      props: { source: '{{profile.interests}}', max: 3, variant: 'dot', style: 'tag' },
      when: 'profile.interests',
    },
    flexSpacer(),
    {
      id: 'quote',
      type: 'quote',
      props: { value: '{{profile.quote}}', mark: true, style: 'quote' },
      when: 'profile.quote',
    },
    creditRow('credit'),
  ]),
  capabilities: {
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
  },
  supportedFields: ['name', 'occupation', 'location', 'bio', 'interests', 'quote', 'photos', 'username'],
}

/* ── 02 Editorial ─────────────────────────────────────────────────────────── */

const editorial: TemplateDefinition = {
  canvas: { width: 1080, height: 1350, background: 'background', padding: 70 },
  textStyles: { display: { size: 104, lineHeight: 0.9 } },
  root: stack({ gap: 'sm', height: 'fill' }, [
    row({ id: 'masthead', justify: 'between', items: 'center' }, [
      label('mastheadLeft', { value: 'Portrait', color: 'accent' }),
      label('mastheadRight', { parts: ['{{profile.location}}', '{{now.year}}'] }),
    ]),
    rule('ruleTop', { weight: 3, color: 'ink' }, { margin: { bottom: 8 } }),
    text('name', {
      style: 'display',
      value: '{{profile.name | default:Your name}}',
      fit: true,
    }),
    text('role', {
      style: 'subtitle',
      value: '{{profile.occupation | default:Somebody worth knowing}}',
    }, { margin: { bottom: 12 } }),
    {
      id: 'hero',
      type: 'image',
      props: {
        src: '{{profile.photos[0].url}}',
        fit: 'cover',
        height: 470,
        radius: 'image',
      },
      editable: { image: true },
      width: 'fill',
    },
    row({ gap: 'md', margin: { top: 22 }, items: 'start' }, [
      stack({ flex: 1, gap: 'xs' }, [
        label('aboutLabel', { value: 'About', color: 'accent' }),
        rule('ruleAbout'),
        text('bio', { style: 'bodySmall', value: '{{profile.bio}}', maxLines: 6 }),
      ]),
      stack({ width: 300, gap: 'xs' }, [
        label('interestsLabel', { value: 'In her own words', color: 'accent' }),
        rule('ruleInterests'),
        {
          id: 'interests',
          type: 'list',
          props: { source: '{{profile.interests}}', max: 5, marker: 'dash', style: 'bodySmall' },
        },
      ]),
    ]),
    flexSpacer(),
    rule('ruleQuote', { weight: 2, color: 'ink' }),
    {
      id: 'quote',
      type: 'quote',
      props: { value: '{{profile.quote}}', author: '{{profile.quoteAuthor}}', style: 'quote', mark: false },
      when: 'profile.quote',
      margin: { top: 14, bottom: 14 },
    },
    creditRow('credit'),
  ]),
  capabilities: {
    accentColor: true,
    backgroundColor: true,
    inkColor: false,
    fontChange: false,
    styleSwap: true,
    customText: true,
    photoReplacement: true,
    reposition: false,
    resize: false,
    sectionVisibility: true,
    decorations: true,
    imageTreatment: true,
    maxCustomElements: 4,
  },
  supportedFields: ['name', 'occupation', 'location', 'bio', 'interests', 'quote', 'quoteAuthor', 'photos'],
}

/* ── 03 Cinematic ─────────────────────────────────────────────────────────── */

const cinematic: TemplateDefinition = {
  canvas: { width: 1080, height: 1350, background: 'background' },
  textStyles: {
    display: { size: 118, lineHeight: 0.9, color: '#FFFFFF' },
    label: { color: '#FFFFFF', opacity: 0.75 },
    body: { color: '#FFFFFF' },
    bodySmall: { color: '#FFFFFF', opacity: 0.8 },
    handle: { color: '#FFFFFF', opacity: 0.7 },
  },
  root: {
    type: 'absolute',
    width: 1080,
    height: 1350,
    children: [
      {
        id: 'hero',
        type: 'image',
        props: {
          src: '{{profile.photos[0].url}}',
          fit: 'cover',
          overlay: scrim(0.45, 1),
        },
        editable: { image: true },
        frame: { x: 0, y: 0, width: 1080, height: 1350 },
      },
      row(
        { id: 'topBar', frame: { x: 72, y: 66, width: 936 }, justify: 'between', items: 'center' },
        [
          label('topLeft', { value: 'A life in one frame' }),
          { id: 'topMark', type: 'mark', props: { kind: 'crosshair', size: 26, color: '#FFFFFF' } },
        ]
      ),
      stack({ id: 'lower', frame: { x: 72, y: 730, width: 936 }, gap: 'sm' }, [
        label('kicker', { value: 'The story so far', color: 'accent' }),
        text('name', { style: 'display', value: '{{profile.name | default:Your name}}', fit: true }),
        text('tagline', {
          style: 'subtitle',
          parts: ['{{profile.occupation}}', '{{profile.location}}'],
          color: '#FFFFFF',
          opacity: 0.85,
        }),
        rule('ruleAccent', { weight: 3, color: 'accent', width: 120 }, { margin: { top: 10, bottom: 6 } }),
        {
          id: 'achievements',
          type: 'list',
          props: {
            source: '{{profile.achievements}}',
            field: 'title',
            secondaryField: 'year',
            max: 3,
            marker: 'none',
            style: 'body',
            secondaryStyle: 'year',
            gap: 8,
          },
          when: 'profile.achievements',
        },
        stack({ gap: 4, margin: { top: 12 } }, [
          label('nowLabel', { value: 'Current chapter', color: 'accent' }),
          text('now', { style: 'bodySmall', value: '{{profile.currentChapter}}', maxLines: 2 }),
        ], ),
        stack({ gap: 4, margin: { top: 6 } }, [
          label('nextLabel', { value: 'Next', color: 'accent' }),
          text('next', { style: 'bodySmall', value: '{{profile.nextChapter}}', maxLines: 2 }),
        ]),
      ]),
      row({ id: 'credit', frame: { x: 72, y: 1252, width: 936 }, justify: 'between', items: 'center' }, [
        text('creditHandle', { style: 'handle', value: '{{profile.username | prefix:@}}' }),
        text('creditMark', { style: 'handle', value: 'Folio' }),
      ]),
    ],
  },
  capabilities: {
    accentColor: true,
    backgroundColor: false,
    inkColor: false,
    fontChange: false,
    styleSwap: true,
    customText: true,
    photoReplacement: true,
    reposition: false,
    resize: false,
    sectionVisibility: true,
    decorations: true,
    imageTreatment: true,
    maxCustomElements: 3,
  },
  supportedFields: [
    'name',
    'occupation',
    'location',
    'photos',
    'achievements',
    'currentChapter',
    'nextChapter',
    'username',
  ],
}

/* ── 04 Timeline ──────────────────────────────────────────────────────────── */

const timeline: TemplateDefinition = {
  canvas: { width: 1080, height: 1350, background: 'background', padding: 78 },
  textStyles: {},
  root: stack({ gap: 'md', height: 'fill' }, [
    row({ id: 'head', gap: 'sm', items: 'center' }, [
      {
        id: 'portrait',
        type: 'image',
        props: { src: '{{profile.photos[0].url}}', fit: 'cover', shape: 'circle' },
        editable: { image: true },
        width: 190,
        height: 190,
      },
      stack({ flex: 1, gap: 6 }, [
        text('name', { style: 'title', value: '{{profile.name | default:Your name}}', maxLines: 2 }),
        text('role', {
          style: 'label',
          parts: ['{{profile.occupation}}', '{{profile.location}}'],
        }),
      ]),
    ]),
    rule('ruleTop', { weight: 2, color: 'ink' }),
    label('timelineLabel', { value: 'How it went', color: 'accent' }),
    {
      id: 'timeline',
      type: 'timeline',
      props: {
        source: '{{profile.timeline}}',
        max: 5,
        marker: 'cross',
        gap: 22,
      },
      when: 'profile.timeline',
    },
    flexSpacer(),
    rule('ruleBottom'),
    row({ gap: 'md', items: 'start' }, [
      stack({ flex: 1, gap: 6 }, [
        label('nowLabel', { value: 'Currently', color: 'accent' }),
        text('now', { style: 'bodySmall', value: '{{profile.currentChapter}}', maxLines: 3 }),
      ]),
      stack({ flex: 1, gap: 6 }, [
        label('nextLabel', { value: 'Next', color: 'accent' }),
        text('next', { style: 'bodySmall', value: '{{profile.nextChapter}}', maxLines: 3 }),
      ]),
    ]),
    creditRow('credit'),
  ]),
  capabilities: {
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
  },
  supportedFields: [
    'name',
    'occupation',
    'location',
    'photos',
    'timeline',
    'currentChapter',
    'nextChapter',
    'username',
  ],
}

/* ── 05 Personality ───────────────────────────────────────────────────────── */

const personality: TemplateDefinition = {
  canvas: { width: 1080, height: 1350, background: 'background', padding: 56 },
  textStyles: {},
  root: stack(
    {
      height: 'fill',
      background: 'surface',
      radius: 24,
      padding: 52,
      gap: 'md',
      border: { width: 2, color: 'border' },
    },
    [
      row({ id: 'head', gap: 'sm', items: 'start' }, [
        {
          id: 'portrait',
          type: 'image',
          props: { src: '{{profile.photos[0].url}}', fit: 'cover', radius: 'image' },
          editable: { image: true },
          width: 250,
          height: 310,
        },
        stack({ flex: 1, gap: 'xs' }, [
          label('kicker', { value: 'Character card', color: 'accent' }),
          text('name', { style: 'title', value: '{{profile.name | default:Your name}}', maxLines: 2 }),
          text('role', { style: 'bodySmall', value: '{{profile.occupation}}' }),
          {
            id: 'traits',
            type: 'tagList',
            props: { source: '{{profile.traits}}', max: 4, variant: 'pill', style: 'tag' },
            when: 'profile.traits',
            margin: { top: 8 },
          },
        ]),
      ]),
      rule('rule1'),
      {
        id: 'meters',
        type: 'meter',
        props: { source: '{{profile.meters}}', max: 4, height: 10, gap: 20 },
        when: 'profile.meters',
      },
      rule('rule2'),
      stack({ gap: 'xs' }, [
        label('interestsLabel', { value: 'Into', color: 'accent' }),
        {
          id: 'interests',
          type: 'tagList',
          props: { source: '{{profile.interests}}', max: 8, variant: 'outline', style: 'tag' },
        },
      ]),
      flexSpacer(),
      stack({ gap: 'xs' }, [
        label('nowLabel', { value: 'Currently', color: 'accent' }),
        text('now', { style: 'bodySmall', value: '{{profile.currentChapter}}', maxLines: 3 }),
      ]),
      creditRow('credit'),
    ]
  ),
  capabilities: {
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
    maxCustomElements: 4,
  },
  supportedFields: [
    'name',
    'occupation',
    'photos',
    'traits',
    'meters',
    'interests',
    'currentChapter',
    'username',
  ],
}

/* ── 06 Polaroid ──────────────────────────────────────────────────────────── */

const polaroid: TemplateDefinition = {
  canvas: { width: 1080, height: 1350, background: 'background', padding: 70 },
  textStyles: {},
  root: stack({ gap: 'md', height: 'fill', items: 'center' }, [
    label('kicker', { value: 'From the drawer', color: 'accent', align: 'center' }, ),
    {
      id: 'photos',
      type: 'photoStack',
      props: {
        source: '{{profile.photos}}',
        count: 3,
        spread: 7,
        matteWidth: 26,
        ratio: 1,
        caption: '{{profile.location}}',
      },
      editable: { image: true },
      width: 'fill',
      height: 720,
    },
    flexSpacer(),
    text('name', {
      style: 'heroName',
      value: '{{profile.name | default:Your name}}',
      align: 'center',
      fit: true,
    }),
    text('tagline', {
      style: 'subtitle',
      value: '{{profile.tagline}}',
      align: 'center',
      maxLines: 2,
    }),
    rule('rule1', { width: 140 }, { align: 'center' }),
    text('handle', {
      style: 'handle',
      parts: ['{{profile.username | prefix:@}}', '{{now.year}}'],
      align: 'center',
    }),
  ]),
  capabilities: {
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
    maxCustomElements: 5,
  },
  supportedFields: ['name', 'tagline', 'location', 'photos', 'username'],
}

/* ── 07 Scrapbook ─────────────────────────────────────────────────────────── */

const scrapbook: TemplateDefinition = {
  canvas: { width: 1080, height: 1350, background: 'background' },
  textStyles: {},
  root: {
    type: 'absolute',
    width: 1080,
    height: 1350,
    children: [
      {
        id: 'photo1',
        type: 'image',
        props: {
          src: '{{profile.photos[0].url}}',
          fit: 'cover',
          matte: 22,
          matteColor: 'surface',
          shadow: true,
        },
        editable: { image: true },
        frame: { x: 78, y: 120, width: 440, height: 470 },
        rotate: -5,
      },
      {
        id: 'photo2',
        type: 'image',
        props: {
          src: '{{profile.photos[1].url}}',
          fit: 'cover',
          matte: 18,
          matteColor: 'surface',
          shadow: true,
        },
        editable: { image: true },
        frame: { x: 560, y: 200, width: 380, height: 380 },
        rotate: 6,
        when: 'profile.photos[1]',
      },
      {
        id: 'photo3',
        type: 'image',
        props: {
          src: '{{profile.photos[2].url}}',
          fit: 'cover',
          matte: 18,
          matteColor: 'surface',
          shadow: true,
        },
        editable: { image: true },
        frame: { x: 610, y: 620, width: 330, height: 300 },
        rotate: -3,
        when: 'profile.photos[2]',
      },
      {
        id: 'sticker1',
        type: 'sticker',
        props: { value: '✦', size: 70, color: 'accent' },
        frame: { x: 500, y: 96 },
        rotate: 12,
      },
      {
        id: 'sticker2',
        type: 'sticker',
        props: { value: '✽', size: 54, color: 'highlight' },
        frame: { x: 96, y: 596 },
        rotate: -10,
      },
      stack({ id: 'words', frame: { x: 78, y: 660, width: 480 }, gap: 'xs' }, [
        label('kicker', { value: 'Pieces of me', color: 'accent' }),
        text('name', { style: 'title', value: '{{profile.name | default:Your name}}', maxLines: 2 }),
        text('bio', { style: 'bodySmall', value: '{{profile.bio}}', maxLines: 4 }),
      ]),
      {
        id: 'interests',
        type: 'tagList',
        props: { source: '{{profile.interests}}', max: 6, variant: 'pill', style: 'tag' },
        frame: { x: 78, y: 1010, width: 924 },
      },
      {
        id: 'quote',
        type: 'quote',
        props: { value: '{{profile.quote}}', style: 'quote', mark: true },
        frame: { x: 78, y: 1120, width: 830 },
        when: 'profile.quote',
      },
      row({ id: 'credit', frame: { x: 78, y: 1268, width: 924 }, justify: 'between', items: 'center' }, [
        text('creditHandle', { style: 'handle', value: '{{profile.username | prefix:@}}' }),
        { id: 'creditMark', type: 'mark', props: { kind: 'cross', size: 24, color: 'inkSoft' } },
      ]),
    ],
  },
  capabilities: {
    accentColor: true,
    backgroundColor: true,
    inkColor: false,
    fontChange: true,
    styleSwap: true,
    customText: true,
    photoReplacement: true,
    reposition: true,
    resize: false,
    sectionVisibility: true,
    decorations: true,
    imageTreatment: true,
    maxCustomElements: 8,
  },
  supportedFields: ['name', 'bio', 'photos', 'interests', 'quote', 'username'],
}

/* ── 08 Magazine ──────────────────────────────────────────────────────────── */

const magazine: TemplateDefinition = {
  canvas: { width: 1080, height: 1350, background: 'background' },
  textStyles: {
    display: { size: 150, lineHeight: 0.84, letterSpacing: -5, color: '#FFFFFF' },
    label: { color: '#FFFFFF' },
    bodySmall: { color: '#FFFFFF' },
    handle: { color: '#FFFFFF', opacity: 0.75 },
  },
  root: {
    type: 'absolute',
    width: 1080,
    height: 1350,
    children: [
      {
        id: 'hero',
        type: 'image',
        props: {
          src: '{{profile.photos[0].url}}',
          fit: 'cover',
          overlay: scrim(0.55, 1, '#000000', 0.7),
        },
        editable: { image: true },
        frame: { x: 0, y: 0, width: 1080, height: 1350 },
      },
      text('name', {
        style: 'display',
        value: '{{profile.name | default:Your name | upper}}',
        fit: true,
        align: 'center',
      }, { frame: { x: 54, y: 74, width: 972 } }),
      rule('ruleTop', { weight: 2, color: '#FFFFFF' }, { frame: { x: 54, y: 232, width: 972 }, opacity: 0.5 }),
      row({ id: 'issue', frame: { x: 54, y: 250, width: 972 }, justify: 'between' }, [
        label('issueLeft', { value: 'No. {{now.year}}' }),
        label('issueRight', { value: '{{profile.location}}' }),
      ]),
      stack({ id: 'coverLines', frame: { x: 54, y: 880, width: 620 }, gap: 14 }, [
        {
          id: 'lines',
          type: 'list',
          props: {
            source: '{{profile.interests}}',
            max: 4,
            marker: 'bar',
            style: 'bodySmall',
            markerColor: 'accent',
            gap: 14,
          },
        },
      ]),
      stack({ id: 'lede', frame: { x: 54, y: 1120, width: 780 }, gap: 10 }, [
        label('ledeLabel', { value: 'Inside', color: 'accent' }),
        text('lede', {
          style: 'bodySmall',
          value: '{{profile.tagline}}',
          fallback: '{{profile.bio}}',
          maxLines: 2,
        }),
      ]),
      row({ id: 'credit', frame: { x: 54, y: 1258, width: 972 }, justify: 'between', items: 'center' }, [
        text('creditHandle', { style: 'handle', value: '{{profile.username | prefix:@}}' }),
        { id: 'creditMark', type: 'mark', props: { kind: 'sprocket', size: 44, color: '#FFFFFF' } },
      ]),
    ],
  },
  capabilities: {
    accentColor: true,
    backgroundColor: false,
    inkColor: false,
    fontChange: false,
    styleSwap: true,
    customText: true,
    photoReplacement: true,
    reposition: false,
    resize: false,
    sectionVisibility: true,
    decorations: true,
    imageTreatment: true,
    maxCustomElements: 3,
  },
  supportedFields: ['name', 'tagline', 'bio', 'location', 'interests', 'photos', 'username'],
}

/* ── 09 Wrapped ───────────────────────────────────────────────────────────── */

const wrapped: TemplateDefinition = {
  canvas: { width: 1080, height: 1350, background: 'accent', padding: 84 },
  textStyles: {
    display: { size: 110, lineHeight: 0.92, color: 'accentInk' },
    title: { color: 'accentInk' },
    label: { color: 'accentInk', opacity: 0.75 },
    body: { color: 'accentInk' },
    bodySmall: { color: 'accentInk', opacity: 0.85 },
    stat: { color: 'accentInk' },
    statLabel: { color: 'accentInk', opacity: 0.7 },
    handle: { color: 'accentInk', opacity: 0.75 },
    tag: { color: 'accentInk' },
  },
  root: stack({ gap: 'md', height: 'fill' }, [
    row({ justify: 'between', items: 'center' }, [
      label('kicker', { value: 'The short version' }),
      label('year', { value: '{{now.year}}' }),
    ]),
    flexSpacer(),
    text('name', { style: 'display', value: '{{profile.name | default:Your name}}', fit: true }),
    text('tagline', {
      style: 'subtitle',
      value: '{{profile.tagline}}',
      color: 'accentInk',
      opacity: 0.85,
      maxLines: 2,
    }),
    rule('rule1', { weight: 2, color: 'accentInk' }, { opacity: 0.35, margin: { top: 18, bottom: 10 } }),
    stack({ gap: 'xs' }, [
      label('topLabel', { value: 'On repeat this year' }),
      {
        id: 'interests',
        type: 'list',
        props: {
          source: '{{profile.interests}}',
          max: 5,
          marker: 'number',
          style: 'title',
          markerStyle: 'statLabel',
          gap: 10,
        },
      },
    ]),
    flexSpacer(),
    {
      id: 'stats',
      type: 'statGroup',
      props: { source: '{{profile.stats}}', columns: 3, divider: true },
      when: 'profile.stats',
    },
    rule('rule2', { weight: 1, color: 'accentInk' }, { opacity: 0.35 }),
    row({ justify: 'between', items: 'center' }, [
      text('handle', { style: 'handle', value: '{{profile.username | prefix:@}}' }),
      { id: 'creditMark', type: 'mark', props: { kind: 'cross', size: 26, color: 'accentInk' } },
    ]),
  ]),
  capabilities: {
    accentColor: true,
    backgroundColor: false,
    inkColor: false,
    fontChange: true,
    styleSwap: true,
    customText: true,
    photoReplacement: false,
    reposition: false,
    resize: false,
    sectionVisibility: true,
    decorations: true,
    imageTreatment: false,
    maxCustomElements: 3,
  },
  supportedFields: ['name', 'tagline', 'interests', 'stats', 'username'],
}

/* ── 10 Story (9:16) ──────────────────────────────────────────────────────── */

const story: TemplateDefinition = {
  canvas: { width: 1080, height: 1920, background: 'background' },
  textStyles: {},
  root: {
    type: 'absolute',
    width: 1080,
    height: 1920,
    children: [
      {
        id: 'hero',
        type: 'image',
        props: {
          src: '{{profile.photos[0].url}}',
          fit: 'cover',
          overlay: scrim(0.6, 1, '#000000', 0.55),
        },
        editable: { image: true },
        frame: { x: 0, y: 0, width: 1080, height: 1180 },
      },
      row({ id: 'top', frame: { x: 80, y: 96, width: 920 }, justify: 'between', items: 'center' }, [
        label('kicker', { value: 'Folio', color: '#FFFFFF' }),
        { id: 'topMark', type: 'mark', props: { kind: 'crosshair', size: 26, color: '#FFFFFF' } },
      ]),
      stack({ id: 'lower', frame: { x: 80, y: 1250, width: 920 }, gap: 'sm' }, [
        text('name', { style: 'heroName', value: '{{profile.name | default:Your name}}', fit: true }),
        text('role', {
          style: 'subtitle',
          parts: ['{{profile.occupation}}', '{{profile.location}}'],
        }),
        rule('rule1', { weight: 2, color: 'accent', width: 110 }, { margin: { top: 12, bottom: 12 } }),
        text('bio', { style: 'body', value: '{{profile.bio}}', maxLines: 3 }, { when: 'profile.bio' }),
        {
          id: 'stats',
          type: 'statGroup',
          props: { source: '{{profile.stats}}', columns: 3, divider: false },
          when: 'profile.stats',
          margin: { top: 24 },
        },
        {
          id: 'interests',
          type: 'tagList',
          props: { source: '{{profile.interests}}', max: 5, variant: 'outline', style: 'tag' },
          margin: { top: 20 },
        },
      ]),
      {
        ...creditRow('credit'),
        frame: { x: 80, y: 1806, width: 920 },
      },
    ],
  },
  capabilities: {
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
    maxCustomElements: 4,
  },
  supportedFields: [
    'name',
    'occupation',
    'location',
    'bio',
    'stats',
    'interests',
    'photos',
    'username',
  ],
}

/* ── 11 Square ────────────────────────────────────────────────────────────── */

const square: TemplateDefinition = {
  canvas: { width: 1080, height: 1080, background: 'background' },
  textStyles: {},
  root: row({ width: 1080, height: 1080 }, [
    {
      id: 'hero',
      type: 'image',
      props: { src: '{{profile.photos[0].url}}', fit: 'cover' },
      editable: { image: true },
      width: 460,
      height: 1080,
    },
    stack({ flex: 1, padding: 62, gap: 'sm', height: 1080 }, [
      label('kicker', { value: 'Hello', color: 'accent' }),
      text('name', { style: 'title', value: '{{profile.name | default:Your name}}', maxLines: 2 }),
      text('role', {
        style: 'label',
        parts: ['{{profile.occupation}}', '{{profile.location}}'],
      }),
      rule('rule1', {}, { margin: { top: 14, bottom: 14 } }),
      text('bio', { style: 'bodySmall', value: '{{profile.bio}}', maxLines: 5 }, { when: 'profile.bio' }),
      {
        id: 'interests',
        type: 'tagList',
        props: { source: '{{profile.interests}}', max: 5, variant: 'dot', style: 'tag' },
        margin: { top: 12 },
      },
      flexSpacer(),
      {
        id: 'socials',
        type: 'socialLinks',
        props: { source: '{{profile.socials}}', max: 3, style: 'handle', layout: 'column' },
        when: 'profile.socials',
      },
      rule('rule2'),
      creditRow('credit'),
    ]),
  ]),
  capabilities: {
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
  },
  supportedFields: [
    'name',
    'occupation',
    'location',
    'bio',
    'interests',
    'socials',
    'photos',
    'username',
  ],
}

/* ── 12 Occasion — the legacy share card, kept as a template ───────────────── */

const occasion: TemplateDefinition = {
  canvas: { width: 1080, height: 1350, background: 'accent', padding: 90 },
  textStyles: {
    heroName: { color: 'accentInk', align: 'center' },
    label: { color: 'accentInk', opacity: 0.8 },
    handle: { color: 'accentInk', opacity: 0.8 },
  },
  root: stack({ gap: 'md', height: 'fill', items: 'center' }, [
    row({ width: 'fill', justify: 'between', items: 'center' }, [
      label('kicker', { value: 'An occasion' }),
      { id: 'topMark', type: 'mark', props: { kind: 'cross', size: 28, color: 'accentInk' } },
    ]),
    flexSpacer(),
    {
      id: 'photo',
      type: 'image',
      props: {
        src: '{{profile.photos[0].url}}',
        fit: 'cover',
        shape: 'circle',
        matte: 18,
        matteColor: 'accentInk',
      },
      editable: { image: true },
      width: 520,
      height: 520,
      align: 'center',
    },
    text('headline', {
      style: 'heroName',
      value: 'Two years',
      align: 'center',
      fit: true,
    }, { margin: { top: 20 } }),
    text('subline', {
      style: 'label',
      value: '{{profile.location}}',
      align: 'center',
    }),
    flexSpacer(),
    text('credit', {
      style: 'handle',
      parts: ['{{profile.name}}', '{{profile.username | prefix:@}}'],
      align: 'center',
    }),
  ]),
  capabilities: {
    accentColor: true,
    backgroundColor: false,
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
  },
  supportedFields: ['name', 'username', 'photos'],
}

export const SEED_TEMPLATES: SeedTemplate[] = [
  {
    id: 'minimal_01',
    name: 'Minimal',
    description: 'One portrait, your name, three things you like. Nothing else.',
    category: 'minimal',
    defaultStyleId: 'ivory',
    sortOrder: 10,
    definition: minimal,
  },
  {
    id: 'editorial_01',
    name: 'Editorial',
    description: 'A magazine spread about one person. Masthead, portrait, two columns.',
    category: 'editorial',
    defaultStyleId: 'paper',
    sortOrder: 20,
    definition: editorial,
  },
  {
    id: 'cinematic_01',
    name: 'Cinematic',
    description: 'A film poster. Full-bleed photograph, your name across the bottom.',
    category: 'cinematic',
    defaultStyleId: 'darkroom',
    sortOrder: 30,
    definition: cinematic,
  },
  {
    id: 'timeline_01',
    name: 'Timeline',
    description: 'The years that made you, set as a printed list.',
    category: 'story',
    defaultStyleId: 'sepia',
    sortOrder: 40,
    definition: timeline,
  },
  {
    id: 'personality_01',
    name: 'Personality',
    description: 'A character card. Traits, meters, and what you are into.',
    category: 'playful',
    defaultStyleId: 'bloom',
    sortOrder: 50,
    definition: personality,
  },
  {
    id: 'polaroid_01',
    name: 'Polaroid',
    description: 'Three prints on a table, slightly out of square.',
    category: 'photography',
    defaultStyleId: 'paper',
    sortOrder: 60,
    definition: polaroid,
  },
  {
    id: 'scrapbook_01',
    name: 'Scrapbook',
    description: 'Photographs at angles, stickers, and your own handwriting.',
    category: 'playful',
    defaultStyleId: 'bloom',
    sortOrder: 70,
    definition: scrapbook,
  },
  {
    id: 'magazine_01',
    name: 'Magazine',
    description: 'A cover. Your name as the masthead, cover lines down the side.',
    category: 'editorial',
    defaultStyleId: 'darkroom',
    sortOrder: 80,
    definition: magazine,
  },
  {
    id: 'wrapped_01',
    name: 'Wrapped',
    description: 'A solid field of colour and a numbered list. Loud on purpose.',
    category: 'playful',
    defaultStyleId: 'midnight',
    sortOrder: 90,
    definition: wrapped,
  },
  {
    id: 'story_01',
    name: 'Story',
    description: 'Nine-by-sixteen, for Instagram and WhatsApp status.',
    category: 'social',
    defaultStyleId: 'darkroom',
    sortOrder: 100,
    definition: story,
  },
  {
    id: 'square_01',
    name: 'Square',
    description: 'A square introduction, split down the middle. Good for LinkedIn.',
    category: 'social',
    defaultStyleId: 'ivory',
    sortOrder: 110,
    definition: square,
  },
  {
    id: 'occasion_01',
    name: 'Occasion',
    description: 'A solid accent field with the photograph set like a locket.',
    category: 'occasion',
    defaultStyleId: 'paper',
    sortOrder: 120,
    definition: occasion,
  },
]
