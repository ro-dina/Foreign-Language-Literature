-- Run this in Supabase SQL Editor after Prisma has created the tables.

-- 1) Editor whitelist table (if it does not exist yet)
create table if not exists public.editor_accounts (
  "userId" uuid primary key,
  "createdAt" timestamptz not null default now()
);

alter table public.editor_accounts enable row level security;

-- 2) Reusable check function
create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.editor_accounts e
    where e."userId" = auth.uid()
  );
$$;

grant execute on function public.is_editor() to anon, authenticated;

-- 3) Helper: drop existing policies safely
drop policy if exists "editor_accounts_select_own" on public.editor_accounts;

drop policy if exists "works_read_all" on public.works;
drop policy if exists "works_write_editor" on public.works;
drop policy if exists "sections_read_all" on public.sections;
drop policy if exists "sections_write_editor" on public.sections;
drop policy if exists "sentences_read_all" on public.sentences;
drop policy if exists "sentences_write_editor" on public.sentences;
drop policy if exists "sentence_tokens_read_all" on public.sentence_tokens;
drop policy if exists "sentence_tokens_write_editor" on public.sentence_tokens;
drop policy if exists "sentence_grammar_read_all" on public.sentence_grammar;
drop policy if exists "sentence_grammar_write_editor" on public.sentence_grammar;
drop policy if exists "dictionary_entries_read_all" on public.dictionary_entries;
drop policy if exists "dictionary_entries_write_editor" on public.dictionary_entries;
drop policy if exists "sentence_progress_select_own" on public.sentence_progress;
drop policy if exists "sentence_progress_insert_own" on public.sentence_progress;
drop policy if exists "sentence_progress_update_own" on public.sentence_progress;
drop policy if exists "sentence_progress_delete_own" on public.sentence_progress;
drop policy if exists "weak_tokens_select_own" on public.weak_tokens;
drop policy if exists "weak_tokens_insert_own" on public.weak_tokens;
drop policy if exists "weak_tokens_update_own" on public.weak_tokens;
drop policy if exists "weak_tokens_delete_own" on public.weak_tokens;

-- 4) Enable RLS
alter table public.works enable row level security;
alter table public.sections enable row level security;
alter table public.sentences enable row level security;
alter table public.sentence_tokens enable row level security;
alter table public.sentence_grammar enable row level security;
alter table public.dictionary_entries enable row level security;
alter table public.sentence_progress enable row level security;
alter table public.weak_tokens enable row level security;

-- 5) Policies
create policy "editor_accounts_select_own"
on public.editor_accounts
for select
to authenticated
using ("userId" = auth.uid());

-- Content: read for all, write for editors
create policy "works_read_all"
on public.works
for select
to anon, authenticated
using (true);
create policy "works_write_editor"
on public.works
for all
to authenticated
using (public.is_editor())
with check (public.is_editor());

create policy "sections_read_all"
on public.sections
for select
to anon, authenticated
using (true);
create policy "sections_write_editor"
on public.sections
for all
to authenticated
using (public.is_editor())
with check (public.is_editor());

create policy "sentences_read_all"
on public.sentences
for select
to anon, authenticated
using (true);
create policy "sentences_write_editor"
on public.sentences
for all
to authenticated
using (public.is_editor())
with check (public.is_editor());

create policy "sentence_tokens_read_all"
on public.sentence_tokens
for select
to anon, authenticated
using (true);
create policy "sentence_tokens_write_editor"
on public.sentence_tokens
for all
to authenticated
using (public.is_editor())
with check (public.is_editor());

create policy "sentence_grammar_read_all"
on public.sentence_grammar
for select
to anon, authenticated
using (true);
create policy "sentence_grammar_write_editor"
on public.sentence_grammar
for all
to authenticated
using (public.is_editor())
with check (public.is_editor());

create policy "dictionary_entries_read_all"
on public.dictionary_entries
for select
to anon, authenticated
using (true);
create policy "dictionary_entries_write_editor"
on public.dictionary_entries
for all
to authenticated
using (public.is_editor())
with check (public.is_editor());

-- Per-user learning states
create policy "sentence_progress_select_own"
on public.sentence_progress
for select
to authenticated
using ("userId" = auth.uid());
create policy "sentence_progress_insert_own"
on public.sentence_progress
for insert
to authenticated
with check ("userId" = auth.uid());
create policy "sentence_progress_update_own"
on public.sentence_progress
for update
to authenticated
using ("userId" = auth.uid())
with check ("userId" = auth.uid());
create policy "sentence_progress_delete_own"
on public.sentence_progress
for delete
to authenticated
using ("userId" = auth.uid());

create policy "weak_tokens_select_own"
on public.weak_tokens
for select
to authenticated
using ("userId" = auth.uid());
create policy "weak_tokens_insert_own"
on public.weak_tokens
for insert
to authenticated
with check ("userId" = auth.uid());
create policy "weak_tokens_update_own"
on public.weak_tokens
for update
to authenticated
using ("userId" = auth.uid())
with check ("userId" = auth.uid());
create policy "weak_tokens_delete_own"
on public.weak_tokens
for delete
to authenticated
using ("userId" = auth.uid());

-- 6) Seed your editor account (replace with your UUID)
-- insert into public.editor_accounts ("userId") values ('YOUR_AUTH_USER_UUID')
-- on conflict ("userId") do nothing;
