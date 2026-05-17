"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { distanceMetres, type StopWithAnnotation } from "@/lib/scouting";
import { authorColor, type AuthorWithProgress, type Claim } from "@/lib/install";

type Filter = "all" | "free" | "claimed";

export default function InstallList({
  token,
  readyStops,
  authors,
  claims,
}: {
  token: string;
  readyStops: StopWithAnnotation[];
  authors: AuthorWithProgress[];
  claims: Claim[];
}) {
  const [me, setMe] = useState<{ lat: number; lon: number } | null>(null);
  const [filter, setFilter] = useState<Filter>("free");
  const [query, setQuery] = useState("");

  const claimByStop = useMemo(() => {
    const m = new Map<string, Claim>();
    for (const c of claims) m.set(c.stop_id, c);
    return m;
  }, [claims]);

  const authorById = useMemo(() => {
    const m = new Map<string, AuthorWithProgress>();
    for (const a of authors) m.set(a.id, a);
    return m;
  }, [authors]);

  const allAuthorIds = useMemo(() => authors.map((a) => a.id), [authors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = readyStops.filter((s) => {
      const claimed = claimByStop.has(s.stop_id);
      if (filter === "free" && claimed) return false;
      if (filter === "claimed" && !claimed) return false;
      if (q && !s.stop_name.toLowerCase().includes(q)) return false;
      return true;
    });
    if (me) {
      list = [...list].sort((a, b) => distanceMetres(me, a) - distanceMetres(me, b));
    } else {
      list = [...list].sort((a, b) => a.stop_name.localeCompare(b.stop_name, "cs"));
    }
    return list;
  }, [readyStops, claimByStop, filter, query, me]);

  const counts = useMemo(() => {
    let free = 0, claimed = 0;
    for (const s of readyStops) {
      if (claimByStop.has(s.stop_id)) claimed++;
      else free++;
    }
    return { all: readyStops.length, free, claimed };
  }, [readyStops, claimByStop]);

  const totalRequested = useMemo(
    () => authors.reduce((acc, a) => acc + (a.requested_stops ?? 0), 0),
    [authors]
  );
  const totalClaimed = claims.length;

  const findMe = () => {
    if (!navigator.geolocation) {
      alert("Geolokace není dostupná");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setMe({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => alert(`GPS selhalo: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };


  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "#000",
          color: "#fff",
          padding: "10px 16px",
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
            ← Scout
          </Link>
          <div className="font-black uppercase" style={{ letterSpacing: "0.12em", fontSize: 12 }}>
            Vernisáž
          </div>
          <Link
            href={`/scouting/${token}/install/authors`}
            className="font-black uppercase no-underline"
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "#fff",
              border: "2px solid #fff",
              padding: "4px 8px",
            }}
          >
            Autoři
          </Link>
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hledat zastávku…"
          style={{
            width: "100%",
            padding: "10px 12px",
            marginTop: 10,
            border: "2px solid #E3000B",
            background: "#000",
            color: "#fff",
            fontFamily: "inherit",
            fontSize: 14,
            fontWeight: 700,
            outline: "none",
          }}
        />

        <div className="flex gap-2 mt-2 flex-wrap items-center">
          {(["free", "all", "claimed"] as Filter[]).map((f) => {
            const active = filter === f;
            const label = f === "free" ? "Volné" : f === "claimed" ? "Obsazené" : "Vše";
            const color = f === "free" ? "#00B341" : f === "claimed" ? "#FFB800" : "#fff";
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={pillStyle(active, color)}
              >
                {label} {counts[f]}
              </button>
            );
          })}
          <button
            onClick={findMe}
            style={{
              ...pillStyle(!!me, "#1e88ff"),
              marginLeft: "auto",
            }}
          >
            {me ? "U mě" : "Najít mě"}
          </button>
        </div>
      </header>

      {/* Top summary */}
      <section
        style={{
          padding: "14px 16px",
          background: "#fff",
          borderBottom: "3px solid #000",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        <div>
          <div style={eyebrow}>Claimnuto</div>
          <div className="font-black" style={{ fontSize: 32, letterSpacing: "-0.04em", lineHeight: 1 }}>
            {totalClaimed} <span style={{ color: "#888", fontSize: 20 }}>/ {totalRequested}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={eyebrow}>Ready zastávek</div>
          <div className="font-black" style={{ fontSize: 32, letterSpacing: "-0.04em", lineHeight: 1 }}>
            {readyStops.length}
          </div>
        </div>
      </section>


      {/* List */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {filtered.map((s) => {
          const claim = claimByStop.get(s.stop_id);
          const author = claim ? authorById.get(claim.author_id) : null;
          const color = author ? authorColor(author.id, allAuthorIds) : "#fff";
          const distance = me ? Math.round(distanceMetres(me, s)) : null;
          return (
            <li key={s.stop_id} style={{ borderBottom: "2px solid #ddd" }}>
              <Link
                href={`/scouting/${token}/install/${s.stop_id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  textDecoration: "none",
                  color: "#000",
                  background: claim ? color : "#fff",
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    background: claim ? "#000" : "#00B341",
                    borderRadius: 3,
                    border: "2px solid #000",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="font-black"
                    style={{
                      fontSize: 17,
                      letterSpacing: "-0.01em",
                      color: claim ? colorContrast(color) : "#000",
                    }}
                  >
                    {s.stop_name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      marginTop: 2,
                      color: claim ? colorContrast(color, 0.7) : "#888",
                    }}
                  >
                    {claim && author
                      ? `${author.name} · ${claim.work_ids.length} ${claim.work_ids.length === 1 ? "dílo" : claim.work_ids.length < 5 ? "díla" : "děl"}`
                      : "VOLNÁ"}
                    {distance != null && (
                      <> · {distance < 1000 ? `${distance} m` : `${(distance / 1000).toFixed(1)} km`}</>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: claim ? colorContrast(color, 0.7) : "#ccc",
                  }}
                >
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: "#888", fontSize: 14 }}>
          Žádné zastávky neodpovídají filtru.
        </div>
      )}

      <div style={{ height: 80 }} />
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

function pillStyle(active: boolean, color: string): React.CSSProperties {
  return {
    padding: "6px 10px",
    fontSize: 11,
    letterSpacing: "0.08em",
    fontWeight: 700,
    textTransform: "uppercase",
    fontFamily: "inherit",
    border: `2px solid ${color}`,
    background: active ? color : "transparent",
    color: active ? "#000" : color,
    cursor: "pointer",
  };
}

// Najít kontrastní barvu textu (černá / bílá) na barevném pozadí
function colorContrast(bg: string, opacity = 1): string {
  const hex = bg.replace("#", "");
  if (hex.length !== 6) return "#000";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance > 0.55) {
    return opacity < 1 ? `rgba(0,0,0,${opacity})` : "#000";
  }
  return opacity < 1 ? `rgba(255,255,255,${opacity})` : "#fff";
}
