import Link from "next/link";
import { assertToken, fetchStopsWithAnnotations } from "@/lib/scouting";
import { fetchAuthors, fetchWorks } from "@/lib/install";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vernisáž — scany",
  robots: { index: false, follow: false },
};

interface ScanRow {
  id: number;
  qr_index: number;
  scanned_at: string;
  user_agent: string | null;
  referrer: string | null;
}

interface LabelRow {
  qr_index: number;
  work_id: string;
  author_id: string;
  stop_id: string | null;
}

export default async function ScansPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  assertToken(token);

  const [stops, authors, works, scansRes, labelsRes] = await Promise.all([
    fetchStopsWithAnnotations(),
    fetchAuthors(),
    fetchWorks(),
    supabase.from("oznacnik_qr_scans").select("*").order("scanned_at", { ascending: false }),
    supabase.from("oznacnik_qr_labels").select("qr_index, work_id, author_id, stop_id"),
  ]);

  const scans = (scansRes.data ?? []) as ScanRow[];
  const labels = (labelsRes.data ?? []) as LabelRow[];

  const labelById = new Map(labels.map((l) => [l.qr_index, l]));
  const stopById = new Map(stops.map((s) => [s.stop_id, s]));
  const authorById = new Map(authors.map((a) => [a.id, a]));
  const workById = new Map(works.map((w) => [w.id, w]));

  // ── Agregace ─────────────────────────────────────────────────────────
  const scansByQr = new Map<number, number>();
  const scansByStop = new Map<string, number>();
  const scansByAuthor = new Map<string, number>();
  for (const s of scans) {
    const label = labelById.get(s.qr_index);
    scansByQr.set(s.qr_index, (scansByQr.get(s.qr_index) ?? 0) + 1);
    if (label?.stop_id) scansByStop.set(label.stop_id, (scansByStop.get(label.stop_id) ?? 0) + 1);
    if (label?.author_id) scansByAuthor.set(label.author_id, (scansByAuthor.get(label.author_id) ?? 0) + 1);
  }

  const topStops = [...scansByStop.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  const topAuthors = [...scansByAuthor.entries()].sort((a, b) => b[1] - a[1]);
  const topQrs = [...scansByQr.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);

  // Scany za posledních 24h
  const last24h = scans.filter((s) => {
    const t = new Date(s.scanned_at).getTime();
    return Date.now() - t < 24 * 60 * 60 * 1000;
  });

  // Labels stav: kolik je pre-printed vs spárováno vs scanned
  const totalLabels = labels.length;
  const pairedLabels = labels.filter((l) => l.stop_id).length;
  const scannedAtLeastOnce = scansByQr.size;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", paddingBottom: 40 }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "#000",
          color: "#fff",
          padding: "10px 16px",
          zIndex: 10,
          borderBottom: "4px solid #E3000B",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          href={`/scouting/${token}/install`}
          className="font-black uppercase no-underline"
          style={{ fontSize: 11, letterSpacing: "0.12em", color: "#aaa" }}
        >
          ← Vernisáž
        </Link>
        <div className="font-black uppercase" style={{ letterSpacing: "0.12em", fontSize: 12 }}>
          Scany QR popisků
        </div>
      </header>

      {/* Top stats grid */}
      <section
        style={{
          padding: 16,
          background: "#fff",
          borderBottom: "3px solid #000",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 16,
        }}
      >
        <BigNum label="Scanů celkem" value={scans.length} />
        <BigNum label="Za 24 h" value={last24h.length} accent="#E3000B" />
        <BigNum label="Unikátních QR" value={scannedAtLeastOnce} />
        <BigNum
          label="Spárovaných labels"
          value={pairedLabels}
          sub={`z ${totalLabels} vytištěných`}
        />
      </section>

      {/* Top stops */}
      <section style={{ padding: 16, background: "#fff", borderBottom: "3px solid #000" }}>
        <h2 style={h2}>Top zastávky podle scanů</h2>
        {topStops.length === 0 ? (
          <div style={empty}>Zatím žádné scany.</div>
        ) : (
          <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {topStops.map(([stopId, count], i) => {
              const stop = stopById.get(stopId);
              return (
                <li
                  key={stopId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      fontSize: 11,
                      color: "#888",
                      fontWeight: 700,
                      fontFamily: "monospace",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-black" style={{ flex: 1, fontSize: 14 }}>
                    {stop?.stop_name ?? stopId}
                  </span>
                  <span
                    className="font-black"
                    style={{
                      fontSize: 22,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {count}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Per autor */}
      {topAuthors.length > 0 && (
        <section style={{ padding: 16, background: "#fff", borderBottom: "3px solid #000" }}>
          <h2 style={h2}>Scany podle autora</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {topAuthors.map(([authorId, count]) => {
              const a = authorById.get(authorId);
              return (
                <li
                  key={authorId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <span className="font-black" style={{ flex: 1, fontSize: 14 }}>
                    {a?.name ?? authorId}
                  </span>
                  <span
                    className="font-black"
                    style={{ fontSize: 20, letterSpacing: "-0.02em" }}
                  >
                    {count}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Top QR popisků */}
      {topQrs.length > 0 && (
        <section style={{ padding: 16, background: "#fff", borderBottom: "3px solid #000" }}>
          <h2 style={h2}>Top QR popisky</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {topQrs.map(([qrIndex, count]) => {
              const label = labelById.get(qrIndex);
              const work = label ? workById.get(label.work_id) : null;
              const stop = label?.stop_id ? stopById.get(label.stop_id) : null;
              const author = label ? authorById.get(label.author_id) : null;
              return (
                <li
                  key={qrIndex}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: "monospace",
                        fontWeight: 700,
                        minWidth: 50,
                      }}
                    >
                      #{String(qrIndex).padStart(3, "0")}
                    </span>
                    <span style={{ flex: 1, fontSize: 13 }}>
                      <strong>{work?.title ?? "?"}</strong>{" "}
                      <span style={{ color: "#888" }}>· {author?.name ?? "?"}</span>{" "}
                      {stop && (
                        <span style={{ color: "#aaa" }}>· {stop.stop_name}</span>
                      )}
                    </span>
                    <span className="font-black" style={{ fontSize: 18 }}>
                      {count}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Posledních 30 scanů */}
      <section style={{ padding: 16, background: "#fff" }}>
        <h2 style={h2}>Posledních {Math.min(30, scans.length)} scanů</h2>
        {scans.length === 0 ? (
          <div style={empty}>Žádné scany.</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {scans.slice(0, 30).map((s) => {
              const label = labelById.get(s.qr_index);
              const stop = label?.stop_id ? stopById.get(label.stop_id) : null;
              const work = label ? workById.get(label.work_id) : null;
              const t = new Date(s.scanned_at);
              return (
                <li
                  key={s.id}
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid #eee",
                    fontSize: 12,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ color: "#888", fontFamily: "monospace", minWidth: 80 }}>
                      {t.toLocaleString("cs-CZ", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
                      #{String(s.qr_index).padStart(3, "0")}
                    </span>
                    <span style={{ flex: 1, color: "#444" }}>
                      {work?.title ?? "?"}
                      {stop && <span style={{ color: "#aaa" }}> @ {stop.stop_name}</span>}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

const h2: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#888",
  marginBottom: 14,
};

const empty: React.CSSProperties = {
  padding: "20px 0",
  textAlign: "center",
  color: "#aaa",
  fontSize: 13,
};

function BigNum({
  label,
  value,
  accent = "#000",
  sub,
}: {
  label: string;
  value: number;
  accent?: string;
  sub?: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#888",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        className="font-black"
        style={{
          fontSize: 36,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: accent,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}
