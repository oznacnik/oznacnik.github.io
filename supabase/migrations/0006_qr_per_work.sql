-- Zjednodušení: jeden qr_index per dílo (work). Fyzické kopie nelze
-- v databázi rozlišit (všechny instance téhož díla mají stejné QR).
-- Pairing zastávka ↔ dílo se odvozuje z oznacnik_claims.work_ids.
--
-- Tracking per-stop tak NENÍ možný (scan QR vede k dílu, dílo může
-- být na víc zastávkách). Per-dílo tracking funguje plně.

-- Wipe stávající labels (přepárování by nedávalo smysl)
delete from oznacnik_qr_scans;
delete from oznacnik_qr_labels;

-- Drop sloupce které ztratily smysl
alter table oznacnik_qr_labels
  drop column if exists label_seq,
  drop column if exists stop_id,
  drop column if exists placed_at;

-- 1:1 vazba work_id ↔ qr_index
alter table oznacnik_qr_labels
  drop constraint if exists oznacnik_qr_labels_work_id_label_seq_key;
alter table oznacnik_qr_labels
  add constraint oznacnik_qr_labels_work_unique unique (work_id);

-- Drop zastaralé indexy
drop index if exists oznacnik_qr_labels_stop_idx;
