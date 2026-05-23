-- Public display name (přezdívka, pseudonym) + attendance flag pro vernisáž.
--
-- display_name = co se ukazuje VEŘEJNĚ na /vystavy/vernisaz a v install UI.
--   Defaultně = name. Pro autory s pseudonymem (utop, DISKOteka77, …)
--   přepsat ručně přes update níže.
--
-- present = jestli je autor fyzicky na vernisáži. Algoritmus přiřazení
--   bere pouze present=true autory. Defaultně true; operátor pak v UI
--   odškrtne kdo nedorazil, případně dorazí.

alter table oznacnik_authors
  add column if not exists display_name text,
  add column if not exists present boolean not null default true;

-- Defaultně display_name = name (kdyby chyběl, fallback v UI)
update oznacnik_authors set display_name = name where display_name is null;

-- Override pro známé pseudonymy (real name v parens → pseudonym ven)
update oznacnik_authors set display_name = 'utop'
  where id = 'veronikagregotova';
-- DISKOteka77 už je na začátku name, jen oříznout real name z parens
update oznacnik_authors set display_name = 'DISKOteka77'
  where id = 'diskoteka';
