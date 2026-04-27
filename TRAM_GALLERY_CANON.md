# GALERIE OZNAČNÍK — Canon dokumentace
> Stav: 1. dubna 2026. Tento dokument slouží jako kompletní přehled projektu pro konzultace, rozvoj obsahu a technická rozhodnutí.

---

## Co je Galerie Označník

Galerie Označník je galerie současného umění v Praze. Výstavní prostory jsou **prázdné reklamní rámečky na tramvajových zastávkách DPP**. Každý úsek tramvajové linky je samostatná výstava. Galerie nemá stálé sídlo — je rozptýlena po celém městě, v infrastruktuře každodenního pohybu.

Cestující projíždí galerií, aniž to ví. Nebo ví. To je na nich.

**Jízdenka DPP je vstupné.**

### Klíčové principy
- Galerie bez kurátora — otevřená komukoli
- Médium: reklamní rámečky na označnících zastávek (formát A3, případně A2)
- Díla se vkládají bez lepidla — za plastový kryt označníku
- Životnost výstavy: neurčitá, dokud DPP nebo čas díla neodstraní
- Kontakt: GalerieOznacnik@protonmail.com

---

## Web

**Technologie:** Next.js 16.2.1 · TypeScript · Tailwind CSS v4
**Repo:** 
**Deploy:** GitHub Pages → 
**Data:** Statická data v `lib/static-data.ts` (připraveno pro Firebase swap)

### Design systém
- Inspirace: Moholy-Nagy, konstruktivismus, DPP vizuální jazyk
- Font: system-ui / sans-serif, velmi tučný (font-weight: 900)
- Barva akcentu: **#E3000B** (DPP červená)
- Žádné zaoblené rohy, žádné stíny, žádné přechody
- Silné horizontální černé čáry jako strukturní prvek
- Typografie: masivní, uppercase, tight letter-spacing (-0.04em)

### Routes

| Route | Název | Popis |
|---|---|---|
| `/` | Výstavy | Homepage = seznam aktuálních výstav |
| `/archiv` | Archiv výstav | Proběhlé výstavy s počtem dní trvání |
| `/open-call` | Open Call | Výzva pro nové autory |
| `/o-galerii` | O galerii | Manifest + návštěva + každý může + postup instalace + kontakt |
| `/manual` | Manuál (PDF) | Print-optimalizovaná stránka pro export jako PDF |
| `/vystavy/[id]` | Detail výstavy | Jednotlivá výstava — kurátorský text, plán zastávek |

### Navigace (Nav)
Výstavy · Archiv · Open Call · O galerii

---

## Výstavy

### Datový model Exhibition

```typescript
{
  id: string
  title: string           // "LINKA 12: LEHOVEC — BALABENKA"
  subtitle?: string       // název výstavy, např. "Chomps"
  artist?: string         // jméno autora
  color: string           // HEX barva výstavy
  lineNumbers: number[]   // čísla linek (jedna nebo více)
  direction: string       // "směr Balabenka"
  startStationId: string
  endStationId: string
  status: "current" | "upcoming" | "past"
  openedAt: string        // ISO datum
  closedAt?: string       // ISO datum, undefined = stále probíhá
  curatorialText: string
  visitInfo: string
  createdAt: string
}
```

---

### Výstava 1: CHOMPS
**ID:** `ex-12-chomps`
**Autor:** Ptáček
**Název výstavy:** Chomps
**Linka:** 12
**Barva:** #E3000B (DPP červená)
**Úsek:** Lehovec → Balabenka
**Směr:** směr Balabenka
**Status:** current
**Zahájení:** 28. 3. 2026
**Počet zastávek:** 13 (všechny s instalací)

**Zastávky (v pořadí):**
1. Lehovec
2. Sídliště Hloubětín
3. Hloubětín
4. Starý Hloubětín
5. Vozovna Hloubětín
6. Nový Hloubětín
7. Kolbenova
8. Poštovská
9. Špitálská
10. Nádraží Vysočany
11. Poliklinika Vysočany
12. Divadlo Gong
13. Balabenka

**Kurátorský text:**
> Linka 12 na úseku Lehovec–Balabenka prochází Vysočany a Hloubětínem. Třináct zastávek, třináct rámečků.
>
> Výstava Chomps obsazuje volné reklamní rámečky podél celé mtrasy. Tisky formátu A3 jsou vloženy za plastový kryt označníku bez lepidla. Motiv se opakuje a variuje jako rytmus kol na kolejích.
>
> Díla existují dokud je město neodstraní.

**Jak navštívit:**
> Nastupte na tramvaj linky 12 na zastávce Lehovec, směr Balabenka. Díla jsou v reklamních rámečcích na označnících zastávek. Výstava končí na Balabence.

---

### Výstava 2: SCREENSHOTY Z HRY GARDEN
**ID:** `ex-3-garden`
**Autor:** Jamie Hann
**Název výstavy:** screenshoty z hry garden
**Linky:** 3, 14, 23 (sdílený koridor)
**Barva:** #1A7A3C (zelená)
**Úsek:** Lazarská → Florenc
**Směr:** směr Florenc
**Status:** current
**Zahájení:** 31. 3. 2026
**Počet zastávek:** 7 (všechny s instalací)

**Zastávky (v pořadí):**
1. Lazarská
2. Vodičkova
3. Václavské náměstí
4. Jindřišská
5. Masarykovo nádraží
6. Bílá labuť
7. Florenc

**Poznámka k vícero linkám:** Výstava není vázána na konkrétní linku ale na koridor zastávek. Linky 3, 14 a 23 jedou stejným úsekem — nastoupit lze na kteroukoli z nich.

**Kurátorský text:**
> Lazarská, Vodičkova, Václavské náměstí, Jindřišská, Masarykovo nádraží, Bílá labuť, Florenc. Sedm zastávek v centru Prahy — sdílený koridor linek 3, 14 a 23.
>
> Výstava screenshoty z hry garden přináší záznamy z digitální krajiny do fyzického prostoru zastávek. Tisky v reklamních rámečcích označníků.

**Jak navštívit:**
> Nastupte na linku 3, 14 nebo 23 na zastávce Lazarská. Jedou stejným koridorem — díla jsou na zastávkách podél trasy. Výstava končí na Florenci.

---

### Výstava 3: GOLDEN SHIT *(archiv)*
**ID:** `ex-17-namrep`
**Autor:** Matouš Holub
**Název výstavy:** Golden Shit
**Linka:** 17
**Barva:** #0057A8 (modrá)
**Úsek:** Bílá labuť → Jiráskovo náměstí
**Směr:** směr Průhonice
**Status:** past
**Zahájení:** 1. 3. 2026
**Ukončení:** 27. 3. 2026
**Trvání:** 26 dní
**Počet zastávek:** 7 (4 s instalací, 3 bez)

**Zastávky:**
1. Bílá labuť ✓
2. Náměstí Republiky ✗
3. Dlouhá třída ✓
4. Právnická fakulta ✗
5. Staroměstská ✓
6. Národní divadlo ✓
7. Jiráskovo náměstí ✗

**Kurátorský text:**
> Sedm zastávek podél Vltavy. Linka 17 kopíruje nábřeží od Starého Města přes Národní třídu k Jiráskovu náměstí.
>
> Výstava Golden Shit pracuje s motivem hodnoty a odpadku. Tisky jsou vloženy do volných reklamních rámečků bez lepidla.

**Jak navštívit:**
> Linka 17, směr Průhonice. Nastoupte na Bílé labuti nebo Náměstí Republiky. Výstava končí na Jiráskově náměstí.

---

## Texty stránek

### Homepage `/`

**Hero:**
> Praha — Galerie současného umění
> **GALERIE OZNAČNÍK**

**Perex:**
> Výstavní prostory galerie jsou prázdné reklamní rámečky na pražských tramvajových zastávkách. Každý úsek linky je samostatná výstava. Cestující projíždí galerií, aniž to ví. Jízdenka DPP je vstupné.

**Karta výstavy — hierarchie:**
1. Malé barevné čtverce s čísly linek (škálovatelné — 1 až N linek)
2. Jméno autora (malé, šedé)
3. Název výstavy (dominantní, uppercase)
4. Trasa · datum (malé, metadata)

---

### Archiv `/archiv`

**Hero:** Archiv výstav

**Řádek výstavy obsahuje:**
- Číslo linky (barevné)
- Autor + název
- Datum od–do
- Počet dní trvání (vpravo, velké šedé číslo)

---

### Open Call `/open-call`

**Hero:** OPEN / CALL

**Perex:**
> Hledáme autory pro kolektivní výstavu v pražských tramvajových zastávkách.

**01 — Co:**
> Výstava v reklamních rámečcích na zastávkách jedné tramvajové linky. Každá zastávka je výstavní sál. Každý autor dostane blok zastávek po sobě. Celý úsek projdete pěšky nebo projedete tramvají.

**02 — Formát díla:**
> Cokoliv co je na papíře. Série, variace, nebo pokaždé něco jiného. Dodáte hotové tisky, nainstalujeme je společně.

**03 — Vernisáž:**
> Společná instalace. Sejdeme se, projdeme trasu, každý nainstaluje svá díla do rámečků. Datum bude upřesněno.

**04 — Životnost:**
> Přibližně týden. Výstavu sundá DPP, počasí, nebo čas.

**Co poslat:**
> Jméno nebo pseudonym, náhled díla nebo série, kolik zastávek chcete obsadit.
> GalerieOznacnik@protonmail.com
> Deadline: [DOPLNIT]

---

### O galerii `/o-galerii`

#### Manifest
> Galerie Označník je galerie současného umění, jejíž výstavní prostory jsou prázdné reklamní rámečky na pražských tramvajových zastávkách.
>
> Každý úsek tramvajové linky je samostatná výstava. Galerie nemá stálé sídlo — je rozptýlena po celém městě, v infrastruktuře každodenního pohybu.
>
> Cestující projíždí galerií, aniž to ví. Nebo ví. To je na nich.

#### Informace (tabulka)
| | |
|---|---|
| Umělci | Ptáček, Matouš Holub, Jamie Hann |
| Médium | Paste-up, linoryt, tisk |
| Výstavní prostory | Reklamní rámečky na pražských tramvajových zastávkách |
| Vstupné | Zdarma (jízdenka DPP) |
| Otevírací doba | 0:00–24:00, denně |
| Lokalita | Praha, Česká republika |

#### Návštěva
**Otevírací doba:** 0:00–24:00 · Denně, tramvaje jezdí vždy
**Vstupné:** Zdarma · Součástí jízdného DPP

**Jak navštívit galerii:**
1. **Vyberte výstavu** — Na stránce Výstavy najdete aktuálně probíhající výstavy. Každá výstava je jeden úsek tramvajové linky.
2. **Nastupte na tramvaj** — Nastupte na uvedenou tramvajovou linku a jeďte v uvedeném směru. Galerie se rozkládá podél celého úseku.
3. **Projíždějte galerií** — Na každé zastávce s instalací najdete v reklamním rámečku dílo. Díla jsou označena v plánu výstavy.

#### Každý může
> Galerie Označník je otevřená galerie bez kurátora. Pokud je rámeček prázdný nebo obsahuje reklamu, je váš. **Stačí papír, šroubovák a něco, co chcete říct.**

#### Formáty rámečků
| Formát | Šířka | Výška | Poznámka |
|---|---|---|---|
| A3 | 29,7 cm | 42,0 cm | Nejčastější formát |
| A2 | 42,0 cm | 59,4 cm | Formát náhradní autobusové dopravy |

#### Postup instalace
1. **Najděte prázdný rámeček** — Ne každý rámeček je volný. Hledejte ty, kde není nic, nebo kde je stará reklama. Nikdy nepřelepujte informace o mimořádných výlukách nebo změnách v dopravě. Ty tam jsou pro lidi, kteří je potřebují.
2. **Připravte dílo** — Formát A3 (29,7 x 42,0 cm). Papír gramáže kolem 220 g/m². Drží tvar, nevlní se, vejde se za plastový kryt. Tenčí papír se kroutí, tlustší nejde zasunout. Tiskněte, malujte, tiskněte z lina. Médium je na vás.
3. **Odšroubujte rámeček** — Rámečky jsou zajištěné šrouby s bitem [TBD]. Odšroubujte, opatrně sejměte plastový kryt. Za ním je prostor kam se vkládá papír.
4. **Vložte a zašroubujte zpět** — Papír zasuňte za plastový kryt do slotu. Nasaďte kryt zpět a zašroubujte. Zastávku nechte tak, jak jste ji našli. Žádné stopy, žádný nepořádek. Dílo je za sklem, chráněné před deštěm.
5. **Zdokumentujte** — Vyfoťte instalaci. Pokud chcete dílo zařadit do programu Galerie Označník, napište nám název zastávky, linku, datum a fotku.

#### Jedno pravidlo
> Respektujte ostatní. Pokud je v rámečku dílo někoho jiného, najděte prázdný. A nikdy nepřekrývejte provozní informace DPP. Výluky, změny tras, mimořádnosti. Ty tam jsou pro cestující, ne pro nás.

#### Kontakt
> Pošlete nám: název zastávky, číslo linky, datum instalace, fotku. Zařadíme vás do aktuální výstavy.
> GalerieOznacnik@protonmail.com

---

## Otevřené otázky / TODO

- **Bit na šrouby** — sekce postup má `[TBD]` pro typ bitu šroubů rámečků
- **Deadline Open Call** — `[DOPLNIT]` v `/open-call`
- **Firebase** — data jsou zatím statická v `lib/static-data.ts`, připraveno na swap za Firebase
- **GH Pages** — deploy funguje přes GitHub Actions (`STATIC_EXPORT=true`)
- **Admin** — existuje `/admin` route pro správu výstav (skrytá z navigace)

---

## Kontakt

GalerieOznacnik@protonmail.com
