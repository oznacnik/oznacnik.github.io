import Link from "next/link";
import { assertToken, fetchStopsWithAnnotations } from "@/lib/scouting";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scouting — statistiky",
  robots: { index: false, follow: false },
};

export default async function StatsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  assertToken(token);

  const stops = await fetchStopsWithAnnotations();

  const agg = (status: string) => {
    const ss = stops.filter((s) => (s.annotation?.status ?? "untouched") === status);
    return {
      stops: ss.length,
      total: ss.reduce((a, s) => a + (s.annotation?.oznacniku_total ?? 0), 0),
      usable: ss.reduce((a, s) => a + (s.annotation?.oznacniku_usable ?? 0), 0),
    };
  };

  const ready = agg("ready");
  const pending = agg("pending");
  const scouted = agg("scouted");
  const blocked = agg("blocked");
  const untouched = agg("untouched");

  const totalUsable = ready.usable + pending.usable;
  const totalStops = ready.stops + pending.stops;

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#000" }}>
      <header
        style={{
          background: "#000",
          color: "#fff",
          padding: "10px 16px",
          borderBottom: "4px solid #E3000B",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          href={`/scouting/${token}`}
          className="font-black uppercase no-underline"
          style={{ fontSize: 11, letterSpacing: "0.12em", color: "#aaa" }}
        >
          ← Seznam
        </Link>
        <div className="font-black uppercase" style={{ letterSpacing: "0.12em", fontSize: 12 }}>
          Statistiky
        </div>
      </header>

      {/* ── Σ Jisté + Možné ──────────────────────────────────────────── */}
      <section
        style={{
          padding: "28px 24px",
          background: "#000",
          color: "#fff",
          borderBottom: "4px solid #E3000B",
        }}
      >
        <div style={{ ...eyebrow, color: "#888" }}>Σ Jisté + Možné</div>
        <BigPair stops={totalStops} oznacniku={totalUsable} accent="#fff" />
      </section>

      {/* ── Hlavní hrdinové: zelené + modré ─────────────────────────── */}
      <HeroBlock
        label="Jisté (zelené)"
        accent="#00B341"
        textOnAccent="#000"
        stops={ready.stops}
        oznacniku={ready.usable}
        oznacnikuTotal={ready.total}
      />
      <HeroBlock
        label="Možné (modré)"
        accent="#2962FF"
        textOnAccent="#fff"
        stops={pending.stops}
        oznacniku={pending.usable}
        oznacnikuTotal={pending.total}
      />

      {/* ── Ostatní (deprioritizované) ──────────────────────────────── */}
      <section style={{ padding: "20px 16px 30px" }}>
        <div style={eyebrow}>Ostatní (vyřazené nebo netknuté)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
          <MutedRow
            label="Zhodnoceno (žluté, blbé)"
            color="#FFB800"
            stops={scouted.stops}
            oznacniku={scouted.usable}
          />
          <MutedRow
            label="Nepoužitelné (červené)"
            color="#E3000B"
            stops={blocked.stops}
            oznacniku={blocked.usable}
          />
          <MutedRow
            label="Nezhodnoceno"
            color="#bbb"
            stops={untouched.stops}
            oznacniku={null}
          />
          <MutedRow label="Σ Celkem v DB" color="#000" stops={stops.length} oznacniku={null} emphasised />
        </div>
      </section>
    </div>
  );
}

// ── Visual primitives ──────────────────────────────────────────────────

const eyebrow: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  marginBottom: 10,
  color: "#888",
};

function HeroBlock({
  label,
  accent,
  textOnAccent,
  stops,
  oznacniku,
  oznacnikuTotal,
}: {
  label: string;
  accent: string;
  textOnAccent: string;
  stops: number;
  oznacniku: number;
  oznacnikuTotal: number;
}) {
  return (
    <section
      style={{
        padding: "28px 24px 32px",
        background: accent,
        color: textOnAccent,
        borderBottom: "4px solid #000",
      }}
    >
      <div
        style={{
          ...eyebrow,
          color: textOnAccent === "#fff" ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.6)",
          marginBottom: 18,
        }}
      >
        {label}
      </div>
      <BigPair stops={stops} oznacniku={oznacniku} accent={textOnAccent} />
      {oznacnikuTotal !== oznacniku && (
        <div
          style={{
            marginTop: 14,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          z toho {oznacnikuTotal - oznacniku} označníků nepoužitelných
        </div>
      )}
    </section>
  );
}

function BigPair({
  stops,
  oznacniku,
  accent,
}: {
  stops: number;
  oznacniku: number;
  accent: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}
    >
      <Stat label="Zastávek" value={stops} accent={accent} />
      <Stat label="Označníků" value={oznacniku} accent={accent} />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          opacity: 0.7,
        }}
      >
        {label}
      </div>
      <div
        className="font-black"
        style={{
          fontSize: "clamp(56px, 16vw, 120px)",
          letterSpacing: "-0.05em",
          lineHeight: 0.9,
          color: accent,
          marginTop: 6,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MutedRow({
  label,
  color,
  stops,
  oznacniku,
  emphasised = false,
}: {
  label: string;
  color: string;
  stops: number;
  oznacniku: number | null;
  emphasised?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto",
        gap: 16,
        alignItems: "center",
        padding: "10px 14px",
        border: `2px solid ${emphasised ? "#000" : "#ddd"}`,
        background: emphasised ? "#f7f7f7" : "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span
          style={{
            width: 10,
            height: 10,
            background: color,
            borderRadius: 2,
            border: emphasised ? "none" : "1px solid #000",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </span>
      </div>
      <SmallStat label="zast." value={stops} />
      <SmallStat label="ozn." value={oznacniku} />
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: number | null }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 4,
        fontFamily: "inherit",
        minWidth: 70,
        justifyContent: "flex-end",
      }}
    >
      <span
        style={{
          fontSize: 18,
          fontWeight: 900,
          letterSpacing: "-0.02em",
          color: value === null ? "#ccc" : "#000",
        }}
      >
        {value ?? "—"}
      </span>
      <span
        style={{
          fontSize: 10,
          opacity: 0.5,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        {label}
      </span>
    </div>
  );
}
