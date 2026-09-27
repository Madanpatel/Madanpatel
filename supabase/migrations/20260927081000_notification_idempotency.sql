create unique index if not exists notifications_user_resource_type_uniq on public.notifications(user_id,resource_id,type) where resource_id is not null;
