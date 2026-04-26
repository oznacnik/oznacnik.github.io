# Galerie Označník — Onboarding přihlášených autorů

## Kontext projektu

**Galerie Označník** je guerilla galerie využívající prázdné reklamní plochy tramvajových zastávek (označníků) v Praze  Každá zastávka má 2 označníky a tvoří jednu výstavní jednotku. Galerie je otevřená 24/7, vstup zdarma. Finisáž = okamžik, kdy DPP plochu vyklidí.

Provozovatel: Martin Tomek vystupující pod pseudonymem **Ptáček**.
Kontakt: `GalerieOznacnik@proton.me`

### Vizuální systém

- Inspirace: Moholy-Nagy — *Dynamik der Gross-Stadt* (1921–22), konstruktivismus, typografická skladba
- Primární barva: **DPP červená `#E3000B`**
- Typografie: **Helvetica Bold** (variant: Helvetica Neue Bold / Inter Bold jako fallback)
- Layout: konstruktivistický, ostré linky, blokové plochy, asymetrie, černá/bílá/červená paleta
- Web nesmí obsahovat instalační fotky (záměrně — galerie je veřejná, navštivte ji)

## Stav projektu

Open call **VÝZVA ZLOBIT** (FAMU varianta) / **OPEN CALL** (AVU/UMPRUM varianta) je uzavřený. Přihlášky dorazily. Tento balík materiálů slouží **přihlášeným autorům** — informuje je o dalších krocích a sbírá nezbytná data pro instalaci a web.

---

## Úkol pro Claude Code

Vytvořit dva oddělené, ale vizuálně sjednocené výstupy:

1. **PDF dokument** — informační „balíček" pro přihlášené (zaslán e-mailem)
2. **React formulář** — sběr odpovědí, deploy na hostovanou stránku galerie

Oba výstupy sdílejí stejný design system (DPP červená, Helvetica Bold, konstruktivistický layout).

---

## Výstup 1: PDF dokument

### Účel

Sdělit přihlášeným, že jsou přijati, a vysvětlit jim podmínky účasti, logistiku vernisáže a co je čeká. PDF obsahuje **pouze informace** — sběr dat probíhá přes formulář (viz Výstup 2).

### Struktura dokumentu

**Strana 1 — Titul**
- Velký nápis: `GALERIE OZNAČNÍK`
- Podtitul: ``PŘIJATO`
- Černá / DPP červená / bílá kompozice


**Strana 2 — Děkujeme & co se děje**
- Krátký text: děkujeme za přihlášku, jsi v programu výstavy
- Co bude následovat (3 kroky):
  1. Vyplň formulář (odkaz + QR kód)
  2. Připrav díla podle technických specifikací
  3. Dorazíš na společnou instalaci

**Strana 3 — Co je Galerie Označník**
- Stručná definice: guerilla galerie v reklamních rámech tramvajových zastávek
- Zastávka = 1 výstavní jednotka (2 označníky)
- 24/7 / vstup zdarma / délka výstavy určuje DPP

**Strana 4 — Disclaimer (důrazně)**
- **Je to guerilla.** Neoficiální, nepovolené, bez financování.
- **Materiál si hradí každý sám** tisk, 

- **Délku výstavy neurčujeme my.** DPP plochu vyklidí → to je finisáž.

**Strana 5 — Vernisáž = společná instalace**
- Sraz na společné instalaci, každý si obsadí svou zastávku sám
- Pomoc s instalací k dispozici (pokud o ni autor v formuláři požádá)
- Datum vernisáže určíme podle preferencí z formuláře - předpokald je 23-24.5 , je mozne je to bude na dva dny vzhledem k poctu prihhlasenych.

**Strana 6 — Přidělování míst**
- Algoritmus přidělí každému jednu zastávku (= 2 označníky)
- Co přesně do rámů dáš a jak to rozdělíš, je na tobě
- **Edice:** jedno dílo = jedna edice, ALE vzhledem k povaze street artu / printu lze jednu kopii (nebo více kopií jednoho motivu) **instalovat na více míst**

**Strana 7 — Technické specifikace**
- Rozměry označníků DPP - je to a3, s tim ze ram zastavky vezme 2 CM tisku .
- Doporučená gramáž / typ papíru

**Strana 8 — Co dostaneš zpět**
- Místo na webu galerie (volitelné)
- Dokumentace tvého díla
- Pomoc s instalací (volitelné)
- Záznam ve filmu / video-dokumentaci výstavy (volitelné)

**Strana 9 — Další kroky & deadline**
- Odkaz na formulář (URL + QR)
- **Deadline pro vyplnění formuláře:** TODO
- Kontakt: `GalerieOznacnik@proton.me`
- Patička: `Ptáček` / `2026`


- poznámka ptáčka k tomu, udělej to max na 3 stránky. 
### Technické požadavky PDF

- Formát: **A4**, na výšku
- Generováno z HTML/CSS přes **Playwright** nebo **Puppeteer** (preferováno — jednotný design system s webem)
a nebo generace jen SVG s tim že si to pak autor upraví v adobe ilusttator
- Vložené fonty (Helvetica fallback chain)
- Velikost souboru < 5 MB
- Výstup: `galerie-oznacnik-info-2026.pdf`

---

## Výstup 2: React formulář

### Účel

Sběr odpovědí od přihlášených. Hostovaný na webu galerie, odkazovaný z PDF (URL + QR kód v PDF směřují sem).

### Tech stack

- **React** + **Vite** (rychlý dev, snadný deploy)
- Styling: **Tailwind** (s custom DPP barvami) nebo **CSS modules** s vlastními proměnnými
- Validace: **react-hook-form** + **zod**
- Backend pro odeslání:
  - Varianta A: **Formspree** / **Basin** (zero-backend)
  - Varianta B: **vlastní endpoint** (Node.js, ukládá do JSON / posílá na ProtonMail)
  - **Doporučení: Varianta A** pro MVP — Martin si může změnit endpoint později

### Pole formuláře

```
1. Jméno autora (text, povinné)
   — pod jakým jménem si přihlášku poslal/a (ať si tě párujem) 

2. E-mail (text, povinné)

3. Pseudonym pro výstavu (text, volitelné)
   — pod čím chceš být uvedený/á? Necháš-li prázdné, použijeme jméno z bodu 1


4. Počet děl (number, 1–10, povinné)
   — kolik děl chceš vystavit?

- tady musi bejt zase napsane ze jeden autor vzdy dostane zastavku ci vice a jedna zastavka ma dva oznacniky. 

5. Stejné dílo na více místech? (radio, povinné)
   — [pouze unikáty] [klidně i kopie stejného motivu na více zastávek]

6. Cedulka u díla (radio, povinné)
   — [ano, chci cedulku] [ne, bez cedulky]

7. Web galerie (radio, povinné)
   — [chci být na webu] [nechci být na webu]

8. Bio / text na web (textarea, volitelné, zobrazit jen pokud bod 7 = ano)
   — krátký text o sobě / o díle (max 500 znaků)
   — pokud bod 7 = ne, pole se vůbec nezobrazí


9. Souhlas s filmovou dokumentací (checkbox, povinné — buď ano, nebo ne)

tady trochu prodat ze rzaroven bdueme vytvraet dokuemtnarni film kerdy bude zachycovat tu isntalaci.
   — [ano, můžu být ve filmu/video-dokumentaci]
   — [ne, nechci být zachycen]



11. Preferované datum vernisáže (multi-select / checkboxes, povinné)
23-24.4


13. Cokoliv dalšího (textarea, volitelné)
    — otázky, alergie na konkrétní zastávky, atd.
```

### UX požadavky

- **Single page**, žádné multi-step (přihlášených není moc, formulář není dlouhý)
- **Progress indicator** (vyplněno X/Y povinných polí)
- **Validace na blur**, ne při psaní
- **Po odeslání:** confirmation screen s shrnutím odpovědí + zopakováním data vernisáže (až bude známé) + kontaktem
- **Mobile-first** — autoři budou klikat z telefonu, hlavně po naskenování QR z PDF
- **Bez cookies, bez analytiky, bez trackerů** (Martinova hodnota — digitální suverenita)
- **Tmavý / světlý mód:** světlý jako default, tmavý jako optional toggle (volitelné)

### Vizuální požadavky

- Stejný design system jako PDF: DPP červená `#E3000B`, Helvetica Bold pro nadpisy, konstruktivistický layout
- Hlavička: velký nápis `GALERIE OZNAČNÍK` + podnadpis `FORMULÁŘ PRO PŘIJATÉ AUTORY`
- Forma: čisté blokové sekce, minimum dekorace, tlustý červený akcent
- Žádné stock ikony, žádné gradienty, žádné zaoblené rohy mimo nezbytné

### Deploy

- Doména: TODO (např. `galerie-oznacnik.cz` / subdoména na Martinově existujícím webu)
- HTTPS, žádný analytics
- Robots: `noindex` (formulář není pro veřejnost)

---

## Otevřené body — vyřešit před spuštěním

Body, které musí Martin doplnit do PDF i formuláře předtím, než se to rozešle:

- [ ] **Deadline pro vyplnění formuláře** (datum) - do patku 1.5.


---

## Adresářová struktura

```
galerie-oznacnik-onboarding/
├── plan.md                          # tento dokument
├── pdf/
│   ├── src/
│   │   ├── index.html               # HTML šablona PDF
│   │   ├── styles.css               # konstruktivistický styling
│   │   └── assets/                  # fonty, QR kód, případné ilustrace
│   ├── build.js                     # Playwright/Puppeteer renderer → PDF
│   └── output/
│       └── galerie-oznacnik-info-2026.pdf
└── form/
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   │   ├── FormField.tsx
    │   │   ├── RadioGroup.tsx
    │   │   └── ...
    │   ├── schema.ts                # zod schema
    │   └── styles/
    ├── package.json
    └── vite.config.ts
```

---

## Priority pro Claude Code

1. **Nejprve PDF** — Martin to chce poslat přihlášeným co nejdřív
2. **Pak formulář** — může jít na mírně pozdější deploy, ale URL musí být známé předtím, než se PDF rozešle (jinak QR nemá kam vést)
3. **Otevřené body výše** Martin doplní v paralelní iteraci
