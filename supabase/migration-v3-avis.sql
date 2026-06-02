-- HB Travel — Migration v3 : avis clients avec modération admin
-- Exécuter dans Supabase → SQL Editor

create table if not exists public.avis (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  author_name text not null,
  sejour_id uuid references public.sejours on delete cascade,
  travel_request_id uuid references public.travel_requests on delete cascade,
  target_label text not null,
  rating int not null check (rating >= 1 and rating <= 5),
  message text not null,
  status text default 'en_attente' check (status in ('en_attente', 'approuve', 'refuse')),
  created_at timestamptz default now(),
  constraint avis_target check (
    (sejour_id is not null and travel_request_id is null) or
    (sejour_id is null and travel_request_id is not null)
  )
);

create unique index if not exists avis_user_sejour_idx
  on public.avis (user_id, sejour_id) where sejour_id is not null;

create unique index if not exists avis_user_request_idx
  on public.avis (user_id, travel_request_id) where travel_request_id is not null;

alter table public.avis enable row level security;

drop policy if exists "Users insert own avis" on public.avis;
create policy "Users insert own avis"
  on public.avis for insert
  with check (auth.uid() = user_id and status = 'en_attente');

drop policy if exists "Users read own avis" on public.avis;
create policy "Users read own avis"
  on public.avis for select
  using (auth.uid() = user_id);

drop policy if exists "Public read approved avis" on public.avis;
create policy "Public read approved avis"
  on public.avis for select
  using (status = 'approuve');

drop policy if exists "Admin read all avis" on public.avis;
create policy "Admin read all avis"
  on public.avis for select
  using (public.is_admin());

drop policy if exists "Admin update avis" on public.avis;
create policy "Admin update avis"
  on public.avis for update
  using (public.is_admin());
