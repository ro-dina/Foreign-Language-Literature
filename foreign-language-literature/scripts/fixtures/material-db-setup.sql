-- LOCAL TEST FIXTURE ONLY. Never apply this file to Supabase.
create role anon;
create role authenticated;
create schema auth;
revoke create on schema public from public;
grant usage on schema public, auth to anon, authenticated;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table public.editor_accounts ("userId" uuid primary key,"createdAt" timestamptz default now());
alter table public.editor_accounts enable row level security;
grant select,insert,update,delete,truncate on public.editor_accounts to authenticated;
create policy own_editor_read on public.editor_accounts for select to authenticated using ("userId"=auth.uid());
insert into public.editor_accounts("userId") values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
create function public.is_editor() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.editor_accounts e where e."userId"=auth.uid()) $$;
grant execute on function public.is_editor() to anon,authenticated;
create table public.legacy_material (id text primary key,source text);
insert into public.legacy_material values ('keep-id','既存の教材を変更しない');
-- Simulate broad inherited grants to prove the new SQL clears them on NEW objects only.
alter default privileges in schema public grant all on tables to anon,authenticated;
alter default privileges in schema public grant execute on functions to anon,authenticated;
