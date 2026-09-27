# ComplyOS Architecture

## Runtime
- Next.js App Router + TypeScript
- Supabase Auth/PostgreSQL/Storage
- PostgreSQL RLS for tenant isolation
- pgvector for document retrieval

## Tenant model
Every business record is scoped to `organization_id`. Server authorization must resolve membership from the authenticated user; client-provided tenant identifiers are never trusted.

## AI boundary
AI extraction and Copilot retrieval are advisory. Structured outputs require schema validation and human verification for consequential compliance fields. Retrieval must filter by organization and authorization before model context assembly.

## Document pipeline
Upload -> validate -> private storage -> hash -> extract/OCR -> classify -> structured extraction -> review -> chunk -> embedding -> retrieval.

## Compliance engine
Deterministic date/status calculations stay outside the LLM. Regulatory source records are versioned and reviewable.

## Deployment
Production deployment is intentionally manual. See `DEPLOYMENT.md` and `.env.example`.
