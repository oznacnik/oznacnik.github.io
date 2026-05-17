/**
 * Wipe vernisáž test dat — claims + QR scan logy.
 *
 * NESAHÁ na seed data:
 *   - oznacnik_stops (zastávky z GTFS)
 *   - oznacnik_authors / oznacnik_works (autoři a jejich díla)
 *   - oznacnik_qr_labels (vytištěné popisky, 1:1 s work_id)
 *
 * MAŽE:
 *   - oznacnik_claims (všechny claimy)
 *   - oznacnik_qr_scans (log scanů)
 *
 * Run:
 *   npx tsx scripts/reset-vernisaz.ts
 *   npx tsx scripts/reset-vernisaz.ts --yes   (skip confirm)
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
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

const sb = createClient(URL_, KEY_, { auth: { persistSession: false } });

async function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("=== RESET VERNISÁŽ ===\n");
  console.log("Tohle SMAŽE následující data:");
  console.log("  - oznacnik_claims          (všechny claimy autor↔zastávka)");
  console.log("  - oznacnik_qr_scans        (log scanů popisků)");
  console.log();
  console.log("Zůstanou nedotčené:");
  console.log("  - oznacnik_stops, oznacnik_authors, oznacnik_works");
  console.log("  - oznacnik_qr_labels       (popisky 1:1 s work_id)");
  console.log();

  // Counts before
  const [claims, scans] = await Promise.all([
    sb.from("oznacnik_claims").select("*", { count: "exact", head: true }),
    sb.from("oznacnik_qr_scans").select("*", { count: "exact", head: true }),
  ]);
  console.log("Současný stav:");
  console.log(`  - claims:   ${claims.count ?? "?"}`);
  console.log(`  - qr scans: ${scans.count ?? "?"}`);
  console.log();

  const skipConfirm = process.argv.includes("--yes");
  if (!skipConfirm) {
    const answer = await ask("Pokračovat? (napiš ANO): ");
    if (answer !== "ANO") {
      console.log("Zrušeno.");
      process.exit(0);
    }
  }

  // Wipe
  console.log("\nMažu…");
  const { error: claimsErr } = await sb.from("oznacnik_claims").delete().neq("stop_id", "");
  if (claimsErr) throw claimsErr;
  console.log("  ✓ claims smazány");

  const { error: scansErr } = await sb.from("oznacnik_qr_scans").delete().neq("id", 0);
  if (scansErr) throw scansErr;
  console.log("  ✓ scans smazány");

  console.log("\n✓ Reset hotov.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
