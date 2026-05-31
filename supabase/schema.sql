-- HB Travel — Schéma Supabase
-- Exécuter dans : Supabase Dashboard → SQL Editor → New query

-- Profils utilisateurs
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  phone text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Demandes de voyage
create table if not exists public.travel_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  full_name text,
  phone text,
  email text,
  destination text not null,
  message text,
  status text default 'en_attente' check (status in ('en_attente', 'en_cours', 'traite', 'annule')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.travel_requests enable row level security;

-- Profil : lecture / mise à jour de son propre profil
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Demandes : CRUD sur ses propres demandes
create policy "Users read own requests"
  on public.travel_requests for select
  using (auth.uid() = user_id);

create policy "Users insert own requests"
  on public.travel_requests for insert
  with check (auth.uid() = user_id);

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Mise à jour updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
