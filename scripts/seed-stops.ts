/**
 * Seed Supabase tabulky `oznacnik_stops` z pid/data/tram-data.json.
 *
 * Run:
 *   npx tsx scripts/seed-stops.ts
 *
 * Vyžaduje NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY v .env.local.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Načti .env.local manuálně (Node nečte sám)
function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv(path.join(process.cwd(), ".env.local"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Chybí Supabase env vars v .env.local");
  process.exit(1);
}

const TRAM_DATA = "/Users/martintomek/.gemini/antigravity/scratch/pid/data/tram-data.json";

interface RawStop {
  stop_id: string;
  stop_name: string;
  lat: number;
  lon: number;
}

async function main() {
  console.log(`Reading ${TRAM_DATA}…`);
  const raw = JSON.parse(fs.readFileSync(TRAM_DATA, "utf8")) as { stops: RawStop[] };
  const rows = raw.stops.map((s) => ({
    stop_id: s.stop_id,
    stop_name: s.stop_name,
    lat: s.lat,
    lon: s.lon,
  }));
  console.log(`Načteno ${rows.length} zastávek.`);

  const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    auth: { persistSession: false },
  });

  // Batch upsert (Supabase má limit ~1000 / req)
  const BATCH = 500;
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from("oznacnik_stops")
      .upsert(chunk, { onConflict: "stop_id" });
    if (error) {
      console.error(`Batch ${i}–${i + chunk.length} selhal:`, error);
      process.exit(1);
    }
    done += chunk.length;
    console.log(`  ${done}/${rows.length}`);
  }
  console.log(`✓ Seed kompletní (${done} stops).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
