-- ============================================================
--  PvP Tierlist — Datenbank
--  Im Supabase-Dashboard unter "SQL Editor" einfuegen und
--  auf "Run" klicken. Laesst sich gefahrlos mehrfach ausfuehren.
-- ============================================================

-- ---------- Spieler ----------
create table if not exists public.players (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  region     text,
  created_at timestamptz not null default now()
);

-- Namen sind eindeutig, egal wie sie geschrieben werden.
create unique index if not exists players_name_lower_idx
  on public.players (lower(name));

-- ---------- Platzierungen ----------
create table if not exists public.rankings (
  id         uuid primary key default gen_random_uuid(),
  kit        text not null,
  -- Muss zu placesPerKit in js/config.js passen.
  place      int  not null check (place between 1 and 15),
  player_id  uuid not null references public.players(id) on delete cascade,
  updated_at timestamptz not null default now(),

  -- Jeder Platz nur einmal pro Kit ...
  unique (kit, place),
  -- ... und jeder Spieler nur auf einem Platz pro Kit.
  unique (kit, player_id)
);

create index if not exists rankings_kit_idx on public.rankings (kit);

-- ============================================================
--  Zugriffsrechte (Row Level Security)
--  Lesen darf jeder. Schreiben darf ausschliesslich das eine
--  Admin-Konto — also nur, wer den PIN kennt. Selbst wer sich
--  ein eigenes Konto anlegt, kann nichts aendern.
--
--  Steht in js/config.js eine andere adminEmail, muss sie hier
--  unten genauso stehen.
-- ============================================================

alter table public.players  enable row level security;
alter table public.rankings enable row level security;

drop policy if exists "players_read"  on public.players;
drop policy if exists "players_write" on public.players;
drop policy if exists "rankings_read"  on public.rankings;
drop policy if exists "rankings_write" on public.rankings;

create policy "players_read"  on public.players
  for select to anon, authenticated using (true);

create policy "players_write" on public.players
  for all to authenticated
  using      ((auth.jwt() ->> 'email') = 'admin@tierlist.local')
  with check ((auth.jwt() ->> 'email') = 'admin@tierlist.local');

create policy "rankings_read"  on public.rankings
  for select to anon, authenticated using (true);

create policy "rankings_write" on public.rankings
  for all to authenticated
  using      ((auth.jwt() ->> 'email') = 'admin@tierlist.local')
  with check ((auth.jwt() ->> 'email') = 'admin@tierlist.local');

-- ============================================================
--  Live-Updates: Aenderungen erscheinen sofort bei allen,
--  ohne dass jemand neu laden muss.
-- ============================================================

alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.rankings;
