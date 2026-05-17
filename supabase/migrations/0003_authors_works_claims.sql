-- Autoři + jejich díla + claimy zastávek pro vernisáž.
-- Otevřená anon RLS (jako 0001 / 0002 — chráněno jen obscure URL tokenem).

-- ── Autoři ────────────────────────────────────────────────────────────
create table if not exists oznacnik_authors (
  id               text primary key,        -- slug bez .md (alzeba, diskoteka, …)
  name             text not null,
  email            text,
  annotation       text,                    -- bio
  web_consent      boolean default false,
  popisek_consent  boolean default false,
  film_consent     boolean default false,
  notes            text,
  created_at       timestamptz not null default now()
);

-- ── Díla ──────────────────────────────────────────────────────────────
create table if not exists oznacnik_works (
  id          text primary key,             -- "{author_id}-{ord:02}"
  author_id   text not null references oznacnik_authors(id) on delete cascade,
  ord         int not null,
  title       text not null,
  year        int,
  technique   text,
  created_at  timestamptz not null default now()
);
create unique index if not exists oznacnik_works_author_ord
  on oznacnik_works(author_id, ord);
create index if not exists oznacnik_works_author_idx
  on oznacnik_works(author_id);

-- ── Claimy: jeden řádek na zastávku ──────────────────────────────────
-- last-write-wins: druhý claim přepíše první (user explicitně OK s konfliktem)
create table if not exists oznacnik_claims (
  stop_id     text primary key references oznacnik_stops(stop_id) on delete cascade,
  author_id   text not null references oznacnik_authors(id) on delete restrict,
  work_ids    text[] not null default '{}',
  notes       text,
  claimed_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists oznacnik_claims_author_idx
  on oznacnik_claims(author_id);
create index if not exists oznacnik_claims_updated_idx
  on oznacnik_claims(updated_at desc);

-- Auto-update updated_at při UPDATE (sdílíme trigger funkci z 0001)
drop trigger if exists oznacnik_claims_touch on oznacnik_claims;
create trigger oznacnik_claims_touch
  before update on oznacnik_claims
  for each row execute function oznacnik_touch_updated_at();

-- ── RLS: anon má plný přístup ─────────────────────────────────────────
alter table oznacnik_authors enable row level security;
alter table oznacnik_works enable row level security;
alter table oznacnik_claims enable row level security;

drop policy if exists oznacnik_authors_anon_all on oznacnik_authors;
create policy oznacnik_authors_anon_all on oznacnik_authors
  for all to anon using (true) with check (true);

drop policy if exists oznacnik_works_anon_all on oznacnik_works;
create policy oznacnik_works_anon_all on oznacnik_works
  for all to anon using (true) with check (true);

drop policy if exists oznacnik_claims_anon_all on oznacnik_claims;
create policy oznacnik_claims_anon_all on oznacnik_claims
  for all to anon using (true) with check (true);
