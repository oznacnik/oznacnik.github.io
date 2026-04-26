import Link from "next/link";
import { getExhibitionsByStatus } from "@/lib/db";
import type { Exhibition } from "@/types";

function ExhibitionCard({ ex }: { ex: Exhibition }) {
  const route = ex.title.replace(/^LINK[AY]\s[\d·\s]+:\s*/i, "");

  return (
    <Link
      href={`/vystavy/${ex.id}`}
      className="block no-underline group"
      style={{ "--ex-color": ex.color } as React.CSSProperties}
    >
      <div className="frame overflow-hidden">
        <div className="h-2 ex-bg" />
        <div className="p-6">
          {/* Řádek 1: badges + autor */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-1">
              {ex.lineNumbers.map((n) => (
                <div
                  key={n}
                  className="font-black leading-none flex items-center justify-center shrink-0"
                  style={{
                    fontSize: "clamp(11px, 1.4vw, 15px)",
                    letterSpacing: "-0.01em",
                    background: ex.color,
                    color: "#fff",
                    width: "clamp(24px, 3vw, 32px)",
                    height: "clamp(24px, 3vw, 32px)",
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
            {ex.artist && ex.artist !== "—" && (
              <span className="type-label" style={{ color: "#888" }}>{ex.artist}</span>
            )}
          </div>

          {/* Řádek 2: název výstavy — dominantní */}
          <h2
            className="font-black uppercase leading-none"
            style={{ fontSize: "clamp(28px, 5vw, 64px)", letterSpacing: "-0.04em", lineHeight: 0.9 }}
          >
            {ex.subtitle ?? ex.title}
          </h2>

          {/* Řádek 3: trasa · datum */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="type-label" style={{ color: "#aaa" }}>{route}</span>
            <span className="type-label" style={{ color: "#ddd" }}>·</span>
            <span className="type-label" style={{ color: "#aaa" }}>
              {new Date(ex.openedAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function Home() {
  let current: Exhibition[] = [];
  let upcoming: Exhibition[] = [];

  try {
    [current, upcoming] = await Promise.all([
      getExhibitionsByStatus("current"),
      getExhibitionsByStatus("upcoming"),
    ]);
  } catch {
    // static data fallback
  }

  return (
    <div>
      {/* Hero */}
      <section className="px-6 pt-12 pb-0 overflow-hidden">
        <div className="type-label mb-4" style={{ color: "#bbb" }}>
          Praha — Galerie současného umění
        </div>
        <div
          className="font-black uppercase leading-none"
          style={{
            fontSize: "clamp(56px, 12vw, 140px)",
            letterSpacing: "-0.04em",
            lineHeight: 0.85,
          }}
        >
          GALERIE<br />
          <span style={{ color: "#E3000B" }}>OZNAČNÍK</span>
        </div>

        <div className="mt-8 max-w-2xl">
          <div className="bar bar-thin mb-4" />
          <p className="type-body" style={{ fontWeight: 400 }}>
            Výstavní prostory galerie jsou prázdné reklamní rámečky na pražských tramvajových zastávkách.
            Každý úsek linky je samostatná výstava. Cestující projíždí galerií, aniž to ví.
            
          </p>
          <div className="bar bar-thin mt-4" />
        </div>
      </section>

      <div className="bar bar-thick mt-12" />

      {/* Aktuální výstavy */}
      <section className="px-6 py-12">
        <div className="flex items-baseline gap-6 mb-8">
          <h1 className="type-lg">Aktuální výstavy</h1>
          {current.length > 0 && (
            <span
              className="font-black"
              style={{ fontSize: "clamp(40px, 6vw, 80px)", color: "var(--dpp)", letterSpacing: "-0.04em", lineHeight: 1 }}
            >
              {current.length}
            </span>
          )}
        </div>
        {current.length === 0 ? (
          <div className="frame p-8">
            <p className="type-label" style={{ color: "#aaa" }}>Žádné aktuální výstavy</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {current.map((ex) => (
              <ExhibitionCard key={ex.id} ex={ex} />
            ))}
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <>
          <div className="bar" />
          <section className="px-6 py-12">
            <h2 className="type-lg mb-8">Připravované</h2>
            <div className="flex flex-col gap-4">
              {upcoming.map((ex) => (
                <ExhibitionCard key={ex.id} ex={ex} />
              ))}
            </div>
          </section>
        </>
      )}

      <div className="bar bar-thick" />
      <div className="px-6 py-6 flex justify-between items-center">
        <span className="type-label" style={{ color: "#aaa" }}>
          Otevřeno 0:00–24:00 · Vstup zdarma (jízdenka DPP)
        </span>
      </div>
      <div className="bar" />
    </div>
  );
}
