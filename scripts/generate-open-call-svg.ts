import fs from "fs";
import path from "path";

const DPP = "#E3000B";
const BLACK = "#000000";
const WHITE = "#FFFFFF";
const GRAY = "#333333";
const LIGHT = "#999999";

const W = 595; // A4 width in pts
const H = 842; // A4 height in pts

const ITEMS = [
  { num: "01", title: "CO HLEDÁME", text: "Autory pro kolektivní výstavu v pražských tramvajových zastávkách. Každý autor dostane blok zastávek na jedné lince. Díla budou vystavena v reklamních rámečcích, za sklem, přímo v ulici." },
  { num: "02", title: "FORMÁT", text: "Papír, formát A3 (29,7 × 42 cm). Tisk, malba, linoryt. Médium je na vás. Série, variace, nebo pokaždé něco jiného. Dodáte hotové tisky, nainstalujeme je společně." },
  { num: "03", title: "INSTALACE", text: "Společná vernisáž. Projdeme trasu a každý nainstaluje svá díla do rámečků. Datum a trasa budou upřesněny." },
  { num: "04", title: "ŽIVOTNOST", text: "Přibližně týden. Výstavu sundá DPP, počasí, nebo čas. To je součást konceptu. Díla žijí ve veřejném prostoru a sdílejí jeho osud." },
];

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      lines.push(current.trim());
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

let y = 0;

// Build SVG groups
const groups: string[] = [];

// Red bar top
y = 0;
groups.push(`<g id="red-bar-top"><rect x="0" y="${y}" width="${W}" height="8" fill="${DPP}"/></g>`);
y += 8;

// Hero
const heroY = y;
groups.push(`<g id="hero">
  <rect x="0" y="${heroY}" width="${W}" height="140" fill="${WHITE}"/>
  <text x="36" y="${heroY + 20}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="7" font-weight="400" fill="${LIGHT}" letter-spacing="2" text-transform="uppercase">GALERIE OZNAČNÍK / PRAHA</text>
  <text x="36" y="${heroY + 90}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="80" font-weight="700" fill="${BLACK}" letter-spacing="-2">VÝZVA</text>
  <text x="36" y="${heroY + 135}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="80" font-weight="700" fill="${DPP}" letter-spacing="-2">ZLOBIT</text>
</g>`);
y = heroY + 145;

// Black bar
groups.push(`<g id="black-bar-1"><rect x="0" y="${y}" width="${W}" height="6" fill="${BLACK}"/></g>`);
y += 6;

// Perex block
const perexY = y;
groups.push(`<g id="perex">
  <rect x="0" y="${perexY}" width="${W}" height="100" fill="${BLACK}"/>
  <text x="36" y="${perexY + 30}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="${WHITE}" letter-spacing="-0.5">HLEDÁME AUTORY PRO KOLEKTIVNÍ VÝSTAVU</text>
  <text x="36" y="${perexY + 58}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="${WHITE}" letter-spacing="-0.5">V PRAŽSKÝCH TRAMVAJOVÝCH ZASTÁVKÁCH.</text>
  <text x="36" y="${perexY + 86}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="${DPP}" letter-spacing="-0.5">STAČÍ PAPÍR A NĚCO, CO CHCETE ŘÍCT.</text>
</g>`);
y = perexY + 100;

// Black bar
groups.push(`<g id="black-bar-2"><rect x="0" y="${y}" width="${W}" height="6" fill="${BLACK}"/></g>`);
y += 6;

// Intro text
const introY = y;
const intro1 = "Galerie Označník je galerie současného umění, jejíž výstavní prostory jsou prázdné reklamní";
const intro1b = "rámečky na pražských tramvajových zastávkách. Každý úsek linky je samostatná výstava.";
const intro2 = "Chystáme další výstavu a hledáme autory, kteří chtějí vystavit ve veřejném prostoru.";
const intro2b = "Bez galerie, bez vernisáže v bílém kubíku, bez poplatků. Stačí dílo na papíře a chuť ukrást";
const intro2c = "kousek města pro umění.";

groups.push(`<g id="intro-text">
  <rect x="0" y="${introY}" width="${W}" height="80" fill="${WHITE}"/>
  <text x="36" y="${introY + 18}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="9" font-weight="400" fill="${GRAY}">${intro1}</text>
  <text x="36" y="${introY + 32}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="9" font-weight="400" fill="${GRAY}">${intro1b}</text>
  <text x="36" y="${introY + 50}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="9" font-weight="400" fill="${GRAY}">${intro2}</text>
  <text x="36" y="${introY + 64}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="9" font-weight="400" fill="${GRAY}">${intro2b}</text>
  <text x="36" y="${introY + 78}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="9" font-weight="400" fill="${GRAY}">${intro2c}</text>
</g>`);
y = introY + 82;

// Black bar thin
groups.push(`<g id="black-bar-3"><rect x="0" y="${y}" width="${W}" height="3" fill="${BLACK}"/></g>`);
y += 3;

// Numbered rows
const numColW = 80;
const rowLineHeight = 14;

for (const item of ITEMS) {
  const textLines = wrapText(item.text, 75);
  const rowH = Math.max(60, 30 + textLines.length * rowLineHeight + 10);
  const rowY = y;

  const textElements = textLines
    .map((line, i) => `  <text x="${numColW + 18}" y="${rowY + 30 + i * rowLineHeight}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="9" font-weight="400" fill="${GRAY}">${line}</text>`)
    .join("\n");

  groups.push(`<g id="row-${item.num}">
  <rect x="0" y="${rowY}" width="${W}" height="${rowH}" fill="${WHITE}"/>
  <line x1="0" y1="${rowY}" x2="${W}" y2="${rowY}" stroke="${BLACK}" stroke-width="2"/>
  <line x1="${numColW}" y1="${rowY}" x2="${numColW}" y2="${rowY + rowH}" stroke="${BLACK}" stroke-width="2"/>
  <text x="6" y="${rowY + 40}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="48" font-weight="700" fill="${DPP}">${item.num}</text>
  <text x="${numColW + 18}" y="${rowY + 17}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="7.5" font-weight="700" fill="${BLACK}" letter-spacing="1.5">${item.title}</text>
${textElements}
</g>`);
  y = rowY + rowH;
}

// Bottom border of last row
groups.push(`<g id="black-bar-rows-bottom"><rect x="0" y="${y}" width="${W}" height="3" fill="${BLACK}"/></g>`);
y += 3;

// Contact section
const contactY = y;
groups.push(`<g id="contact">
  <rect x="0" y="${contactY}" width="${W}" height="100" fill="${WHITE}"/>
  <text x="36" y="${contactY + 18}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="7.5" font-weight="700" fill="${BLACK}" letter-spacing="1.5">PŘIHLÁŠKA</text>
  <text x="36" y="${contactY + 36}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="9" font-weight="400" fill="${GRAY}">Pošlete nám: jméno nebo pseudonym, náhled díla nebo série (foto/scan), kolik zastávek chcete</text>
  <text x="36" y="${contactY + 50}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="9" font-weight="400" fill="${GRAY}">obsadit. Nemusíte mít hotová díla, stačí záměr a ukázka.</text>
  <text x="36" y="${contactY + 76}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="18" font-weight="700" fill="${DPP}" text-decoration="underline">GalerieOznacnik@protonmail.com</text>
  <text x="36" y="${contactY + 94}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="11" font-weight="700" fill="${LIGHT}">Deadline: [DOPLNIT]</text>
</g>`);
y = contactY + 100;

// Black bar
groups.push(`<g id="black-bar-footer"><rect x="0" y="${y}" width="${W}" height="6" fill="${BLACK}"/></g>`);
y += 6;

// Footer
const footerY = y;
groups.push(`<g id="footer">
  <rect x="0" y="${footerY}" width="${W}" height="60" fill="${WHITE}"/>
  <text x="36" y="${footerY + 48}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="52" font-weight="700" fill="${DPP}">O</text>
  <text x="${W - 36}" y="${footerY + 28}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="7" font-weight="400" fill="${LIGHT}" letter-spacing="1.5" text-anchor="end">TRAMGALLERY.CZ</text>
  <text x="${W - 36}" y="${footerY + 42}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="7" font-weight="400" fill="${LIGHT}" letter-spacing="1.5" text-anchor="end">PRAHA</text>
</g>`);
y = footerY + 60;

// Red bar bottom
groups.push(`<g id="red-bar-bottom"><rect x="0" y="${y}" width="${W}" height="8" fill="${DPP}"/></g>`);
y += 8;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${y}" width="${W}" height="${y}">
${groups.join("\n")}
</svg>`;

const outPath = path.join(process.cwd(), "public/open-call.svg");
fs.writeFileSync(outPath, svg, "utf-8");
console.log(`SVG saved to ${outPath} (${W}x${y})`);
