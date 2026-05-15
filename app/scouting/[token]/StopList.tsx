"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  distanceMetres,
  type StopWithAnnotation,
} from "@/lib/scouting";

type StatusFilter = "all" | "untouched" | "scouted" | "ready" | "blocked";

export default function StopList({
  token,
  stops,
}: {
  token: string;
  stops: StopWithAnnotation[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [me, setMe] = useState<{ lat: number; lon: number } | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);

  // Spočítat counts pro filtr badges
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: stops.length, untouched: 0, scouted: 0, ready: 0, blocked: 0 };
    for (const s of stops) {
      const st = s.annotation?.status ?? "untouched";
      c[st] = (c[st] ?? 0) + 1;
    }
    return c;
  }, [stops]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = stops.filter((s) => {
      const status = s.annotation?.status ?? "untouched";
      if (filter !== "all" && status !== filter) return false;
      if (q && !s.stop_name.toLowerCase().includes(q)) return false;
      return true;
    });
    if (sortByDistance && me) {
      list = [...list].sort(
        (a, b) => distanceMetres(me, a) - distanceMetres(me, b)
      );
    }
    return list;
  }, [stops, query, filter, sortByDistance, me]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolokace není dostupná v tomto prohlížeči.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMe({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setSortByDistance(true);
      },
      (err) => alert(`Geolokace selhala: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7" }}>
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
          <div className="font-black uppercase" style={{ letterSpacing: "0.1em", fontSize: 14 }}>
            Scouting
          </div>
          <Link
            href={`/scouting/${token}/map`}
            className="font-black uppercase no-underline"
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "#E3000B",
              border: "2px solid #E3000B",
              padding: "6px 10px",
            }}
          >
            Mapa →
          </Link>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hledat zastávku…"
          style={{
            width: "100%",
            padding: "12px 14px",
            marginTop: 12,
            border: "3px solid #E3000B",
            background: "#000",
            color: "#fff",
            fontFamily: "inherit",
            fontSize: 16,
            fontWeight: 700,
            outline: "none",
          }}
        />
        <div className="flex gap-2 mt-3 flex-wrap">
          {(["all", "untouched", "scouted", "ready", "blocked"] as StatusFilter[]).map((s) => {
            const active = filter === s;
            const color = s === "all" ? "#fff" : STATUS_COLORS[s];
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
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
                }}
              >
                {s === "all" ? "Vše" : STATUS_LABELS[s]} {counts[s] ?? 0}
              </button>
            );
          })}
          <button
            onClick={requestLocation}
            style={{
              padding: "6px 10px",
              fontSize: 11,
              letterSpacing: "0.08em",
              fontWeight: 700,
              textTransform: "uppercase",
              fontFamily: "inherit",
              border: "2px solid #00B341",
              background: sortByDistance && me ? "#00B341" : "transparent",
              color: sortByDistance && me ? "#000" : "#00B341",
              cursor: "pointer",
              marginLeft: "auto",
            }}
          >
            {sortByDistance && me ? "U mě" : "Najít mě"}
          </button>
        </div>
      </header>

      {/* List */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {filtered.map((s) => {
          const status = s.annotation?.status ?? "untouched";
          const color = STATUS_COLORS[status];
          const distance =
            me ? Math.round(distanceMetres(me, s)) : null;
          return (
            <li key={s.stop_id} style={{ borderBottom: "2px solid #ddd" }}>
              <Link
                href={`/scouting/${token}/${s.stop_id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  textDecoration: "none",
                  color: "#000",
                  background: "#fff",
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    background: color,
                    borderRadius: 3,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="font-black"
                    style={{
                      fontSize: 17,
                      letterSpacing: "-0.01em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.stop_name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#888",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      marginTop: 2,
                    }}
                  >
                    {s.annotation?.oznacniku_total != null && (
                      <>
                        {s.annotation.oznacniku_usable ?? "?"}/
                        {s.annotation.oznacniku_total} označníků ·{" "}
                      </>
                    )}
                    {STATUS_LABELS[status]}
                    {distance != null && (
                      <> · {distance < 1000 ? `${distance} m` : `${(distance / 1000).toFixed(1)} km`}</>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#ccc",
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
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "#888",
            fontSize: 14,
          }}
        >
          Žádné zastávky neodpovídají filtru.
        </div>
      )}

      <div style={{ height: 80 }} />
    </div>
  );
}
