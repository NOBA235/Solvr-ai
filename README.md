# 🔬 Solvr AI — Production SaaS Starter

AI-powered STEM problem solver + virtual lab platform. Students upload or type any Physics, Maths, Chemistry, or Biology problem and receive streaming, step-by-step solutions from Claude AI.

---

## Subscription Plans

| Feature | Free | Basic ($9/mo) | Premium ($19/mo) |
|---------|------|---------------|------------------|
| Problems/month | 5 | 150 | Unlimited |
| Text input | ✓ | ✓ | ✓ |
| Photo upload | — | ✓ | ✓ |
| PDF upload | — | — | ✓ |
| Virtual Labs | — | ✓ | ✓ |
| History | 3 days | 90 days | Unlimited |
| Priority AI | — | — | ✓ |
| Export PDF | — | — | ✓ |
| 7-day free trial | — | ✓ | ✓ |

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 App Router + TypeScript | SSR for SEO, API routes, type safety |
| Auth + DB + Storage | Supabase (Postgres + GoTrue + S3) | Eliminates custom auth, RLS security |
| AI | Anthropic Claude (streaming) | Best-in-class reasoning, vision support |
| Payments | Stripe | Industry standard, webhook reliability |
| Email | Resend | Developer-friendly transactional email |
| Styling | Tailwind CSS + Framer Motion | Rapid UI, smooth animations |
| Deployment | Vercel + Supabase Cloud | Zero-config, auto-scaling |

---

## Project Structure

```
solvr/
├── middleware.ts                    # Auth + rate limiting + plan gates
├── vercel.json                      # Cron job config
├── supabase/migrations/
│   └── 001_initial.sql             # Full schema, RLS, functions, storage
│
└── src/
    ├── app/
    │   ├── page.tsx                 # Landing page
    │   ├── pricing/page.tsx         # Pricing with billing toggle
    │   ├── auth/login|register/     # Auth pages (+ Google OAuth)
    │   ├── auth/callback/route.ts   # OAuth redirect handler
    │   ├── dashboard/
    │   │   ├── layout.tsx           # Protected layout + sidebar
    │   │   ├── page.tsx             # Dashboard home + usage stats
    │   │   ├── solve/page.tsx       # ← CORE FEATURE: streaming solver
    │   │   ├── history/page.tsx     # Past solutions + bookmarks
    │   │   ├── lab/page.tsx         # Subject hub
    │   │   ├── lab/[subject]/       # Virtual lab (chemistry/physics/maths/bio)
    │   │   └── settings/page.tsx    # Subscription management
    │   └── api/
    │       ├── solve/route.ts       # Streaming Claude solver (auth + quota + rate limit)
    │       ├── lab/react/route.ts   # Virtual lab AI endpoint
    │       ├── subscriptions/
    │       │   ├── create/route.ts  # Stripe Checkout (idempotent)
    │       │   └── portal/route.ts  # Stripe Customer Portal
    │       ├── webhooks/stripe/     # Webhook handler (signature verified)
    │       └── cron/reset-usage/    # Monthly usage reset
    │
    ├── lib/
    │   ├── api-guard.ts             # Auth + quota + rate limit in one call
    │   ├── rate-limit/index.ts      # Sliding window rate limiter
    │   ├── validate/index.ts        # Input sanitisation + validation
    │   ├── email.ts                 # Resend transactional emails
    │   ├── anthropic/solver.ts      # Claude streaming solver
    │   ├── stripe/plans.ts          # Plan config (single source of truth)
    │   └── supabase/client|server   # Browser + server Supabase clients
    └── types/index.ts               # Shared TypeScript types
```

---

## Setup

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- An [Anthropic](https://console.anthropic.com) API key
- A [Stripe](https://stripe.com) account
- A [Resend](https://resend.com) account (free tier works)

### 2. Install

```bash
unzip solvr.zip && cd solvr
npm install
```

### 3. Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link to your project
supabase login
supabase link --project-ref your-project-ref

# Run migrations (creates all tables, RLS, functions, storage)
supabase db push

# Enable Google OAuth (optional but recommended)
# Supabase dashboard → Auth → Providers → Google
```

### 4. Stripe Setup

In the Stripe dashboard:
1. Create two products: **Basic** and **Premium**
2. Add monthly and yearly prices to each
3. Copy the Price IDs into your `.env`
4. Set up the webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
5. Subscribe to these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`

### 5. Configure Environment

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`. **Never commit this file.**

### 6. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set all env vars in Vercel dashboard:
# Project → Settings → Environment Variables
# (copy from .env.example)

# The cron job in vercel.json runs automatically on Vercel Pro/Enterprise
# For free tier, use an external cron (GitHub Actions, cron-job.org)
```

---

## Security Architecture

### Authentication
- **Supabase GoTrue** handles all auth (JWT, session refresh, OAuth)
- Middleware uses `getUser()` (cryptographically verified) — never `getSession()`
- Sessions stored in HTTP-only cookies (not localStorage)
- Google OAuth supported out of the box

### API Security

Every protected API route goes through `apiGuard()` which enforces:

```
Request → Verify Supabase JWT → Fetch profile → Rate limit check → Plan feature gate → Quota check → Handler
```

| Layer | Protection |
|-------|-----------|
| Auth | Supabase JWT on every request |
| Rate limiting | Sliding window per user (5–60 req/min by plan) |
| Auth brute force | 10 attempts per 15 min per IP |
| Input validation | All inputs validated before DB/AI access |
| File validation | MIME type + size checked before Claude |
| Plan gates | Feature access checked server-side |
| Monthly quota | Atomic DB counter (prevents race conditions) |

### Payment Security

| Concern | Solution |
|---------|---------|
| Webhook forgery | Stripe signature verified before any DB write |
| Duplicate charges | Idempotency keys on checkout creation |
| Plan state | Always synced from Stripe webhook, not client |
| Secret keys | STRIPE_SECRET_KEY server-only, never in client bundle |
| Downgrade | Handled by Stripe webhook on subscription deletion |

### Database Security

- **Row Level Security (RLS)** on every table — users can only access their own data
- **Service role client** used only in webhook handler (bypasses RLS intentionally)
- **Parameterised queries** via Supabase client (no SQL injection)
- **Atomic counters** via RPC functions (no race conditions on usage tracking)

### HTTP Security Headers

Applied to all routes via `next.config.ts`:

```
X-Frame-Options: DENY                     (clickjacking)
X-Content-Type-Options: nosniff           (MIME sniffing)
Strict-Transport-Security: max-age=63072000  (HTTPS only)
Content-Security-Policy: ...              (XSS)
Permissions-Policy: ...                   (browser feature lockdown)
Referrer-Policy: strict-origin-when-cross-origin
```

### What to Add Before Launch

- [ ] **Sentry** for error monitoring: `npm i @sentry/nextjs`
- [ ] **PostHog** for analytics: `npm i posthog-js`
- [ ] **Upstash Redis** for rate limiting (replaces in-memory Map for multi-instance): `npm i @upstash/ratelimit @upstash/redis`
- [ ] **PDF export** for Premium users (jsPDF or Puppeteer)
- [ ] Email verification on signup (enable in Supabase Auth settings)
- [ ] CAPTCHA on auth forms (hCaptcha or Cloudflare Turnstile)
- [ ] Penetration test before large-scale launch

---

## Performance Notes

- **Streaming**: AI responses stream token-by-token — users see output immediately, no waiting for full solution
- **Server Components**: Dashboard, history, and settings pages fetch data server-side (no client-side loading states)
- **Lazy loading**: Lab client loaded only when user navigates to lab route
- **No-cache**: All `/dashboard` and `/api` routes are `Cache-Control: no-store`
- **Static**: Landing page and pricing are fully static (ISR-compatible)

---

## API Rate Limits by Plan

| Plan | Requests/min | Auth attempts/15min | File uploads/hr |
|------|-------------|--------------------|-----------------| 
| Free | 5 | 10 (per IP) | 30 |
| Basic | 20 | 10 (per IP) | 30 |
| Premium | 60 | 10 (per IP) | 30 |
