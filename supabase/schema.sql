-- Execute no SQL Editor do projeto Supabase antes de publicar.
create table if not exists public.user_state (
  id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.user_state enable row level security;
create policy "Users manage their own training state" on public.user_state
  for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);
