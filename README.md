# Folio — AI-Powered Event Photography & Collaboration

Folio is a premium web application designed to transform how event hosts and guests capture, share, and preserve memories. Using advanced AI and a sleek, modern interface, Folio automates the tedious parts of event photography, allowing you to focus on the moment.

## ✨ Key Features

- **Smart Event Management**: Create and manage events with ease. Each event comes with a unique invite code for guests and collaborators.
- **AI Face Matching**: Guests enroll their faces once, and our AI automatically finds every photo they appear in across the entire event gallery.
- **Collaborative Design**: Invite other users to work and design together on event galleries and photo albums.
- **AI-Curated Albums**: Automatically generate stunning, professional-grade photo book layouts using AI that selects the best shots based on quality, emotion, and composition.
- **Private Collections**: Each guest gets a personalized view of the event, showing them exactly where they were part of the story.
- **Seamless Sharing**: Hosts can share all photos or curate specific highlights for the entire guest list.

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Lucide](https://lucide.dev/)
- **Caching**: [Upstash Redis](https://upstash.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) / CSS Transitions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- A Redis instance (e.g., Upstash)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Antarik06/Folio.git
   cd Folio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📸 Core Workflow

1. **Host** creates an event and shares the **Invite Code**.
2. **Guests** join using the code and take a quick **Selfie** to enroll their face.
3. **Collaborators** join using a special code to help manage the event and design albums.
4. AI processes uploaded photos, tags faces, and organizes them.
5. Guests instantly see "Photos of Me" in their dashboard.
6. Use the **AI Album Generator** to create a print-ready memory book in seconds.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
