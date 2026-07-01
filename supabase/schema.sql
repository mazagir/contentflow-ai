-- ContentFlow AI — Schema Supabase
-- Proyecto: https://xavkxybiitkewjaxzkju.supabase.co
-- Ejecuta en: Supabase → SQL Editor → New query → Run

-- Perfiles de usuario (extiende auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro')),
  credits integer not null default 5,
  payment_method text not null default 'none' check (payment_method in ('stripe', 'paypal', 'none')),
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Historial de generaciones
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  niche text not null,
  content_type text not null,
  context text not null,
  tone text,
  engagement_lever text,
  content text,
  created_at timestamptz not null default now()
);

-- Perfil automático al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, plan, credits, payment_method)
  values (new.id, 'free', 5, 'none');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Acceso a tablas vía Data API
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on public.profiles to postgres, service_role;
grant all on public.generations to postgres, service_role;
grant select, update on public.profiles to authenticated;
grant select, insert on public.generations to authenticated;

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.generations enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "generations_select_own" on public.generations;
create policy "generations_select_own"
  on public.generations for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "generations_insert_own" on public.generations;
create policy "generations_insert_own"
  on public.generations for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create index if not exists generations_user_id_idx on public.generations(user_id);
