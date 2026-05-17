-- Vrátit se k modelu unikátní QR per fyzický popisek (per-oznacnik tracking).
-- Migrace 0006 byla špatně — sloučila labels na 1 řádek per work.
-- Teď: 1 řádek per (work, label_seq), každý s unikátním qr_index.
-- Sequence se restartuje na 1 ať jdeme od #001.

-- Wipe vše co závisí na qr_index
delete from oznacnik_qr_scans;
delete from oznacnik_qr_labels;

-- Drop sloučenou unique vazbu na work_id
alter table oznacnik_qr_labels
  drop constraint if exists oznacnik_qr_labels_work_unique;

-- Vrátit sloupce které 0006 odebrala
alter table oznacnik_qr_labels
  add column if not exists label_seq int not null default 1,
  add column if not exists stop_id text references oznacnik_stops(stop_id) on delete set null,
  add column if not exists placed_at timestamptz;

-- 1 řádek per (work, label_seq) — víc fyzických kopií téhož díla mají
-- různé label_seq a unikátní qr_index.
alter table oznacnik_qr_labels
  drop constraint if exists oznacnik_qr_labels_work_seq_unique;
alter table oznacnik_qr_labels
  add constraint oznacnik_qr_labels_work_seq_unique unique (work_id, label_seq);

create index if not exists oznacnik_qr_labels_stop_idx
  on oznacnik_qr_labels(stop_id);

-- Restart auto-increment sekvence na 1, ať tisk začíná #001
alter sequence oznacnik_qr_labels_qr_index_seq restart with 1;
