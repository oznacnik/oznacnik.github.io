import { notFound } from "next/navigation";
import Link from "next/link";
import { getExhibition, getExhibitionStations, getStationsByIds, getAllExhibitions } from "@/lib/db";

export async function generateStaticParams() {
  const exhibitions = await getAllExhibitions();
  return exhibitions.map((e) => ({ id: e.id }));
}
import StopDiagram from "@/components/StopDiagram";
import type { Station } from "@/types";

function renderMarkdown(text: string): string {
  // Minimal markdown: bold, italic, headings, paragraphs
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<h[123])(.+)$/gm, (m) => m.startsWith('<') ? m : m)
    .replace(/^(.+)$/gm, (m) => {
      if (m.startsWith('<h') || m.startsWith('<p') || m.startsWith('</p')) return m;
      return m;
    });
}

export default async function ExhibitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let exhibition, exStations, stations: Station[] = [];

  try {
    [exhibition, exStations] = await Promise.all([
      getExhibition(id),
      getExhibitionStations(id),
    ]);

    if (!exhibition) return notFound();

    const stationIds = exStations.map((s) => s.stationId);
    stations = await getStationsByIds(stationIds);
  } catch {
    return notFound();
  }

  const stationsMap = Object.fromEntries(stations.map((s) => [s.id, s]));
  const installationCount = exStations.filter((s) => s.hasInstallation).length;
  const startStation = stationsMap[exhibition.startStationId];
  const endStation = stationsMap[exhibition.endStationId];

  const statusLabel =
    exhibition.status === "current"
      ? "Probíhá"
      : exhibition.status === "upcoming"
      ? "Připravuje se"
      : "Ukončeno";

  return (
    <div style={{ "--ex-color": exhibition.color } as React.CSSProperties}>
      {/* Exhibition color bar */}
      <div className="h-4 ex-bg" />

      {/* Header */}
      <div className="px-6 pt-10 pb-8" style={{ background: exhibition.color }}>
        <div className="flex items-start gap-6">
          {/* Vertical line number */}
          <div
            className="rotate-label font-black shrink-0"
            style={{
              fontSize: "clamp(14px, 2vw, 20px)",
              letterSpacing: "0.08em",
              color: "rgba(0,0,0,0.4)",
            }}
          >
            LINKA {exhibition.lineNumbers.join(" · ")}
          </div>

          <div className="flex-1">
            {/* Artist — most prominent */}
            {exhibition.artist && exhibition.artist !== "—" && (
              <div
                className="font-black uppercase leading-none text-white mb-2"
                style={{ fontSize: "clamp(13px, 1.8vw, 18px)", letterSpacing: "0.12em", opacity: 0.7 }}
              >
                {exhibition.artist}
              </div>
            )}

            {/* Exhibition name */}
            <h1
              className="font-black uppercase leading-none text-white"
              style={{
                fontSize: "clamp(40px, 7vw, 96px)",
                letterSpacing: "-0.04em",
                lineHeight: 0.88,
              }}
            >
              {exhibition.subtitle ?? exhibition.title}
            </h1>

            {/* Install date — prominent */}
            <div className="mt-5 flex items-center gap-3">
              <div
                className="font-black text-white"
                style={{ fontSize: "clamp(22px, 3vw, 36px)", letterSpacing: "-0.02em", lineHeight: 1 }}
              >
                {new Date(exhibition.openedAt).toLocaleDateString("cs-CZ", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <div className="type-label" style={{ color: "rgba(255,255,255,0.55)" }}>
                {statusLabel}
                {exhibition.closedAt
                  ? ` — ${new Date(exhibition.closedAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })}`
                  : exhibition.status === "current"
                  ? " — probíhá"
                  : ""}
              </div>
            </div>

            {/* Tram line subtitle */}
            <div className="mt-3 type-label" style={{ color: "rgba(0,0,0,0.4)" }}>
              {exhibition.title}
            </div>
          </div>
        </div>
      </div>

      <div className="bar bar-thick" />

      {/* Main content */}
      <div className="px-6 py-10 grid grid-cols-1 gap-0 lg:grid-cols-[1fr_400px]">
        {/* Left: curatorial text + visit info */}
        <div className="lg:pr-12 lg:border-r-4 lg:border-black">
          {/* Metadata strip */}
          <div className="flex flex-wrap gap-x-8 gap-y-4 mb-8 pb-6 border-b-4 border-black">
            <div>
              <div className="type-label mb-1" style={{ color: "#888" }}>Linka</div>
              <div
                className="font-black ex-text"
                style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.03em", lineHeight: 1 }}
              >
                {exhibition.lineNumbers.join(" · ")}
              </div>
            </div>
            <div>
              <div className="type-label mb-1" style={{ color: "#888" }}>Úsek</div>
              <div className="type-md" style={{ fontSize: "clamp(16px, 2vw, 20px)" }}>
                {startStation?.name ?? "—"} — {endStation?.name ?? "—"}
              </div>
            </div>
            <div>
              <div className="type-label mb-1" style={{ color: "#888" }}>Díla</div>
              <div
                className="font-black ex-text"
                style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.03em", lineHeight: 1 }}
              >
                {installationCount * 2}
              </div>
            </div>
          </div>

          {/* Artist bio */}
          {exhibition.artistBio && (
            <div className="mb-10">
              <div className="type-label mb-4" style={{ color: "#888" }}>O umělci</div>
              <p className="prose-gallery">{exhibition.artistBio}</p>
            </div>
          )}

          {/* Curatorial text */}
          {exhibition.curatorialText && (
            <div className="mb-10">
              <div className="type-label mb-4" style={{ color: "#888" }}>Kurátorský text</div>
              <div
                className="prose-gallery"
                dangerouslySetInnerHTML={{
                  __html: `<p>${renderMarkdown(exhibition.curatorialText)}</p>`,
                }}
              />
            </div>
          )}

        </div>

        {/* Right: stop diagram */}
        <div className="mt-10 lg:mt-0 lg:pl-12">
          <div className="type-label mb-6" style={{ color: "#888" }}>
            Plán výstavy — {exStations.length} zastávek
          </div>
          <StopDiagram
            exhibitionStations={exStations}
            stationsMap={stationsMap}
            color={exhibition.color}
          />
        </div>
      </div>

      <div className="bar bar-thick" />
      <div className="px-6 py-4 flex justify-between items-center">
        <Link href="/" className="nav-link">← Všechny výstavy</Link>
        <Link href="/o-galerii" className="nav-link">Jak instalovat →</Link>
      </div>
      <div className="bar" />
    </div>
  );
}
