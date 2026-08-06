# 🎨 Design.md — Visual Aesthetics, Theme & Design System

## 1. Aesthetic Vision: "Editorial Darkroom"
Folio's visual identity balances the **tactile warmth of traditional photo print darkrooms** with **sleek modern digital studio interfaces**. Rather than generic flat or neon tech aesthetics, Folio uses aged paper textures, warm terracotta accents, deep forest green secondary tones, and dark ink typography.

---

## 2. Color Palette & CSS Variables

| Token | Hex Value | Name | Description / Usage |
|---|---|---|---|
| `--background` | `#F5F0E8` | Aged Paper | Soft warm background, reminiscent of unbleached fine cartridge paper |
| `--foreground` | `#1C1814` | Near-Black Ink | High contrast warm ink typography |
| `--card` | `#FDFAF5` | Warm White Surface | Crisp paper surface for cards, popovers, and canvas container frames |
| `--primary` | `#B85C38` | Worn Terracotta | Primary buttons, active tabs, focus rings, call-to-action elements |
| `--secondary` | `#3A7D6E` | Bottle Green | Secondary accents, status badges, highlight tags, forest depth |
| `--muted-foreground` | `#7A6F64` | Pencil Gray | Subtitle text, metadata, subtle borders, captions |
| `--border` | `#DDD8CE` | Linen Texture | Clean linen structural borders and divider lines |
| `--darkroom` | `#1C1814` | Darkroom Canvas | Dark mode background and studio canvas workbench backdrop |

### Dark Mode Palette Overrides (`.dark`)
```css
.dark {
  --background: #1C1814;       /* Deep darkroom ink */
  --foreground: #F5F0E8;       /* Aged paper text */
  --card: #252019;             /* Warm charcoal card surface */
  --card-foreground: #F5F0E8;
  --border: #3a342b;           /* Dark linen border */
  --surface: #252019;
}
```

---

## 3. Typography & Hierarchy

- **Sans-Serif Font**: `Inter`, system-ui, -apple-system, sans-serif
  - Used for body text, interactive controls, inputs, and UI navigation.
- **Serif Font**: `Georgia`, `Times New Roman`, serif
  - Used for editorial titles, album cover titles, section headers, and quotes.
- **Monospace Font**: `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, monospace
  - Used for dimensions (e.g., `3000 x 2400 px @ 300 DPI`), technical meta information, and status codes.

---

## 4. Component Layouts & Visual Attributes

### 📐 Border Radii & Shapes
- `--radius: 4px`: Almost square, sharp editorial corners rather than rounded/bubbly elements.
- Clean 1px linen-colored borders (`border-border`).

### ✨ Micro-Animations & Interactivity
- **Framer Motion**: Smooth page transitions between dashboard views and studio panels.
- **Hover Transitions**: Subtle elevation and opacity shifts (`transition-all duration-200 ease-in-out`).
- **Canvas Feedback**: Subtle glowing terracotta selection outline (`--ring: #B85C38`) around active Konva canvas elements.

---

## 5. UI Assets & Iconography
- **Icons**: Lucide Icons (`lucide-react`) used with `strokeWidth={1.5}` for a delicate, hand-drawn photographic tool feel.
- **Toasts**: Sonner toast notifications styled with warm editorial borders.
