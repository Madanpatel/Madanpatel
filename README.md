# ComplyOS

AI Compliance Operating System for SMEs.

## Current product surface

- Supabase Auth with email signup/login and callback handling
- Multi-tenant organization model with RLS and server-side membership checks
- Documents, private Storage, version records, hashes and audit events
- Compliance obligations, tasks, risks and vendors
- Compliance calendar and notification center
- Reports queue and report architecture
- AI Copilot endpoint/UI with organization-scoped retrieval foundation
- AI conversations, messages and citation persistence
- Organization settings, integrations, webhooks, automations and feature flags schema
- Deterministic daily compliance/expiry maintenance endpoint
- CI configuration for lint, typecheck, tests and production build
- Security-focused Supabase RPC grants and RLS

## Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Supabase Auth/PostgreSQL/Storage/pgvector
- Zod

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

## Environment

Use the dedicated ComplyOS Supabase project. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. Configure `NEXT_PUBLIC_SITE_URL` to the deployed application URL for email auth callbacks. `CRON_SECRET` protects the scheduled maintenance endpoint.

## Deployment

Production deployment is manual. Import this repository into Vercel as a Next.js application with root directory `/` and `npm run build`. Configure production environment variables from `.env.example`. See `docs/DEPLOYMENT.md` for the complete checklist.

## Product principles

- Tenant isolation by default
- Row Level Security for tenant data
- Source-backed compliance reasoning
- Human review for high-impact decisions
- Auditability for material actions
- Documents treated as untrusted input
- No unsupported claim that a business is legally compliant
