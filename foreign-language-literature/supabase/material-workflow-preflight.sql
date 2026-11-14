-- READ-ONLY REVIEW SCRIPT. Prepared only; not executed against production.
-- Run only after approval to inspect the restored project. Review all result sets.
begin transaction read only;
set local statement_timeout = '15s';
select current_database() as database_name, current_user as reviewer,
       version() as postgres_version, pg_catalog.pg_is_in_recovery() as in_recovery,
       current_setting('transaction_read_only') as read_only;
select pg_catalog.to_regprocedure('public.is_editor()') as is_editor_function,
       pg_catalog.to_regprocedure('auth.uid()') as uid_function,
       pg_catalog.to_regclass('public.editor_accounts') as editor_accounts;

select p.oid::regprocedure as signature, r.rolname as owner,
       r.rolsuper as owner_superuser, r.rolbypassrls as owner_bypasses_rls,
       p.prosecdef as security_definer, p.provolatile as volatility,
       p.proretset as returns_set, pg_catalog.pg_get_function_result(p.oid) as return_type,
       p.proconfig as fixed_settings, p.proacl as explicit_acl,
       pg_catalog.pg_get_functiondef(p.oid) as definition,
       pg_catalog.md5(pg_catalog.pg_get_functiondef(p.oid) || E'\n' || r.rolname || E'\n' || coalesce(p.proacl::text,'<default>')) as reviewed_is_editor_fingerprint
from pg_catalog.pg_proc p join pg_catalog.pg_roles r on r.oid=p.proowner
where p.oid=pg_catalog.to_regprocedure('public.is_editor()');

-- Effective privileges include PUBLIC/inherited grants, not just explicit ACLs.
select roles.rolname,
       pg_catalog.has_function_privilege(roles.oid,pg_catalog.to_regprocedure('public.is_editor()'),'EXECUTE') as can_execute_is_editor,
       pg_catalog.has_function_privilege(roles.oid,pg_catalog.to_regprocedure('auth.uid()'),'EXECUTE') as can_execute_uid,
       pg_catalog.has_schema_privilege(roles.oid,'public','USAGE') as can_use_public,
       pg_catalog.has_schema_privilege(roles.oid,'auth','USAGE') as can_use_auth,
       pg_catalog.has_schema_privilege(roles.oid,'public','CREATE') as can_create_in_public,
       pg_catalog.has_schema_privilege(roles.oid,'auth','CREATE') as can_create_in_auth
from pg_catalog.pg_roles roles where roles.rolname in ('anon','authenticated');
select roles.rolname, owner_role.rolname as function_owner,
       pg_catalog.pg_has_role(roles.oid,p.proowner,'MEMBER') as can_assume_function_owner
from pg_catalog.pg_roles roles cross join pg_catalog.pg_proc p
join pg_catalog.pg_roles owner_role on owner_role.oid=p.proowner
where roles.rolname in ('anon','authenticated') and p.oid=pg_catalog.to_regprocedure('public.is_editor()');
select roles.rolname,
       pg_catalog.has_table_privilege(roles.oid,pg_catalog.to_regclass('public.editor_accounts'),'SELECT') as can_select_membership,
       pg_catalog.has_table_privilege(roles.oid,pg_catalog.to_regclass('public.editor_accounts'),'INSERT') as can_insert_membership,
       pg_catalog.has_table_privilege(roles.oid,pg_catalog.to_regclass('public.editor_accounts'),'UPDATE') as can_update_membership,
       pg_catalog.has_table_privilege(roles.oid,pg_catalog.to_regclass('public.editor_accounts'),'TRUNCATE') as can_truncate_membership
from pg_catalog.pg_roles roles where roles.rolname in ('anon','authenticated');
select case when acl.grantee=0 then 'PUBLIC' else pg_catalog.pg_get_userbyid(acl.grantee) end as grantee,
       acl.privilege_type, acl.is_grantable
from pg_catalog.pg_proc p cross join lateral pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) acl
where p.oid=pg_catalog.to_regprocedure('public.is_editor()');

select n.nspname, c.relname, c.relkind, c.relrowsecurity, c.relforcerowsecurity,
       pg_catalog.pg_get_userbyid(c.relowner) as owner,
       c.reltuples::bigint as estimated_rows, c.relacl
from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public','auth') and c.relkind in ('r','p') order by n.nspname,c.relname;
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_catalog.pg_policies
where schemaname='public' order by tablename,policyname;
select column_name,data_type from information_schema.columns
where table_schema='public' and table_name='editor_accounts' order by ordinal_position;
-- No row contents, password hashes, emails or JWTs are returned by this script.
select n.nspname,p.proname,pg_catalog.pg_get_function_identity_arguments(p.oid) as args
from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname like 'reading_studio_%';
rollback;
