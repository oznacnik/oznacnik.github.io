import { NextResponse } from "next/server";

const DPP = "#E3000B";
const BLACK = "#000000";
const WHITE = "#FFFFFF";
const GRAY = "#333333";
const LIGHT = "#888888";
const LIGHT2 = "#BBBBBB";
const LIGHT3 = "#CCCCCC";

// A4 at 96dpi
const W = 794;
const H = 1123;
const PX = 48; // horizontal padding

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function txt(
  x: number,
  y: number,
  content: string,
  opts: {
    size?: number;
    weight?: number;
    fill?: string;
    spacing?: string;
    decoration?: string;
    anchor?: string;
  } = {}
) {
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

const sections = [
  {
    num: "01",
    title: "CO",
    lines: [
      "Výstava v reklamních rámečcích na zastávkách jedné tramvajové linky. Každá",
      "zastávka je výstavní sál. Každý autor dostane blok zastávek po sobě. Celý",
      "úsek projdete pěšky nebo projedete tramvají.",
    ],
  },
  {
    num: "02",
    title: "FORMÁT DÍLA",
    lines: [
      "Cokoliv co je na papíře. Série, variace, nebo pokaždé něco jiného. Dodáte",
      "hotové tisky, nainstalujeme je společně.",
    ],
  },
  {
    num: "03",
    title: "VERNISÁŽ",
    lines: [
      "Společná instalace. Sejdeme se, projdeme trasu, každý nainstaluje svá díla",
      "do rámečků. Datum bude upřesněno.",
    ],
  },
  {
    num: "04",
    title: "ŽIVOTNOST",
    lines: [
      "Přibližně týden. Výstavu sundá DPP, počasí, nebo čas.",
    ],
  },
];

export async function GET() {
  const BAR = 4;

  // ── vertical layout ──
  let y = 0;

  // top red bar
  y += 8;

  // hero
  const heroY = y;
  y += 220;

  // thick black bar
  const bar1Y = y;
  y += BAR;

  // perex
  const perexY = y;
  y += 130;

  // thick black bar
  const bar2Y = y;
  y += BAR;

  // detail rows
  const NUM_COL = 70;
  const rowPadTop = 20;
  const bodySize = 13;
  const lineH = 18;
  const titleH = 22;
  const rowPadBot = 18;

  interface RowLayout { y: number; h: number }
  const rowLayouts: RowLayout[] = [];
  for (const sec of sections) {
    const rh = rowPadTop + titleH + sec.lines.length * lineH + rowPadBot;
    rowLayouts.push({ y, h: rh });
    y += rh;
  }

  // thick black bar
  const bar3Y = y;
  y += 6;

  // contact
  const contactY = y;
  y += 140;

  // thick black bar
  const bar4Y = y;
  y += 6;

  // footer row
  const footerY = y;
  y += 46;

  // thick black bar
  const bar5Y = y;
  y += 6;

  // bottom red bar
  const bottomY = y;

  // ── SVG ──
  const s: string[] = [];

  s.push(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${WHITE}"/>

  <!-- top red bar -->
  <rect y="0" width="${W}" height="8" fill="${DPP}"/>
`);

  // ── hero ──
  s.push(`
  ${txt(PX, heroY + 22, "GALERIE OZNAČNÍK — PRAHA", { size: 9, fill: LIGHT2, spacing: "2.5" })}
  ${txt(PX - 3, heroY + 100, "VÝZVA", { size: 96, weight: 900, fill: BLACK, spacing: "-5" })}
  ${txt(PX - 3, heroY + 190, "ZLOBIT", { size: 96, weight: 900, fill: DPP, spacing: "-5" })}
`);

  // ── bar1 ──
  s.push(`  <rect y="${bar1Y}" width="${W}" height="${BAR}" fill="${BLACK}"/>
`);

  // ── perex ──
  // Match PDF: 3 lines, very large bold text
  const perexLines = [
    "HLEDÁME AUTORY PRO KOLEKTIVNÍ",
    "VÝSTAVU V PRAŽSKÝCH TRAMVAJOVÝCH",
    "ZASTÁVKÁCH.",
  ];
  perexLines.forEach((line, i) => {
    s.push(`  ${txt(PX, perexY + 38 + i * 36, line, { size: 32, weight: 900, fill: BLACK, spacing: "-1.5" })}\n`);
  });

  // ── bar2 ──
  s.push(`  <rect y="${bar2Y}" width="${W}" height="${BAR}" fill="${BLACK}"/>
`);

  // ── section rows ──
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    const rl = rowLayouts[i];

    // horizontal line between rows
    if (i > 0) {
      s.push(`  <line x1="0" y1="${rl.y}" x2="${W}" y2="${rl.y}" stroke="${BLACK}" stroke-width="3"/>\n`);
    }
    // vertical separator
    s.push(`  <line x1="${NUM_COL}" y1="${rl.y}" x2="${NUM_COL}" y2="${rl.y + rl.h}" stroke="${BLACK}" stroke-width="3"/>\n`);

    // number
    const numY = rl.y + rl.h * 0.52 + 10;
    s.push(`  ${txt(PX - 14, numY, sec.num, { size: 40, weight: 900, fill: DPP, spacing: "-2" })}\n`);

    // title
    s.push(`  ${txt(NUM_COL + 20, rl.y + rowPadTop + 12, sec.title, { size: 14, weight: 900, fill: BLACK, spacing: "1.5" })}\n`);

    // body lines
    sec.lines.forEach((line, li) => {
      s.push(`  ${txt(NUM_COL + 20, rl.y + rowPadTop + titleH + 6 + li * lineH, line, { size: bodySize, weight: 400, fill: GRAY })}\n`);
    });
  }

  // ── bar3 ──
  s.push(`  <rect y="${bar3Y}" width="${W}" height="6" fill="${BLACK}"/>
`);

  // ── contact ──
  s.push(`
  ${txt(PX, contactY + 18, "CO POSLAT", { size: 9, fill: LIGHT, spacing: "2.5" })}
  ${txt(PX, contactY + 44, "Jméno nebo pseudonym, náhled díla nebo série, kolik zastávek", { size: 20, weight: 900, fill: BLACK, spacing: "-0.8" })}
  ${txt(PX, contactY + 66, "chcete obsadit.", { size: 20, weight: 900, fill: BLACK, spacing: "-0.8" })}

  ${txt(PX, contactY + 88, "KAM", { size: 9, fill: LIGHT, spacing: "2.5" })}
  ${txt(PX, contactY + 110, "GalerieOznacnik@protonmail.com", { size: 24, weight: 900, fill: DPP, decoration: "underline", spacing: "-0.5" })}

  ${txt(500, contactY + 88, "DEADLINE", { size: 9, fill: LIGHT, spacing: "2.5" })}
  ${txt(500, contactY + 110, "[DOPLŇ]", { size: 24, weight: 900, fill: LIGHT3, spacing: "-0.5" })}
`);

  // ── bar4 ──
  s.push(`  <rect y="${bar4Y}" width="${W}" height="6" fill="${BLACK}"/>
`);

  // ── footer ──
  s.push(`
  ${txt(PX, footerY + 28, "VERZE PRO TISK / SDÍLENÍ", { size: 9, fill: "#AAAAAA", spacing: "2" })}
  <rect x="${W - PX - 128}" y="${footerY + 12}" width="128" height="28" fill="none" stroke="${DPP}" stroke-width="3"/>
  ${txt(W - PX - 64, footerY + 31, "SVG z webu →", { size: 13, weight: 900, fill: DPP, anchor: "middle" })}
`);

  // ── bar5 ──
  s.push(`  <rect y="${bar5Y}" width="${W}" height="6" fill="${BLACK}"/>
`);

  // ── bottom red bar ──
  s.push(`  <rect y="${bottomY}" width="${W}" height="8" fill="${DPP}"/>
</svg>`);

  const svg = s.join("");

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": 'inline; filename="galerie-oznacnik-open-call-v2.svg"',
    },
  });
}
