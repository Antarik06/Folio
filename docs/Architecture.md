# 🏗️ Architecture.md — System Architecture & Directory Structure

## 1. System Architecture Overview

Folio adopts a modern decoupled full-stack architecture comprising a **Next.js 16 App Router Frontend** and a **Node.js / Express TypeScript Backend Server**, backed by **Supabase PostgreSQL** and **Upstash Redis**.

```
[ Web Clients / Mobile Guests ]
             │
             ▼
 ┌───────────────────────┐
 │ Next.js 16 Frontend   │ ◄── (SSR, Konva Editor, Three.js 3D Viewer)
 └───────────┬───────────┘
             │ HTTP / REST / Websockets
             ▼
 ┌───────────────────────┐
 │ Express REST Backend  │ ◄── (Drizzle ORM, Sharp, PDF-lib, Gemini AI API)
 └─────┬───────────┬─────┘
       │           │
       ▼           ▼
┌─────────────┐ ┌──────────────┐
│ PostgreSQL  │ │ Upstash Redis│ (Caching & Rate Limiting)
│ (Supabase)  │ └──────────────┘
└─────────────┘
```

---

## 2. Technical Stack

| Layer | Technology | Key Role / Libraries |
|---|---|---|
| **Frontend Framework** | Next.js 16 (App Router), React 19, TypeScript 5.7 | Page routing, SSR, client-side state, server actions |
| **Canvas & Graphics** | Konva, `react-konva`, `ag-psd` | 2D interactive album composition, native PSD parsing |
| **3D & Flipbook** | Three.js, `@react-three/fiber`, `react-pageflip` | 3D album rendering & page-turn physics |
| **Frontend UI/Style** | Tailwind CSS v4, Radix UI, Lucide Icons, Framer Motion | Editorial design system, accessibility, micro-animations |
| **Frontend State** | Jotai, React Hook Form, Zod, `@supabase/ssr` | Atomic canvas state, form validation, auth session |
| **Backend API** | Node.js, Express.js (TypeScript) | API endpoints, image processing, export jobs |
| **Database & ORM** | PostgreSQL (Supabase), Drizzle ORM, Drizzle Kit | Relational schema management, type-safe SQL queries |
| **Image & PDF Export** | `sharp`, `pdf-lib`, `adm-zip` | Server-side high-DPI rendering, PDF export, ZIP archives |
| **AI Integration** | Google AI (Gemini API) | Automated layout recommendation & highlight selection |
| **Payment Gateway** | Razorpay SDK | Checkout, order validation, payment webhook processing |
| **Caching Layer** | Upstash Redis (`@upstash/redis`) | Key-value caching, rate limiting, session cache |

---

## 3. Directory & File Structure

```
Folio/
├── PRD.md                     # Product Requirements Document
├── Architecture.md            # System Architecture & Directory Structure
├── Rules.md                   # AI Coding Rules & Boundaries
├── Phases.md                  # Development Roadmap & Execution Phases
├── Design.md                  # Design Tokens, Color Palette & Typography
├── Memory.md                  # AI Session Memory & Progress Tracker
├── README.md                  # Main Repository Overview
│
├── frontend/                  # Next.js 16 Web Application
│   ├── app/                   # App Router Pages & API Routes
│   │   ├── (dashboard)/       # Dashboard Layout & Sub-routes
│   │   │   ├── events/        # Host Event Management
│   │   │   ├── templates/     # Artist Template Marketplace
│   │   │   └── polaroid/      # Instant Photo Gallery
│   │   ├── album/             # Interactive Album Gallery & Viewer
│   │   ├── auth/              # Auth Flow (login, register, callback)
│   │   ├── editor/            # Konva Canvas Studio & PSD Studio
│   │   ├── join/              # QR Code Event Join & Guest Selfie Onboarding
│   │   ├── preview/           # 3D Flipbook Album Preview
│   │   ├── globals.css        # Tailwind CSS v4 & Editorial CSS Tokens
│   │   └── layout.tsx         # Root Application Layout & Theme Provider
│   ├── components/            # UI & Interactive Components
│   │   ├── artist/            # Artist Dashboard Components
│   │   ├── canvas/            # Konva Layer & Drawing Widgets
│   │   ├── editor/            # Page Layouts, Toolbar & Asset Panel
│   │   ├── ui/                # Radix UI primitives & Atomic Components
│   │   └── viewer/            # Three.js 3D & Flipbook Components
│   ├── lib/                   # Utility Libraries
│   │   ├── psd-parser.ts      # ag-psd Integration Module
│   │   ├── template-engine.ts # AI & Standard Template Compiler
│   │   ├── pricing.ts         # Album Cost & Checkout Calculator
│   │   └── supabase/          # Supabase Client & Server SSR Config
│   └── public/                # Static Assets & Sample Templates
│
└── backend/                   # Express.js API Server
    ├── src/
    │   ├── controllers/       # HTTP Controller Handlers
    │   ├── db/                # PostgreSQL Database Client (Drizzle)
    │   ├── middlewares/       # Auth Middleware & Zod Validation
    │   ├── migrations/        # Drizzle SQL Schema Migrations
    │   ├── routes/            # Express API Routes
    │   │   ├── aiRoutes.ts    # AI Layout & Gemini Endpoints
    │   │   ├── albumRoutes.ts # Album CRUD & Page Structure
    │   │   ├── artistRoutes.ts# Artist Dashboard & Earnings
    │   │   ├── eventRoutes.ts # Event Creation & Invites
    │   │   ├── orderRoutes.ts # Orders & Razorpay Webhooks
    │   │   └── photoRoutes.ts # Media Uploads & Processing
    │   ├── schema/            # Drizzle ORM Database Schemas
    │   │   ├── albums.ts      # Albums & Pages Tables
    │   │   ├── events.ts      # Events & Guests Tables
    │   │   ├── orders.ts      # Print Orders & Payments
    │   │   └── users.ts       # Profiles & Artists Tables
    │   ├── services/          # Core Business Logic
    │   │   ├── ai-layout.ts   # Gemini Layout Engine
    │   │   ├── pdf-export.ts  # pdf-lib Print PDF Generator
    │   │   └── psd-service.ts # Backend PSD Buffer Engine
    │   └── utils/             # Helper Functions & Constants
    └── drizzle.config.ts      # Drizzle Configuration
```

---

## 4. Key Data Flows

### A. AI Face Matching & Guest Onboarding
1. Guest scans QR code -> `frontend/app/join/page.tsx`
2. Guest captures/uploads selfie -> Sent to `/api/photos/match-face`
3. Backend extracts face descriptor vectors -> Matches against indexed event photos.
4. Guest receives personalized photo feed.

### B. Photoshop PSD Import & Canvas Rendering
1. Photographer drops `.psd` file into studio editor -> `frontend/lib/psd-parser.ts`
2. `ag-psd` parses layers, coordinates, blending modes, and image buffers.
3. Layers are mapped to Jotai canvas state -> Rendered using `react-konva`.

### C. Server-Side Print PDF Export
1. User requests high-resolution print PDF -> `/api/albums/:id/export-pdf`
2. Backend loads album canvas JSON -> `backend/src/services/pdf-export.ts`
3. High-res images processed via `sharp` (upscaling, CMYK adjustments).
4. `pdf-lib` compiles 300 DPI multi-page print document.
