import Link from "next/link";
import { assertToken, fetchStopsWithAnnotations } from "@/lib/scouting";
import {
  authorColor,
  buildAuthorsWithProgress,
  fetchAuthors,
  fetchClaims,
  fetchWorks,
} from "@/lib/install";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vernisáž — autoři",
  robots: { index: false, follow: false },
};

export default async function AuthorsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  assertToken(token);

  const [stops, authors, works, claims] = await Promise.all([
    fetchStopsWithAnnotations(),
    fetchAuthors(),
    fetchWorks(),
    fetchClaims(),
  ]);

  const list = buildAuthorsWithProgress(authors, works, claims);
  const allAuthorIds = list.map((a) => a.id);
  const stopsById = new Map(stops.map((s) => [s.stop_id, s]));

  // Claimy seskupené po autorech
  const claimsByAuthor = new Map<string, typeof claims>();
  for (const c of claims) {
    if (!claimsByAuthor.has(c.author_id)) claimsByAuthor.set(c.author_id, []);
    claimsByAuthor.get(c.author_id)!.push(c);
  }

  const totalRequested = list.reduce((a, x) => a + (x.requested_stops ?? 0), 0);
  const totalClaimed = claims.length;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header
        style={{
          background: "#000",
          color: "#fff",
          padding: "10px 16px",
          borderBottom: "4px solid #E3000B",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/scouting/${token}/install`}
            className="font-black uppercase no-underline"
            style={{ fontSize: 11, letterSpacing: "0.12em", color: "#aaa" }}
          >
            ← Vernisáž
          </Link>
          <div className="font-black uppercase" style={{ letterSpacing: "0.12em", fontSize: 12 }}>
            Autoři
          </div>
          <div style={{ width: 60 }} />
        </div>
      </header>

      <section
        style={{
          padding: "14px 16px",
          background: "#fff",
          borderBottom: "3px solid #000",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div>
          <div style={eyebrow}>Claimnuto z požadovaných</div>
          <div className="font-black" style={{ fontSize: 32, letterSpacing: "-0.04em", lineHeight: 1 }}>
            {totalClaimed} <span style={{ color: "#888", fontSize: 20 }}>/ {totalRequested}</span>
          </div>
        </div>
        <div className="font-black" style={{ fontSize: 11, color: "#888", letterSpacing: "0.1em" }}>
          {list.length} AUTORŮ
        </div>
      </section>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {list.map((a) => {
          const color = authorColor(a.id, allAuthorIds);
          const quota = a.requested_stops ?? 0;
          const filled = a.claimedStops;
          const pct = quota > 0 ? Math.min(100, Math.round((filled / quota) * 100)) : 0;
          const isFull = quota > 0 && filled >= quota;
          const isOver = quota > 0 && filled > quota;
          const myClaims = claimsByAuthor.get(a.id) ?? [];

          return (
            <li
              key={a.id}
              style={{
                background: "#fff",
                borderBottom: "3px solid #000",
                padding: "14px 16px",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  style={{
                    width: 16,
                    height: 16,
                    background: color,
                    border: "2px solid #000",
                    borderRadius: 3,
                    flexShrink: 0,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div
                    className="font-black"
                    style={{
                      fontSize: 18,
                      letterSpacing: "-0.02em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {a.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#888",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginTop: 2,
                    }}
                  >
                    {a.works.length} unik. {a.works.length === 1 ? "dílo" : a.works.length < 5 ? "díla" : "děl"}
                  </div>
                </div>
                <div
                  className="font-black"
                  style={{
                    fontSize: 28,
                    letterSpacing: "-0.03em",
                    color: isOver ? "#E3000B" : isFull ? "#00B341" : "#000",
                  }}
                >
                  {filled}
                  <span style={{ color: "#888", fontSize: 16 }}> / {quota || "?"}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  marginTop: 10,
                  height: 8,
                  background: "#eee",
                  border: "1px solid #000",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    height: "100%",
                    background: isOver ? "#E3000B" : color,
                    transition: "width 0.2s",
                  }}
                />
              </div>

              {/* Claimnuté zastávky */}
              {myClaims.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {myClaims.map((c) => {
                    const stop = stopsById.get(c.stop_id);
                    return (
                      <Link
                        key={c.stop_id}
                        href={`/scouting/${token}/install/${c.stop_id}`}
                        style={{
                          padding: "4px 8px",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "-0.01em",
                          background: color,
                          color: "#000",
                          border: "2px solid #000",
                          textDecoration: "none",
                        }}
                      >
                        {stop?.stop_name ?? c.stop_id}
                        {c.work_ids.length > 0 && (
                          <span style={{ opacity: 0.7, marginLeft: 4 }}>· {c.work_ids.length}d</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const eyebrow: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#888",
  marginBottom: 4,
};
