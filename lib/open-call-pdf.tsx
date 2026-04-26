import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";
import path from "path";

Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/Inter-Regular.ttf"), fontWeight: 400 },
    { src: path.join(process.cwd(), "public/fonts/Inter-Bold.ttf"), fontWeight: 700 },
  ],
});

const DPP = "#E3000B";
const BLACK = "#000000";
const WHITE = "#FFFFFF";
const GRAY = "#333333";
const LIGHT = "#999999";

const s = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    backgroundColor: WHITE,
    padding: 0,
  },
  redBar: { height: 8, backgroundColor: DPP },
  blackBar3: { height: 3, backgroundColor: BLACK },
  blackBar6: { height: 6, backgroundColor: BLACK },

  // ── HERO ──────────────────────────────────────────────
  hero: {
    paddingLeft: 36,
    paddingRight: 36,
    paddingTop: 24,
    paddingBottom: 18,
  },
  heroLabel: {
    fontSize: 7,
    fontWeight: 400,
    letterSpacing: 2,
    color: LIGHT,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  heroLine1: {
    fontSize: 80,
    fontWeight: 700,
    letterSpacing: -2,
    lineHeight: 0.88,
    color: BLACK,
    textTransform: "uppercase",
  },
  heroLine2: {
    fontSize: 80,
    fontWeight: 700,
    letterSpacing: -2,
    lineHeight: 0.88,
    color: DPP,
    textTransform: "uppercase",
  },

  // ── PEREX — černý blok ────────────────────────────────
  perexBlock: {
    backgroundColor: BLACK,
    paddingLeft: 36,
    paddingRight: 36,
    paddingTop: 22,
    paddingBottom: 22,
  },
  perexText: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.2,
    color: WHITE,
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  perexAccent: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.2,
    color: DPP,
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },

  // ── ŘÁDKY ─────────────────────────────────────────────
  row: {
    flexDirection: "row",
    borderTop: `2 solid ${BLACK}`,
    alignItems: "flex-start",
  },
  rowNum: {
    width: 40,
    paddingLeft: 4,
    paddingTop: 4,
    flexShrink: 0,
  },
  rowNumText: {
    fontSize: 36,
    fontWeight: 700,
    color: DPP,
    lineHeight: 1,
  },
  rowContent: {
    flex: 1,
    borderLeft: `2 solid ${BLACK}`,
    paddingLeft: 10,
    paddingRight: 36,
    paddingTop: 10,
    paddingBottom: 10,
  },
  rowTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: BLACK,
    marginBottom: 4,
  },
  rowText: {
    fontSize: 9,
    fontWeight: 400,
    color: GRAY,
    lineHeight: 1.6,
  },

  // ── KONTAKT ───────────────────────────────────────────
  contact: {
    paddingLeft: 36,
    paddingRight: 36,
    paddingTop: 16,
    paddingBottom: 16,
  },
  contactText: {
    fontSize: 9,
    fontWeight: 400,
    color: GRAY,
    lineHeight: 1.6,
    marginBottom: 10,
  },
  contactEmail: {
    fontSize: 18,
    fontWeight: 700,
    color: DPP,
    textDecoration: "underline",
    marginBottom: 6,
  },
  deadline: {
    fontSize: 11,
    fontWeight: 700,
    color: LIGHT,
  },

  // ── FOOTER ────────────────────────────────────────────
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingLeft: 36,
    paddingRight: 36,
    paddingTop: 12,
    paddingBottom: 12,
  },
  footerTG: {
    fontSize: 52,
    fontWeight: 700,
    color: DPP,
    lineHeight: 0.85,
  },
  footerRight: {
    fontSize: 7,
    fontWeight: 400,
    color: LIGHT,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "right",
  },
});

const ITEMS = [
  {
    num: "01",
    title: "Co hledáme",
    text: "Autory pro kolektivní výstavu v pražských tramvajových zastávkách. Každý autor dostane blok zastávek na jedné lince. Díla budou vystavena v reklamních rámečcích, za sklem, přímo v ulici.",
  },
  {
    num: "02",
    title: "Formát",
    text: "Papír, formát A3. Série, variace, nebo pokaždé něco jiného. Dodáte hotové tisky, nainstalujeme je společně.",
  },
  {
    num: "03",
    title: "Instalace",
    text: "Společná vernisáž. Projdeme trasu a každý nainstaluje svá díla do označníků. Datum a trasa budou upřesněny.",
  },
  {
    num: "04",
    title: "Životnost",
    text: "Přibližně týden. Výstavu sundá DPP, počasí, nebo čas. To je součást konceptu. Díla žijí ve veřejném prostoru a sdílejí jeho osud.",
  },
];

export const OpenCallPDF = () => (
  <Document title="Galerie Označník / Výzva Zlobit" author="Galerie Označník">
    <Page size="A4" style={s.page}>
      <View style={s.redBar} />

      {/* Hero */}
      <View style={s.hero}>
        <Text style={s.heroLabel}>Galerie Označník Open Call</Text>
        <Text style={s.heroLine1}>VÝZVA</Text>
        <Text style={s.heroLine2}>ZLOBIT</Text>
      </View>

      {/* Perex — černý blok */}
      <View style={s.blackBar6} />
      <View style={s.perexBlock}>
        <Text style={s.perexText}>
          {"Hledáme autory pro kolektivní výstavu\nv pražských tramvajových zastávkách."}
        </Text>
      </View>
      <View style={s.blackBar6} />

      {/* Intro text */}
      <View style={{ paddingLeft: 36, paddingRight: 36, paddingTop: 16, paddingBottom: 14 }}>
        <Text style={{ fontSize: 9, fontWeight: 400, color: GRAY, lineHeight: 1.6 }}>
          Galerie Označník je galerie současného umění, jejíž výstavní prostory jsou prázdné reklamní označníky pražských tramvajových zastávek. Každý úsek linky je samostatná výstava.
        </Text>
        <Text style={{ fontSize: 9, fontWeight: 400, color: GRAY, lineHeight: 1.6, marginTop: 6 }}>
          Chystáme další výstavu a hledáme autory, kteří chtějí vystavit ve veřejném prostoru. Bez galerie, bez white cube, bez poplatků. Vernísáž by probíhala formou aktivní instalace.
        </Text>
      </View>
      <View style={{ height: 14, backgroundColor: BLACK }} />

      {/* Řádky */}
      {ITEMS.map((item) => (
        <View key={item.num} style={s.row}>
          <View style={s.rowNum}>
            <Text style={s.rowNumText}>{item.num}</Text>
          </View>
          <View style={s.rowContent}>
            <Text style={s.rowTitle}>{item.title}</Text>
            <Text style={s.rowText}>{item.text}</Text>
          </View>
        </View>
      ))}
      <View style={s.blackBar3} />

      {/* Kontakt */}
      <View style={s.contact}>
        <Text style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: BLACK, marginBottom: 8 }}>Přihláška</Text>
        <Text style={s.contactText}>
          Pošlete nám: jméno nebo pseudonym, náhled díla nebo série, kolik zastávek chcete obsadit. Nemusíte mít hotová díla, stačí záměr a ukázka.
        </Text>
        <Text style={s.contactEmail}>GalerieOznacnik@protonmail.com</Text>
        <Text style={s.deadline}>Deadline: 14. 4. 2026</Text>
      </View>

      {/* Footer */}
      <View style={s.blackBar6} />
      <View style={s.footer}>
        <Text style={s.footerTG}>O</Text>
        <Text style={s.footerRight}>oznacnik.github.io{"\n"}Praha</Text>
      </View>
      <View style={s.redBar} />
    </Page>
  </Document>
);
