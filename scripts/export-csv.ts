/**
 * Export scouting dat do CSV (Excel-friendly).
 *
 * Output: backups/scouting-export-{ISO}.csv
 *
 * Sloupce:
 *   stop_id, stop_name, lat, lon, status,
 *   oznacniku_total, oznacniku_usable, notes, photos_count, updated_at
 *
 * Defaultně exportuje JEN anotované (=indexované) zastávky.
 * Pro export všech (vč. untouched) přidej --all.
 *
 * Run:
 *   npx tsx scripts/export-csv.ts
 *   npx tsx scripts/export-csv.ts --all
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

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY_ = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL_ || !KEY_) {
  console.error("Chybí Supabase env vars v .env.local");
  process.exit(1);
}

const STATUS_LABELS: Record<string, string> = {
  untouched: "nezhodnoceno",
  pending: "rozdelano",
  scouted: "zhodnoceno",
  ready: "pripraveno",
  blocked: "nepouzitelne",
};

const exportAll = process.argv.includes("--all");

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // Standard CSV escape: pokud obsahuje quote / comma / newline → wrap do
  // dvojitých uvozovek a zdvojit interní uvozovky.
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(",");
}

async function main() {
  const supabase = createClient(URL_!, KEY_!, { auth: { persistSession: false } });

  console.log("Stahuji data…");

  const [stopsRes, annRes] = await Promise.all([
    supabase.from("oznacnik_stops").select("*").order("stop_name"),
    supabase.from("oznacnik_annotations").select("*"),
  ]);
  if (stopsRes.error) throw stopsRes.error;
  if (annRes.error) throw annRes.error;

  const annMap = new Map<string, {
    stop_id: string;
    oznacniku_total: number | null;
    oznacniku_usable: number | null;
    status: string;
    notes: string | null;
    photo_paths: string[];
    updated_at: string;
  }>();
  for (const a of annRes.data ?? []) annMap.set(a.stop_id, a);

  const all = stopsRes.data ?? [];
  const rows = exportAll
    ? all
    : all.filter((s) => annMap.has(s.stop_id));

  console.log(`Zastávek k exportu: ${rows.length} ${exportAll ? "(vše)" : "(jen anotované)"}`);

  const lines: string[] = [];
  lines.push(
    csvRow([
      "stop_id",
      "stop_name",
      "lat",
      "lon",
      "status",
      "oznacniku_total",
      "oznacniku_usable",
      "notes",
      "photos_count",
      "updated_at",
    ])
  );

  // Seřadit: nejdřív podle statusu (ready/pending/scouted nahoru), pak abecedně
  const statusOrder = ["ready", "pending", "scouted", "blocked", "untouched"];
  rows.sort((a, b) => {
    const aStatus = annMap.get(a.stop_id)?.status ?? "untouched";
    const bStatus = annMap.get(b.stop_id)?.status ?? "untouched";
    const ord = statusOrder.indexOf(aStatus) - statusOrder.indexOf(bStatus);
    if (ord !== 0) return ord;
    return a.stop_name.localeCompare(b.stop_name, "cs");
  });

  for (const s of rows) {
    const a = annMap.get(s.stop_id);
    const status = a?.status ?? "untouched";
    lines.push(
      csvRow([
        s.stop_id,
        s.stop_name,
        s.lat,
        s.lon,
        STATUS_LABELS[status] ?? status,
        a?.oznacniku_total ?? "",
        a?.oznacniku_usable ?? "",
        a?.notes ?? "",
        a?.photo_paths?.length ?? 0,
        a?.updated_at ?? "",
      ])
    );
  }

  const outDir = path.join(process.cwd(), "backups");
  fs.mkdirSync(outDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `scouting-export-${ts}.csv`;
  const outPath = path.join(outDir, filename);

  // BOM kvůli Excelu (správně zobrazí UTF-8 češtinu)
  fs.writeFileSync(outPath, "﻿" + lines.join("\n"), "utf8");

  console.log(`\n✓ ${rows.length} řádků`);
  console.log(`  → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
