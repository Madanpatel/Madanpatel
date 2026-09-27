create extension if not exists vector;

alter table public.documents add column if not exists legal_entity_id uuid references public.organizations(id) on delete set null;
alter table public.documents add column if not exists location_id uuid;
alter table public.documents add column if not exists vendor_id uuid;
alter table public.documents add column if not exists department_id uuid;
alter table public.documents add column if not exists original_filename text;
alter table public.documents add column if not exists document_category text;
alter table public.documents add column if not exists document_type text;
alter table public.documents add column if not exists document_number text;
alter table public.documents add column if not exists issuing_authority text;
alter table public.documents add column if not exists issue_date date;
alter table public.documents add column if not exists effective_date date;
alter table public.documents add column if not exists expiry_date date;
alter table public.documents add column if not exists renewal_date date;
alter table public.documents add column if not exists status text default 'ACTIVE';
alter table public.documents add column if not exists verification_status text default 'PENDING';
alter table public.documents add column if not exists confidence_score numeric;
alter table public.documents add column if not exists source text;
alter table public.documents add column if not exists deleted_at timestamptz;

create table if not exists public.vendors (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, legal_name text, category text, status text not null default 'ACTIVE', risk_level text not null default 'MEDIUM', tax_identifier text, registration_number text, website text, email text, phone text, address text, owner_user_id uuid references auth.users(id), notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.compliance_obligations (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, rule_id uuid references public.requirements(id) on delete set null, title text not null, description text, due_date date, status text not null default 'NOT_STARTED', priority text not null default 'MEDIUM', assigned_user_id uuid references auth.users(id), reviewer_id uuid references auth.users(id), evidence_required boolean not null default true, completion_date date, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.tasks (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, obligation_id uuid references public.compliance_obligations(id) on delete set null, risk_id uuid, document_id uuid references public.documents(id) on delete set null, title text not null, description text, priority text not null default 'MEDIUM', status text not null default 'OPEN', assigned_to uuid references auth.users(id), reviewer_id uuid references auth.users(id), due_date date, completed_at timestamptz, created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.risks (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, vendor_id uuid references public.vendors(id) on delete set null, document_id uuid references public.documents(id) on delete set null, obligation_id uuid references public.compliance_obligations(id) on delete set null, type text, severity text not null default 'MEDIUM', title text not null, description text, evidence jsonb not null default '{}', recommended_action text, status text not null default 'OPEN', assigned_user_id uuid references auth.users(id), resolved_by uuid references auth.users(id), resolved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.notifications (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, type text not null, title text not null, message text not null, resource_type text, resource_id uuid, read_at timestamptz, created_at timestamptz not null default now());
create table if not exists public.audit_logs (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, actor_user_id uuid references auth.users(id), action text not null, resource_type text, resource_id uuid, previous_data jsonb, new_data jsonb, metadata jsonb not null default '{}', created_at timestamptz not null default now());
create table if not exists public.document_versions (id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade, version_number integer not null, storage_path text not null, file_hash text, uploaded_by uuid references auth.users(id), created_at timestamptz not null default now(), supersedes_version_id uuid references public.document_versions(id), extraction_status text default 'PENDING', unique(document_id,version_number));
create table if not exists public.document_extractions (id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade, version_id uuid references public.document_versions(id) on delete cascade, extraction_type text not null, extracted_data jsonb not null default '{}', model_provider text, model_name text, prompt_version text, confidence numeric, status text default 'PENDING', created_at timestamptz not null default now());
create table if not exists public.document_chunks (id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade, version_id uuid references public.document_versions(id) on delete cascade, page_number integer, section text, content text not null, token_count integer, embedding vector(1536), metadata jsonb not null default '{}', created_at timestamptz not null default now());

create index if not exists idx_documents_expiry on public.documents(organization_id,expiry_date);
create index if not exists idx_obligations_due on public.compliance_obligations(organization_id,due_date);
create index if not exists idx_tasks_due on public.tasks(organization_id,due_date);
create index if not exists idx_risks_status on public.risks(organization_id,status);

alter table public.vendors enable row level security;
alter table public.compliance_obligations enable row level security;
alter table public.tasks enable row level security;
alter table public.risks enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_extractions enable row level security;
alter table public.document_chunks enable row level security;

create policy "vendors_org_access" on public.vendors for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "obligations_org_access" on public.compliance_obligations for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "tasks_org_access" on public.tasks for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "risks_org_access" on public.risks for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "notifications_org_access" on public.notifications for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "audit_logs_org_read" on public.audit_logs for select using (public.is_org_member(organization_id));
create policy "document_versions_org_access" on public.document_versions for all using (exists(select 1 from public.documents d where d.id=document_id and public.is_org_member(d.organization_id))) with check (exists(select 1 from public.documents d where d.id=document_id and public.is_org_member(d.organization_id)));
create policy "document_extractions_org_access" on public.document_extractions for all using (exists(select 1 from public.documents d where d.id=document_id and public.is_org_member(d.organization_id))) with check (exists(select 1 from public.documents d where d.id=document_id and public.is_org_member(d.organization_id)));
create policy "document_chunks_org_access" on public.document_chunks for all using (exists(select 1 from public.documents d where d.id=document_id and public.is_org_member(d.organization_id))) with check (exists(select 1 from public.documents d where d.id=document_id and public.is_org_member(d.organization_id)));
