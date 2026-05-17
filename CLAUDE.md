# CLAUDE.md — Vernisáž 2026 install flow

**Účel souboru:** Definice flow, který se opakovaně chybně implementuje. Před
úpravou install logiky si tohle PŘEČTI.

---

## Physical flow (jak to vypadá na místě)

1. **Skupina přijde k zastávce** (např. Anděl).
2. **Operátor klikne CLAIM** → aplikace **náhodně** přidělí autora
   (vážený výběr, viz níže). **NIC víc CLAIM nedělá.**
3. **Autor řekne**, jaké dílo / díla z jeho seznamu chce na téhle zastávce
   instalovat. Tohle je rozhodnutí autora, ne algoritmu.
4. **Operátor zaškrtne** vybraná díla v aplikaci.
5. **Aplikace u každého zaškrtnutého díla ukáže QR #N** — konkrétní popisek,
   který má operátor najít v tištěném stohu.
6. **Operátor najde fyzické popisky** #N v stohu a nalepí je na označníky.
7. **Save** → propíše claim + spáruje QR popisky se zastávkou.

## Co CLAIM dělá (a NEdělá)

| | |
|---|---|
| CLAIM **dělá** | Náhodně vybere autora (vážený algoritmus, viz níže) |
| CLAIM **NEdělá** | Vybírat díla (to dělá autor IRL) |
| CLAIM **NEdělá** | Přiřazovat QR popisky (až po výběru díla) |
| CLAIM **NEdělá** | Vytvářet claim row v DB (až na Save) |

## Random algoritmus výběru autora

- Pool = autoři s `requested_stops > 0` a `claimedStops < requested_stops`
- Vyloučit **posledního přiřazeného** (avoid back-to-back)
- **Na první 3 claimy:** vyloučit `krsnajedy` + `terka` AND vyloučit
  malé autory (`requested_stops < 5`). Cíl: úvod vernisáže testuje
  flow na velkém autorovi (Nikol/Vaculík/Veronika/Vavrečka). Po 3.
  claimu se restrikce uvolní a malí mohou padnout.
- **Filter na velikost zastávky:** zastávka má proměnný počet označníků
  (1—6, default 2). Autor potřebuje aspoň `oznacniku_usable` volných
  labelů, ideálně **+2 navíc** ať mu zbyde aspoň na 1 další standardní
  zastávku. Když nikdo nesedí na strict rule, fallback: kdokoliv kdo
  aspoň vyplní tuhle. To zabraňuje absurditám typu „krys (4 labely)
  na Anděl (4 ozn) → vyčerpaná kvóta jedním stop, 2. stop ztracený".
- **Inverse weighting:** weight = `1 / remaining_labels`, malí autoři
  rychleji (po filtru velikosti)
- Random pick z váženého poolu

## Co se v UI ukazuje po CLAIM

Pro picknutého autora se vyrenderuje **seznam jeho fyzických QR popisků**
— každý vlastní řádek (ne deduplikovaný per dílo!). Pro Nikol se 13
unikátními díly × 2 kopiemi = 26 položek; pro Vaculíka 1 dílo × 26
kopiemi = 26 položek se stejným titulem; pro Alžbětu 4 díla × 1 = 4
položky.

Pool = autorovy labels kde `stop_id IS NULL` (= dostupné v stohu) +
labels kde `stop_id == aktuální zastávka` (= už paired sem v minulé
session, mohou se uvolnit). Labels paired na jinou zastávku v UI
nejsou (jsou „pryč ze stohu").

Každá položka: `ord · title · QR #N`. Klik toggluje výběr.

## Co se zaškrtnutím konkrétního popisku stane

1. Aplikace si přidá `qr_index` do lokálního setu vybraných.
2. UI změní styl položky (zaškrtnuto = černé pozadí).
3. Při odškrtnutí: odebere zpět.

Při **Save**:
- `UPDATE oznacnik_qr_labels SET stop_id = NULL WHERE qr_index IN (uvolněné)`
- `UPDATE oznacnik_qr_labels SET stop_id = ?, placed_at = now() WHERE qr_index IN (nově vybrané)`
- `UPSERT oznacnik_claims (stop_id, author_id, work_ids = [unikátní work_ids z vybraných])`

## Variabilní velikost zastávek

Některé zastávky mají 1, jiné 2, větší (Anděl, Hl. nádraží) až 4-6
označníků. `oznacnik_stops_annotations.oznacniku_usable` říká kolik.
**1 zastávka = 1 autor**, ale autor potřebuje labelů = počet ozn na
zastávce. Algoritmus filtru velikosti zajišťuje že velké zastávky
dostanou autory s dostatečným poolem.

Edge case: pokud má autor právě tolik labelů kolik je ozn na zastávce
(žádný spare), algoritmus ho NEvybere — nechá ho na menší. Až nezbývá
jiná možnost, vezme i jeho.

## Datový model

| Tabulka | Klíčové sloupce | Granularita |
|---|---|---|
| `oznacnik_stops` | stop_id | 1 row per zastávka (z GTFS) |
| `oznacnik_authors` | id, requested_stops, popisek_consent, web_consent | 1 per autor |
| `oznacnik_works` | id, author_id, ord, title | 1 per dílo |
| `oznacnik_qr_labels` | qr_index, work_id, author_id, label_seq, **stop_id (nullable)** | **1 per fyzický popisek** |
| `oznacnik_claims` | stop_id, author_id, work_ids[] | 1 per zastávka |
| `oznacnik_qr_scans` | qr_index, scanned_at, ua, referrer | 1 per scan |

**Pre-printed labels:** generator vytvoří `requested_stops × 2` popisků na
autora, distribuovaných přes jeho díla. Každý popisek má unikátní
`qr_index` (per-oznacnik tracking).

## Workflow nesmí být

NE: **CLAIM auto-přiřazuje konkrétní QR popisky stopu** — to bere autorovi
agenturu nad výběrem.

NE: **1 QR per dílo + N fyzických kopií totožného QR** — ztrácíme
per-oznacnik tracking. Každý fyzický popisek MUSÍ mít unikátní QR.

NE: **CLAIM tvoří claim row v DB** — vznikají claims bez děl. Claim se
zapíše až na Save.

## Migrace history (proč jsou tak rozsáhlé)

- 0001: scouting tables (stops, annotations, photos)
- 0002: status `pending` (modré scouted bez photo+note)
- 0003: authors, works, claims
- 0004: `requested_stops` column na authors
- 0005: `qr_labels` (per-physical-label, s `label_seq`, `stop_id`)
- 0006: omyl — sloučil labels na 1 per work (vrácenou v 0007)
- 0007: revert 0006 + restart sequence na 1

## Skip lists a manual entries

Některé CSV řádky nejdou parsovat (Nela má „zajíc" bez numerace,
Vavrečka nemá seznam děl). Tihle dva jsou v `SKIP_SLUGS` u CSV iterace
a přidáni manuálně přes `MANUAL_AUTHORS` v
[scripts/seed-authors.ts](scripts/seed-authors.ts) s placeholder dílem.

## Anonymní autoři

Autoři s `web_consent = false` (Terez Schrijversová, Nela, Vavrečka,
Vaculík dle CSV) se na public stránce `/vystavy/vernisaz` zobrazují
jako „Anonym 1/2/3" a jejich anotace se skryje. Zastávky jsou viditelné
(jen bez identifikace).

## Authors s `popisek_consent = false`

Vavrečka, Terez, Nela, Vaculík → jejich QR popisky jsou v PDF rendered
jako **blank** („GALERIE OZNAČNÍK" + QR + index, bez autor/dílo info).
QR funguje stejně — scan loguje a redirectne.


nikdy nepouzivej emoji!