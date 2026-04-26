import Link from "next/link";
import { getExhibitionsByStatus } from "@/lib/db";
import type { Exhibition } from "@/types";

export const metadata = {
  title: "Archiv výstav — Galerie Označník",
};

function durationDays(openedAt: string, closedAt: string): number {
  const ms = new Date(closedAt).getTime() - new Date(openedAt).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function ArchiveRow({ ex }: { ex: Exhibition }) {
  const days = ex.closedAt ? durationDays(ex.openedAt, ex.closedAt) : null;

  return (
    <Link
      href={`/vystavy/${ex.id}`}
      className="block no-underline group border-b-4 border-black"
      style={{ "--ex-color": ex.color } as React.CSSProperties}
    >
      <div className="px-6 py-6 flex items-center gap-6">
        {/* Line number */}
        <div
          className="ex-text font-black leading-none shrink-0 tabular-nums"
          style={{ fontSize: "clamp(32px, 4vw, 52px)", letterSpacing: "-0.04em", lineHeight: 1, minWidth: "2ch" }}
        >
          {ex.lineNumbers.join(" · ")}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          {ex.artist && ex.artist !== "—" && (
            <div className="type-label mb-1" style={{ color: "#888" }}>{ex.artist}</div>
          )}
          <div
            className="font-black uppercase leading-none"
            style={{ fontSize: "clamp(18px, 3vw, 36px)", letterSpacing: "-0.04em", lineHeight: 0.95 }}
          >
            {ex.subtitle ?? ex.title}
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="type-label" style={{ color: "#aaa" }}>
              {new Date(ex.openedAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" })}
              {ex.closedAt && (
                <> — {new Date(ex.closedAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" })}</>
              )}
            </span>
            <span className="type-label" style={{ color: "#ddd" }}>·</span>
            <span className="type-label" style={{ color: "#aaa" }}>
              {ex.title.replace(/^LINKA \d+:\s*/, "")}
            </span>
          </div>
        </div>

        {/* Duration */}
        {days !== null && (
          <div className="shrink-0 text-right">
            <div
              className="font-black leading-none tabular-nums"
              style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.04em", color: "#ddd" }}
            >
              {days}
            </div>
            <div className="type-label mt-1" style={{ color: "#bbb" }}>
              {days === 1 ? "den" : days < 5 ? "dny" : "dní"}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export default async function ArchivPage() {
  let past: Exhibition[] = [];

  try {
    past = await getExhibitionsByStatus("past");
  } catch {
    // static fallback
  }

  return (
    <div>
      <div className="px-6 pt-12 pb-8">
        <div className="type-label mb-4" style={{ color: "#bbb" }}>Galerie Označník</div>
        <div
          className="font-black uppercase leading-none"
          style={{ fontSize: "clamp(48px, 10vw, 120px)", letterSpacing: "-0.04em", lineHeight: 0.85 }}
        >
          Archiv<br />výstav
        </div>
      </div>

      <div className="bar bar-thick" />

      {past.length === 0 ? (
        <div className="px-6 py-16">
          <p className="type-label" style={{ color: "#aaa" }}>Žádné proběhlé výstavy.</p>
        </div>
      ) : (
        <>
          {/* Header row */}
          <div
            className="px-6 py-3 flex items-center gap-6 border-b-4 border-black"
            style={{ background: "#000", color: "#fff" }}
          >
            <div className="type-label shrink-0" style={{ minWidth: "2ch", fontSize: 10 }}>L.</div>
            <div className="flex-1 type-label" style={{ fontSize: 10 }}>Výstava</div>
            <div className="shrink-0 type-label text-right" style={{ fontSize: 10 }}>Vydrželo</div>
          </div>

          {past.map((ex) => (
            <ArchiveRow key={ex.id} ex={ex} />
          ))}

          <div className="px-6 py-6 border-b-4 border-black">
            <span className="type-label" style={{ color: "#bbb" }}>
              {past.length} {past.length === 1 ? "výstava" : past.length < 5 ? "výstavy" : "výstav"} celkem
            </span>
          </div>
        </>
      )}

      <div className="bar bar-thick" />
    </div>
  );
}
