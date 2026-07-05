create extension if not exists pgcrypto;

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_name text not null,
  intro text not null,
  audience text not null,
  selling_points jsonb not null default '[]'::jsonb,
  channel text not null,
  input jsonb not null,
  output jsonb not null,
  status text not null default 'success',
  error_message text,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists generations_user_created_idx
on public.generations (user_id, created_at desc);

alter table public.generations enable row level security;

create policy "Users can read own generations"
on public.generations
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own generations"
on public.generations
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own generations"
on public.generations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
