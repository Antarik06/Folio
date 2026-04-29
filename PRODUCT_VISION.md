# Folio — Product Vision & Features

Folio is an AI-powered, high-fidelity platform designed to revolutionize the way event memories are captured, curated, and preserved. It bridges the gap between digital convenience and the tactile beauty of physical keepsakes through advanced 3D previews and intelligent automation.

---

## 🚀 Core Features

### 1. AI-Powered Face Discovery
- **One-Time Enrollment**: Guests upload a single selfie to join an event.
- **Automated Tagging**: Our AI engine scans every photo uploaded to the event and instantly identifies guest faces.
- **"Photos of Me"**: A personalized, private gallery for every guest, showing them exactly where they appear in the event's story.

### 2. High-Fidelity 3D Previews
- **Immersive Viewing**: Interactive 3D renders of books and magazines using Three.js and React Three Fiber.
- **Physical Realism**: Realistic page-turning animations, dynamic book thickness based on page count, and material simulations (glossy vs. matte).
- **Environment Lighting**: Studio-grade lighting setups to see how your album looks in various conditions.

### 3. Intelligent Layout Engine (Quick Builder)
- **Auto-Curation**: AI selects the "hero" shots based on composition, lighting, and emotional impact.
- **Smart Spreads**: Automatically arranges photos into aesthetically pleasing layouts, maintaining chronology and narrative flow.
- **Instant Templates**: Switch between "Modern Magazine," "Classic Photobook," or "Minimalist Portfolio" with one click.

### 4. Collaborative Event Management
- **Shared Galleries**: Hosts can invite collaborators to help moderate photos and design the final album.
- **Invite Codes**: Secure, easy-to-share codes for guests to join and upload photos in real-time.
- **Real-time Synchronization**: Changes made by one designer are reflected instantly for others (Powered by Supabase & Redis).

### 5. Premium Design System
- **Curated Palettes**: Sophisticated color schemes designed for editorial excellence.
- **Typography**: Modern, readable fonts (Inter, Outfit) that give every album a premium feel.
- **Glassmorphism UI**: A sleek, modern dashboard that focuses on visual content.

---

## 🔮 Future Improvements

### 1. AR Placement (Augmented Reality)
- Allow users to "place" their 3D album on their real coffee table using their smartphone camera before ordering.

### 2. Physical Fulfillment Integration
- Direct API integration with premium print-on-demand services (e.g., WhiteWall, Blurb) for one-click ordering of high-quality physical copies.

### 3. AI Content Enhancement
- **Super-Resolution**: Automatically upscale low-quality guest uploads for printing.
- **Neural Retouching**: Subtle, AI-driven lighting and skin tone corrections for a professional look.
- **Caption Generation**: Use Multimodal AI to generate meaningful captions and stories based on the photos in a spread.

### 4. Live Event "Pulse"
- A real-time slideshow/feed feature for events where guests can see photos appearing on a big screen as they are taken.

### 5. Interactive "Memory" Videos
- Automatically generate short cinematic trailers of the event, mixing still photos with smooth transitions and AI-selected music.

---

## 🛠️ Tech Stack Overview
- **Frontend**: Next.js 14, React Three Fiber, Tailwind CSS, Framer Motion.
- **Backend**: Supabase (Database & Auth), Upstash (Redis Caching), Neon (Postgres).
- **AI**: Face Matching via specialized neural networks, Automated Curation via Gemini/OpenAI vision models.
