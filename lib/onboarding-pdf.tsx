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
const LIGHT = "#888888";

const FORM_URL = "https://oznacnik.github.io/prijato";
const EMAIL = "GalerieOznacnik@proton.me";
const DEADLINE = "pátek 1. 5. 2026";

const s = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    backgroundColor: WHITE,
    padding: 0,
  },
  redBar: { height: 8, backgroundColor: DPP },
  redBarThin: { height: 4, backgroundColor: DPP },
  blackBar: { height: 6, backgroundColor: BLACK },
  blackBarThin: { height: 3, backgroundColor: BLACK },

  pad: { paddingLeft: 36, paddingRight: 36 },

  // ── Page 1 ────────────────────────────────────────────
  titleHero: {
    paddingLeft: 36,
    paddingRight: 36,
    paddingTop: 80,
    paddingBottom: 28,
  },
  kicker: {
    fontSize: 9,
    fontWeight: 400,
    letterSpacing: 2.5,
    color: LIGHT,
    marginBottom: 14,
    textTransform: "uppercase",
  },
  bigBlack: {
    fontSize: 88,
    fontWeight: 700,
    letterSpacing: -3,
    lineHeight: 0.86,
    color: BLACK,
    textTransform: "uppercase",
  },
  bigRed: {
    fontSize: 88,
    fontWeight: 700,
    letterSpacing: -3,
    lineHeight: 0.86,
    color: DPP,
    textTransform: "uppercase",
  },
  perex: {
    fontSize: 22,
    fontWeight: 700,
    color: WHITE,
    letterSpacing: -0.4,
    lineHeight: 1.18,
    textTransform: "uppercase",
  },
  perexAccent: {
    fontSize: 22,
    fontWeight: 700,
    color: DPP,
    letterSpacing: -0.4,
    lineHeight: 1.18,
    textTransform: "uppercase",
  },
  blockBlack: {
    backgroundColor: BLACK,
    paddingTop: 22,
    paddingBottom: 22,
    paddingLeft: 36,
    paddingRight: 36,
  },

  // ── Generic body ──────────────────────────────────────
  body: {
    fontSize: 9.5,
    fontWeight: 400,
    color: GRAY,
    lineHeight: 1.6,
  },
  bodyMt: { marginTop: 6 },

  // ── Section header (uppercase eyebrow) ────────────────
  eyebrow: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: LIGHT,
    marginBottom: 6,
  },
  h2: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: -0.8,
    lineHeight: 0.95,
    color: BLACK,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  // ── Numbered row ──────────────────────────────────────
  row: {
    flexDirection: "row",
    borderTop: `2 solid ${BLACK}`,
    alignItems: "flex-start",
  },
  rowNum: {
    width: 50,
    paddingLeft: 8,
    paddingTop: 12,
    flexShrink: 0,
  },
  rowNumText: {
    fontSize: 28,
    fontWeight: 700,
    color: DPP,
    lineHeight: 1,
  },
  rowContent: {
    flex: 1,
    borderLeft: `2 solid ${BLACK}`,
    paddingLeft: 12,
    paddingRight: 36,
    paddingTop: 12,
    paddingBottom: 12,
  },
  rowTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: BLACK,
    marginBottom: 4,
  },

  // ── Footer ────────────────────────────────────────────
  footerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 36,
    paddingRight: 36,
    paddingTop: 10,
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 7,
    color: LIGHT,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // ── Page 3 — call to action ───────────────────────────
  ctaUrl: {
    fontSize: 22,
    fontWeight: 700,
    color: DPP,
    letterSpacing: -0.6,
    textDecoration: "underline",
    marginBottom: 8,
  },
  ctaEmail: {
    fontSize: 16,
    fontWeight: 700,
    color: BLACK,
    letterSpacing: -0.4,
    textDecoration: "underline",
  },
  deadlineBox: {
    border: `4 solid ${BLACK}`,
    padding: 16,
    marginTop: 16,
  },
  deadlineLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 2,
    color: DPP,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  deadlineText: {
    fontSize: 24,
    fontWeight: 700,
    color: BLACK,
    letterSpacing: -0.8,
  },
});

const STEPS = [
  {
    num: "01",
    title: "Vyplň formulář",
    text: "Odkaz najdeš na další straně. Zabere ti to 5 minut. Bez něj tě nezařadíme do plánu instalace.",
  },
  {
    num: "02",
    title: "Připrav díla",
    text: "Formát A3, papír cca 220 g/m². Sám/sama si hradíš tisk a materiál. Edice = volné — jeden motiv můžeš mít ve více kopiích na více zastávkách.",
  },
  {
    num: "03",
    title: "Dorazíš na společnou instalaci",
    text: "Termín víkend 23.–24. 5. 2026 (podle počtu přihlášených klidně oba dny). Sejdeme se, projdeme trasu, každý si obsadí svou zastávku. Pomoc s instalací je k dispozici.",
  },
];

const ABOUT = [
  {
    num: "A",
    title: "Co je Galerie Označník",
    text: "Guerilla galerie. Výstavní prostory jsou prázdné reklamní rámečky pražských tramvajových zastávek. Zastávka = 1 výstavní jednotka (2 označníky). Otevřeno 24/7, vstup zdarma. Délku výstavy určuje DPP — finisáž = okamžik, kdy plochu vyklidí.",
  },
  {
    num: "B",
    title: "Disclaimer",
    text: "Je to guerilla. Neoficiální, nepovolené, bez financování. Materiál si hradí každý sám. Délku výstavy neurčujeme my — DPP plochu vyklidí, a to je finisáž.",
  },
  {
    num: "C",
    title: "Přidělování míst",
    text: "Každý dostane jednu zastávku (= 2 označníky). Co přesně do rámů dáš a jak to rozdělíš, je na tobě. Jeden motiv může být ve více kopiích na více zastávkách.",
  },
  {
    num: "D",
    title: "Co dostaneš zpět",
    text: "Místo na webu galerie (volitelné), dokumentaci tvého díla, pomoc s instalací (volitelné), záznam ve filmu / video-dokumentaci výstavy (volitelné — souhlas v formuláři).",
  },
];

export const OnboardingPDF = () => (
  <Document title="Galerie Označník — Přijato" author="Galerie Označník">
    {/* ───────── PAGE 1 — Titul + co se děje ───────── */}
    <Page size="A4" style={s.page}>
      <View style={s.redBar} />

      <View style={s.titleHero}>
        <Text style={s.kicker}>Galerie Označník — Praha — 2026</Text>
        <Text style={s.bigBlack}>PŘI</Text>
        <Text style={s.bigRed}>JATO.</Text>
      </View>

      <View style={s.blackBar} />
      <View style={s.blockBlack}>
        <Text style={s.perex}>
          Děkujeme za přihlášku. <Text style={s.perexAccent}>Jsi v programu</Text> kolektivní výstavy.
        </Text>
      </View>
      <View style={s.blackBar} />

      <View style={[s.pad, { paddingTop: 18, paddingBottom: 18 }]}>
        <Text style={s.eyebrow}>Co bude následovat</Text>
        <Text style={s.body}>
          Tři kroky, které tě čekají. Detaily k podmínkám, formátu a vernisáži najdeš na další straně. Odkaz na formulář a deadline jsou na poslední straně.
        </Text>
      </View>

      {STEPS.map((step) => (
        <View key={step.num} style={s.row}>
          <View style={s.rowNum}>
            <Text style={s.rowNumText}>{step.num}</Text>
          </View>
          <View style={s.rowContent}>
            <Text style={s.rowTitle}>{step.title}</Text>
            <Text style={s.body}>{step.text}</Text>
          </View>
        </View>
      ))}

      <View style={[s.row, { borderBottom: `2 solid ${BLACK}` }]} />

      <View style={[s.pad, { paddingTop: 24, paddingBottom: 12 }]}>
        <Text style={s.eyebrow}>Pozn. Ptáčka</Text>
        <Text style={s.body}>
          Tohle PDF je krátké schválně. Nechci tě zatěžovat čtením — důležité věci jsou na další straně, formulář na té poslední. Když cokoliv, piš na e-mail.
        </Text>
      </View>

      <View style={{ flexGrow: 1 }} />
      <View style={s.blackBar} />
      <View style={s.footerBar}>
        <Text style={s.footerText}>Strana 1 / 3 — Přijato</Text>
        <Text style={s.footerText}>Galerie Označník — Praha</Text>
      </View>
      <View style={s.redBar} />
    </Page>

    {/* ───────── PAGE 2 — Co je galerie + disclaimer + technika ───────── */}
    <Page size="A4" style={s.page}>
      <View style={s.redBar} />

      <View style={[s.pad, { paddingTop: 28, paddingBottom: 12 }]}>
        <Text style={s.eyebrow}>Co potřebuješ vědět</Text>
        <Text style={s.h2}>Galerie, podmínky, technika.</Text>
      </View>

      <View style={s.blackBarThin} />

      {ABOUT.map((item) => (
        <View key={item.num} style={s.row}>
          <View style={s.rowNum}>
            <Text style={[s.rowNumText, { fontSize: 24 }]}>{item.num}</Text>
          </View>
          <View style={s.rowContent}>
            <Text style={s.rowTitle}>{item.title}</Text>
            <Text style={s.body}>{item.text}</Text>
          </View>
        </View>
      ))}

      <View style={[s.row, { borderBottom: `2 solid ${BLACK}` }]} />

      {/* Technika — tabulka klíč/hodnota */}
      <View style={[s.pad, { paddingTop: 22, paddingBottom: 12 }]}>
        <Text style={s.eyebrow}>Technické specifikace</Text>
        <Text style={[s.h2, { fontSize: 20 }]}>Označník = A3, minus 2 cm v rámu.</Text>
      </View>

      <View style={[s.row, { borderTop: `3 solid ${BLACK}` }]}>
        <View style={s.rowNum}>
          <Text style={[s.rowNumText, { color: BLACK, fontSize: 14 }]}>FORMÁT</Text>
        </View>
        <View style={s.rowContent}>
          <Text style={s.body}>
            A3 (297 × 420 mm) na šířku. Pozor: rám zastávky překryje cca 2 cm tisku po obvodu — nechte si bezpečnou zónu.
          </Text>
        </View>
      </View>
      <View style={s.row}>
        <View style={s.rowNum}>
          <Text style={[s.rowNumText, { color: BLACK, fontSize: 14 }]}>PAPÍR</Text>
        </View>
        <View style={s.rowContent}>
          <Text style={s.body}>
            Doporučená gramáž ~220 g/m². Drží tvar, nevlní se, vejde se za plastový kryt. Tenčí se kroutí, tlustší nejde zasunout.
          </Text>
        </View>
      </View>
      <View style={[s.row, { borderBottom: `2 solid ${BLACK}` }]}>
        <View style={s.rowNum}>
          <Text style={[s.rowNumText, { color: BLACK, fontSize: 14 }]}>MÉDIUM</Text>
        </View>
        <View style={s.rowContent}>
          <Text style={s.body}>
            Tisk, malba, linoryt, sítotisk — médium je na tobě. Důležité je, že to drží na A3 papíře.
          </Text>
        </View>
      </View>

      <View style={{ flexGrow: 1 }} />
      <View style={s.blackBar} />
      <View style={s.footerBar}>
        <Text style={s.footerText}>Strana 2 / 3 — Galerie & technika</Text>
        <Text style={s.footerText}>Ptáček / 2026</Text>
      </View>
      <View style={s.redBar} />
    </Page>

    {/* ───────── PAGE 3 — Další kroky / formulář / deadline ───────── */}
    <Page size="A4" style={s.page}>
      <View style={s.redBar} />

      <View style={[s.pad, { paddingTop: 60, paddingBottom: 14 }]}>
        <Text style={s.kicker}>Tvůj další krok</Text>
        <Text style={[s.bigBlack, { fontSize: 64 }]}>VYPLŇ</Text>
        <Text style={[s.bigRed, { fontSize: 64 }]}>FORMULÁŘ.</Text>
      </View>

      <View style={s.blackBar} />
      <View style={s.blockBlack}>
        <Text style={s.perex}>
          Bez vyplněného formuláře <Text style={s.perexAccent}>tě nezařadíme</Text> do plánu instalace.
        </Text>
      </View>
      <View style={s.blackBar} />

      <View style={[s.pad, { paddingTop: 24 }]}>
        <Text style={s.eyebrow}>Formulář</Text>
        <Text style={s.ctaUrl}>{FORM_URL}</Text>
        <Text style={s.body}>
          Otevře se v prohlížeči, vyplnění zabere cca 5 minut. Žádný účet, žádné cookies. Po odeslání ti vyskočí e-mail s předvyplněnou zprávou — jen ji odešleš.
        </Text>

        <View style={s.deadlineBox}>
          <Text style={s.deadlineLabel}>Deadline pro vyplnění</Text>
          <Text style={s.deadlineText}>{DEADLINE}</Text>
        </View>
      </View>

      <View style={[s.pad, { paddingTop: 28 }]}>
        <Text style={s.eyebrow}>Jakákoliv otázka</Text>
        <Text style={s.body}>Napiš rovnou na e-mail. Odpovídá Ptáček.</Text>
        <Text style={[s.ctaEmail, { marginTop: 6 }]}>{EMAIL}</Text>
      </View>

      <View style={{ flexGrow: 1 }} />
      <View style={s.blackBar} />
      <View style={s.footerBar}>
        <Text style={s.footerText}>Strana 3 / 3 — Další kroky</Text>
        <Text style={s.footerText}>Ptáček / 2026</Text>
      </View>
      <View style={s.redBar} />
    </Page>
  </Document>
);
