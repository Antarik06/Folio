# 📏 Rules.md — AI Coding Rules, Guidelines & Guardrails

## 1. Core Principles & Philosophy
- **Precision First**: Never guess APIs, database schemas, or file locations. Always inspect authoritative code files using `view_file` or `grep_search`.
- **Aesthetic Excellence**: Folio follows a high-end "Editorial Darkroom" design language. Interfaces must look premium, tactile, and responsive.
- **Empirical Diagnostics**: Never fix symptoms or suppress errors with empty fallbacks (`try { ... } catch (e) { return [] }`). Always inspect actual tracebacks and resolve root causes.

---

## 2. Technology & Library Constraints

### ✅ Approved Frontend Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4 using CSS variable design tokens (`--paper`, `--terracotta`, `--darkroom`, `--bottle-green`).
- **State Management**: Jotai for atomic state (especially canvas & editor state).
- **Canvas / 3D**: `react-konva` for 2D editor; `@react-three/fiber` & `@react-spring/three` for 3D flipbook previews; `ag-psd` for PSD parsing.

### 🚫 Forbidden Practices & Unapproved Libraries
- **Do NOT introduce arbitrary UI libraries** outside Radix UI and Tailwind CSS v4.
- **Do NOT use inline pixel offsets** for dynamic canvas layouts; calculate dynamic container bounds programmatically.
- **Do NOT use TailwindCSS v3 utility classes** when Tailwind CSS v4 theme CSS variables are defined in `app/globals.css`.
- **Do NOT introduce heavy external state managers** like Redux or MobX; keep atomic state in Jotai.

---

## 3. Code Standards & Patterns

### 🔵 TypeScript & Schema Strictness
- Enable strict null checks. Avoid `any` types wherever possible.
- All request/response validation in the backend MUST use `zod` schemas.
- Database schema changes MUST be a new numbered `.sql` file in `backend/src/migrations/`, applied by `migrate.ts`. There is no ORM: queries use parameterised raw SQL through the `query()` wrapper in `backend/src/db/index.ts`. Never interpolate values into SQL strings.

### 🟢 React & Next.js Guidelines
- Prefer React Server Components (RSC) for data fetching in Next.js pages.
- Add `'use client';` directive ONLY on interactive components (Canvas editor, 3D flipbook, interactive dialogs).
- Ensure all interactive elements have unique `id` attributes or accessible `aria-labels`.

### 🟣 Naming & Structure Rules
These exist because Polaroid, Adventure and Premium Concierge each grew into a
semi-disconnected branch with its own nav item, its own components and no shared
plumbing. The rules remove the mechanism that produced that sprawl.

- The app has **three tabs**: **Photos**, **Create**, **Profile**, plus two
  role-gated areas (**Artist Studio**, **Admin**). Before adding a top-level
  feature, it MUST fit inside one of the three. If it fits none, that is a signal
  an existing umbrella needs renaming or splitting — not that a fourth is needed.
- **Label = route slug = top component name**, same words, different casing only.
  `Ask an Artist` → `/create/artist` → `ask-an-artist/`. If a label and a filename
  do not obviously match, rename one before adding more code.
- **One plain word or a plain two-word phrase per feature**, in code and in UI
  copy. No internal jargon ("Concierge", "Adventure Flow") in either.
- **One component per concept, parameterised by a prop.** Never
  `XStyle3D` + `XStyleExperience` + `XStylePreviewUI` repeated per style — see
  `components/viewer/AlbumViewer.tsx`, which took nine such files down to two.
  A new style extends the `style` union; it does not fork the files.
- **Business logic lives in `services/`.** A `routes/*.ts` file only wires an
  HTTP request to a service call and returns the result. A long route file means
  logic belongs in a service, not in a bigger route file.

### 🔴 Error Handling & Logging Rules
- Backend API endpoints MUST handle errors via centralized error-handling middlewares (`backend/src/middlewares/errorMiddleware.ts`).
- Never swallow exceptions silently. Log structured errors using standard logging methods.
- Return standard HTTP status codes (`400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `500` Server Error) with descriptive JSON error messages.

---

## 4. AI Behavior & Guardrails

| DO | DON'T |
|---|---|
| Trace upstream data providers when APIs return null data. | Do NOT mask missing data with dummy fallbacks or zeroed out buffers. |
| Use existing helper functions in `lib/` or `utils/`. | Do NOT reinvent custom helpers if standard utilities exist in the repo. |
| Run build/lint check scripts to verify code correctness before declaring completion. | Do NOT declare victory right after editing a file without verification. |
| Maintain existing JSDoc comments and explicit signature types. | Do NOT break public API parameters or function signatures without updating all invocation sites. |
| Scope temporary work to local component state before mutating global Jotai atoms. | Do NOT mutate global state during partial rendering cycles. |
