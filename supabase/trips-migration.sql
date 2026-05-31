-- Migration : séjours dynamiques + admin
-- Exécuter dans Supabase → SQL Editor (si schema.sql déjà exécuté)

-- Rôle admin sur les profils
alter table public.profiles add column if not exists is_admin boolean default false;

-- Table des séjours
create table if not exists public.trips (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  price numeric(10, 2) not null,
  image_url text not null,
  tag text default '',
  slug text unique not null,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.trips enable row level security;

-- Fonction : vérifier si l'utilisateur est admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Séjours : lecture publique (actifs uniquement)
drop policy if exists "Anyone read active trips" on public.trips;
create policy "Anyone read active trips"
  on public.trips for select
  using (is_active = true);

-- Séjours : admin voit tout
drop policy if exists "Admin read all trips" on public.trips;
create policy "Admin read all trips"
  on public.trips for select
  using (public.is_admin());

drop policy if exists "Admin insert trips" on public.trips;
create policy "Admin insert trips"
  on public.trips for insert
  with check (public.is_admin());

drop policy if exists "Admin update trips" on public.trips;
create policy "Admin update trips"
  on public.trips for update
  using (public.is_admin());

drop policy if exists "Admin delete trips" on public.trips;
create policy "Admin delete trips"
  on public.trips for delete
  using (public.is_admin());

-- Admin peut lire toutes les demandes
drop policy if exists "Admin read all requests" on public.travel_requests;
create policy "Admin read all requests"
  on public.travel_requests for select
  using (public.is_admin());

-- Admin peut modifier le statut des demandes
drop policy if exists "Admin update requests" on public.travel_requests;
create policy "Admin update requests"
  on public.travel_requests for update
  using (public.is_admin());

-- Admin peut lire tous les profils
drop policy if exists "Admin read all profiles" on public.profiles;
create policy "Admin read all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Trigger updated_at sur trips
drop trigger if exists trips_updated_at on public.trips;
create trigger trips_updated_at
  before update on public.trips
  for each row execute procedure public.set_updated_at();

-- Données initiales (ignorées si déjà présentes)
insert into public.trips (title, description, price, image_url, tag, slug, sort_order) values
  ('Omra Premium — Makkah & Madinah', '10 jours · Hôtel 5★ face au Haram · Guide inclus', 1890,
   'https://images.unsplash.com/photo-1591604120669-370153677687?w=600&q=80', 'Best-seller', 'omra', 1),
  ('Turquie — Istanbul & Cappadoce', '8 jours · Hôtels halal · Excursions culturelles', 799,
   'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&q=80', 'Famille', 'turquie', 2),
  ('Maldives — Resort halal-friendly', '7 jours · Plage privée · Spa & détente', 1450,
   'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80', 'Plage', 'maldives', 3),
  ('Maroc — Marrakech & Essaouira', '6 jours · Riad authentique · Cuisine locale halal', 549,
   'https://images.unsplash.com/photo-1580418827493-f2b062c0a640?w=600&q=80', 'Découverte', 'maroc', 4)
on conflict (slug) do nothing;

-- Définir votre compte comme admin (remplacez l'e-mail)
-- update public.profiles set is_admin = true where email = 'salah.mohamedpdg@gmail.com';
