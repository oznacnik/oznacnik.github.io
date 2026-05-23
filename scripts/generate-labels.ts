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
// Hostname bez protokolu — to co se tiskne na popisku jako lidsky čitelná
// URL. GitHub Pages je jen statický mirror; samotná aplikace (claim,
// realtime, photo upload) běží jen na Vercelu, takže tam musí směrovat
// i QR scan i to, co operátor / divák uvidí v rámu.
const PRINTED_HOSTNAME = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");

Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/Inter-Regular.ttf"), fontWeight: 400 },
    { src: path.join(process.cwd(), "public/fonts/Inter-Bold.ttf"), fontWeight: 700 },
  ],
});

// CJK fallback — některé tituly obsahují čínské znaky (např. „除四害
// kampaň 4 škůdců"), které Inter nemá v glyph table. NotoSansCJKsc
// pokrývá Han + Hiragana + Katakana + Hangul + Latin (vč. českých
// diakritik), takže když v textu detekujeme CJK, přepneme celý Text
// na tuhle rodinu. Font není v repu (16 MB) — gitignore, dotahuje se
// jednorázově. Viz scripts/README pro download command.
const NOTO_CJK_PATH = path.join(
  process.cwd(),
  "public/fonts/NotoSansCJKsc-Regular.otf"
);
const HAS_CJK_FONT = fs.existsSync(NOTO_CJK_PATH);
if (HAS_CJK_FONT) {
  Font.register({ family: "NotoCJK", src: NOTO_CJK_PATH });
} else {
  console.warn(
    `⚠ ${NOTO_CJK_PATH} nenalezen — tituly s CJK znaky se renderují prázdně.`
  );
}

const CJK_RE = /[　-鿿가-힯豈-﫿]/;
function isCJKChar(c: string): boolean {
  return CJK_RE.test(c);
}

// Auto-fit titulu: najde největší fontSize, kde se celý text vejde do
// 1 řádku v dostupné šířce LEFT_TEXT_WIDTH. CJK znaky cca 2× širší než
// Latin (počítají se s váhou 2). Když ani 7pt nestačí, truncate.
const TITLE_FONT_TIERS = [22, 18, 14, 11, 9, 7];
// Empirický šířkový ratio pro Inter bold uppercase. Trochu konzervativní,
// aby se text nedotýkal pravého bloku.
const AVG_CHAR_W_RATIO = 0.62;

function fitTitle(text: string, maxWidth: number): { text: string; fontSize: number } {
  let weight = 0;
  for (const ch of text) weight += isCJKChar(ch) ? 2 : 1;
  for (const size of TITLE_FONT_TIERS) {
    const fit = Math.floor(maxWidth / (size * AVG_CHAR_W_RATIO));
    if (weight <= fit) return { text, fontSize: size };
  }
  // Ani na nejmenší velikost se nevejde → truncate
  const size = TITLE_FONT_TIERS[TITLE_FONT_TIERS.length - 1];
  const maxCh = Math.floor(maxWidth / (size * AVG_CHAR_W_RATIO)) - 1;
  return { text: truncate(text, maxCh), fontSize: size };
}

// Rozdělí text na souvislé chunky stejného scriptu. Latin chunky pak
// renderujeme v Inter (má `ů`, `ň` apod.), CJK chunky v NotoCJK.
// NotoCJK má sice Latin glyfy, ale ne celý Latin Extended-A — dřív
// jsem celé „除四害 kampaň 4 škůdců" pustil přes NotoCJK a `ů` vypadly.
function splitByScript(text: string): { text: string; isCJK: boolean }[] {
  if (!HAS_CJK_FONT) return [{ text, isCJK: false }];
  const out: { text: string; isCJK: boolean }[] = [];
  let current = "";
  let currentIsCJK = false;
  // Iterátor přes Unicode code points — surrogate-safe pro CJK Ext B+.
  for (const ch of text) {
    const cjk = isCJKChar(ch);
    if (current === "") {
      current = ch;
      currentIsCJK = cjk;
    } else if (cjk === currentIsCJK) {
      current += ch;
    } else {
      out.push({ text: current, isCJK: currentIsCJK });
      current = ch;
      currentIsCJK = cjk;
    }
  }
  if (current) out.push({ text: current, isCJK: currentIsCJK });
  return out;
}

const sb = createClient(URL_, KEY_, { auth: { persistSession: false } });

interface Author {
  id: string;
  name: string;
  display_name: string | null;
  popisek_consent: boolean;
  requested_stops: number | null;
  web_consent: boolean;
}

// Konzistentní zobrazení autora — pseudonym má přednost před legal name.
// (Stejné chování jako lib/install#displayName, jen tady duplikováno
// aby skript nevisel na app/lib aliasu při tsx běhu.)
function displayAuthor(a: Author): string {
  return a.display_name?.trim() || a.name;
}

// Některé PDF renderery se zaseknou na NFD diakritice — sjednotit na NFC.
function nfc(s: string): string {
  return s.normalize("NFC");
}

// react-pdf občas neaplikuje maxLines + ellipsis čistě (různé verze),
// takže rovnou ořezáváme v JS na bezpečnou délku. Konec: nahrazení
// vícenásobných whitespace a explicitních newlinů jednou mezerou.
function truncate(s: string, maxChars: number): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  return clean.slice(0, maxChars - 1).trimEnd() + "…";
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

// Label = úzký pás na šířku celé A4 (297×38mm). Vychází z předlohy
// label.svg (viewBox 842.89×108.04 pt). Pozice prvků jsou odvozené
// přímo z těch pt souřadnic — žádný přepočet, react-pdf používá pt.
// Na jednu A4 landscape stránku se vejde 5 popisků pod sebou
// (5 × 38 = 190mm, zbývajících 20mm rozdělíme jako horní/spodní padding).
const MM = 2.83465;
// A4 portrait — užší stránka, aby šly popisky tisknout normálně.
const PAGE_W_PT = 210 * MM; // ~595.28
const PAGE_H_PT = 297 * MM; // ~841.89
const SIDE_PADDING = 8; // ~3mm okraj na každé straně (safe printable area)
const LABEL_W_PT = PAGE_W_PT - SIDE_PADDING * 2; // ~579
// Popisek = horní content zóna (108pt podle SVG) + 2cm prázdná plocha
// dole UVNITŘ rámečku. Spodní zóna je pro ruční značení / odlomení /
// vlepení do reklamního rámu, nebo klidová zóna.
const CONTENT_H_PT = 108.04;
const BOTTOM_NOTES_PT = 20 * MM; // 2 cm = ~56.7pt
const LABEL_H_PT = CONTENT_H_PT + BOTTOM_NOTES_PT; // ~164.7
const BORDER = 1;

// Dvě varianty (vždy se generují obě, user si vybere):
//   4/strana: pohodlný layout, hodně místa kolem (10pt page padding)
//   5/strana: hustější, menší page padding aby 5×164.7=823.5pt fitlo do 842pt
const VARIANTS = [
  { perPage: 4, pagePadV: 10 },
  { perPage: 5, pagePadV: 5 },
];

// Layout per label.png: QR vlevo nahoře (menší než předtím), vpravo od
// QR velký uppercase TITLE + pod ním bold AUTHOR. Pod celým horním
// blokem (na novém řádku přes celou šířku) velký „GALERIE OZNAČNÍK".
// Vpravo nahoře: #NNN bold velký + pod ním URL (drobné, gray, jeden
// řádek pokud možno).
const QR_SIZE = 60;
const QR_X = 10;
const QR_Y = 12;

const TEXT_X = QR_X + QR_SIZE + 14; // levá hrana titulu / autora
const RIGHT_BLOCK_WIDTH = 165; // dost široký na „oznacnik-github-io.vercel.app" na 1 řádek
const RIGHT_BLOCK_RIGHT = 10;
const TEXT_RIGHT_LIMIT = LABEL_W_PT - RIGHT_BLOCK_WIDTH - RIGHT_BLOCK_RIGHT - 8;
const LEFT_TEXT_WIDTH = TEXT_RIGHT_LIMIT - TEXT_X;

// Posuv nahoru proti SVG, aby vizuální top titulu lícoval s top QR.
// Absolute `top` v react-pdf sedí na hlavní line-box (vč. font ascent),
// takže glyph CAVECANEM působí níž než hodnota `top`.
const TITLE_TOP = 4;
const AUTHOR_TOP = 36;
const GALLERY_BRAND_TOP = 76; // hned pod QR (QR_Y + QR_SIZE = 72)
const GALLERY_BRAND_LEFT = QR_X; // začíná pod QR, ne pod textem

function makePageStyle(padV: number) {
  return {
    fontFamily: "Inter",
    backgroundColor: "#fff",
    paddingTop: padV,
    paddingBottom: padV,
    paddingLeft: SIDE_PADDING,
    paddingRight: SIDE_PADDING,
  };
}

const s = StyleSheet.create({
  label: {
    width: LABEL_W_PT,
    height: LABEL_H_PT,
    border: `${BORDER}pt solid #000`,
    position: "relative",
    overflow: "hidden",
  },
  qrImage: {
    position: "absolute",
    left: QR_X,
    top: QR_Y,
    width: QR_SIZE,
    height: QR_SIZE,
  },
  workTitle: {
    position: "absolute",
    left: TEXT_X,
    top: TITLE_TOP,
    width: LEFT_TEXT_WIDTH,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.2,
    lineHeight: 1.05,
    textTransform: "uppercase",
    color: "#000",
  },
  authorName: {
    position: "absolute",
    left: TEXT_X,
    top: AUTHOR_TOP,
    width: LEFT_TEXT_WIDTH,
    fontSize: 17,
    fontWeight: 700,
    color: "#000",
  },
  qrIndex: {
    position: "absolute",
    right: RIGHT_BLOCK_RIGHT,
    top: TITLE_TOP,
    width: RIGHT_BLOCK_WIDTH,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 0.4,
    color: "#000",
    textAlign: "right",
  },
  urlText: {
    position: "absolute",
    right: RIGHT_BLOCK_RIGHT,
    top: AUTHOR_TOP + 4,
    width: RIGHT_BLOCK_WIDTH,
    fontSize: 9,
    fontWeight: 400,
    color: "#666",
    textAlign: "right",
  },
  galleryBrand: {
    position: "absolute",
    left: GALLERY_BRAND_LEFT,
    top: GALLERY_BRAND_TOP,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 4,
    textTransform: "uppercase",
    color: "#000",
  },
  blankBigTitle: {
    position: "absolute",
    left: TEXT_X,
    top: TITLE_TOP,
    width: LEFT_TEXT_WIDTH,
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: -0.5,
    textTransform: "uppercase",
    color: "#000",
  },
  blankSub: {
    position: "absolute",
    left: TEXT_X,
    top: AUTHOR_TOP,
    width: LEFT_TEXT_WIDTH,
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#666",
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

function Label({ l }: { l: LabelData }) {
  const indexLabel = `#${String(l.qr_index).padStart(3, "0")}`;
  // Common right column (ID + URL) je všude. „Galerie Označník" big
  // row pod QR se renderuje JEN pro normální popisky — blank labely
  // už mají GALERIE OZNAČNÍK velký místo titulu díla, neopakovat.
  const idAndUrl = [
    React.createElement(Text, { style: s.urlText, key: "url" }, PRINTED_HOSTNAME),
    React.createElement(Text, { style: s.qrIndex, key: "idx" }, indexLabel),
  ];
  if (l.blank) {
    return React.createElement(
      View,
      { style: s.label },
      React.createElement(Image, { style: s.qrImage, src: l.qrDataUrl }),
      React.createElement(Text, { style: s.blankBigTitle }, "GALERIE OZNAČNÍK"),
      React.createElement(Text, { style: s.blankSub }, "Vernisáž 2026"),
      ...idAndUrl
    );
  }
  // Year + technika jen na webu, na popisku zbytečně tlačí na šířku.
  const { text: fittedTitle, fontSize: titleFontSize } = fitTitle(
    l.workTitle,
    LEFT_TEXT_WIDTH
  );
  return React.createElement(
    View,
    { style: s.label },
    React.createElement(Image, { style: s.qrImage, src: l.qrDataUrl }),
    multiScriptText(
      fittedTitle,
      [s.workTitle, { fontSize: titleFontSize }],
      "title"
    ),
    multiScriptText(l.authorName, s.authorName, "author"),
    React.createElement(Text, { style: s.galleryBrand }, "Galerie Označník"),
    ...idAndUrl
  );
}

// Wrap textu pro mix Latin/CJK. Když text neobsahuje CJK, vrací jen
// jeden <Text> (žádný nested mark-up = stejný layout jako dřív).
// Jinak vrací parent <Text> se style + nested <Text> chunky se
// správným fontem.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function multiScriptText(text: string, style: any, keyPrefix: string) {
  const chunks = splitByScript(text);
  if (chunks.length === 1 && !chunks[0].isCJK) {
    return React.createElement(
      Text,
      { style: [style, { fontFamily: "Inter" }] },
      text
    );
  }
  return React.createElement(
    Text,
    { style },
    chunks.map((c, i) =>
      React.createElement(
        Text,
        {
          key: `${keyPrefix}-${i}`,
          style: { fontFamily: c.isCJK ? "NotoCJK" : "Inter" },
        },
        c.text
      )
    )
  );
}

function LabelsDocument({
  labels,
  perPage,
  pagePadV,
}: {
  labels: LabelData[];
  perPage: number;
  pagePadV: number;
}) {
  const pages = chunk(labels, perPage);
  const pageStyle = makePageStyle(pagePadV);
  return React.createElement(
    Document,
    { title: "Galerie Označník — QR popisky" },
    pages.map((pageLabels, pi) =>
      React.createElement(
        Page,
        { size: "A4", orientation: "portrait", style: pageStyle, key: pi },
        pageLabels.map((l) =>
          React.createElement(Label, { l, key: l.qr_index })
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

    // Limit tak, aby se titul nezalomil přes řádek autora.
    // ~75 znaků = bezpečně 1 řádek při 13pt na ~470pt šířce.
    out.push({
      qr_index: l.qr_index,
      blank: !a.popisek_consent,
      authorName: truncate(nfc(displayAuthor(a)), 48),
      workTitle: truncate(nfc(w.title), 75),
      workTech: w.technique ? truncate(nfc(w.technique), 65) : null,
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

  const outDir = path.join(process.cwd(), "backups");
  fs.mkdirSync(outDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  for (const v of VARIANTS) {
    const pages = Math.ceil(data.length / v.perPage);
    console.log(`Renderuju ${v.perPage}/strana (${pages} stránek)…`);
    const outPath = path.join(outDir, `qr-labels-${v.perPage}perpage-${ts}.pdf`);
    await renderToFile(
      // @ts-expect-error - renderToFile akceptuje DocumentElement
      React.createElement(LabelsDocument, {
        labels: data,
        perPage: v.perPage,
        pagePadV: v.pagePadV,
      }),
      outPath
    );
    console.log(`  → ${outPath}`);
  }

  console.log(`\n✓ ${data.length} popisků (2 varianty)`);
  console.log(`  QR target: ${SITE_URL}/qr/{index}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
