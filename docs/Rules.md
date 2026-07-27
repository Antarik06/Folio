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
- Database schemas MUST be defined cleanly using `drizzle-orm/pg-core`.

### 🟢 React & Next.js Guidelines
- Prefer React Server Components (RSC) for data fetching in Next.js pages.
- Add `'use client';` directive ONLY on interactive components (Canvas editor, 3D flipbook, interactive dialogs).
- Ensure all interactive elements have unique `id` attributes or accessible `aria-labels`.

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
