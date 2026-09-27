revoke execute on function public.is_org_member(uuid) from public,anon;
grant execute on function public.is_org_member(uuid) to authenticated;
revoke execute on function public.has_org_role(uuid,text[]) from public,anon;
grant execute on function public.has_org_role(uuid,text[]) to authenticated;
revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
revoke execute on function public.create_organization(text,text) from public,anon;
grant execute on function public.create_organization(text,text) to authenticated;
