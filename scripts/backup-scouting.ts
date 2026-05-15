/**
 * Záloha scouting dat ze Supabase do lokálního adresáře.
 *
 * Stáhne:
 *   - všechny stops (oznacnik_stops)
 *   - všechny anotace (oznacnik_annotations)
 *   - všechny fotky z bucketu oznacnik-scouting
 *
 * Output: backups/scouting-{ISO}/
 *   stops.json          — všechny zastávky
 *   annotations.json    — všechny anotace
 *   photos/{stop_id}/   — soubory fotek pod jejich originálním klíčem
 *   summary.json        — meta: timestamp, počty, velikosti
 *
 * Run:
 *   npx tsx scripts/backup-scouting.ts
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

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL || !KEY) {
  console.error("Chybí Supabase env vars v .env.local");
  process.exit(1);
}

const BUCKET = "oznacnik-scouting";
const ROOT = path.join(process.cwd(), "backups");

interface Stop {
  stop_id: string;
  stop_name: string;
  lat: number;
  lon: number;
}
interface Annotation {
  stop_id: string;
  oznacniku_total: number | null;
  oznacniku_usable: number | null;
  status: string;
  notes: string | null;
  photo_paths: string[];
  updated_at: string;
}

async function main() {
  const supabase = createClient(URL!, KEY!, { auth: { persistSession: false } });

  // Timestamp pro adresář (ISO bez dvojteček aby fungoval na všech FS)
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(ROOT, `scouting-${ts}`);
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`Cíl: ${outDir}`);

  // ── Stops ────────────────────────────────────────────
  console.log("\n[1/3] Stahuji stops…");
  const { data: stops, error: stopsErr } = await supabase
    .from("oznacnik_stops")
    .select("*")
    .order("stop_name");
  if (stopsErr) throw stopsErr;
  const stopsArr = (stops ?? []) as Stop[];
  fs.writeFileSync(path.join(outDir, "stops.json"), JSON.stringify(stopsArr, null, 2));
  console.log(`  ✓ ${stopsArr.length} stops → stops.json`);

  // ── Annotations ──────────────────────────────────────
  console.log("\n[2/3] Stahuji anotace…");
  const { data: anns, error: annErr } = await supabase
    .from("oznacnik_annotations")
    .select("*")
    .order("updated_at", { ascending: false });
  if (annErr) throw annErr;
  const annsArr = (anns ?? []) as Annotation[];
  fs.writeFileSync(path.join(outDir, "annotations.json"), JSON.stringify(annsArr, null, 2));
  console.log(`  ✓ ${annsArr.length} anotací → annotations.json`);

  // ── Photos ───────────────────────────────────────────
  console.log("\n[3/3] Stahuji fotky…");
  const photosDir = path.join(outDir, "photos");
  fs.mkdirSync(photosDir, { recursive: true });

  const allPaths = new Set<string>();
  for (const a of annsArr) for (const p of a.photo_paths ?? []) allPaths.add(p);
  const pathsArr = [...allPaths];
  console.log(`  ${pathsArr.length} fotek k stažení`);

  let okCount = 0;
  let failCount = 0;
  let totalBytes = 0;
  for (let i = 0; i < pathsArr.length; i++) {
    const remotePath = pathsArr[i];
    const localPath = path.join(photosDir, remotePath);
    fs.mkdirSync(path.dirname(localPath), { recursive: true });

    if (fs.existsSync(localPath)) {
      // skip — už máme
      okCount++;
      totalBytes += fs.statSync(localPath).size;
      continue;
    }

    const { data: blob, error: dlErr } = await supabase.storage
      .from(BUCKET)
      .download(remotePath);
    if (dlErr || !blob) {
      console.warn(`  ✗ ${remotePath}: ${dlErr?.message ?? "no data"}`);
      failCount++;
      continue;
    }
    const buf = Buffer.from(await blob.arrayBuffer());
    fs.writeFileSync(localPath, buf);
    totalBytes += buf.length;
    okCount++;
    if ((i + 1) % 10 === 0 || i === pathsArr.length - 1) {
      console.log(`  ${i + 1}/${pathsArr.length}`);
    }
  }

  // ── Summary ──────────────────────────────────────────
  const summary = {
    backup_at: new Date().toISOString(),
    counts: {
      stops: stopsArr.length,
      annotations: annsArr.length,
      photos_ok: okCount,
      photos_failed: failCount,
    },
    photos_total_bytes: totalBytes,
    photos_total_mb: Math.round((totalBytes / 1024 / 1024) * 100) / 100,
    supabase_url: URL,
    bucket: BUCKET,
  };
  fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));

  console.log("\n─────────────────────────────────────");
  console.log(`✓ Záloha hotová`);
  console.log(`  stops:       ${summary.counts.stops}`);
  console.log(`  annotations: ${summary.counts.annotations}`);
  console.log(`  photos:      ${summary.counts.photos_ok} OK${failCount > 0 ? `, ${failCount} FAILED` : ""}`);
  console.log(`  velikost:    ${summary.photos_total_mb} MB`);
  console.log(`  cíl:         ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
