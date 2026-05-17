/**
 * Vygeneruje QR popisky pro autory s popisek_consent=true.
 *
 * Pre-print workflow:
 *   1) Spusť skript — upsertne labels do oznacnik_qr_labels (stop_id=null),
 *      vygeneruje PDF se všemi popisky, uloží do backups/.
 *   2) Vytiskni PDF, vystřihni popisky.
 *   3) Při claimu na zastávce naskenuješ QR z popisku — app spáruje
 *      qr_index ↔ stop_id.
 *
 * Run:
 *   npx tsx scripts/generate-labels.ts
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
  renderToFile,
} from "@react-pdf/renderer";

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
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://oznacnik-github-io.vercel.app";

Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/Inter-Regular.ttf"), fontWeight: 400 },
    { src: path.join(process.cwd(), "public/fonts/Inter-Bold.ttf"), fontWeight: 700 },
  ],
});

const sb = createClient(URL_, KEY_, { auth: { persistSession: false } });

interface Author {
  id: string;
  name: string;
  popisek_consent: boolean;
  requested_stops: number | null;
  web_consent: boolean;
}
interface Work {
  id: string;
  author_id: string;
  ord: number;
  title: string;
  year: number | null;
  technique: string | null;
}
interface QrLabel {
  qr_index: number;
  work_id: string;
  author_id: string;
}

// ─── Plán fyzických kopií per work ────────────────────────────────────
// Autor potřebuje requested_stops × 2 fyzických popisků celkem.
// Rozděleno rovnoměrně mezi jeho unikátní díla.
function physicalCopiesPerWork(author: Author, works: Work[]): Map<string, number> {
  const total = (author.requested_stops ?? 0) * 2;
  const result = new Map<string, number>();
  if (total === 0 || works.length === 0) return result;

  const perWork = Math.ceil(total / works.length);
  const sorted = [...works].sort((a, b) => a.ord - b.ord);
  let remaining = total;
  for (const w of sorted) {
    if (remaining <= 0) break;
    const n = Math.min(perWork, remaining);
    result.set(w.id, n);
    remaining -= n;
  }
  return result;
}

async function ensureLabels(): Promise<QrLabel[]> {
  // Jeden qr_index per dílo. Pro VŠECHNY autory (popisek_consent jen
  // ovlivňuje vizuál physical labels — blank nebo plný).
  const [{ data: authorsData }, { data: worksData }, { data: existing }] = await Promise.all([
    sb.from("oznacnik_authors").select("*"),
    sb.from("oznacnik_works").select("*"),
    sb.from("oznacnik_qr_labels").select("*"),
  ]);

  const authors = (authorsData ?? []) as Author[];
  const works = (worksData ?? []) as Work[];
  const existingLabels = (existing ?? []) as QrLabel[];

  const existingWorkIds = new Set(existingLabels.map((l) => l.work_id));

  // Pro každé dílo autora co má requested_stops > 0 => label
  const toInsert: { work_id: string; author_id: string }[] = [];
  for (const author of authors) {
    if ((author.requested_stops ?? 0) === 0) continue;
    const authorWorks = works.filter((w) => w.author_id === author.id);
    for (const w of authorWorks) {
      if (!existingWorkIds.has(w.id)) {
        toInsert.push({ work_id: w.id, author_id: author.id });
      }
    }
  }

  console.log(
    `Existující labels: ${existingLabels.length}, nově vložím: ${toInsert.length}`
  );

  if (toInsert.length > 0) {
    const { error } = await sb.from("oznacnik_qr_labels").insert(toInsert);
    if (error) throw error;
  }

  const { data: all, error: refetchErr } = await sb
    .from("oznacnik_qr_labels")
    .select("*")
    .order("qr_index");
  if (refetchErr) throw refetchErr;
  return (all ?? []) as QrLabel[];
}

// ─── PDF render ───────────────────────────────────────────────────────

// Label size: 80 × 40 mm landscape (uživatelská spec). Na A4 (210 × 297 mm)
// se vleze 2 × 7 = 14 labelů s ~20mm bočním paddingem a ~3mm na vrchu/spodku.
// react-pdf používá body (1mm = 2.83 pt).
const MM = 2.83465;
const LABEL_W = 80 * MM;
const LABEL_H = 40 * MM;
const COLS = 2;
const ROWS = 7;
const LABELS_PER_PAGE = COLS * ROWS; // 14
const PAGE_W = 210 * MM;
const PAGE_H = 297 * MM;
const SIDE_PADDING = (PAGE_W - COLS * LABEL_W) / 2;
const TOP_PADDING = (PAGE_H - ROWS * LABEL_H) / 2;

const s = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    backgroundColor: "#fff",
    paddingTop: TOP_PADDING,
    paddingBottom: TOP_PADDING,
    paddingLeft: SIDE_PADDING,
    paddingRight: SIDE_PADDING,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: COLS * LABEL_W,
    height: ROWS * LABEL_H,
  },
  label: {
    width: LABEL_W,
    height: LABEL_H,
    border: "1.5pt solid #000",
    flexDirection: "row",
    padding: 6,
    gap: 6,
    boxSizing: "border-box",
  },
  textCol: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    minWidth: 0,
  },
  qrCol: {
    width: 22 * MM,
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  authorName: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#000",
  },
  workTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: -0.3,
    lineHeight: 1.05,
    color: "#000",
    marginTop: 3,
  },
  workTech: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#000",
    marginTop: 3,
  },
  workYear: {
    fontSize: 7,
    fontWeight: 400,
    color: "#666",
    marginTop: 1,
  },
  galleryFooter: {
    fontSize: 5.5,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#aaa",
  },
  qrImage: {
    width: 22 * MM,
    height: 22 * MM,
  },
  qrIndex: {
    fontSize: 6,
    fontWeight: 700,
    letterSpacing: 0.4,
    color: "#000",
    textAlign: "right",
  },
  blankBigTitle: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: -0.5,
    lineHeight: 1.0,
    color: "#000",
  },
});

interface LabelData {
  qr_index: number;
  blank: boolean; // true = autor nechtěl popisek, render jen "GALERIE OZNAČNÍK" + QR
  authorName: string;
  workTitle: string;
  workTech: string | null;
  workYear: string | null;
  qrDataUrl: string;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function LabelsDocument({ labels }: { labels: LabelData[] }) {
  const pages = chunk(labels, LABELS_PER_PAGE);
  return React.createElement(
    Document,
    { title: "Galerie Označník — QR popisky" },
    pages.map((pageLabels, pi) =>
      React.createElement(
        Page,
        { size: "A4", style: s.page, key: pi },
        React.createElement(
          View,
          { style: s.grid },
          pageLabels.map((l, li) =>
            React.createElement(
              View,
              { style: s.label, key: `${l.qr_index}-${li}` },
              l.blank
                ? React.createElement(
                    View,
                    { style: s.textCol },
                    React.createElement(
                      View,
                      {},
                      React.createElement(Text, { style: s.blankBigTitle }, "GALERIE"),
                      React.createElement(Text, { style: s.blankBigTitle }, "OZNAČNÍK")
                    ),
                    React.createElement(
                      Text,
                      { style: s.galleryFooter },
                      "Vernisáž 2026"
                    )
                  )
                : React.createElement(
                    View,
                    { style: s.textCol },
                    React.createElement(
                      View,
                      {},
                      React.createElement(Text, { style: s.authorName }, l.authorName),
                      React.createElement(Text, { style: s.workTitle }, l.workTitle),
                      l.workTech &&
                        React.createElement(Text, { style: s.workTech }, l.workTech),
                      l.workYear &&
                        React.createElement(Text, { style: s.workYear }, l.workYear)
                    ),
                    React.createElement(
                      Text,
                      { style: s.galleryFooter },
                      "Galerie Označník · 2026"
                    )
                  ),
              React.createElement(
                View,
                { style: s.qrCol },
                React.createElement(Image, { style: s.qrImage, src: l.qrDataUrl }),
                React.createElement(
                  Text,
                  { style: s.qrIndex },
                  `#${String(l.qr_index).padStart(3, "0")}`
                )
              )
            )
          )
        )
      )
    )
  );
}

async function buildLabelData(labels: QrLabel[]): Promise<LabelData[]> {
  const [{ data: works }, { data: authors }] = await Promise.all([
    sb.from("oznacnik_works").select("*"),
    sb.from("oznacnik_authors").select("*"),
  ]);
  const worksMap = new Map<string, Work>();
  for (const w of (works ?? []) as Work[]) worksMap.set(w.id, w);
  const authorsMap = new Map<string, Author>();
  for (const a of (authors ?? []) as Author[]) authorsMap.set(a.id, a);

  // Pre-spočítej fyzické kopie per work (kolik kopií tisknout)
  const copiesByWork = new Map<string, number>();
  for (const a of authorsMap.values()) {
    const aWorks = (works ?? []).filter((w) => w.author_id === a.id) as Work[];
    const plan = physicalCopiesPerWork(a, aWorks);
    for (const [wid, n] of plan) copiesByWork.set(wid, n);
  }

  const out: LabelData[] = [];
  for (const l of labels) {
    const w = worksMap.get(l.work_id);
    const a = authorsMap.get(l.author_id);
    if (!w || !a) continue;

    const copies = copiesByWork.get(l.work_id) ?? 0;
    if (copies === 0) continue;

    const url = `${SITE_URL}/qr/${l.qr_index}`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      margin: 1,
      width: 240,
      color: { dark: "#000000", light: "#ffffff" },
    });

    // Vyemituj N fyzických kopií téhož labelu — všechny mají stejný qr_index
    for (let i = 0; i < copies; i++) {
      out.push({
        qr_index: l.qr_index,
        blank: !a.popisek_consent,
        authorName: a.name,
        workTitle: w.title,
        workTech: w.technique || null,
        workYear: w.year ? String(w.year) : null,
        qrDataUrl,
      });
    }
  }
  return out;
}

async function main() {
  console.log("Zajišťuji labels v DB…");
  const labels = await ensureLabels();
  console.log(`Celkem labels: ${labels.length}`);

  console.log("Generuji QR kódy + sestavuji label data…");
  const data = await buildLabelData(labels);

  console.log(`Renderuju PDF (${Math.ceil(data.length / LABELS_PER_PAGE)} stránek)…`);
  const outDir = path.join(process.cwd(), "backups");
  fs.mkdirSync(outDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outPath = path.join(outDir, `qr-labels-${ts}.pdf`);

  // @ts-expect-error - renderToFile akceptuje DocumentElement
  await renderToFile(React.createElement(LabelsDocument, { labels: data }), outPath);

  console.log(`\n✓ ${data.length} popisků`);
  console.log(`  → ${outPath}`);
  console.log(`  QR target: ${SITE_URL}/qr/{index}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
