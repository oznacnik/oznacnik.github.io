import { NextResponse } from "next/server";

const DPP = "#E3000B";
const BLACK = "#000000";
const WHITE = "#FFFFFF";
const GRAY = "#333333";
const LIGHT = "#999999";

// A4 at 72dpi
const W = 595;
const H = 842;

const rows = [
  {
    num: "01",
    title: "CO",
    lines: [
      "Autory pro kolektivní výstavu v pražských tramvajových zastávkách.",
      "Každý autor dostane blok zastávek na jedné lince.",
      "Díla jsou za sklem, v ulici, pro všechny.",
      "Nekurátujeme. Co pošlete, to vystavíme.",
    ],
  },
  {
    num: "02",
    title: "FORMÁT",
    lines: [
      "A3 na šířku. Rozměr definován zastávkou.",
      "Doporučený papír 220 g/m² a více.",
      "Série, variace, nebo pokaždé něco jiného.",
    ],
  },
  {
    num: "03",
    title: "VÝBĚR",
    lines: [
      "Neinstalované práce budou přijaty všechny.",
      "Vybíráme jen kvůli kapacitě zastávek.",
    ],
  },
  {
    num: "04",
    title: "INSTALACE",
    lines: [
      "Datum bude upřesněno.",
      "Sejdeme se, projdeme trasu, každý nainstaluje svá díla.",
    ],
  },
];

function t(x: number, y: number, content: string, opts: {
  size?: number;
  weight?: string;
  fill?: string;
  family?: string;
  spacing?: string;
  decoration?: string;
} = {}) {
  const {
    size = 9,
    weight = "400",
    fill = GRAY,
    family = "Helvetica, Arial, sans-serif",
    spacing = "0",
    decoration = "none",
  } = opts;
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" letter-spacing="${spacing}" text-decoration="${decoration}">${content}</text>`;
}

function lines(x: number, startY: number, texts: string[], opts = {}) {
  return texts.map((text, i) => t(x, startY + i * 13, text, opts)).join("\n    ");
}

export async function GET() {
  // layout
  const heroH = 140;
  const blackBar = 6;
  const perexH = 74;
  const introH = 78;
  const bigBarH = 14;

  let y = 8; // after red bar top (8px)
  const heroY = y; y += heroH + blackBar; // 154
  const perexY = y; y += perexH + blackBar; // 234
  const introY = y; y += introH + bigBarH; // 326

  // rows: each ~68px
  const rowH = [82, 68, 56, 68];
  const rowY: number[] = [];
  for (const h of rowH) {
    rowY.push(y);
    y += h;
  }
  const afterRowsY = y; y += 4;
  const contactY = y; y += 90;
  const footerBarY = y; y += 6;
  const footerY = y;

  const numX = 6;
  const colX = 44;
  const colLine = 40;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">

  <!-- red bar top -->
  <rect x="1" y="0" width="${W - 2}" height="8" fill="${DPP}"/>

  <!-- hero -->
  <rect x="1" y="${heroY}" width="${W - 2}" height="${heroH}" fill="${WHITE}"/>
  ${t(colX, heroY + 12, "GALERIE OZNAČNÍK", { size: 7, fill: LIGHT, spacing: "2" })}
  ${t(37, heroY + 76, "VÝZVA", { size: 72, weight: "700", fill: BLACK, family: "Helvetica-Bold, Helvetica, Arial, sans-serif", spacing: "-3" })}
  ${t(37, heroY + 133, "ZLOBIT", { size: 72, weight: "700", fill: DPP, family: "Helvetica-Bold, Helvetica, Arial, sans-serif", spacing: "-3" })}

  <!-- black bar 1 -->
  <rect x="1" y="${heroY + heroH}" width="${W - 2}" height="${blackBar}" fill="${BLACK}"/>

  <!-- perex block -->
  <rect x="1" y="${perexY}" width="${W - 2}" height="${perexH}" fill="${BLACK}"/>
  ${t(38, perexY + 26, "VÝSTAVNÍ PROSTORY JSOU PRÁZDNÉ REKLAMNÍ RÁMEČKY", { size: 18, weight: "700", fill: WHITE, family: "Helvetica-Bold, Helvetica, Arial, sans-serif" })}
  ${t(38, perexY + 50, "NA PRAŽSKÝCH TRAMVAJOVÝCH ZASTÁVKÁCH.", { size: 18, weight: "700", fill: DPP, family: "Helvetica-Bold, Helvetica, Arial, sans-serif" })}

  <!-- black bar 2 -->
  <rect x="1" y="${perexY + perexH}" width="${W - 2}" height="${blackBar}" fill="${BLACK}"/>

  <!-- intro text -->
  <rect x="1" y="${introY}" width="${W - 2}" height="${introH}" fill="${WHITE}"/>
  ${lines(colX, introY + 14, [
    "Každý autor dostane blok zastávek. Díla jsou za sklem, v ulici, pro všechny.",
    "Bez honoráře, bez white cube. Tisk na vlastní náklady.",
    "Vernisáž je společná instalace. Projdeme trasu a nainstalujeme.",
  ], { size: 9, fill: GRAY })}

  <!-- big black bar -->
  <rect x="1" y="${introY + introH}" width="${W - 2}" height="${bigBarH}" fill="${BLACK}"/>

  <!-- rows -->
  ${rows.map((row, i) => {
    const ry = rowY[i];
    const rh = rowH[i];
    const numY = ry + rh * 0.58;
    return `
  <!-- row ${row.num} -->
  <rect x="1" y="${ry}" width="${W - 2}" height="${rh}" fill="${WHITE}"/>
  ${i > 0 ? `<line x1="1" y1="${ry}" x2="${W - 1}" y2="${ry}" stroke="${BLACK}" stroke-width="2"/>` : ""}
  <line x1="${colLine}" y1="${ry - 2}" x2="${colLine}" y2="${ry + rh}" stroke="${BLACK}" stroke-width="2"/>
  ${t(numX, numY, row.num, { size: 28, weight: "700", fill: DPP, family: "Helvetica-Bold, Helvetica, Arial, sans-serif" })}
  ${t(colX, ry + 14, row.title, { size: 8, weight: "700", fill: BLACK, spacing: "2" })}
  ${lines(colX, ry + 27, row.lines, { size: 9, fill: GRAY })}`;
  }).join("")}

  <!-- bar after rows -->
  <rect x="1" y="${afterRowsY}" width="${W - 2}" height="4" fill="${BLACK}"/>

  <!-- contact -->
  <rect x="1" y="${contactY}" width="${W - 2}" height="90" fill="${WHITE}"/>
  ${t(colX, contactY + 14, "PŘIHLÁŠKA", { size: 7, weight: "700", fill: LIGHT, spacing: "2" })}
  ${t(colX, contactY + 30, "Pošlete nám: jméno nebo pseudonym, náhled díla nebo série, kolik zastávek chcete obsadit.", { size: 9, fill: GRAY })}
  ${t(colX, contactY + 44, "Nemusíte mít hotová díla, stačí záměr a ukázka.", { size: 9, fill: GRAY })}
  ${t(colX, contactY + 62, "GalerieOznacnik@protonmail.com", { size: 14, weight: "700", fill: DPP, decoration: "underline", family: "Helvetica-Bold, Helvetica, Arial, sans-serif" })}
  ${t(colX, contactY + 78, "Deadline: 14. 4. 2026", { size: 9, weight: "700", fill: BLACK })}

  <!-- footer bar -->
  <rect x="1" y="${footerBarY}" width="${W - 2}" height="6" fill="${BLACK}"/>

  <!-- footer -->
  <rect x="1" y="${footerY}" width="${W - 2}" height="52" fill="${WHITE}"/>
  ${t(37, footerY + 42, "O", { size: 44, weight: "700", fill: DPP, family: "Helvetica-Bold, Helvetica, Arial, sans-serif" })}
  ${t(colX, footerY + 20, "oznacnik.github.io", { size: 7, fill: LIGHT, family: "Helvetica, Arial, sans-serif", spacing: "1" })}
  ${t(colX, footerY + 34, "PRAHA", { size: 7, fill: LIGHT, spacing: "2" })}

  <!-- red bar bottom -->
  <rect x="0" y="${footerY + 52}" width="${W}" height="8" fill="${DPP}"/>

</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": 'inline; filename="galerie-oznacnik-open-call.svg"',
    },
  });
}
