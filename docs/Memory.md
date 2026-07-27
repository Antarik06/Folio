# 🧠 Memory.md — Project Memory & Progress Tracker

> **Notice**: This document maintains the living state of the Folio project across AI sessions. Update this file whenever significant architectural decisions are made or features are completed.

---

## 1. Project Context & Current State
- **Project Name**: Folio (AI-Powered Event Photography & Album Publishing Platform)
- **Active Workspace**: `c:\Users\SUBHAM NABIK\Desktop\Folio2\Folio`
- **Current Version**: `0.1.0`
- **Primary Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Express.js Backend, Drizzle ORM, Supabase PostgreSQL, Konva, Three.js, Sharp, PDF-lib, Razorpay.

---

## 2. Core Documentation Files Overview
- [PRD.md](file:///c:/Users/SUBHAM%20NABIK/Desktop/Folio2/Folio/docs/PRD.md) — Product requirements, personas, functional specs.
- [Architecture.md](file:///c:/Users/SUBHAM%20NABIK/Desktop/Folio2/Folio/docs/Architecture.md) — System flow, technology stack, directory structure.
- [Rules.md](file:///c:/Users/SUBHAM%20NABIK/Desktop/Folio2/Folio/docs/Rules.md) — Guardrails, technology standards, coding rules.
- [Phases.md](file:///c:/Users/SUBHAM%20NABIK/Desktop/Folio2/Folio/docs/Phases.md) — Implementation roadmap and phase tracking.
- [Design.md](file:///c:/Users/SUBHAM%20NABIK/Desktop/Folio2/Folio/docs/Design.md) — Editorial Darkroom design tokens, colors, typography.
- [Memory.md](file:///c:/Users/SUBHAM%20NABIK/Desktop/Folio2/Folio/docs/Memory.md) — Session context & progress log.

---

## 3. Key Technical Decisions & Patterns
1. **Frontend App Router Architecture**: Located in `frontend/app/`. Key routes include `(dashboard)`, `album`, `auth`, `editor`, `join`, `preview`.
2. **Backend API Architecture**: Express server running in `backend/src/` with Drizzle ORM managing Supabase PostgreSQL.
3. **Photoshop Import Pipeline**: `ag-psd` parses native `.psd` templates into Konva canvas objects client-side in `frontend/lib/psd-parser.ts`.
4. **Server-Side PDF Export**: `backend/src/services/pdf-export.ts` generates 300 DPI print-ready PDFs using `pdf-lib` and `sharp`.
5. **Color Design Tokens**: "Editorial Darkroom" CSS theme variables in `frontend/app/globals.css` (`--paper`, `--terracotta`, `--bottle-green`, `--darkroom`).

---

## 4. Completed Work Log
- ✅ Created initial full-stack project structure (`frontend` + `backend`).
- ✅ Implemented core database schemas (Users, Events, Albums, Pages, Photos) with Drizzle ORM.
- ✅ Integrated Supabase Auth & JWT middleware.
- ✅ Implemented mobile QR code guest join flow and facial indexing pipeline.
- ✅ Implemented Konva 2D interactive editor studio & `ag-psd` parser.
- ✅ Implemented 3D flipbook album preview using `@react-three/fiber` and `react-pageflip`.
- ✅ Implemented backend Sharp image processing and `pdf-lib` server-side export pipeline.
- ✅ Created full set of project documentation files (`PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `Memory.md`).

---

## 5. Next Immediate Steps
1. Configure Upstash Redis caching for API queries and face indexing lookups.
2. Complete end-to-end Razorpay checkout testing for print order fulfillment.
3. Finalize high-resolution PDF print render performance optimizations.
