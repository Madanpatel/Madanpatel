create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(), name text not null, legal_name text, slug text not null unique,
  industry text, company_size text, country text default 'India', state text, city text, timezone text default 'Asia/Kolkata',
  currency text default 'INR', financial_year_start date, logo_url text, status text not null default 'ACTIVE',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, role text not null default 'VIEWER', status text not null default 'ACTIVE',
  invited_by uuid references auth.users(id), joined_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(organization_id,user_id)
);
create table if not exists public.legal_entities (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, legal_name text, registration_number text, tax_identifier text, entity_type text, country text, state text, status text default 'ACTIVE',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  legal_entity_id uuid references public.legal_entities(id) on delete set null, name text not null, location_type text, address text, city text, state text, postal_code text, country text,
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, description text, manager_user_id uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  legal_entity_id uuid references public.legal_entities(id) on delete set null, name text not null, legal_name text, category text, status text default 'ACTIVE', risk_level text default 'MEDIUM',
  tax_identifier text, registration_number text, website text, email text, phone text, address text, owner_user_id uuid references auth.users(id), notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  legal_entity_id uuid references public.legal_entities(id) on delete set null, location_id uuid references public.locations(id) on delete set null, vendor_id uuid references public.vendors(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null, name text not null, original_filename text, mime_type text, file_size bigint, storage_path text,
  document_category text, document_type text, document_number text, issuing_authority text, issue_date date, effective_date date, expiry_date date, renewal_date date,
  status text not null default 'ACTIVE', processing_status text not null default 'UPLOADED', verification_status text not null default 'PENDING', confidence_score numeric,
  source text, uploaded_by uuid references auth.users(id), current_version_id uuid, file_hash text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade, version_number integer not null,
  storage_path text not null, file_hash text, uploaded_by uuid references auth.users(id), created_at timestamptz not null default now(), supersedes_version_id uuid references public.document_versions(id), extraction_status text default 'PENDING',
  unique(document_id,version_number)
);
create table if not exists public.document_extractions (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade, version_id uuid references public.document_versions(id) on delete cascade,
  extraction_type text not null, extracted_data jsonb not null default '{}', model_provider text, model_name text, prompt_version text, confidence numeric, status text default 'PENDING', created_at timestamptz not null default now()
);
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade, version_id uuid references public.document_versions(id) on delete cascade,
  page_number integer, section text, content text not null, token_count integer, embedding vector(1536), metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists public.compliance_frameworks (
  id uuid primary key default gen_random_uuid(), name text not null, country text, jurisdiction text, industry text, version text, status text default 'ACTIVE', source text, effective_date date, review_date date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.compliance_rules (
  id uuid primary key default gen_random_uuid(), framework_id uuid references public.compliance_frameworks(id) on delete set null, title text not null, description text, jurisdiction text, country text, state text, industry text,
  applicability_logic jsonb not null default '{}', frequency text, due_date_logic jsonb not null default '{}', grace_period_days integer default 0, responsible_role text, required_evidence jsonb not null default '[]',
  source_name text, source_url text, source_reference text, effective_date date, version text, status text default 'ACTIVE', reviewed_at timestamptz, reviewed_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.compliance_obligations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, legal_entity_id uuid references public.legal_entities(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null, rule_id uuid references public.compliance_rules(id) on delete set null, title text not null, description text, due_date date,
  status text not null default 'NOT_STARTED', priority text default 'MEDIUM', assigned_user_id uuid references auth.users(id), reviewer_id uuid references auth.users(id), evidence_required boolean default true,
  completion_date date, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.obligation_evidence (
  id uuid primary key default gen_random_uuid(), obligation_id uuid not null references public.compliance_obligations(id) on delete cascade, document_id uuid references public.documents(id) on delete set null,
  uploaded_by uuid references auth.users(id), verification_status text default 'PENDING', verified_by uuid references auth.users(id), verified_at timestamptz, notes text, created_at timestamptz not null default now()
);
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, obligation_id uuid references public.compliance_obligations(id) on delete set null,
  risk_id uuid, document_id uuid references public.documents(id) on delete set null, title text not null, description text, priority text default 'MEDIUM', status text default 'OPEN', assigned_to uuid references auth.users(id), reviewer_id uuid references auth.users(id), due_date date,
  completed_at timestamptz, created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.risks (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, entity_id uuid references public.legal_entities(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null, vendor_id uuid references public.vendors(id) on delete set null, document_id uuid references public.documents(id) on delete set null,
  obligation_id uuid references public.compliance_obligations(id) on delete set null, type text, severity text default 'MEDIUM', title text not null, description text, evidence jsonb default '{}', recommended_action text,
  status text default 'OPEN', assigned_user_id uuid references auth.users(id), resolved_by uuid references auth.users(id), resolved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, title text not null, message text not null, resource_type text, resource_id uuid, read_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, actor_user_id uuid references auth.users(id), action text not null, resource_type text, resource_id uuid,
  previous_data jsonb, new_data jsonb, metadata jsonb default '{}', ip_address inet, user_agent text, created_at timestamptz not null default now()
);

create index if not exists idx_members_org_user on public.organization_members(organization_id,user_id);
create index if not exists idx_documents_org on public.documents(organization_id);
create index if not exists idx_documents_expiry on public.documents(organization_id,expiry_date);
create index if not exists idx_obligations_org_due on public.compliance_obligations(organization_id,due_date);
create index if not exists idx_tasks_org_due on public.tasks(organization_id,due_date);
create index if not exists idx_risks_org_status on public.risks(organization_id,status);
create index if not exists idx_audit_org_created on public.audit_logs(organization_id,created_at desc);

create or replace function public.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.organization_members m where m.organization_id=target_org and m.user_id=auth.uid() and m.status='ACTIVE');
$$;

do $$ declare t text; begin
  foreach t in array array['organizations','organization_members','legal_entities','locations','departments','vendors','documents','document_versions','document_extractions','document_chunks','compliance_frameworks','compliance_rules','compliance_obligations','obligation_evidence','tasks','risks','notifications','audit_logs'] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;

create policy "org members can read organizations" on public.organizations for select using (public.is_org_member(id));
create policy "members isolated by org" on public.organization_members for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "tenant isolated legal entities" on public.legal_entities for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "tenant isolated locations" on public.locations for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "tenant isolated departments" on public.departments for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "tenant isolated vendors" on public.vendors for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "tenant isolated documents" on public.documents for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "tenant isolated obligations" on public.compliance_obligations for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "tenant isolated evidence" on public.obligation_evidence for all using (exists(select 1 from public.compliance_obligations o where o.id=obligation_id and public.is_org_member(o.organization_id))) with check (exists(select 1 from public.compliance_obligations o where o.id=obligation_id and public.is_org_member(o.organization_id)));
create policy "tenant isolated tasks" on public.tasks for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "tenant isolated risks" on public.risks for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "tenant isolated notifications" on public.notifications for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "tenant isolated audit" on public.audit_logs for select using (public.is_org_member(organization_id));
create policy "frameworks readable" on public.compliance_frameworks for select using (true);
create policy "rules readable" on public.compliance_rules for select using (true);
create policy "document versions via tenant" on public.document_versions for all using (exists(select 1 from public.documents d where d.id=document_id and public.is_org_member(d.organization_id))) with check (exists(select 1 from public.documents d where d.id=document_id and public.is_org_member(d.organization_id)));
create policy "document extraction via tenant" on public.document_extractions for all using (exists(select 1 from public.documents d where d.id=document_id and public.is_org_member(d.organization_id))) with check (exists(select 1 from public.documents d where d.id=document_id and public.is_org_member(d.organization_id)));
create policy "document chunks via tenant" on public.document_chunks for all using (exists(select 1 from public.documents d where d.id=document_id and public.is_org_member(d.organization_id))) with check (exists(select 1 from public.documents d where d.id=document_id and public.is_org_member(d.organization_id)));
