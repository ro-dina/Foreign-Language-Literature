-- READ-ONLY. Execute only AFTER approved application of material-workflow.sql.
-- This checks catalog configuration, NOT behavior under real JWT sessions.
begin transaction read only;
set local statement_timeout = '15s';
select n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity,
       pg_catalog.pg_get_userbyid(c.relowner) as owner
from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('reading_studio_drafts','reading_studio_publications');
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
from pg_catalog.pg_policies where schemaname='public'
  and tablename in ('reading_studio_drafts','reading_studio_publications') order by tablename,policyname;
select r.rolname,t.name,
       pg_catalog.has_table_privilege(r.oid,t.name,'SELECT') as select_table,
       pg_catalog.has_column_privilege(r.oid,t.name,'payload','INSERT') as insert_payload,
       pg_catalog.has_column_privilege(r.oid,t.name,'owner_id','INSERT') as insert_owner,
       pg_catalog.has_column_privilege(r.oid,t.name,'payload','UPDATE') as update_payload,
       pg_catalog.has_column_privilege(r.oid,t.name,'owner_id','UPDATE') as update_owner_must_be_false,
       pg_catalog.has_column_privilege(r.oid,t.name,'revision','UPDATE') as update_revision_must_be_false,
       pg_catalog.has_column_privilege(r.oid,t.name,'updated_at','UPDATE') as update_time_must_be_false,
       pg_catalog.has_column_privilege(r.oid,t.name,'revision','INSERT') as insert_revision_must_be_false,
       pg_catalog.has_table_privilege(r.oid,t.name,'DELETE') as delete_must_be_false,
       pg_catalog.has_table_privilege(r.oid,t.name,'TRUNCATE') as truncate_must_be_false,
       pg_catalog.has_table_privilege(r.oid,t.name,'TRIGGER') as trigger_must_be_false
from pg_catalog.pg_roles r cross join (values ('public.reading_studio_drafts'),('public.reading_studio_publications')) t(name)
where r.rolname in ('anon','authenticated') order by t.name,r.rolname;
select c.relname,t.tgname,t.tgenabled,pg_catalog.pg_get_triggerdef(t.oid) as definition
from pg_catalog.pg_trigger t join pg_catalog.pg_class c on c.oid=t.tgrelid
where not t.tgisinternal and t.tgrelid in ('public.reading_studio_drafts'::regclass,'public.reading_studio_publications'::regclass);
select c.relname,con.conname,pg_catalog.pg_get_constraintdef(con.oid) as definition
from pg_catalog.pg_constraint con join pg_catalog.pg_class c on c.oid=con.conrelid
where con.conrelid in ('public.reading_studio_drafts'::regclass,'public.reading_studio_publications'::regclass)
order by c.relname,con.conname;
select p.proname,p.prosecdef,p.proconfig,p.proacl,
       pg_catalog.has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute_must_be_false,
       pg_catalog.has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute
from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('reading_studio_json_keys','reading_studio_json_strings','reading_studio_payload_valid','reading_studio_stamp_material');
-- Compare this fingerprint with the preflight result: it must be identical.
select pg_catalog.md5(pg_catalog.pg_get_functiondef(p.oid)||E'\n'||r.rolname||E'\n'||coalesce(p.proacl::text,'<default>')) as is_editor_fingerprint
from pg_catalog.pg_proc p join pg_catalog.pg_roles r on r.oid=p.proowner
where p.oid=pg_catalog.to_regprocedure('public.is_editor()');
rollback;
