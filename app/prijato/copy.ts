// ─────────────────────────────────────────────────────────────────────────
// COPY — všechny texty formuláře PŘIJATO. Jediné místo k editaci textů.
// ─────────────────────────────────────────────────────────────────────────

export const COPY = {
  meta: {
    title: "Přijato — Galerie Označník",
  },

  hero: {
    kicker: "",
    line1: "PŘIJATO",
  
  },

  deadline: {
    label: "Deadline pro vyplnění",
    date: "pátek 1. 5. 2026",
  },

  perex: {
    headline: "Jsi v programu výstavy.",
    accent: "Vyplň formulář",
    },

  fields: {
    name: {
      num: "01",
      title: "Jméno",
      placeholder: "...",
      error: "Doplň jméno",
    },
    email: {
      num: "02",
      title: "E-mail",
      placeholder: "ahoj@example.com",
      error: "Vlož platný e-mail",
    },
    stops: {
      num: "03",
      title: "Kolik zastávek chceš obsadit?",
      subtitle: "1 zastávka = 2 označníky.",
      hint: "Konkrétní zastávky přidělí algoritmus. Limit není.",
      placeholder: "5",
      // Skloňování ZASTÁVKA / ZASTÁVKY / ZASTÁVEK podle čísla
      unitForms: {
        one: "ZASTÁVKA",
        few: "ZASTÁVKY",
        many: "ZASTÁVEK",
      },
      // {{slots}} = stops × 2; {{suffix}} = "" / "Y" / "Ů" pro OZNAČNÍK skloňování
      computedLabel: "= {{slots}} OZNAČNÍK{{suffix}}",
      error: "Zadej počet zastávek (číslo větší než 0)",
    },
    works: {
      num: "04",
      title: "Seznam děl",
      subtitle: "Stačí 1 motiv. Kopie jsou v pohodě.",
      hint: "U každého díla: název, rok, technika a počet kopií. Potřebujeme to kvůli popiskům, které dodáme. Vytiskneme jeden popisek na každý označník.",
      calloutWithStops:
        "Máš {{stops}} zastáv{{stopsSuffix}} = {{slots}} označník{{slotsSuffix}} k zaplnění. U každého díla zadej počet kopií, ať součet sedí.",
      calloutNoStops:
        "Jeden motiv můžeš vytisknout v libovolném počtu kopií a obsadit jím víc označníků. Nemusíš mít unikáty.",
      titleLabel: "Název",
      yearLabel: "Rok",
      techniqueLabel: "Technika",
      countLabel: "Počet ks",
      titlePlaceholder: "Bez názvu",
      yearPlaceholder: "2026",
      techniquePlaceholder: "Sítotisk",
      countPlaceholder: "1",
      addLabel: "+ Přidat další dílo",
      removeLabel: "× Odebrat",
      error: "Vyplň alespoň jedno dílo (název)",
      // Live total counter under the list:
      totalLabel: "CELKEM KOPIÍ",
      totalOk: "PŘESNĚ",
      totalShort: "CHYBÍ {{n}}",
      totalOver: "O {{n}} VÍC",
      totalNoStops: "doplň 03",
    },
    annotation: {
      num: "05",
      title: "Anotace autora",
      placeholder: "Tom je umělec širokého záběru…",
      maxLength:800,
    },
    web: {
      num: "06",
      title: "Web galerie",
      subtitle: "Jméno, anotace, díla.",
      hint: "Máme tě uvést na webu galerie?",
      yes: "Chci být na webu",
      no: "Nechci",
      error: "Vyber jednu možnost",
    },
    popisek: {
      num: "07",
      title: "Popisek u díla",
      subtitle: "Informační štítek vedle díla v rámu.",
      hint: "Standardní galerijní popisek: název, rok, technika, autor. Vytiskneme ho za tebe.",
      yes: "Ano, popisek u díla",
      no: "Bez popisku",
      error: "Vyber jednu možnost",
    },
    film: {
      num: "08",
      title: "Souhlas s filmovou dokumentací",
      subtitle: "Točíme dokument.",
      hint: "Zároveň s vernisáží natáčíme dokumentární film o vzniku výstavy. Záběry tvojí instalace a tvoje účasti se mohou objevit ve filmu.",
      yes: "Můžu být ve filmu",
      no: "Nechci být zachycen",
      error: "Vyber jednu možnost",
    },
    vernisage: {
      num: "09",
      title: "Preferované datum vernisáže",
      subtitle: " 23. - 24. 5. 2026.",
      hint: "Předpoklad víkend 23. / 24. 5. 2026. Finální harmonogram potvrdíme.",
      options: [
        { value: "any", label: "oba dny mi vyhovují" },
        { value: "2026-05-23", label: "sobota 23. 5. 2026" },
        { value: "2026-05-24", label: "neděle 24. 5. 2026" },
      ],
      error: "Vyber jeden termín",
    },
    notes: {
      num: "10",
      title: "Cokoliv dalšího",
      subtitle: "Volitelné.",
      placeholder: "…",
    },
  },

  progress: {
    label: "Vyplněno",
    of: "z",
    suffix: "povinných",
  },

  submit: {
    idle: "Odeslat",
    sending: "Odesílám…",
    error: "Něco se pokazilo. Zkus to znovu, nebo napiš na e-mail.",
    missing: "Chybí: ",
  },

  success: {
    eyebrow: "Hotovo",
    title1: "Díky.",
    title2: "Zařadíme tě.",
    body: "Tvoje odpovědi máme. Ozveme se po deadline (1. 5.) s konkrétní zastávkou a dalšími detaily k vernisáži. Pokud něco, piš na e-mail.",
    again: "vyplnit znovu",
  },

  contact: {
    label: "Kontakt",
    email: "GalerieOznacnik@proton.me",
    body: "Pokud máš jakoukoliv otázku, piš rovnou. Odpovídá Ptáček.",
  },
} as const;
