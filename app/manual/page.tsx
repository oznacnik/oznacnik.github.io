export const metadata = {
  title: "Každý může — Galerie Označník",
};

const DPP = "#E3000B";

const STEPS = [
  {
    num: "01",
    title: "Najděte prázdný rámeček",
    text: "Ne každý rámeček je volný. Hledejte ty, kde není nic, nebo kde je stará reklama. Nikdy nepřelepujte informace o mimořádných výlukách nebo změnách v dopravě. Ty tam jsou pro lidi, kteří je potřebují.",
  },
  {
    num: "02",
    title: "Připravte dílo",
    text: "Formát A3 (29,7 x 42,0 cm). Papír gramáže kolem 220 g/m². Drží tvar, nevlní se, vejde se za plastový kryt. Tenčí papír se kroutí, tlustší nejde zasunout. Tiskněte, malujte, tiskněte z lina. Médium je na vás.",
  },
  {
    num: "03",
    title: "Odšroubujte rámeček",
    text: "Rámečky jsou zajištěné šrouby s bitem [TBD]. Odšroubujte, opatrně sejměte plastový kryt. Za ním je prostor kam se vkládá papír.",
  },
  {
    num: "04",
    title: "Vložte a zašroubujte zpět",
    text: "Papír zasuňte za plastový kryt do slotu. Nasaďte kryt zpět a zašroubujte. Zastávku nechte tak, jak jste ji našli. Žádné stopy, žádný nepořádek. Dílo je za sklem, chráněné před deštěm.",
  },
  {
    num: "05",
    title: "Zdokumentujte",
    text: "Vyfoťte instalaci. Pokud chcete dílo zařadit do programu Galerie Označník, napište nám název zastávky, linku, datum a fotku.",
  },
];

export default function ManualPage() {
  return (
    <>
      <style>{`
        @media print {
          nav, header, .bar, .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { padding: 0 !important; }
        }
        @page {
          size: A4;
          margin: 12mm 14mm;
        }
      `}</style>

      <div className="print-page">

        {/* Header strip */}
        <div style={{ background: DPP, height: 8 }} className="no-print" />

        {/* Hero */}
        <div style={{ borderBottom: "4px solid black", padding: "40px 48px 32px" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#aaa", marginBottom: 12, fontFamily: "inherit", fontWeight: 700 }}>
            Galerie Označník — Manuál instalace
          </div>
          <div
            style={{
              fontFamily: "inherit",
              fontWeight: 900,
              textTransform: "uppercase",
              fontSize: "clamp(64px, 14vw, 120px)",
              letterSpacing: "-0.05em",
              lineHeight: 0.85,
            }}
          >
            Každý<br />
            <span style={{ color: DPP }}>může.</span>
          </div>
        </div>

        {/* Perex */}
        <div style={{ borderBottom: "4px solid black", padding: "32px 48px", background: "#000", color: "#fff" }}>
          <p style={{ fontFamily: "inherit", fontWeight: 900, fontSize: "clamp(16px, 2.5vw, 24px)", maxWidth: 720, letterSpacing: "-0.01em", lineHeight: 1.3, margin: 0 }}>
            Galerie Označník je otevřená galerie bez kurátora. Výstavní prostory jsou prázdné reklamní rámečky na pražských tramvajových zastávkách. Pokud je rámeček prázdný nebo obsahuje reklamu, je váš.{" "}
            <span style={{ color: DPP }}>Stačí papír, šroubovák a něco, co chcete říct.</span>
          </p>
        </div>

        {/* Postup */}
        <div>
          {STEPS.map((step) => (
            <div
              key={step.num}
              style={{ display: "grid", gridTemplateColumns: "96px 1fr", borderBottom: "4px solid black" }}
            >
              <div
                style={{
                  fontFamily: "inherit",
                  fontWeight: 900,
                  fontSize: "clamp(36px, 5vw, 56px)",
                  letterSpacing: "-0.05em",
                  color: DPP,
                  lineHeight: 0.85,
                  padding: "24px 0 24px 48px",
                  borderRight: "4px solid black",
                }}
              >
                {step.num}
              </div>
              <div style={{ padding: "24px 48px" }}>
                <div style={{ fontFamily: "inherit", fontWeight: 900, textTransform: "uppercase", fontSize: 13, letterSpacing: "0.06em", marginBottom: 8 }}>
                  {step.title}
                </div>
                <p style={{ fontFamily: "inherit", fontWeight: 400, fontSize: 14, lineHeight: 1.65, margin: 0, color: "#333" }}>
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Jedno pravidlo + kontakt */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "4px solid black" }}>
          <div style={{ padding: "28px 48px", borderRight: "4px solid black" }}>
            <div style={{ fontFamily: "inherit", fontWeight: 700, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: DPP, marginBottom: 10 }}>
              Jedno pravidlo
            </div>
            <p style={{ fontFamily: "inherit", fontWeight: 400, fontSize: 13, lineHeight: 1.65, margin: 0, color: "#333" }}>
              Respektujte ostatní. Pokud je v rámečku dílo někoho jiného, najděte prázdný. A nikdy nepřekrývejte provozní informace DPP. Výluky, změny tras, mimořádnosti. Ty tam jsou pro cestující, ne pro nás.
            </p>
          </div>
          <div style={{ padding: "28px 48px" }}>
            <div style={{ fontFamily: "inherit", fontWeight: 700, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: DPP, marginBottom: 10 }}>
              Kontakt
            </div>
            <p style={{ fontFamily: "inherit", fontWeight: 400, fontSize: 13, lineHeight: 1.65, margin: "0 0 12px", color: "#333" }}>
              Pošlete nám: název zastávky, číslo linky, datum instalace, fotku.
            </p>
            <a
              href="mailto:GalerieOznacnik@protonmail.com"
              style={{ fontFamily: "inherit", fontWeight: 900, fontSize: 14, color: DPP, textDecoration: "underline", letterSpacing: "-0.01em" }}
            >
              GalerieOznacnik@protonmail.com
            </a>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 48px", borderBottom: "4px solid black" }}>
          <div style={{ fontFamily: "inherit", fontWeight: 900, fontSize: "clamp(36px, 8vw, 64px)", letterSpacing: "-0.06em", color: DPP, lineHeight: 0.8 }}>
            O
          </div>
          <div style={{ fontFamily: "inherit", fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", textAlign: "right" }}>
            tramgallery.cz<br />Praha
          </div>
        </div>

        <div style={{ background: DPP, height: 8 }} />
      </div>
    </>
  );
}
