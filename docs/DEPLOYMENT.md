# ComplyOS Manual Deployment

Production deployment is intentionally not performed by the build agent.

1. Create or select the dedicated ComplyOS Supabase project.
2. Configure `.env` from `.env.example`; keep secrets server-side.
3. Apply `supabase/migrations/` with the Supabase CLI.
4. Create private Storage buckets: `documents`, `reports`, `avatars`, `organization-assets`.
5. Configure Supabase Auth email verification and password reset URLs.
6. Configure AI, email and optional OAuth/integration credentials.
7. Run lint, typecheck, tests and production build.
8. Deploy the Next.js application manually to Vercel.
9. Add environment variables to the Vercel project.
10. Configure the production domain and OAuth callback URLs.
11. Verify RLS with two test organizations.
12. Verify private document signed URLs and upload validation.
13. Configure scheduled/background processing for expiry checks, notifications and document jobs.
14. Run the browser smoke journey before inviting real users.

Do not place Supabase service-role keys or third-party secrets in client-side variables.
