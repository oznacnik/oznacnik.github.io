export const metadata = {
  title: "O galerii — Galerie Označník",
};

const DPP = "#E3000B";

export default function OGaleriiPage() {
  return (
    <div>

      {/* ── O GALERII ─────────────────────────────────────────────────────── */}
      <div className="px-6 pt-10 pb-0">
        <div className="flex items-start gap-6 overflow-hidden">
          <div className="rotate-label type-label shrink-0 mt-2" style={{ color: "#bbb" }}>
            O galerii
          </div>
          <div className="flex-1">
            <h1
              className="font-black uppercase leading-none"
              style={{ fontSize: "clamp(56px, 14vw, 160px)", letterSpacing: "-0.04em", lineHeight: 0.85 }}
            >
              GALERIE<br />
              OZNAČNÍK
            </h1>
          </div>
        </div>
      </div>

      <div className="bar bar-thick mt-10" />

      <div className="px-6 py-12 grid lg:grid-cols-2 gap-0">
        <div className="lg:pr-12 lg:border-r-4 lg:border-black">
          <div className="type-label mb-6" style={{ color: "#888" }}>Manifest</div>
          <div className="prose-gallery">
            <p>
              Galerie Označník je guerilla projekt, který roubuje galerijní koncept na tramvajové zastávky v Praze. Jako výstavní médium využívá prázdné reklamní plochy v označnících. Označník je veřejná infrastruktura. Věříme, že město patří všem.

Výhodou je vysoká expozice. Výstavu vidí každý, kdo čeká na tramvaj. Finisáž může přijít kdykoli, za den, za měsíc. Sami nevíme. Rozhoduje DPP.

Projekt je dočasný. Dopravní podnik v blízké době změní  řešení pražských označníků. Prázdné plochy, zmizí. S ní zmizí i Galerie Označník v podobě, jakou má teď. Naše okno příležitosti se zavře.
            </p>
   
            <p>
            </p>
          </div>
        </div>

      </div>

      <div className="bar bar-thick" />

      {/* ── NÁVŠTĚVA ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b-4 border-black">
        {[
          { label: "Otevírací doba", value: "0:00–24:00", note: "Denně, tramvaje jezdí vždy" },
          { label: "Vstupné", value: "Zdarma", note: "Součástí jízdného DPP" },
        ].map((item, i) => (
          <div key={i} className="px-6 py-6" style={{ borderRight: i === 0 ? "4px solid black" : "none" }}>
            <div className="type-label mb-2" style={{ color: "#888" }}>{item.label}</div>
            <div className="font-black leading-none" style={{ fontSize: "clamp(20px, 3vw, 36px)", letterSpacing: "-0.02em" }}>
              {item.value}
            </div>
            <div className="type-label mt-2" style={{ color: "#aaa", textTransform: "none", letterSpacing: "0.04em" }}>
              {item.note}
            </div>
          </div>
        ))}
      </div>

      {/* ── JEDNO PRAVIDLO ────────────────────────────────────────────────── */}
      <div className="px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-2" style={{ maxWidth: 800 }}>
          <div>
            <div className="type-label mb-4" style={{ color: DPP }}>Kontakt</div>
            <p style={{ fontWeight: 400, fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
              Pošlete nám: název zastávky, číslo linky, datum instalace, fotku. Zařadíme vás do aktuální výstavy.
            </p>
            <a
              href="mailto:GalerieOznacnik@protonmail.com"
              className="font-black"
              style={{ fontSize: "clamp(15px, 2vw, 22px)", color: DPP, textDecoration: "underline", letterSpacing: "-0.01em" }}
            >
              GalerieOznacnik@protonmail.com
            </a>
          </div>
          
        </div>
      </div>

      <div className="bar bar-thick" />
    </div>
  );
}
