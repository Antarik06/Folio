# Template Production Workflow (Illustrator -> Folio)

This is the production spec for high-quality templates so creative and engineering can scale template drops without quality loss.

## 1. Design Source of Truth
- Design in Adobe Illustrator at print-native dimensions.
- Keep each page/spread as a separate artboard.
- Use a 300 DPI target for print assets.
- Keep all photo placeholders in fixed frame boxes (no flattened text-on-image where editable text is expected).

## 2. Export Package (per template)
- `manifest.json`
  - `templateId`, `name`, `category`
  - `spreads` with frame metadata (`x`, `y`, `width`, `height`, `rotation`, `fitMode`)
  - editable text blocks with defaults (`fontFamily`, `fontSize`, `weight`, `align`, color)
- `preview/`
  - compressed thumbnails for template catalog cards
- `print/`
  - high-res background/image layers (PNG/JPEG, 300 DPI equivalent)
- Optional: `fonts/` notes and licensing metadata

## 3. Quality Rules
- Never use thumbnail assets for layout population.
- Insert client photos from original `blob_url` first, and only fallback to thumbnails when original is unavailable.
- Preserve aspect ratio in frames and allow user crop-fit toggles in editor.
- Keep text editable in the Folio editor whenever the template intends user customization.

## 4. Runtime Mapping in Folio
- Template selection loads spread structure.
- User photos are remapped into template image frames automatically.
- Template switches reapply frame structure while retaining current photo pool.
- Final edits happen in simple editor, with Advanced View available for full control.
