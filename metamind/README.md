# MetaMind AI — Webflow Hybrid App

AI-powered Meta & Alt Text Generator for Webflow. Generate SEO-optimized meta titles, descriptions, OG tags, and image alt text for your entire Webflow site — directly from the Designer.

## Architecture

```
metamind/
├── apps/
│   ├── designer-extension/   # React + Vite Designer Extension (runs inside Webflow)
│   └── backend/              # Next.js API server (OAuth, LLM proxy, billing)
└── packages/
    └── shared/               # Shared TypeScript types & utilities
```

## Tech Stack

- **Designer Extension:** React 18, Vite, TypeScript, Webflow Designer SDK
- **Backend:** Next.js 14, TypeScript, Prisma, PostgreSQL
- **AI:** OpenAI GPT-4o (text + vision), Anthropic Claude (fallback)
- **Billing:** Stripe
- **Queue:** BullMQ + Redis (for bulk operations)
- **Hosting:** Vercel (backend) + Webflow Marketplace (extension)

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+
- PostgreSQL database (local or Neon/Supabase)
- Redis (local or Upstash)
- Webflow Developer account + registered app

### Setup

```bash
# Install dependencies
npm install

# Copy env files
cp apps/backend/.env.example apps/backend/.env.local
cp apps/designer-extension/.env.example apps/designer-extension/.env.local

# Run database migrations
npm run db:migrate --workspace=apps/backend

# Start development
npm run dev
```

### Development

```bash
# Run just the Designer Extension
npm run extension:dev

# Run just the backend
npm run backend:dev

# Run both (via Turbo)
npm run dev
```

### Webflow CLI

```bash
# Login to Webflow
npx webflow login

# Serve the extension locally (opens in Designer)
npx webflow extension serve
```

## Environment Variables

See `.env.example` files in each app for required variables.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/callback` | OAuth callback from Webflow |
| GET | `/api/sites` | List authorized sites |
| GET | `/api/sites/:id/pages` | List pages for a site |
| GET | `/api/sites/:id/collections` | List CMS collections |
| POST | `/api/generate/meta` | Generate meta tags for pages/items |
| POST | `/api/generate/alt-text` | Generate alt text for images |
| POST | `/api/apply` | Apply generated content to Webflow |
| GET | `/api/usage` | Get usage stats for billing |

## License

MIT
