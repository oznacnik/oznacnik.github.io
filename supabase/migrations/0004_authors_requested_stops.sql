-- Přidává sloupec requested_stops k autorům.
-- Tohle je KVÓTA: kolik zastávek autor požádal v přihlášce, nezávisle
-- na počtu unikátních děl. Vaculík má 1 dílo a 13 zastávek (88 kopií);
-- Nikol má 13 unikátních děl a 13 zastávek.

alter table oznacnik_authors
  add column if not exists requested_stops int;
