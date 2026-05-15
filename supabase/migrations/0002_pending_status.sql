-- Přidává status 'pending' (modrá / "Rozděláno") = scouted bez detailů.
-- Použití: rychle označit "byl jsem tam, vrátím se doplnit fotku/poznámku".

-- 1) Rozšířit CHECK constraint o 'pending'
alter table oznacnik_annotations
  drop constraint if exists oznacnik_annotations_status_check;

alter table oznacnik_annotations
  add constraint oznacnik_annotations_status_check
  check (status in ('untouched','pending','scouted','ready','blocked'));

-- 2) Migrace dat: stávající 'scouted' bez fotky I bez poznámky → 'pending'
update oznacnik_annotations
set status = 'pending'
where status = 'scouted'
  and (photo_paths is null or array_length(photo_paths, 1) is null)
  and (notes is null or trim(notes) = '');
