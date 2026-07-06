create extension if not exists pgcrypto;

create table if not exists public.billing_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  plan_code text,
  billing_cycle text,
  amount_cents int,
  status text,
  created_at timestamptz not null default now(),
  stripe_checkout_session_id text unique,
  stripe_payment_intent text
);

create index if not exists billing_records_user_created_idx
on public.billing_records (user_id, created_at desc);

alter table public.billing_records enable row level security;

create policy "Users can read own billing records"
on public.billing_records
for select
to authenticated
using (auth.uid() = user_id);
