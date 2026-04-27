import { NextResponse } from "next/server";

// A4 @ 96dpi
const W = 794;
const H = 1123;
const PX = 36;

const DPP = "#E3000B";
const BLACK = "#000000";
const WHITE = "#FFFFFF";
const GRAY = "#333333";
const LIGHT = "#888888";

const FORM_URL = "https://oznacnik.github.io/prijato";
const EMAIL = "GalerieOznacnik@proton.me";
const DEADLINE = "pátek 1. 5. 2026";

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface TxtOpts {
  size?: number;
  weight?: number;
  fill?: string;
  spacing?: string;
  decoration?: string;
  anchor?: "start" | "middle" | "end";
}

function txt(x: number, y: number, content: string, opts: TxtOpts = {}): string {
  const {
    size = 14,
    weight = 400,
    fill = GRAY,
    spacing = "0",
    decoration = "none",
    anchor = "start",
  } = opts;
  return `<text x="${x}" y="${y}" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" letter-spacing="${spacing}" text-decoration="${decoration}" text-anchor="${anchor}">${esc(content)}</text>`;
}

function lines(x: number, y: number, items: string[], opts: TxtOpts & { lh?: number } = {}): string {
  const lh = opts.lh ?? 18;
  return items.map((line, i) => txt(x, y + i * lh, line, opts)).join("\n  ");
}

// ── Bars / footer ─────────────────────────────────────
function topBars(): string {
  return `<rect y="0" width="${W}" height="8" fill="${DPP}"/>`;
}

function bottomBars(label: string, side: string): string {
  const fy = H - 36;
  return `
  <rect y="${H - 28}" width="${W}" height="6" fill="${BLACK}"/>
  ${txt(PX, fy + 9, label, { size: 8, fill: LIGHT, spacing: "1.6" })}
  ${txt(W - PX, fy + 9, side, { size: 8, fill: LIGHT, spacing: "1.6", anchor: "end" })}
  <rect y="${H - 8}" width="${W}" height="8" fill="${DPP}"/>`;
}

// ── Loud section: HUGE title (+ optional subtitle) + body lines ──
function loudSection(
  yTop: number,
  title: string,
  bodyLines: string[],
  opts: {
    titleSize?: number;
    titleColor?: string;
    bodySize?: number;
    bodyLh?: number;
    subtitle?: string;
  } = {}
): { svg: string; height: number } {
  const titleSize = opts.titleSize ?? 56;
  const titleColor = opts.titleColor ?? BLACK;
  const bodySize = opts.bodySize ?? 13;
  const bodyLh = opts.bodyLh ?? 19;
  const padTop = 16;
  const titleH = titleSize * 0.92;
  const subtitleH = opts.subtitle ? 28 : 0;
  const gap = 12;
  const padBot = 16;
  const h = padTop + titleH + subtitleH + gap + bodyLines.length * bodyLh + padBot;

  const subtitleSvg = opts.subtitle
    ? `\n  ${txt(PX, yTop + padTop + titleH + 18, opts.subtitle.toUpperCase(), {
        size: 13,
        weight: 700,
        fill: BLACK,
        spacing: "2.4",
      })}`
    : "";

  const svg = `
  <line x1="0" y1="${yTop}" x2="${W}" y2="${yTop}" stroke="${BLACK}" stroke-width="3"/>
  ${txt(PX, yTop + padTop + titleSize - 4, title.toUpperCase(), {
    size: titleSize,
    weight: 700,
    fill: titleColor,
    spacing: "-2",
  })}${subtitleSvg}
  ${lines(PX, yTop + padTop + titleH + subtitleH + gap + bodySize, bodyLines, {
    size: bodySize,
    weight: 400,
    fill: GRAY,
    lh: bodyLh,
  })}`;
  return { svg, height: h };
}

// ── Numbered step row: red number + title + body ──
function stepRow(
  yTop: number,
  num: string,
  title: string,
  bodyLines: string[]
): { svg: string; height: number } {
  const numColW = 90;
  const padTop = 18;
  const titleSize = 18;
  const titleH = titleSize + 4;
  const lineH = 19;
  const padBot = 20;
  const h = padTop + titleH + 12 + bodyLines.length * lineH + padBot;

  const numSize = 56;

  const svg = `
  <line x1="0" y1="${yTop}" x2="${W}" y2="${yTop}" stroke="${BLACK}" stroke-width="3"/>
  <line x1="${numColW}" y1="${yTop}" x2="${numColW}" y2="${yTop + h}" stroke="${BLACK}" stroke-width="3"/>
  ${txt(PX - 4, yTop + padTop + numSize - 6, num, {
    size: numSize,
    weight: 700,
    fill: DPP,
    spacing: "-2.5",
  })}
  ${txt(numColW + 16, yTop + padTop + titleSize - 2, title.toUpperCase(), {
    size: titleSize,
    weight: 700,
    fill: BLACK,
    spacing: "-0.4",
  })}
  ${lines(numColW + 16, yTop + padTop + titleH + 16, bodyLines, {
    size: 13,
    weight: 400,
    fill: GRAY,
    lh: lineH,
  })}`;

  return { svg, height: h };
}

// ── Page 1 ──────────────────────────────────────────
function page1(): string {
  let y = 8;
  const out: string[] = [topBars()];

  // hero
  out.push(`
  ${txt(PX, y + 64, "GALERIE OZNAČNÍK / PRAHA / 2026", { size: 9, fill: LIGHT, spacing: "2.4" })}
  ${txt(PX - 4, y + 168, "PŘI", { size: 110, weight: 700, fill: BLACK, spacing: "-4" })}
  ${txt(PX - 4, y + 268, "JATO.", { size: 110, weight: 700, fill: DPP, spacing: "-4" })}`);
  y += 290;

  // black perex
  out.push(`<rect y="${y}" width="${W}" height="6" fill="${BLACK}"/>`);
  y += 6;
  out.push(`
  <rect y="${y}" width="${W}" height="92" fill="${BLACK}"/>
  ${txt(PX, y + 36, "Děkujeme za přihlášku.", { size: 22, weight: 700, fill: WHITE, spacing: "-0.4" })}
  ${txt(PX, y + 66, "Jsi v programu kolektivní výstavy.", { size: 22, weight: 700, fill: DPP, spacing: "-0.4" })}`);
  y += 92;
  out.push(`<rect y="${y}" width="${W}" height="6" fill="${BLACK}"/>`);
  y += 6;

  // intro
  out.push(`
  ${txt(PX, y + 24, "CO BUDE NÁSLEDOVAT", { size: 9, weight: 700, fill: LIGHT, spacing: "2.4" })}
  ${lines(PX, y + 50, [
    "Tři kroky, které tě čekají. Detaily k podmínkám a vernisáži",
  ], { size: 13, fill: GRAY, lh: 19 })}`);
  y += 100;

  // 3 steps
  const steps = [
    {
      num: "01",
      title: "Vyplň formulář",
      body: ["Formulář obsahuje všechny podstatné informace pro instalaci."],
    },
    {
      num: "02",
      title: "Připrav díla",
      body: ["Připrav díla podle technických specifikací."],
    },
    {
      num: "03",
      title: "Dorazíš na vernisáž / instalaci",
      body: [
        "Společná instalace je zároveň vernisáž.",
        "Sejdeme se, projdeme trasu, každý si obsadí",
        "svou zastávku. Pomoc s instalací k dispozici, pokud o ni požádáš.",
      ],
    },
  ];
  for (const s of steps) {
    const r = stepRow(y, s.num, s.title, s.body);
    out.push(r.svg);
    y += r.height;
  }
  out.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${BLACK}" stroke-width="3"/>`);
  y += 26;


  out.push(bottomBars("Strana 1 / 3 / Přijato", "Galerie Označník / Praha"));
  return out.join("\n");
}

// ── Page 2 — Disclaimer / Zastávka ─────────────────
function page2(): string {
  let y = 8;
  const out: string[] = [topBars()];
  y += 36;

  // header
  out.push(`
  ${txt(PX, y, "CO BEREŠ NA SEBE", { size: 9, weight: 700, fill: LIGHT, spacing: "2.4" })}
  ${txt(PX - 2, y + 60, "DISCLAIMER", { size: 56, weight: 700, fill: BLACK, spacing: "-2" })}
  ${txt(PX - 2, y + 116, "ZASTÁVKA.", { size: 56, weight: 700, fill: DPP, spacing: "-2" })}`);
  y += 156;

  const r1 = loudSection(y, "Disclaimer", [
    "Je to guerilla. Neoficiální, bez financování.",
    "Materiál si hradí každý sám.",
    "Délku výstavy neurčujeme my, určuje ji DPP. Průměrná délka isntalace je týden.",
  ], {
    titleSize: 72,
    titleColor: DPP,
    subtitle: "Guerilla. Vlastní zodpovědnost.",
  });
  out.push(r1.svg);
  y += r1.height;

  const r2 = loudSection(y, "Zastávka", [
    "Tvůj výstavní prostor je zastávka. Označník je ten informační rámeček",
    "na zastávce, do kterého instalujeme.",
    "Jedna zastávka má dva označníky. Oba patří tobě.",
    "Můžeš si v formuláři říct o víc zastávek. Pak máš odpovídajícím",
    "způsobem víc označníků k zaplnění. Konkrétní zastávky přidělí algoritmus, který náhodně vybírá.",
  ], {
    titleSize: 56,
    subtitle: "1 zastávka = 2 označníky.",
  });
  out.push(r2.svg);
  y += r2.height;

  out.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${BLACK}" stroke-width="3"/>`);

  out.push(bottomBars("Strana 2 / 4 / Disclaimer / Zastávka", "Ptáček / 2026"));
  return out.join("\n");
}

// ── Page 3 — Kopie / Vernisáž / Film / Co potřebujeme ──
function page3(): string {
  let y = 8;
  const out: string[] = [topBars()];
  y += 36;

  // header
  out.push(`
  ${txt(PX, y, "JAK TO FUNGUJE", { size: 9, weight: 700, fill: LIGHT, spacing: "2.4" })}
  ${txt(PX - 2, y + 56, "VERNISÁŽ / FILM", { size: 44, weight: 700, fill: BLACK, spacing: "-1.6" })}
  ${txt(PX - 2, y + 100, "CO POTŘEBUJEME.", { size: 44, weight: 700, fill: DPP, spacing: "-1.6" })}`);
  y += 130;

  // 1. KOPIE / POČET (combined, kompaktní)
  const r1 = loudSection(y, "Kopie / Počet", [
    "Jeden motiv můžeš vytisknout ve více kopiích a rozmístit ho na víc",
    "označníků nebo víc zastávek po městě. Kopie jsou v pořádku.",
    "Je jedno, kolik chceš vystavit děl. Čím víc, tím líp.",
  ], {
    titleSize: 40,
    subtitle: "Čím víc, tím líp.",
  });
  out.push(r1.svg);
  y += r1.height;

  // 2. VERNISÁŽ
  const r2 = loudSection(y, "Vernisáž", [
    "Vernisáž koncipujeme jako procházku městem. Sejdeme se,",
    "projdeme trasu, každý si obsadí svou zastávku. Cestou jídlo a pití.",
    "Pomoc s instalací k dispozici, pokud o ni v formuláři požádáš.",
  ], {
    titleSize: 48,
    titleColor: DPP,
    subtitle: "Procházka, instalace, jídlo, pití.",
  });
  out.push(r2.svg);
  y += r2.height;

  // 3. FILM
  const r3 = loudSection(y, "Film", [
    "Zároveň s vernisáží natáčíme dokumentární film o vzniku výstavy.",
    "Záběry tvojí instalace a tvoje účasti se mohou objevit ve filmu.",
    "V formuláři odsouhlasíš, jestli chceš být zachycen, nebo ne.",
  ], {
    titleSize: 40,
    subtitle: "Točíme dokument.",
  });
  out.push(r3.svg);
  y += r3.height;

  // 4. CO POTŘEBUJEME
  const r4 = loudSection(y, "Co potřebujeme", [
    "Pokud chceš být na webu galerie a/nebo mít u díla cedulku,",
    "pošli nám: u každého díla název, rok, technika.",
    "K tomu krátkou anotaci autora (2 / 3 věty o tobě).",
    "Pošli e-mailem před vernisáží.",
  ], {
    titleSize: 40,
    subtitle: "Pokud chceš na web nebo cedulku.",
  });
  out.push(r4.svg);
  y += r4.height;

  out.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${BLACK}" stroke-width="3"/>`);

  // ── End-of-page banner with predicted date ──
  // Position it just above bottomBars (which start at H-28 black bar, H-8 red bar)
  const bannerH = 60;
  const bannerY = H - 28 - bannerH - 4;
  out.push(`
  <rect y="${bannerY}" width="${W}" height="${bannerH}" fill="${BLACK}"/>
  ${txt(PX, bannerY + 22, "PŘEDPOKLÁDANÝ TERMÍN VERNISÁŽE", { size: 10, weight: 700, fill: WHITE, spacing: "2.4" })}
  ${txt(PX, bannerY + 50, "Víkend 23. a 24. 5. 2026", { size: 22, weight: 700, fill: DPP, spacing: "-0.6" })}
  ${txt(W - PX, bannerY + 48, "potvrdíme dle preferencí z formuláře", { size: 10, fill: "#aaaaaa", spacing: "1.2", anchor: "end" })}`);

  out.push(bottomBars("Strana 3 / 4 / Vernisáž / Film / Co potřebujeme", "Ptáček / 2026"));
  return out.join("\n");
}

// ── Page 4 — Vyplň formulář ────────────────────────
function page4(): string {
  let y = 8;
  const out: string[] = [topBars()];
  y += 60;

  // hero
  out.push(`
  ${txt(PX, y + 18, "TVŮJ DALŠÍ KROK", { size: 9, fill: LIGHT, spacing: "2.4" })}
  ${txt(PX - 4, y + 100, "VYPLŇ", { size: 84, weight: 700, fill: BLACK, spacing: "-3" })}
  ${txt(PX - 4, y + 178, "FORMULÁŘ.", { size: 84, weight: 700, fill: DPP, spacing: "-3" })}`);
  y += 210;

  out.push(`<rect y="${y}" width="${W}" height="6" fill="${BLACK}"/>`);
  y += 6;
  out.push(`
  <rect y="${y}" width="${W}" height="80" fill="${BLACK}"/>
  ${txt(PX, y + 32, "Bez vyplněného formuláře", { size: 20, weight: 700, fill: WHITE, spacing: "-0.4" })}
  ${txt(PX, y + 60, "tě nezařadíme do plánu instalace.", { size: 20, weight: 700, fill: DPP, spacing: "-0.4" })}`);
  y += 80;
  out.push(`<rect y="${y}" width="${W}" height="6" fill="${BLACK}"/>`);
  y += 6;
  y += 28;

  // formulář URL
  out.push(`
  ${txt(PX, y, "FORMULÁŘ", { size: 9, weight: 700, fill: LIGHT, spacing: "2.4" })}
  ${txt(PX, y + 36, FORM_URL, { size: 24, weight: 700, fill: DPP, spacing: "-0.6", decoration: "underline" })}
  ${lines(PX, y + 64, [
    "Otevře se v prohlížeči, vyplnění zabere ~5 minut. Žádný účet, žádné cookies.",
    "Po odeslání ti vyskočí e-mail s předvyplněnou zprávou, jen ji odešleš.",
  ], { size: 13, fill: GRAY, lh: 19 })}`);
  y += 118;

  // deadline
  out.push(`
  <rect x="${PX}" y="${y}" width="${W - 2 * PX}" height="92" fill="none" stroke="${BLACK}" stroke-width="4"/>
  ${txt(PX + 18, y + 28, "DEADLINE PRO VYPLNĚNÍ", { size: 10, weight: 700, fill: DPP, spacing: "2" })}
  ${txt(PX + 18, y + 70, DEADLINE, { size: 32, weight: 700, fill: BLACK, spacing: "-1" })}`);
  y += 124;

  // kontakt
  out.push(`
  ${txt(PX, y, "JAKÁKOLIV OTÁZKA", { size: 9, weight: 700, fill: LIGHT, spacing: "2.4" })}
  ${txt(PX, y + 24, "Napiš rovnou na e-mail. Odpovídá Ptáček.", { size: 13, fill: GRAY })}
  ${txt(PX, y + 56, EMAIL, { size: 20, weight: 700, fill: BLACK, decoration: "underline", spacing: "-0.4" })}`);

  out.push(bottomBars("Strana 4 / 4 / Další kroky", "Ptáček / 2026"));
  return out.join("\n");
}

const PAGES: Record<string, () => string> = {
  "1": page1,
  "2": page2,
  "3": page3,
  "4": page4,
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pageParam = url.searchParams.get("page") ?? "1";
  const renderer = PAGES[pageParam] ?? page1;
  const inner = renderer();
  const filename = `galerie-oznacnik-prijato-${pageParam}.svg`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${WHITE}"/>
  ${inner}
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
