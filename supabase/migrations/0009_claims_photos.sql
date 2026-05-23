-- Foto galerie per claim — operátor cvakne fotku při instalaci, propíše
-- se do public feedu na /vystavy/vernisaz.
-- Reuse bucket oznacnik-scouting (stejné public read + anon write policy).

alter table oznacnik_claims
  add column if not exists photo_paths text[] not null default '{}';
