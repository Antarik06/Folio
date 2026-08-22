# 📸 Folio — AI-Powered Event Photography, Collaboration & Album Publishing Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![node-postgres](https://img.shields.io/badge/node--postgres-8-336791?style=flat-square&logo=postgresql)](https://node-postgres.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

**Folio** is a full-stack, enterprise-grade event photography and album creation platform. Designed for event hosts, guests, and professional photographers/artists, Folio combines **AI face-matching**, **photoshop template parsing**, **interactive 2D/3D album canvas editing**, and **print-ready PDF exporting**.

---

## ✨ Core Features & Highlights

### 🤖 AI Face Matching & Personal Guest Portals
- **Instant Photo Indexing**: Guests enroll their face via a quick selfie upload; facial recognition automatically groups every photo they appear in across the entire event gallery.
- **Private Guest Galleries**: Personalized "Photos of Me" view tailored for each attendee without manual tagging.
- **QR Code & Invite Access**: Seamless onboarding for event guests using unique event codes and QR invitations.

### 🎨 Advanced Interactive Canvas & Studio Editor
- **Dynamic Konva Canvas**: Full-featured design canvas supporting image layers, drag-and-drop elements, custom text typography, and image cropping via `react-easy-crop`.
- **Photoshop (PSD) Importer**: Direct parsing of native Adobe Photoshop (`.psd`) templates using `ag-psd`, automatically extracting layers, dimensions, and text structures into editable canvas layouts.
- **AI-Powered Layout Generator**: Integrates Google AI (Gemini) to automatically arrange photos, suggest composition layouts, and select top highlight shots based on quality and emotion.

### 📖 Realistic 3D & Flipbook Album Previews
- **Interactive 3D Book Viewer**: Experience digital photo albums in interactive 3D spaces powered by `@react-three/fiber` and `@react-spring/three`.
- **Realistic Page-Turn Physics**: Smooth, tactile flipbook preview using `page-flip` / `react-pageflip` for authentic album review before printing.

### 🃏 Life Cards — a template-driven card engine
- **One Renderer, Any Design**: Cards are drawn by a single SVG renderer fed by template configuration, base-style tokens, profile data and user customisation — there is no per-design component. See [`docs/CardSystem.md`](docs/CardSystem.md).
- **Backend-Published Templates**: Templates and base styles are database rows. Publishing a new one from the admin panel puts it in every user's picker, correctly previewed, with no frontend deploy.
- **Versioned & Snapshotted**: A card pins the template version and the profile snapshot it was built from, so a shared link never changes under its owner; refreshing and upgrading are explicit.
- **Safe Declarative Schemas**: Template definitions are validated documents — allowlisted components, bounded dimensions, and a `{{profile.name}}` resolver that never evaluates code.
- **High-Quality Image Export**: The exported PNG/JPEG is rasterised from the very SVG on screen, at 1×–3× the template's canvas, with photographs inlined.

### 💼 Photographer/Artist Portal & Monetization
- **Artist Dashboard**: Dedicated portal for professional photographers to publish template designs, view analytics, and manage client orders.
- **Razorpay E-Commerce Integration**: Complete checkout flow for ordering physical print albums, photo packages, and digital deliverables.

### 🖨️ Server-Side High-Res Print Export Pipeline
- **Print-Ready PDF Generator**: High-DPI PDF generation using `pdf-lib` for physical print production.
- **High-Performance Image Processing**: On-demand image optimization, resizing, and watermark overlays powered by `sharp`.
- **Google Drive Integration**: Direct import of high-resolution event media via Google Drive Picker API.

---

## 🛠️ Technology Stack

### **Frontend** (`/frontend`)
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling & UI**: Tailwind CSS v4, Radix UI primitives, Lucide Icons, Vaul, Sonner
- **Canvas & Graphics**: Konva / `react-konva`, `ag-psd` (Photoshop parser)
- **3D & Animation**: Three.js, `@react-three/fiber`, `@react-spring/three`, Framer Motion, `react-pageflip`
- **State & Data**: Jotai, React Hook Form, Zod, `@supabase/ssr`

### **Backend** (`/backend`)
- **Runtime & Server**: Node.js, Express.js (TypeScript)
- **Database**: PostgreSQL (hosted on Supabase), accessed with raw SQL through `node-postgres` (`pg`). There is no ORM — queries go through the `query()` wrapper in `backend/src/db/index.ts`, and the schema is a set of numbered `.sql` files applied by `backend/src/migrations/migrate.ts`.
- **Image & PDF Processing**: `sharp`, `pdf-lib`, `adm-zip`, `fast-xml-parser`
- **Authentication & Security**: Supabase Auth (JWT verification), CORS
- **Payments & Caching**: Razorpay API, Upstash Redis (`@upstash/redis`)
- **AI Services**: Google AI (Gemini API)

---

## 📁 Repository Structure

```
Folio/
├── frontend/                  # Next.js 16 Web Application
│   ├── app/                   # App Router pages & API routes
│   │   ├── (app)/             # Signed-in shell — the three tabs + role-gated areas
│   │   │   ├── photos/        #   Photos — library, events, "photos of me"
│   │   │   ├── create/        #   Create — styles, editor, ask an artist, orders
│   │   │   ├── profile/       #   Profile — my page, cards (template-driven)
│   │   │   ├── artist-studio/ #   Role-gated: photographers
│   │   │   └── admin/         #   Role-gated: staff
│   │   ├── album/             # Album share-link viewer
│   │   ├── auth/              # Authentication routes (login, register, callback)
│   │   ├── join/              # Event join & guest face-matching flow
│   │   ├── p/                 # Public profile pages (/p/[handle]) — no auth
│   │   └── preview/           # 3D album preview
│   ├── components/
│   │   ├── folio/             # Editorial Darkroom primitives & press marks
│   │   ├── viewer/            # The one 3D viewer (AlbumViewer + its scenes)
│   │   ├── cards/             # The card engine's renderer, editor & panels
│   │   ├── photos/  create/  profile/  join/   # One folder per tab
│   │   └── album-editor/      # Canvas editor widgets
│   ├── lib/                   # Utility modules (PSD parser, template engine, pricing, supabase)
│   │   └── cards/             # Card engine: resolver, style, layout, registry, export
│   └── styles/                # Global CSS & Tailwind styling setup
│
└── backend/                   # Express.js REST API Server
    ├── src/
    │   ├── controllers/       # Route request handlers
    │   ├── db/                # pg Pool + the query() wrapper every service uses
    │   ├── middlewares/       # Auth verification & error handling
    │   ├── migrations/        # Database schema migrations
    │   ├── routes/            # HTTP wiring only (artist, album, ai, cards, event, library, order, premium, profile)
    │   ├── schema/            # Zod request validation (not an ORM schema)
    │   ├── services/          # Core business logic (PDF export, PSD processing, AI layout)
    │   └── utils/             # Helper utilities
    └── src/migrations/        # Numbered .sql migrations + migrate.ts runner
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites

- **Node.js** v18+ and **npm**
- **PostgreSQL** database (or a free [Supabase](https://supabase.com/) project)
- **Upstash Redis** instance (optional, for caching)
- **Razorpay Account** (for payment testing)

---

### 1. Repository Setup

Clone the repository to your local machine:
```bash
git clone https://github.com/Antarik06/Folio.git
cd Folio
```

---

### 2. Backend Setup

Navigate to the `backend` directory, install dependencies, and configure environment variables:

```bash
cd backend
npm install
```

Create a `.env` file in `backend/.env`:

```env
# Express Server Config
PORT=5000
FRONTEND_URL=http://localhost:3000

# PostgreSQL Connection String (Supabase Postgres or local)
DATABASE_URL=postgresql://user:password@host:5432/postgres

# Supabase Configurations
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# Signing Secret
ALBUM_SHARE_SECRET=your_custom_album_share_secret

# AI & Media Services (Optional)
GOOGLE_AI_API_KEY=your_google_ai_gemini_key

# Payment Gateway (Optional)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Cache (Optional)
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your_redis_token
```

Run database migrations to initialize tables:
```bash
npm run migrate
```

Start the backend development server:
```bash
npm run dev
```
The API server will run on `http://localhost:5000`.

---

### 3. Frontend Setup

In a new terminal window, navigate to the `frontend` directory:

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/.env`:

```env
# Supabase Client Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Express Backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000

# Google Drive Integration (Optional)
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the Next.js frontend development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔄 End-to-End Workflow

1. **Event Creation**: Host sets up an event and shares the unique invite code/QR.
2. **Guest Face Enrollment**: Guests join via `/join`, take a selfie, and instantly access their AI-matched photo gallery.
3. **Template Import & Designing**:
   - Photographers upload `.psd` templates or choose pre-built magazine layouts.
   - Customize pages using the Konva interactive editor (adjust frames, text, layers, and filters).
4. **AI Album Generation**: Automatically distribute event highlights across album pages using Google Gemini AI layout recommendations.
5. **Interactive Preview**: Preview the complete photo album in realistic 3D or smooth flipbook view.
6. **Order & Print Export**: Place physical orders via Razorpay integration, generating high-resolution PDF print files on the backend.

---

## 📡 API Endpoints Overview

| Service | Prefix | Key Operations |
|---|---|---|
| **Artist / Photographer** | `/api/artist` | Manage designer templates, portfolios, profile metrics, & earnings |
| **Albums & Pages** | `/api/albums` | Fetch album structure, pages, PSD imports, and page updates |
| **AI Services** | `/api/ai` | AI layout generation, highlight selection, and title drafting |
| **Events & Galleries** | `/api/events` | Event management, guest invite validation, photo tagging |
| **Orders & Payments** | `/api/orders`, `/api/premium` | Order checkout creation, Razorpay verification, and print jobs |
| **Photos & Uploads** | `/api/photos` | Direct media uploads, face indexing triggers, and sharp transformations |

---

## 🧪 Running Automated Tests

Folio includes automated test coverage for frontend components, backend API endpoints, and end-to-end (E2E) user flows.

### 1. Frontend Unit & Component Tests (Vitest + React Testing Library)
Run component rendering and pure unit tests (pricing calculations, navigation, join button):
```bash
cd frontend
npm test
```

### 2. Backend API & Security Tests (Vitest + Supertest)
Run backend API integration tests for authentication middleware, order validation, and Razorpay webhook signature handling:
```bash
cd backend
npm test
```

### 3. End-to-End (E2E) Flow Tests (Playwright)
Run end-to-end browser tests for Auth/Login, RSVP Event Join, and Payment Checkout flows:
```bash
cd frontend

# Install browser binaries if running for the first time
npx playwright install chromium

# Execute Playwright E2E tests
npm run test:e2e
```

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

