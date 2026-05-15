-- ─────────────────────────────────────────────────────────────────────────
-- Scouting tool pro Galerii Označník
--
-- Sdílíme Supabase projekt s pixilate, proto všechny tabulky/bucket mají
-- prefix "oznacnik_" / "oznacnik-".
-- ─────────────────────────────────────────────────────────────────────────

-- READ-ONLY seed z GTFS (importováno scriptem scripts/seed-stops.ts)
create table if not exists oznacnik_stops (
  stop_id   text primary key,
  stop_name text not null,
  lat       double precision not null,
  lon       double precision not null
);

create index if not exists oznacnik_stops_name_idx
  on oznacnik_stops using gin (to_tsvector('simple', stop_name));

-- MUTABLE anotace, jeden řádek na zastávku
create table if not exists oznacnik_annotations (
  stop_id          text primary key references oznacnik_stops(stop_id) on delete cascade,
  oznacniku_total  int,
  oznacniku_usable int,
  status           text not null default 'untouched'
                    check (status in ('untouched','scouted','ready','blocked')),
  notes            text,
  photo_paths      text[] not null default '{}',
  updated_at       timestamptz not null default now()
);

create index if not exists oznacnik_annotations_status_idx
  on oznacnik_annotations (status);

create index if not exists oznacnik_annotations_updated_idx
  on oznacnik_annotations (updated_at desc);

-- Auto-update updated_at při UPDATE
create or replace function oznacnik_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists oznacnik_annotations_touch on oznacnik_annotations;
create trigger oznacnik_annotations_touch
  before update on oznacnik_annotations
  for each row execute function oznacnik_touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- RLS: tool je za obscure URL (bez auth), takže anon má plný přístup.
-- Pro produkci doporučuju přidat auth a omezit policies.
-- ─────────────────────────────────────────────────────────────────────────

alter table oznacnik_stops enable row level security;
alter table oznacnik_annotations enable row level security;

drop policy if exists oznacnik_stops_anon_read on oznacnik_stops;
create policy oznacnik_stops_anon_read on oznacnik_stops
  for select to anon using (true);

drop policy if exists oznacnik_stops_anon_write on oznacnik_stops;
create policy oznacnik_stops_anon_write on oznacnik_stops
  for insert to anon with check (true);

drop policy if exists oznacnik_annotations_anon_read on oznacnik_annotations;
create policy oznacnik_annotations_anon_read on oznacnik_annotations
  for select to anon using (true);

drop policy if exists oznacnik_annotations_anon_write on oznacnik_annotations;
create policy oznacnik_annotations_anon_write on oznacnik_annotations
  for all to anon using (true) with check (true);

-- ─────────────────────────────────────────────────────────────────────────
-- Storage bucket pro fotky zastávek.
-- Public = každý s URL může číst (interní tool, fotky nejsou tajné).
-- ─────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
  values ('oznacnik-scouting', 'oznacnik-scouting', true)
  on conflict (id) do nothing;

drop policy if exists oznacnik_scouting_anon_read on storage.objects;
create policy oznacnik_scouting_anon_read on storage.objects
  for select to anon
  using (bucket_id = 'oznacnik-scouting');

drop policy if exists oznacnik_scouting_anon_write on storage.objects;
create policy oznacnik_scouting_anon_write on storage.objects
  for insert to anon
  with check (bucket_id = 'oznacnik-scouting');

drop policy if exists oznacnik_scouting_anon_delete on storage.objects;
create policy oznacnik_scouting_anon_delete on storage.objects
  for delete to anon
  using (bucket_id = 'oznacnik-scouting');
