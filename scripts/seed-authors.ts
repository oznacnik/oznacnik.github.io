/**
 * Seed authors + works z exportovaných CSV.
 *
 * Run:
 *   npx tsx scripts/seed-authors.ts
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv(path.join(process.cwd(), ".env.local"));

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY_ = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const AUTHORS_CSV =
  "/Users/martintomek/Library/Mobile Documents/com~apple~CloudDocs/Osobni_projekty/galeire/data/export_autoru.csv";

// Autoři z CSV které vyloučit (např. neúplná data které neřešíme)
const SKIP_SLUGS = new Set(["nela", "vavrecka"]);

// Manuální dodatky — autoři co v CSV chybí / mají neparsovatelnou strukturu
interface ManualAuthor {
  id: string;
  name: string;
  email?: string;
  annotation?: string;
  web_consent?: boolean;
  popisek_consent?: boolean;
  film_consent?: boolean;
  notes?: string;
  requested_stops?: number;
  works: { ord: number; title: string; year?: number; technique?: string }[];
}
// Nela & Vavrečka byli na SKIP listu (chyběla jim data v CSV). Přidáváme je
// jako manuál s placeholderem dílem, ať jim algoritmus vygeneruje QR popisky.
// Mají popisek_consent=false → labels budou blank ("GALERIE OZNAČNÍK").
const MANUAL_AUTHORS: ManualAuthor[] = [
  {
    id: "nela",
    name: "Nela",
    requested_stops: 1,
    works: [{ ord: 1, title: "zajíc" }],
    notes: "Z CSV jen 'zajíc' (neparsovatelné jako numerický seznam)",
  },
  {
    id: "vavrecka",
    name: "Vavrečka",
    requested_stops: 10,
    works: [{ ord: 1, title: "(bez názvu)" }],
    notes: "CSV bez seznamu děl, jen 10 zast. / 20 kopií",
  },
];

// ── Minimalistický CSV parser (umí quoted cells s escaped quotes) ─────
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(cell);
        cell = "";
      } else if (c === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else if (c === "\r") {
        // skip
      } else {
        cell += c;
      }
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length));
}

// ── Parse seznamu děl: "1. titul (technika, rok) | 2. titul | …" ────
interface ParsedWork {
  ord: number;
  title: string;
  year: number | null;
  technique: string | null;
}

function parseWorks(raw: string): ParsedWork[] {
  if (!raw || raw === "—" || raw === "(nevyplněno)") return [];
  const out: ParsedWork[] = [];
  // Rozděl podle " | " (separátor mezi díly)
  const parts = raw.split(/\s*\|\s*/);
  for (const part of parts) {
    // Strip "1. " prefix
    const m = part.match(/^(\d+)\.\s*(.+)$/);
    if (!m) continue;
    const ord = parseInt(m[1], 10);
    let rest = m[2].trim();
    // Extract optional "(...)" suffix
    let year: number | null = null;
    let technique: string | null = null;
    const paren = rest.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (paren) {
      rest = paren[1].trim();
      const meta = paren[2];
      // Najít rok 4-digit
      const yearMatch = meta.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) year = parseInt(yearMatch[0], 10);
      // Zbytek = technika (po odstranění roku a čárek)
      const techPart = meta.replace(/\b(19|20)\d{2}\b/, "").replace(/,/g, " ").trim();
      if (techPart) technique = techPart;
    }
    out.push({ ord, title: rest, year, technique });
  }
  return out;
}

async function main() {
  const text = fs.readFileSync(AUTHORS_CSV, "utf8");
  const rows = parseCsv(text);
  const header = rows[0];
  console.log(`CSV header: ${header.length} sloupců`);

  const idx = (name: string) => header.indexOf(name);
  const I = {
    soubor: idx("Soubor"),
    name: idx("Jméno"),
    email: idx("E-mail"),
    zastavek: idx("Zastávek"),
    works: idx("Seznam děl"),
    anotace: idx("Anotace autora"),
    web: idx("Web galerie"),
    popisek: idx("Popisek u díla"),
    film: idx("Film (souhlas)"),
    notes: idx("Poznámky"),
  };

  const authors: {
    id: string;
    name: string;
    email: string | null;
    annotation: string | null;
    web_consent: boolean;
    popisek_consent: boolean;
    film_consent: boolean;
    notes: string | null;
    requested_stops: number | null;
  }[] = [];
  const works: {
    id: string;
    author_id: string;
    ord: number;
    title: string;
    year: number | null;
    technique: string | null;
  }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const soubor = r[I.soubor]?.trim();
    if (!soubor) continue;
    const slug = soubor.replace(/\.md$/, "");
    if (SKIP_SLUGS.has(slug)) {
      console.warn(`  ⏭ ${slug}: skip (na SKIP listu)`);
      continue;
    }
    const name = r[I.name]?.trim();
    if (!name) {
      console.warn(`  ⚠ ${slug}: bez jména v CSV, přeskakuju (případně přidej do MANUAL_AUTHORS)`);
      continue;
    }
    const bool = (v: string) => v?.trim().toLowerCase() === "ano";
    const cleanText = (v: string) => {
      const t = v?.trim() ?? "";
      if (!t || t === "(nevyplněno)" || t === "—") return null;
      return t;
    };

    const zastavekRaw = r[I.zastavek]?.trim() ?? "";
    const zastavek = zastavekRaw && /^\d+$/.test(zastavekRaw) ? parseInt(zastavekRaw, 10) : null;

    authors.push({
      id: slug,
      name,
      email: cleanText(r[I.email]),
      annotation: cleanText(r[I.anotace]),
      web_consent: bool(r[I.web]),
      popisek_consent: bool(r[I.popisek]),
      film_consent: bool(r[I.film]),
      notes: cleanText(r[I.notes]),
      requested_stops: zastavek,
    });

    const parsed = parseWorks(r[I.works]);
    for (const w of parsed) {
      works.push({
        id: `${slug}-${String(w.ord).padStart(2, "0")}`,
        author_id: slug,
        ord: w.ord,
        title: w.title,
        year: w.year,
        technique: w.technique,
      });
    }
    console.log(
      `  ${slug.padEnd(20)} ${name.padEnd(30)} ` +
        `${String(zastavek ?? "?").padStart(2)} zast. · ${parsed.length} unikátních děl`
    );
  }

  // ── Přidej manuální autory ──
  for (const m of MANUAL_AUTHORS) {
    authors.push({
      id: m.id,
      name: m.name,
      email: m.email ?? null,
      annotation: m.annotation ?? null,
      web_consent: m.web_consent ?? false,
      popisek_consent: m.popisek_consent ?? false,
      film_consent: m.film_consent ?? false,
      notes: m.notes ?? null,
      requested_stops: m.requested_stops ?? null,
    });
    for (const w of m.works) {
      works.push({
        id: `${m.id}-${String(w.ord).padStart(2, "0")}`,
        author_id: m.id,
        ord: w.ord,
        title: w.title,
        year: w.year ?? null,
        technique: w.technique ?? null,
      });
    }
    console.log(
      `  ${m.id.padEnd(20)} ${m.name.padEnd(30)} ` +
        `${String(m.requested_stops ?? "?").padStart(2)} zast. · ${m.works.length} unikátních děl (manual)`
    );
  }

  console.log(`\nUpsert: ${authors.length} autorů, ${works.length} děl…`);

  const supabase = createClient(URL_, KEY_, { auth: { persistSession: false } });

  // Cleanup: smaž autory v SKIP listu (kdyby tam zbyli z předchozích seedů)
  if (SKIP_SLUGS.size > 0) {
    const { error: cleanupErr } = await supabase
      .from("oznacnik_authors")
      .delete()
      .in("id", [...SKIP_SLUGS]);
    if (cleanupErr) console.warn("Cleanup warning:", cleanupErr.message);
  }

  const { error: aErr } = await supabase
    .from("oznacnik_authors")
    .upsert(authors, { onConflict: "id" });
  if (aErr) {
    console.error("Authors upsert:", aErr);
    process.exit(1);
  }

  if (works.length > 0) {
    const { error: wErr } = await supabase
      .from("oznacnik_works")
      .upsert(works, { onConflict: "id" });
    if (wErr) {
      console.error("Works upsert:", wErr);
      process.exit(1);
    }
  }

  console.log(`✓ Seed kompletní.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
