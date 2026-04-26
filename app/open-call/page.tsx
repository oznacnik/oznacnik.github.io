export const metadata = {
  title: "Výzva Zlobit — Galerie Označník",
};

export default function OpenCallPage() {
  return (
    <div>

      {/* Hero */}
      <section className="px-6 pt-12 pb-0">
        <div className="type-label mb-4" style={{ color: "#bbb" }}>Galerie Označník — Praha</div>
        <div
          className="font-black uppercase leading-none"
          style={{ fontSize: "clamp(64px, 14vw, 200px)", letterSpacing: "-0.05em", lineHeight: 0.85 }}
        >
          VÝZVA<br />
          <span style={{ color: "#E3000B" }}>ZLOBIT</span>
        </div>
      </section>

      <div className="bar bar-thick mt-12" />

      {/* Perex */}
      <section className="px-6 py-12 border-b-4 border-black">
        <p
          className="font-black leading-none uppercase"
          style={{ fontSize: "clamp(28px, 5vw, 64px)", letterSpacing: "-0.04em", lineHeight: 0.9, maxWidth: 900 }}
        >
          Kolektivní výstava na tramvajových zastávkách v Praze. Přidejte se!
        </p>
      </section>

      {/* Detail bloky */}
      <section>
        {[
          {
            num: "08",
            title: "Co",
            text: "Výstavní prostory jsou prázdné reklamní označníky tramvajových zastávek. Každý úsek linky je samostatná výstava. Každý dostane blok zastávek na jedné lince.",
          },
          {
            num: "12",
            title: "Formát",
            text: "A3 na šířku. Rozměr je definován označníkem zastávky.",
          },
          {
            num: "35",
            title: "Instalace",
            text: "Společná vernisáž. Projdeme trasu a každý nainstaluje svá díla do označníků.",
          },
          {
            num: "22",
            title: "Životnost",
            text: "Přibližně týden. Výstavu sundá DPP. Díla žijí ve veřejném prostoru a sdílejí jeho osud.",
          },
          {
            num: "18",
            title: "Přihláška",
            text: null,
          },
        ].map((item) => (
          <div key={item.num} className="flex border-b-4 border-black">
            <div
              className="font-black leading-none pt-8 pb-8 shrink-0 border-r-4 border-black flex items-start justify-start pl-6"
              style={{ fontSize: "clamp(32px, 4vw, 52px)", letterSpacing: "-0.04em", color: "#E3000B", width: "clamp(70px, 10vw, 100px)" }}
            >
              {item.num}
            </div>
            <div className="px-8 py-8 flex-1">
              <div
                className="font-black uppercase mb-3"
                style={{ fontSize: "clamp(18px, 2.5vw, 28px)", letterSpacing: "-0.02em" }}
              >
                {item.title}
              </div>
              {item.text ? (
                <p className="type-body" style={{ fontWeight: 400, maxWidth: 640 }}>{item.text}</p>
              ) : (
                <div className="flex items-start gap-12 flex-wrap">
                  <div>
                    <a
                      href="mailto:GalerieOznacnik@protonmail.com"
                      className="font-black"
                      style={{ fontSize: "clamp(14px, 2vw, 22px)", color: "#E3000B", textDecoration: "underline", letterSpacing: "-0.03em" }}
                    >
                      GalerieOznacnik@protonmail.com
                    </a>
                  </div>
                  <div>
                    <div className="type-label mb-1" style={{ color: "#888" }}>Deadline</div>
                    <div className="font-black" style={{ fontSize: "clamp(16px, 2vw, 24px)", letterSpacing: "-0.03em" }}>
                      25. 4. 2026
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      <div className="bar bar-thick" />

      {/* PDF download */}
      <div className="px-6 py-6 flex items-center justify-between border-b-4 border-black">
        <span className="type-label" style={{ color: "#aaa" }}>Verze pro tisk / sdílení</span>
        <div className="flex gap-4">
          <a
            href="/open-call.svg"
            download="vyzva-zlobit.svg"
            className="font-black no-underline"
            style={{ fontSize: "clamp(13px, 1.5vw, 16px)", letterSpacing: "-0.01em", color: "#E3000B", border: "3px solid #E3000B", padding: "8px 16px" }}
          >
            SVG →
          </a>
          <a
            href="/api/open-call-pdf-v2"
            target="_blank"
            className="font-black no-underline"
            style={{ fontSize: "clamp(13px, 1.5vw, 16px)", letterSpacing: "-0.01em", color: "#999", border: "3px solid #ccc", padding: "8px 16px" }}
          >
            PDF z webu
          </a>
        </div>
      </div>

      <div className="bar bar-thick" />
    </div>
  );
}
