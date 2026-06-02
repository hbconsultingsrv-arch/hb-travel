-- HB Travel — Migration v3 : avis modérés + type de réservation
-- Exécuter dans Supabase → SQL Editor (après migration-v2-admin-sejours.sql)

-- Les demandes distinguent une réservation libre d'un évènement en groupe.
alter table public.travel_requests
  add column if not exists booking_type text;

update public.travel_requests
set booking_type = 'reservation_libre'
where booking_type is null;

alter table public.travel_requests
  alter column booking_type set default 'reservation_libre',
  alter column booking_type set not null;

alter table public.travel_requests
  drop constraint if exists travel_requests_booking_type_check;

alter table public.travel_requests
  add constraint travel_requests_booking_type_check
  check (booking_type in ('reservation_libre', 'evenement_groupe'));

-- Avis clients soumis à validation avant publication.
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  full_name text,
  rating smallint not null check (rating between 0 and 5),
  comment text not null check (char_length(btrim(comment)) >= 10),
  status text not null default 'en_attente'
    check (status in ('en_attente', 'approuve', 'rejete')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  reviewed_at timestamptz
);

alter table public.reviews enable row level security;

-- Lecture publique uniquement des avis approuvés.
drop policy if exists "Public read approved reviews" on public.reviews;
create policy "Public read approved reviews"
  on public.reviews for select
  using (status = 'approuve');

-- Chaque utilisateur peut relire ses propres avis soumis.
drop policy if exists "Users read own reviews" on public.reviews;
create policy "Users read own reviews"
  on public.reviews for select
  using (auth.uid() = user_id);

-- Les utilisateurs connectés créent uniquement leurs propres avis en attente.
drop policy if exists "Users insert own pending reviews" on public.reviews;
create policy "Users insert own pending reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id and status = 'en_attente');

-- L'admin modère tous les avis.
drop policy if exists "Admin read all reviews" on public.reviews;
create policy "Admin read all reviews"
  on public.reviews for select
  using (public.is_admin());

drop policy if exists "Admin update reviews" on public.reviews;
create policy "Admin update reviews"
  on public.reviews for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin delete reviews" on public.reviews;
create policy "Admin delete reviews"
  on public.reviews for delete
  using (public.is_admin());

drop trigger if exists reviews_updated_at on public.reviews;
create trigger reviews_updated_at
  before update on public.reviews
  for each row execute procedure public.set_updated_at();
