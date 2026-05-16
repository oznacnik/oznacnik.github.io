import Link from "next/link";
import { assertToken, fetchStopsWithAnnotations, STATUS_COLORS, STATUS_LABELS } from "@/lib/scouting";
import type { ScoutingStatus } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scouting — statistiky",
  robots: { index: false, follow: false },
};

const STATUS_ORDER: ScoutingStatus[] = ["ready", "scouted", "pending", "blocked", "untouched"];

export default async function StatsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  assertToken(token);

  const stops = await fetchStopsWithAnnotations();

  // ── Agregace ─────────────────────────────────────────────────────────
  const totalStops = stops.length;
  const customStops = stops.filter((s) => s.stop_id.startsWith("custom-")).length;
  const annotated = stops.filter((s) => s.annotation).length;
  const progressPct = totalStops > 0 ? Math.round((annotated / totalStops) * 100) : 0;

  interface Bucket {
    stops: number;
    total: number;
    usable: number;
    photos: number;
    withNote: number;
  }
  const buckets: Record<string, Bucket> = {};
  for (const s of stops) {
    const status = s.annotation?.status ?? "untouched";
    if (!buckets[status]) buckets[status] = { stops: 0, total: 0, usable: 0, photos: 0, withNote: 0 };
    const b = buckets[status];
    b.stops += 1;
    if (s.annotation?.oznacniku_total != null) b.total += s.annotation.oznacniku_total;
    if (s.annotation?.oznacniku_usable != null) b.usable += s.annotation.oznacniku_usable;
    if (s.annotation?.photo_paths?.length) b.photos += 1;
    if (s.annotation?.notes?.trim()) b.withNote += 1;
  }

  // Distribuce použitelnosti (jen ready+scouted, kde to dává smysl)
  const distribution: Record<string, number> = {};
  for (const s of stops) {
    if (!s.annotation) continue;
    if (s.annotation.status !== "ready" && s.annotation.status !== "scouted") continue;
    const t = s.annotation.oznacniku_total ?? 0;
    const u = s.annotation.oznacniku_usable ?? 0;
    const key = `${u}/${t}`;
    distribution[key] = (distribution[key] ?? 0) + 1;
  }

  const totalReadyUsable = (buckets.ready?.usable ?? 0);
  const totalReadyStops = (buckets.ready?.stops ?? 0);

  // Posledních 10 anotací
  const recent = [...stops]
    .filter((s) => s.annotation)
    .sort((a, b) => (b.annotation!.updated_at).localeCompare(a.annotation!.updated_at))
    .slice(0, 10);

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7", paddingBottom: 60 }}>
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "#000",
          color: "#fff",
          padding: "12px 16px",
          zIndex: 10,
          borderBottom: "4px solid #E3000B",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/scouting/${token}`}
            className="font-black uppercase no-underline"
            style={{ fontSize: 11, letterSpacing: "0.12em", color: "#aaa" }}
          >
            ← Seznam
          </Link>
          <div className="font-black uppercase" style={{ letterSpacing: "0.1em", fontSize: 14 }}>
            Statistiky
          </div>
          <div style={{ width: 60 }} />
        </div>
      </header>

      {/* Hero — progress */}
      <section
        style={{
          padding: 24,
          background: "#fff",
          borderBottom: "4px solid #000",
        }}
      >
        <div style={eyebrowStyle}>Anotováno</div>
        <div
          className="font-black"
          style={{
            fontSize: "clamp(56px, 12vw, 120px)",
            letterSpacing: "-0.05em",
            lineHeight: 0.9,
            color: "#000",
          }}
        >
          {annotated}
          <span style={{ color: "#888", fontSize: "0.5em" }}> / {totalStops}</span>
        </div>
        <div style={{ marginTop: 12, height: 16, background: "#eee", border: "2px solid #000" }}>
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              background: "#000",
              transition: "width 0.3s",
            }}
          />
        </div>
        <div className="flex justify-between mt-2" style={{ fontSize: 11, color: "#888", letterSpacing: "0.08em" }}>
          <span>{progressPct} %</span>
          <span>{totalStops - annotated} ZBÝVÁ</span>
        </div>
      </section>

      {/* Hero — ready usable */}
      <section
        style={{
          padding: 24,
          background: STATUS_COLORS.ready,
          color: "#000",
          borderBottom: "4px solid #000",
        }}
      >
        <div style={{ ...eyebrowStyle, color: "#000", opacity: 0.7 }}>Označníků připravených k použití</div>
        <div className="flex items-baseline gap-4 flex-wrap">
          <div
            className="font-black"
            style={{
              fontSize: "clamp(64px, 14vw, 140px)",
              letterSpacing: "-0.05em",
              lineHeight: 0.9,
            }}
          >
            {totalReadyUsable}
          </div>
          <div className="font-black uppercase" style={{ fontSize: 13, letterSpacing: "0.12em" }}>
            na {totalReadyStops} zastávkách
          </div>
        </div>
      </section>

      {/* Status table */}
      <section
        style={{
          background: "#fff",
          borderBottom: "4px solid #000",
        }}
      >
        <div style={{ padding: "16px 16px 8px 16px" }}>
          <div style={eyebrowStyle}>Stavy</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "inherit",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "3px solid #000" }}>
                <th style={thStyle}>Stav</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Zast.</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Ozn.</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Použit.</th>
                <th style={{ ...thStyle, textAlign: "right" }}>📷</th>
                <th style={{ ...thStyle, textAlign: "right" }}>✍️</th>
              </tr>
            </thead>
            <tbody>
              {STATUS_ORDER.map((status) => {
                const b = buckets[status];
                if (!b || b.stops === 0) return null;
                return (
                  <tr key={status} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ ...tdStyle, display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          background: STATUS_COLORS[status],
                          borderRadius: 3,
                          border: "1px solid #000",
                          flexShrink: 0,
                        }}
                      />
                      {STATUS_LABELS[status]}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 900 }}>{b.stops}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{b.total}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 900, color: STATUS_COLORS[status] }}>
                      {b.usable}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", color: "#888" }}>{b.photos}</td>
                    <td style={{ ...tdStyle, textAlign: "right", color: "#888" }}>{b.withNote}</td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: "3px solid #000", background: "#fafafa" }}>
                <td style={{ ...tdStyle, fontWeight: 900 }}>Σ Anotováno</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 900 }}>
                  {Object.values(buckets).reduce((acc, b) => acc + b.stops, 0) -
                    (buckets.untouched?.stops ?? 0)}
                </td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 900 }}>
                  {Object.values(buckets).reduce((acc, b) => acc + b.total, 0)}
                </td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 900 }}>
                  {Object.values(buckets).reduce((acc, b) => acc + b.usable, 0)}
                </td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 900 }}>
                  {Object.values(buckets).reduce((acc, b) => acc + b.photos, 0)}
                </td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 900 }}>
                  {Object.values(buckets).reduce((acc, b) => acc + b.withNote, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Distribuce použitelnosti */}
      <section style={{ padding: 16, background: "#fff", borderBottom: "4px solid #000" }}>
        <div style={eyebrowStyle}>Distribuce použitelnosti (ready + scouted)</div>
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(distribution)
            .sort((a, b) => b[1] - a[1])
            .map(([key, count]) => (
              <div
                key={key}
                style={{
                  padding: "10px 14px",
                  border: "3px solid #000",
                  background: "#fff",
                }}
              >
                <div
                  className="font-black"
                  style={{ fontSize: 24, letterSpacing: "-0.02em", lineHeight: 1 }}
                >
                  {key}
                </div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  × {count}
                </div>
              </div>
            ))}
          {Object.keys(distribution).length === 0 && (
            <div style={{ color: "#888", fontSize: 13 }}>(žádná data)</div>
          )}
        </div>
      </section>

      {/* Custom stops */}
      {customStops > 0 && (
        <section style={{ padding: 16, background: "#fff", borderBottom: "4px solid #000" }}>
          <div style={eyebrowStyle}>Custom zastávky (vytvořené ručně)</div>
          <div
            className="font-black"
            style={{ fontSize: 36, letterSpacing: "-0.03em", marginTop: 6 }}
          >
            {customStops}
          </div>
        </section>
      )}

      {/* Recent */}
      <section style={{ padding: 16, background: "#fff" }}>
        <div style={eyebrowStyle}>Posledních {recent.length} anotací</div>
        <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0 0" }}>
          {recent.map((s) => {
            const status = s.annotation!.status;
            const updated = new Date(s.annotation!.updated_at);
            const dateStr = updated.toLocaleString("cs-CZ", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <li key={s.stop_id} style={{ borderBottom: "1px solid #eee" }}>
                <Link
                  href={`/scouting/${token}/${s.stop_id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 0",
                    color: "#000",
                    textDecoration: "none",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      background: STATUS_COLORS[status],
                      borderRadius: 2,
                      border: "1px solid #000",
                      flexShrink: 0,
                    }}
                  />
                  <span className="font-black" style={{ fontSize: 14, flex: 1 }}>{s.stop_name}</span>
                  <span style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>{dateStr}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#888",
  marginBottom: 6,
};

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 10,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#888",
  textAlign: "left",
  fontWeight: 700,
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: "-0.01em",
};
