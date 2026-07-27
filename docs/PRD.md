# 📋 PRD.md — Project Requirements Document

## 1. Executive Summary & Vision
**Folio** is an enterprise-grade, AI-powered event photography, collaborative album creation, and print-publishing platform. It bridges the gap between event hosts, attending guests, and professional photographers/artists. By leveraging **AI facial recognition**, **Adobe Photoshop (`.psd`) template parsing**, **interactive 2D canvas editing (Konva)**, **realistic 3D flipbook previews**, and a **server-side high-DPI print export pipeline**, Folio delivers an end-to-end modern digital-to-print workflow.

---

## 2. Target Audience & User Personas

### 📸 1. Professional Photographers & Artists
- **Needs**: Streamlined client delivery, automated album layout generation, monetization of custom design templates, and high-res print production.
- **Key Workflows**: Upload `.psd` templates, organize event galleries, use Gemini AI to generate auto-layouts, manage client album reviews, publish templates on the marketplace.

### 🥳 2. Event Hosts & Clients (Couples, Corporate Hosts, Organizers)
- **Needs**: Centralized event gallery, seamless photo collection from guests, custom album design, and easy physical print ordering.
- **Key Workflows**: Create events, share invite QR codes, approve guest photos, review 3D flipbook previews, order print albums via Razorpay.

### 👤 3. Event Guests & Attendees
- **Needs**: Instant access to personal event photos without scrolling through thousands of unorganized images.
- **Key Workflows**: Join via QR code, register a quick selfie, access a personalized "Photos of Me" gallery indexed by AI facial recognition.

### 🖨️ 4. Print Administrators & Fulfillment Labs
- **Needs**: High-resolution print-ready files (300 DPI PDFs) with precise trim, bleed, and color matching.
- **Key Workflows**: Download automated print-ready PDF packages and zip archives generated server-side.

---

## 3. Core Product Features & Functional Requirements

### 🤖 Feature 1: AI Face-Matching & Guest Portals
- **Face Indexing**: Attendees upload a single selfie upon scanning an event QR code.
- **Personalized Gallery**: AI matches and isolates images containing the attendee's face across the entire event repository.
- **Privacy & Security**: Access is scoped strictly to authorized event invitees using tokenized guest links.

### 🎨 Feature 2: Interactive Studio Canvas & PSD Parsing
- **Konva Canvas Engine**: Interactive 2D canvas editor supporting multi-layer manipulation, z-index layering, typography adjustments, object transformation, and `react-easy-crop` integration.
- **Native PSD Importer**: Parse Adobe Photoshop (`.psd`) files directly via `ag-psd`, extracting structural layers, text blocks, vector frames, and artboards into native canvas components.
- **Google Gemini AI Layout Engine**: Automated single and multi-page layout generation based on photo aesthetics, emotional scoring, and page balance.

### 📖 Feature 3: 3D Flipbook & Interactive Album Viewer
- **Realistic 3D Preview**: Render photo albums in interactive 3D spaces using `@react-three/fiber` and `@react-spring/three`.
- **Page-Turn Physics**: Smooth page turning powered by `react-pageflip` for authentic album review prior to ordering.

### 💼 Feature 4: Artist Dashboard & Marketplace Monetization
- **Monetization Engine**: Photographers publish album templates and set pricing models.
- **Analytics & Earnings**: Track template usage, orders, and total revenue.
- **Client Management**: Review, approve, and deliver digital and print assets.

### 🛍️ Feature 5: Razorpay E-Commerce & Print Export Pipeline
- **Razorpay Checkout**: Seamless payment processing for physical album prints and digital photo bundles.
- **Server-Side PDF Generation**: Server-side high-resolution (300 DPI) PDF rendering via `pdf-lib` and `sharp`.
- **Media Optimization**: Dynamic image compression, watermarking, and format conversion.

---

## 4. Non-Functional Requirements

### ⚡ Performance & Scalability
- **Initial Load Time**: Under 1.5 seconds for guest galleries.
- **Canvas FPS**: Maintain 60 FPS performance during multi-layer Konva canvas manipulation.
- **High-Res PDF Export**: Complete server-side generation of a 30-page high-DPI album PDF in under 15 seconds.

### 🔒 Security & Data Compliance
- **Authentication**: JWT-based session security via `@supabase/ssr` and Supabase Auth.
- **Data Protection**: Row Level Security (RLS) enabled on PostgreSQL via Supabase.
- **Secure File Storage**: S3-compatible cloud storage buckets with signed URLs for client access.

### 📱 Usability & Accessibility
- **Responsive Layouts**: Desktop-optimized editor studio; mobile-first guest onboarding and gallery view.
- **Dark/Light Mode**: Full support for system preferences using `next-themes` with custom "Editorial Darkroom" styling.
