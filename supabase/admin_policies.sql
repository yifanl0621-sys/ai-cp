create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can read all generations" on public.generations;
create policy "Admins can read all generations"
on public.generations
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can read all billing records" on public.billing_records;
create policy "Admins can read all billing records"
on public.billing_records
for select
to authenticated
using (public.is_admin());
