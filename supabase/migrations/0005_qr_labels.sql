-- QR popisky pro vernisáž.
--
-- Workflow:
-- 1) Vygenerujeme labels předem (každý popisek = 1 fyzický exemplář s QR)
--    pro autory s popisek_consent=true. stop_id je při generování NULL.
-- 2) Vytiskneme + nalepíme na rámy.
-- 3) Při claimu na zastávce uživatel naskenuje QR z popisku
--    → app updatuje stop_id pro daný qr_index.
-- 4) Veřejnost skenuje QR → /qr/{index} loguje scan a redirectuje.
--    Vidíme z jakého označníku se nejvíc skenovalo.

create table if not exists oznacnik_qr_labels (
  qr_index   bigint generated always as identity primary key,
  work_id    text not null references oznacnik_works(id) on delete restrict,
  author_id  text not null references oznacnik_authors(id) on delete restrict,
  -- label_seq: pro autora s 1 dílem × 26 fyzických exemplářů je seq 1..26.
  -- Pomáhá v PDF poznat "1 z 26", a v UI rozlišit fyzické exempláře.
  label_seq  int not null default 1,
  -- stop_id: nullable. Vyplní se ve chvíli kdy uživatel naskenuje QR
  -- na zastávce v install flow.
  stop_id    text references oznacnik_stops(stop_id) on delete set null,
  placed_at  timestamptz,
  created_at timestamptz not null default now(),
  unique (work_id, label_seq)
);

create index if not exists oznacnik_qr_labels_stop_idx
  on oznacnik_qr_labels(stop_id);
create index if not exists oznacnik_qr_labels_author_idx
  on oznacnik_qr_labels(author_id);

-- Log scanů — každý hit veřejností přidá řádek
create table if not exists oznacnik_qr_scans (
  id          bigint generated always as identity primary key,
  qr_index    bigint not null references oznacnik_qr_labels(qr_index) on delete cascade,
  scanned_at  timestamptz not null default now(),
  user_agent  text,
  referrer    text
);

create index if not exists oznacnik_qr_scans_qr_idx
  on oznacnik_qr_scans(qr_index);
create index if not exists oznacnik_qr_scans_time_idx
  on oznacnik_qr_scans(scanned_at desc);

-- RLS: open jako u ostatních oznacnik_* tabulek
alter table oznacnik_qr_labels enable row level security;
alter table oznacnik_qr_scans enable row level security;

drop policy if exists oznacnik_qr_labels_anon_all on oznacnik_qr_labels;
create policy oznacnik_qr_labels_anon_all on oznacnik_qr_labels
  for all to anon using (true) with check (true);

drop policy if exists oznacnik_qr_scans_anon_all on oznacnik_qr_scans;
create policy oznacnik_qr_scans_anon_all on oznacnik_qr_scans
  for all to anon using (true) with check (true);
