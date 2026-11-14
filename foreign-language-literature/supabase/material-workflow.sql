-- FINAL REVIEW CANDIDATE. Never run against production before final approval.
-- Replace the fingerprint only after reviewing material-workflow-preflight.sql.
-- Additive: no existing table, row, function, ACL, RLS policy or Auth object is changed.
-- Re-running on an installed or partially colliding schema intentionally FAILS.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '60s';
set local reading_studio.reviewed_is_editor_fingerprint = '__REVIEWED_IS_EDITOR_FINGERPRINT__';

do $guard$
declare
  editor_function record;
  expected text := current_setting('reading_studio.reviewed_is_editor_fingerprint', true);
  actual text;
begin
  if pg_catalog.pg_is_in_recovery() or current_setting('transaction_read_only')='on' then
    raise exception 'STOP: database is still in recovery or read-only. Do not apply DDL.';
  end if;
  if expected is null or expected !~ '^[0-9a-f]{32}$' then
    raise exception 'STOP: review public.is_editor() definition, owner and ACL, then set its fingerprint.';
  end if;
  if pg_catalog.to_regrole('authenticated') is null or pg_catalog.to_regrole('anon') is null
     or pg_catalog.to_regprocedure('auth.uid()') is null then
    raise exception 'STOP: Supabase roles/auth.uid() are missing.';
  end if;
  select p.*, r.rolname as owner_name into editor_function
    from pg_catalog.pg_proc p join pg_catalog.pg_roles r on r.oid=p.proowner
    where p.oid=pg_catalog.to_regprocedure('public.is_editor()');
  if not found then raise exception 'STOP: public.is_editor() is missing. Do not create or replace it implicitly.'; end if;
  actual := pg_catalog.md5(pg_catalog.pg_get_functiondef(editor_function.oid) || E'\n' || editor_function.owner_name || E'\n' || coalesce(editor_function.proacl::text, '<default>'));
  if actual <> expected then raise exception 'STOP: is_editor() changed since review.'; end if;
  if editor_function.prorettype <> 'pg_catalog.bool'::regtype or editor_function.proretset
     or not editor_function.prosecdef or editor_function.provolatile not in ('s','i') then
    raise exception 'STOP: expected a reviewed stable SECURITY DEFINER boolean is_editor().';
  end if;
  if not exists(select 1 from pg_catalog.unnest(editor_function.proconfig) c where c in ('search_path=""','search_path=','search_path=public')) then
    raise exception 'STOP: is_editor() must have a reviewed fixed search_path.';
  end if;
  if not pg_catalog.has_function_privilege('authenticated',editor_function.oid,'EXECUTE') then
    raise exception 'STOP: authenticated cannot execute is_editor(). Review grants separately.';
  end if;
  if not pg_catalog.has_function_privilege('authenticated','auth.uid()','EXECUTE')
     or not pg_catalog.has_schema_privilege('authenticated','public','USAGE')
     or not pg_catalog.has_schema_privilege('authenticated','auth','USAGE') then
    raise exception 'STOP: authenticated lacks required schema/auth.uid() access. Review existing grants separately.';
  end if;
  if pg_catalog.pg_has_role('authenticated',editor_function.proowner,'MEMBER')
     or pg_catalog.pg_has_role('anon',editor_function.proowner,'MEMBER') then
    raise exception 'STOP: untrusted API roles can act as the is_editor() owner.';
  end if;
  if pg_catalog.has_schema_privilege('authenticated','public','CREATE')
     or pg_catalog.has_schema_privilege('anon','public','CREATE')
     or pg_catalog.has_schema_privilege('authenticated','auth','CREATE')
     or pg_catalog.has_schema_privilege('anon','auth','CREATE') then
    raise exception 'STOP: API roles can create objects in a trusted schema. Review existing grants separately.';
  end if;
  if pg_catalog.to_regclass('public.reading_studio_drafts') is not null
     or pg_catalog.to_regclass('public.reading_studio_publications') is not null
     or exists(select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('reading_studio_json_keys','reading_studio_json_strings','reading_studio_payload_valid','reading_studio_stamp_material')) then
    raise exception 'STOP: target objects already exist. Inspect them; do not overwrite or drop them.';
  end if;
end;
$guard$;

create function public.reading_studio_json_keys(document jsonb, required_keys text[], optional_keys text[])
returns boolean language sql immutable security invoker set search_path = ''
as $fn$
  select coalesce(case when pg_catalog.jsonb_typeof(document)='object'
    then document ?& required_keys and (document - (required_keys || optional_keys))='{}'::jsonb
    else false end,false);
$fn$;

create function public.reading_studio_json_strings(document jsonb)
returns boolean language sql immutable security invoker set search_path = ''
as $fn$
  select coalesce(case when pg_catalog.jsonb_typeof(document)='array' then
    not exists(select 1 from pg_catalog.jsonb_array_elements(document) v where pg_catalog.jsonb_typeof(v) is distinct from 'string')
    else false end,false);
$fn$;

-- Closed schema at EVERY level. No progress, weak flags, drafts, sessions or
-- unknown JSON properties can be stored, including through direct REST calls.
create function public.reading_studio_payload_valid(document jsonb)
returns boolean language plpgsql immutable security invoker set search_path = ''
as $fn$
declare
  w jsonb; s jsonb; x jsonb; t jsonb; g jsonb; e jsonb; row_data jsonb;
  field text; work_ids jsonb := '{}'; section_ids jsonb; sentence_ids jsonb;
begin
  if not public.reading_studio_json_keys(document,array['version','data','dict'],array[]::text[])
     or (document->'version') is distinct from '1'::jsonb
     or pg_catalog.jsonb_typeof(document->'data') is distinct from 'array'
     or pg_catalog.jsonb_typeof(document->'dict') is distinct from 'object' then return false; end if;
  for w in select value from pg_catalog.jsonb_array_elements(document->'data') loop
    if not public.reading_studio_json_keys(w,array['id','title','sourceLanguage','sections'],array['author']) then return false; end if;
    foreach field in array array['id','title','sourceLanguage','author'] loop
      if (w ? field) and pg_catalog.jsonb_typeof(w->field) is distinct from 'string' then return false; end if;
    end loop;
    if w->>'id'='' or work_ids ? (w->>'id') or pg_catalog.jsonb_typeof(w->'sections') is distinct from 'array' then return false; end if;
    work_ids := work_ids || pg_catalog.jsonb_build_object(w->>'id',true);
    section_ids := '{}';
    for s in select value from pg_catalog.jsonb_array_elements(w->'sections') loop
      if not public.reading_studio_json_keys(s,array['id','title','sentences'],array['description']) then return false; end if;
      foreach field in array array['id','title','description'] loop
        if (s ? field) and pg_catalog.jsonb_typeof(s->field) is distinct from 'string' then return false; end if;
      end loop;
      if s->>'id'='' or section_ids ? (s->>'id') or pg_catalog.jsonb_typeof(s->'sentences') is distinct from 'array' then return false; end if;
      section_ids := section_ids || pg_catalog.jsonb_build_object(s->>'id',true);
      sentence_ids := '{}';
      for x in select value from pg_catalog.jsonb_array_elements(s->'sentences') loop
        if not public.reading_studio_json_keys(x,array['id','label','source','english','japanese','tokens','buildUp','notes','grammar'],array[]::text[]) then return false; end if;
        foreach field in array array['id','label','source','english','japanese'] loop
          if pg_catalog.jsonb_typeof(x->field) is distinct from 'string' then return false; end if;
        end loop;
        if x->>'id'='' or sentence_ids ? (x->>'id')
           or not public.reading_studio_json_strings(x->'buildUp') or not public.reading_studio_json_strings(x->'notes')
           or pg_catalog.jsonb_typeof(x->'tokens') is distinct from 'array' or pg_catalog.jsonb_typeof(x->'grammar') is distinct from 'array' then return false; end if;
        sentence_ids := sentence_ids || pg_catalog.jsonb_build_object(x->>'id',true);
        for t in select value from pg_catalog.jsonb_array_elements(x->'tokens') loop
          if not public.reading_studio_json_keys(t,array['text'],array['en','ja','origin','gender','grammarRefs','lemma','partOfSpeech']) then return false; end if;
          foreach field in array array['text','en','ja','origin','gender','lemma','partOfSpeech'] loop
            if (t ? field) and pg_catalog.jsonb_typeof(t->field) is distinct from 'string' then return false; end if;
          end loop;
          if ((t ? 'gender') and t->>'gender' not in ('','m','f','n'))
             or ((t ? 'grammarRefs') and not public.reading_studio_json_strings(t->'grammarRefs')) then return false; end if;
        end loop;
        for g in select value from pg_catalog.jsonb_array_elements(x->'grammar') loop
          if not public.reading_studio_json_keys(g,array['id','title','body'],array['type','tags','tableRows']) then return false; end if;
          foreach field in array array['id','title','body','type'] loop
            if (g ? field) and pg_catalog.jsonb_typeof(g->field) is distinct from 'string' then return false; end if;
          end loop;
          if ((g ? 'type') and g->>'type' not in ('grammar','conjugation','pattern','idiom'))
             or ((g ? 'tags') and not public.reading_studio_json_strings(g->'tags')) then return false; end if;
          if g ? 'tableRows' then
            if pg_catalog.jsonb_typeof(g->'tableRows') is distinct from 'array' then return false; end if;
            for row_data in select value from pg_catalog.jsonb_array_elements(g->'tableRows') loop
              if not public.reading_studio_json_strings(row_data) then return false; end if;
            end loop;
          end if;
        end loop;
      end loop;
    end loop;
  end loop;
  for e in select value from pg_catalog.jsonb_each(document->'dict') loop
    if not public.reading_studio_json_keys(e,array['sourceLanguage','token','en','ja','origin','gender','grammarRefs'],array['lemma','partOfSpeech']) then return false; end if;
    foreach field in array array['sourceLanguage','token','en','ja','origin','gender','lemma','partOfSpeech'] loop
      if (e ? field) and pg_catalog.jsonb_typeof(e->field) is distinct from 'string' then return false; end if;
    end loop;
    if e->>'gender' not in ('','m','f','n') or not public.reading_studio_json_strings(e->'grammarRefs') then return false; end if;
  end loop;
  return true;
end;
$fn$;

create function public.reading_studio_stamp_material()
returns trigger language plpgsql security invoker set search_path = ''
as $fn$
begin
  if TG_OP='INSERT' then
    new.revision := 1;
  else
    if new.owner_id is distinct from old.owner_id then raise exception 'Material owner is immutable.' using errcode='23514'; end if;
    new.revision := old.revision + 1;
  end if;
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$fn$;

create table public.reading_studio_drafts (
  owner_id uuid primary key,
  payload jsonb not null constraint studio_drafts_payload_valid check (public.reading_studio_payload_valid(payload) is true),
  revision bigint not null default 1 constraint studio_drafts_revision_valid check (revision between 1 and 9007199254740991),
  updated_at timestamptz not null default now()
);
create table public.reading_studio_publications (
  owner_id uuid primary key,
  payload jsonb not null constraint studio_publications_payload_valid check (public.reading_studio_payload_valid(payload) is true),
  revision bigint not null default 1 constraint studio_publications_revision_valid check (revision between 1 and 9007199254740991),
  updated_at timestamptz not null default now()
);
create trigger studio_drafts_stamp before insert or update on public.reading_studio_drafts for each row execute function public.reading_studio_stamp_material();
create trigger studio_publications_stamp before insert or update on public.reading_studio_publications for each row execute function public.reading_studio_stamp_material();
alter table public.reading_studio_drafts enable row level security;
alter table public.reading_studio_publications enable row level security;
-- Also clear PUBLIC grants: revoking anon alone does not remove inherited grants.
revoke all on public.reading_studio_drafts, public.reading_studio_publications from public, anon, authenticated;
grant select on public.reading_studio_drafts, public.reading_studio_publications to authenticated;
grant insert(owner_id,payload), update(payload) on public.reading_studio_drafts, public.reading_studio_publications to authenticated;
revoke all on function public.reading_studio_json_keys(jsonb,text[],text[]), public.reading_studio_json_strings(jsonb), public.reading_studio_payload_valid(jsonb), public.reading_studio_stamp_material() from public, anon, authenticated;
grant execute on function public.reading_studio_json_keys(jsonb,text[],text[]), public.reading_studio_json_strings(jsonb), public.reading_studio_payload_valid(jsonb) to authenticated;

create policy studio_drafts_owner_read on public.reading_studio_drafts for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_editor()));
create policy studio_drafts_editor_insert on public.reading_studio_drafts for insert to authenticated
  with check (owner_id=(select auth.uid()) and (select public.is_editor()));
create policy studio_drafts_editor_update on public.reading_studio_drafts for update to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_editor()))
  with check (owner_id=(select auth.uid()) and (select public.is_editor()));
create policy studio_publications_signed_in_read on public.reading_studio_publications for select to authenticated using ((select auth.uid()) is not null);
create policy studio_publications_editor_insert on public.reading_studio_publications for insert to authenticated
  with check (owner_id=(select auth.uid()) and (select public.is_editor()));
create policy studio_publications_editor_update on public.reading_studio_publications for update to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_editor()))
  with check (owner_id=(select auth.uid()) and (select public.is_editor()));
notify pgrst, 'reload schema';
commit;
