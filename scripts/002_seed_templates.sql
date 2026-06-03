-- Seed default album templates

INSERT INTO public.templates (id, name, description, category, thumbnail_url, layout_schema, style_schema, is_premium) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Classic Minimal',
  'Clean, timeless layouts with generous white space',
  'minimal',
  '/templates/classic-minimal.jpg',
  '{"defaultLayout": "single", "availableLayouts": ["single", "duo", "trio", "grid-4"], "marginStyle": "generous"}',
  '{"fontFamily": "serif", "backgroundColor": "#FDFAF5", "textColor": "#1C1814", "accentColor": "#B85C38"}',
  false
),
(
  '00000000-0000-0000-0000-000000000002',
  'Editorial Story',
  'Magazine-style spreads that emphasize narrative flow',
  'editorial',
  '/templates/editorial-story.jpg',
  '{"defaultLayout": "asymmetric", "availableLayouts": ["full-bleed", "asymmetric", "text-heavy", "single"], "marginStyle": "tight"}',
  '{"fontFamily": "sans", "backgroundColor": "#F5F0E8", "textColor": "#1C1814", "accentColor": "#3A7D6E"}',
  false
),
(
  '00000000-0000-0000-0000-000000000003',
  'Warm Memories',
  'Soft, nostalgic aesthetic with warm tones',
  'warm',
  '/templates/warm-memories.jpg',
  '{"defaultLayout": "duo", "availableLayouts": ["single", "duo", "polaroid", "scattered"], "marginStyle": "medium"}',
  '{"fontFamily": "serif", "backgroundColor": "#FAF6F0", "textColor": "#3D3428", "accentColor": "#C4785A"}',
  false
),
(
  '00000000-0000-0000-0000-000000000004',
  'Modern Grid',
  'Contemporary geometric layouts',
  'modern',
  '/templates/modern-grid.jpg',
  '{"defaultLayout": "grid-4", "availableLayouts": ["grid-4", "grid-6", "masonry", "single"], "marginStyle": "minimal"}',
  '{"fontFamily": "sans", "backgroundColor": "#FFFFFF", "textColor": "#1C1814", "accentColor": "#1C1814"}',
  true
),
(
  '00000000-0000-0000-0000-000000000005',
  'Cinematic',
  'Widescreen letterbox layouts for dramatic impact',
  'cinematic',
  '/templates/cinematic.jpg',
  '{"defaultLayout": "letterbox", "availableLayouts": ["letterbox", "full-bleed", "single", "duo"], "marginStyle": "none"}',
  '{"fontFamily": "sans", "backgroundColor": "#1C1814", "textColor": "#F5F0E8", "accentColor": "#B85C38"}',
  true
),
(
  '00000000-0000-0000-0000-000000000006',
  'Scrapbook',
  'Playful, layered layouts with personality',
  'playful',
  '/templates/scrapbook.jpg',
  '{"defaultLayout": "scattered", "availableLayouts": ["scattered", "polaroid", "stacked", "single"], "marginStyle": "generous"}',
  '{"fontFamily": "handwritten", "backgroundColor": "#F8F4EC", "textColor": "#2D2A26", "accentColor": "#5B8A72"}',
  true
);
