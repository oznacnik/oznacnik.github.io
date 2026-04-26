"use client";
import type { ExhibitionStation, Station } from "@/types";

interface StopDiagramProps {
  exhibitionStations: ExhibitionStation[];
  stationsMap: Record<string, Station>;
  color: string;
}

export default function StopDiagram({
  exhibitionStations,
  stationsMap,
  color,
}: StopDiagramProps) {
  if (exhibitionStations.length === 0) {
    return (
      <div className="type-label py-4" style={{ color: "#aaa" }}>
        Žádné zastávky
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{ "--ex-color": color } as React.CSSProperties}
    >
      {exhibitionStations.map((es, i) => {
        const station = stationsMap[es.stationId];
        const isLast = i === exhibitionStations.length - 1;
        const active = es.hasInstallation;

        return (
          <div key={es.id} className="flex items-stretch gap-4">
            {/* Diagram column */}
            <div className="flex flex-col items-center" style={{ width: 24 }}>
              <div
                className={`stop-dot${active ? " stop-dot-active" : ""}`}
                style={active ? { background: color, borderColor: color } : {}}
              />
              {!isLast && (
                <div
                  className="stop-line-seg"
                  style={active ? { background: color } : {}}
                />
              )}
            </div>

            {/* Label column */}
            <div
              className="pb-6 flex-1"
              style={{ paddingBottom: isLast ? 0 : "1.5rem" }}
            >
              <div
                className="font-black uppercase leading-none"
                style={{
                  fontSize: "clamp(13px, 1.8vw, 16px)",
                  letterSpacing: "-0.01em",
                  color: active ? color : "var(--text)",
                }}
              >
                {station?.name ?? es.stationId}
              </div>
              {es.workTitle && (
                <div className="type-label mt-1" style={{ color: "#888", textTransform: "none", letterSpacing: "0.04em" }}>
                  {es.workTitle}
                </div>
              )}
              {es.notes && (
                <div className="type-label mt-0.5" style={{ color: "#aaa", textTransform: "none", letterSpacing: "0.02em" }}>
                  {es.notes}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
