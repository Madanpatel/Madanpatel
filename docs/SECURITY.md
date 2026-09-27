# ComplyOS Security

## Tenant isolation
RLS is enabled for tenant-owned tables. Policies use authenticated membership rather than client-supplied organization identity.

## Sensitive files
Compliance documents must live in private storage buckets and be accessed through short-lived signed URLs. Storage paths should be `{organization_id}/{document_id}/{version_id}/file`.

## AI security
Uploaded text is untrusted data. It cannot override system instructions. Retrieval is permission-filtered before model context. Consequential AI actions require explicit user confirmation.

## Secrets
Only server-side environments may contain service-role, AI, OAuth, webhook-signing or billing secrets. `.env.example` contains placeholders only.

## Audit
Security-sensitive changes are recorded in append-only audit logs. Production implementation should additionally restrict audit mutation to trusted server/database paths.
