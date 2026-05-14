# MetaMind AI — Deployment Guide

Complete guide to deploying MetaMind AI for production.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Webflow Designer                       │
│         (loads Designer Extension from CDN/Vercel)       │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS API calls
                           ▼
┌─────────────────────────────────────────────────────────┐
│               Vercel (Backend API)                        │
│         Next.js 14 — metamind-api.vercel.app             │
│                                                          │
│  /api/auth/*       — OAuth flow                          │
│  /api/generate/*   — AI generation (OpenAI)              │
│  /api/apply        — Write back to Webflow               │
│  /api/billing/*    — Stripe integration                  │
│  /api/settings     — Brand settings CRUD                 │
│  /api/usage        — Usage stats                         │
│  /api/sites        — Site listing                        │
└────────┬───────────────────┬────────────────┬───────────┘
         │                   │                │
         ▼                   ▼                ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │    OpenAI    │   │    Stripe    │
│  (Neon/      │   │   GPT-4o    │   │  Billing     │
│   Supabase)  │   │   Vision    │   │  Webhooks    │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## Step 1: Database Setup (Neon or Supabase)

### Option A: Neon (Recommended — free tier, serverless)

1. Go to [neon.tech](https://neon.tech) and create a project
2. Copy the connection string:
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/metamind?sslmode=require
   ```
3. Use this as your `DATABASE_URL`

### Option B: Supabase

1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Settings → Database → Connection string (URI)
3. Use the "Transaction" connection string for Prisma

### Run Migrations

```bash
cd apps/backend
DATABASE_URL="your_connection_string" npx prisma migrate deploy
```

---

## Step 2: Vercel Deployment

### Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# From the metamind root
cd apps/backend
vercel

# Follow prompts:
# - Link to your Vercel account
# - Choose "apps/backend" as root directory
# - Framework: Next.js (auto-detected)
```

### Deploy via GitHub Integration (Preferred)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `hello-world` repository
3. Set **Root Directory** to `metamind/apps/backend`
4. Set **Build Command**: `npm run build`
5. Set **Install Command**: `npm install`
6. Add all environment variables (see Step 5)
7. Deploy

### Custom Domain (Optional)

```
metamind-api.yourdomain.com → Vercel project
```

---

## Step 3: Designer Extension Hosting

The Designer Extension is a static site built with Vite. Options:

### Option A: Vercel (separate project)

```bash
cd apps/designer-extension
vercel

# Root Directory: metamind/apps/designer-extension
# Build Command: npm run build
# Output Directory: dist
```

### Option B: GitHub Pages / Cloudflare Pages

```bash
cd apps/designer-extension
npm run build
# Deploy the `dist/` folder to any static host
```

### Update VITE_BACKEND_URL

In the Designer Extension's environment:
```
VITE_BACKEND_URL=https://metamind-api.yourdomain.com
```

---

## Step 4: Webflow App Registration

### Create App on Webflow Developer Portal

1. Go to [developers.webflow.com](https://developers.webflow.com)
2. Click "Create App" → "Hybrid App"
3. Fill in:
   - **App Name**: MetaMind AI
   - **Description**: AI-powered SEO meta & alt text generator
   - **Homepage URL**: Your landing page URL
   - **Redirect URI**: `https://metamind-api.yourdomain.com/api/auth/callback`
4. Request scopes:
   - `sites:read`
   - `pages:read`, `pages:write`
   - `cms:read`, `cms:write`
   - `assets:read`, `assets:write`
5. Under "Designer Extension":
   - Set the **App URL** to your hosted extension URL
   - Upload icon (256x256 PNG)

### Copy Credentials

After creating the app, you'll get:
- **Client ID** → `WEBFLOW_CLIENT_ID`
- **Client Secret** → `WEBFLOW_CLIENT_SECRET`

---

## Step 5: Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `WEBFLOW_CLIENT_ID` | `wf_abc123...` | From Webflow Developer Portal |
| `WEBFLOW_CLIENT_SECRET` | `wf_secret_...` | From Webflow Developer Portal |
| `NEXT_PUBLIC_APP_URL` | `https://metamind-api.yourdomain.com` | Your backend URL |
| `DESIGNER_EXTENSION_URL` | `https://metamind-ext.yourdomain.com` | Your extension URL |
| `DATABASE_URL` | `postgresql://...` | From Neon/Supabase |
| `OPENAI_API_KEY` | `sk-proj-...` | From OpenAI dashboard |
| `STRIPE_SECRET_KEY` | `sk_live_...` | From Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From Stripe webhook setup |
| `STRIPE_PRICE_PRO` | `price_...` | Stripe Price ID for Pro plan |
| `STRIPE_PRICE_AGENCY` | `price_...` | Stripe Price ID for Agency plan |
| `JWT_SECRET` | `(random 64-char string)` | Session signing key |
| `NODE_ENV` | `production` | Environment flag |

### Generate JWT_SECRET

```bash
openssl rand -hex 32
```

---

## Step 6: Stripe Setup

### Create Products & Prices

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Create two products:

**Pro Plan ($19/mo)**
- Name: "MetaMind Pro"
- Price: $19/month, recurring
- Copy the Price ID → `STRIPE_PRICE_PRO`

**Agency Plan ($49/mo)**
- Name: "MetaMind Agency"
- Price: $49/month, recurring
- Copy the Price ID → `STRIPE_PRICE_AGENCY`

### Configure Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint:
   - URL: `https://metamind-api.yourdomain.com/api/billing/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
3. Copy the **Signing Secret** → `STRIPE_WEBHOOK_SECRET`

### Test with Stripe CLI (Local Development)

```bash
stripe listen --forward-to localhost:3001/api/billing/webhook
# Copy the webhook signing secret it outputs
```

---

## Step 7: Webflow Marketplace Submission

Once everything is deployed and tested:

1. Go to Webflow Developer Portal → Your App
2. Click "Submit for Review"
3. Prepare:
   - Screenshots of the extension in action (4+)
   - Short demo video (30-60 seconds)
   - Privacy policy URL
   - Terms of service URL
   - Support email
4. Review timeline: typically 5-10 business days

---

## Post-Deployment Checklist

- [ ] Backend deploys successfully on Vercel
- [ ] Database migrations applied
- [ ] OAuth flow works (authorize → callback → extension loads)
- [ ] Generation endpoints produce results
- [ ] Apply endpoint writes data back to Webflow
- [ ] Rate limiting returns 429 on abuse
- [ ] Stripe checkout creates subscriptions
- [ ] Stripe webhook updates subscription status
- [ ] Designer Extension loads inside Webflow Designer
- [ ] Landing page links point to correct URLs
- [ ] Custom domain configured (optional)
- [ ] SSL/HTTPS on all endpoints (automatic on Vercel)

---

## Monitoring & Maintenance

### Vercel Dashboard
- Function invocations and errors
- Build logs and deployment history

### Recommended Additions (Post-Launch)
- **Sentry** — Error tracking (`@sentry/nextjs`)
- **Axiom/Logflare** — Structured logging
- **Uptime monitoring** — BetterStack, Checkly, or Vercel's built-in
- **Stripe Revenue Metrics** — Stripe Dashboard or Baremetrics

---

## Troubleshooting

### "CORS error" in Designer Extension
- Verify `DESIGNER_EXTENSION_URL` matches the actual deployed URL
- Check `next.config.js` headers are deployed

### "Unauthorized" on all API calls
- Verify `JWT_SECRET` is the same across all deployments
- Check that the OAuth callback URL matches exactly

### "Database connection error"
- Verify `DATABASE_URL` includes `?sslmode=require` for Neon
- Check that migrations have been applied: `npx prisma migrate deploy`

### "OpenAI API error"
- Verify API key is valid and has credits
- Check that GPT-4o access is enabled on your OpenAI account

### "Stripe webhook fails"
- Verify webhook secret matches
- Check that the webhook endpoint is accessible publicly
- Use `stripe listen` locally for debugging
