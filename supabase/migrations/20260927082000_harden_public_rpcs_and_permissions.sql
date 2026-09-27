create policy permissions_authenticated_read on public.permissions for select to authenticated using (true);
revoke execute on function public.create_organization(text,text) from anon;
grant execute on function public.create_organization(text,text) to authenticated;
revoke execute on function public.is_org_member(uuid) from anon;
grant execute on function public.is_org_member(uuid) to authenticated;
revoke execute on function public.has_org_role(uuid,text[]) from anon;
grant execute on function public.has_org_role(uuid,text[]) to authenticated;
revoke execute on function public.rls_auto_enable() from anon,authenticated;
