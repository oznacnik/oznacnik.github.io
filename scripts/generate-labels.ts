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
  label_seq: number;
}

// ─── Plán fyzických popisků per (work, label_seq) ──────────────────────
// Autor potřebuje requested_stops × 2 fyzických popisků celkem.
// Rozdělit rovnoměrně mezi jeho unikátní díla.
// Output: list of { work_id, label_seq } — každý = jedna physical kopie.
function planAuthorLabels(
  author: Author,
  works: Work[]
): { work_id: string; label_seq: number }[] {
  const total = (author.requested_stops ?? 0) * 2;
  if (total === 0 || works.length === 0) return [];

  const perWork = Math.ceil(total / works.length);
  const sorted = [...works].sort((a, b) => a.ord - b.ord);
  const out: { work_id: string; label_seq: number }[] = [];
  let made = 0;
  for (const w of sorted) {
    for (let seq = 1; seq <= perWork && made < total; seq++) {
      out.push({ work_id: w.id, label_seq: seq });
      made++;
    }
  }
  return out;
}

async function ensureLabels(): Promise<QrLabel[]> {
  const [{ data: authorsData }, { data: worksData }, { data: existing }] = await Promise.all([
    sb.from("oznacnik_authors").select("*"),
    sb.from("oznacnik_works").select("*"),
    sb.from("oznacnik_qr_labels").select("*"),
  ]);

  const authors = (authorsData ?? []) as Author[];
  const works = (worksData ?? []) as Work[];
  const existingLabels = (existing ?? []) as QrLabel[];

  const existingKeys = new Set(existingLabels.map((l) => `${l.work_id}:${l.label_seq}`));

  const toInsert: { work_id: string; author_id: string; label_seq: number }[] = [];
  for (const author of authors) {
    if ((author.requested_stops ?? 0) === 0) continue;
    const authorWorks = works.filter((w) => w.author_id === author.id);
    const planned = planAuthorLabels(author, authorWorks);
    for (const p of planned) {
      const key = `${p.work_id}:${p.label_seq}`;
      if (!existingKeys.has(key)) {
        toInsert.push({ work_id: p.work_id, author_id: author.id, label_seq: p.label_seq });
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
// se vleze 2 × 6 = 12 labelů. Border + řezání = potřebujeme rezervu;
// 7 řad pretékal a react-pdf paginal s blank pages mezi.
// react-pdf body units: 1mm = 2.83465 pt.
const MM = 2.83465;
const BORDER = 1.5;
const LABEL_W = 80 * MM;
const LABEL_H = 40 * MM;
const SLOT_W = LABEL_W + BORDER * 2; // skutečně zabraný prostor s borderem
const SLOT_H = LABEL_H + BORDER * 2;
const COLS = 2;
const ROWS = 6;
const LABELS_PER_PAGE = COLS * ROWS; // 12
const PAGE_W = 210 * MM;
const PAGE_H = 297 * MM;
const SIDE_PADDING = Math.max(0, (PAGE_W - COLS * SLOT_W) / 2);
const TOP_PADDING = Math.max(0, (PAGE_H - ROWS * SLOT_H) / 2);

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
    width: COLS * SLOT_W,
    height: ROWS * SLOT_H,
  },
  label: {
    width: LABEL_W,
    height: LABEL_H,
    border: `${BORDER}pt solid #000`,
    flexDirection: "row",
    padding: 6,
    gap: 6,
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
          pageLabels.map((l) =>
            React.createElement(
              View,
              { style: s.label, key: l.qr_index },
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

  // 1 QR popisek per row v qr_labels = 1 entry v PDF
  const out: LabelData[] = [];
  for (const l of labels) {
    const w = worksMap.get(l.work_id);
    const a = authorsMap.get(l.author_id);
    if (!w || !a) continue;

    const url = `${SITE_URL}/qr/${l.qr_index}`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      margin: 1,
      width: 240,
      color: { dark: "#000000", light: "#ffffff" },
    });

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
