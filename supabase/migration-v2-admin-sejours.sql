-- HB Travel — Migration v2 : séjours dynamiques + admin
-- Exécuter dans Supabase → SQL Editor (après schema.sql)

-- Rôle admin sur les profils
alter table public.profiles
  add column if not exists role text default 'user'
  check (role in ('user', 'admin'));

-- Séjours phares
create table if not exists public.sejours (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  price numeric(10, 2) not null,
  image_url text not null,
  tag text default 'Nouveau',
  slug text unique not null,
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Statuts demandes : accepter / rejeter
alter table public.travel_requests drop constraint if exists travel_requests_status_check;
alter table public.travel_requests add constraint travel_requests_status_check
  check (status in ('en_attente', 'accepte', 'rejete', 'en_cours', 'traite', 'annule'));

-- Fonction admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.sejours enable row level security;

-- Séjours : lecture publique (actifs) ou admin (tous)
drop policy if exists "Public read active sejours" on public.sejours;
create policy "Public read active sejours"
  on public.sejours for select
  using (active = true or public.is_admin());

drop policy if exists "Admin manage sejours" on public.sejours;
create policy "Admin manage sejours"
  on public.sejours for all
  using (public.is_admin())
  with check (public.is_admin());

-- Demandes : admin lit et modifie toutes les demandes
drop policy if exists "Admin read all requests" on public.travel_requests;
create policy "Admin read all requests"
  on public.travel_requests for select
  using (public.is_admin());

drop policy if exists "Admin update all requests" on public.travel_requests;
create policy "Admin update all requests"
  on public.travel_requests for update
  using (public.is_admin());

-- Admin lit tous les profils (pour afficher noms clients)
drop policy if exists "Admin read all profiles" on public.profiles;
create policy "Admin read all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Trigger updated_at séjours
drop trigger if exists sejours_updated_at on public.sejours;
create trigger sejours_updated_at
  before update on public.sejours
  for each row execute procedure public.set_updated_at();

-- Données initiales (ignorées si slug existe déjà)
insert into public.sejours (title, description, price, image_url, tag, slug, sort_order) values
  ('Omra Premium — Makkah & Madinah', '10 jours · Hôtel 5★ face au Haram · Guide inclus', 1890,
   'https://images.unsplash.com/photo-1579305796538-03268c05b65c?w=800&q=85&auto=format&fit=crop', 'Best-seller', 'omra', 1),
  ('Turquie — Istanbul & Cappadoce', '8 jours · Hôtels halal · Excursions culturelles', 799,
   'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=85&auto=format&fit=crop', 'Famille', 'turquie', 2),
  ('Maldives — Resort halal-friendly', '7 jours · Plage privée · Spa & détente', 1450,
   'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=85&auto=format&fit=crop', 'Plage', 'maldives', 3),
  ('Maroc — Marrakech & Essaouira', '6 jours · Riad authentique · Cuisine locale halal', 549,
   'https://images.unsplash.com/photo-1560769629-847638654886?w=800&q=85&auto=format&fit=crop', 'Découverte', 'maroc', 4)
on conflict (slug) do nothing;

-- ═══ Promouvoir votre compte en admin ═══
-- Remplacez l'e-mail par le vôtre :
-- update public.profiles set role = 'admin' where email = 'salah.mohamedpdg@gmail.com';
