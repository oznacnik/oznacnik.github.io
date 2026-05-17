"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type StopWithAnnotation,
} from "@/lib/scouting";
import { scoutingPhotoUrl } from "@/lib/supabase";

type StatusFilter = "all" | "ready" | "pending" | "scouted" | "blocked";

export default function Explorer({
  token,
  stops,
}: {
  token: string;
  stops: StopWithAnnotation[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [needsPhoto, setNeedsPhoto] = useState(false);
  const [needsNote, setNeedsNote] = useState(false);
  const [lightbox, setLightbox] = useState<{ paths: string[]; idx: number } | null>(null);

  // Default: jen anotované zastávky (s aspoň nějakým obsahem)
  const annotated = useMemo(
    () =>
      stops.filter(
        (s) => s.annotation && s.annotation.status !== "untouched"
      ),
    [stops]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return annotated.filter((s) => {
      const a = s.annotation!;
      if (filter !== "all" && a.status !== filter) return false;
      if (needsPhoto && (!a.photo_paths || a.photo_paths.length === 0)) return false;
      if (needsNote && (!a.notes || !a.notes.trim())) return false;
      if (q && !s.stop_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [annotated, filter, needsPhoto, needsNote, query]);

  const counts = useMemo(() => {
    const c = { all: annotated.length, ready: 0, pending: 0, scouted: 0, blocked: 0 } as Record<StatusFilter, number>;
    for (const s of annotated) {
      const st = s.annotation!.status as StatusFilter;
      if (st in c) c[st] += 1;
    }
    return c;
  }, [annotated]);

  const totalPhotos = annotated.reduce((a, s) => a + (s.annotation?.photo_paths?.length ?? 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f3f3f3" }}>
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
            ← Seznam
          </Link>
          <div className="font-black uppercase" style={{ letterSpacing: "0.12em", fontSize: 12 }}>
            Explorer
          </div>
          <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.08em" }}>
            {filtered.length} / {annotated.length} · {totalPhotos} fotek
          </div>
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

        <div className="flex gap-2 mt-2 flex-wrap">
          {(["all", "ready", "pending", "scouted", "blocked"] as StatusFilter[]).map((s) => {
            const active = filter === s;
            const color = s === "all" ? "#fff" : STATUS_COLORS[s];
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={pillStyle(active, color)}
              >
                {s === "all" ? "Vše" : STATUS_LABELS[s]} {counts[s]}
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setNeedsPhoto((v) => !v)}
            style={pillStyle(needsPhoto, "#fff")}
            title="Jen zastávky s fotkou"
          >
            Foto
          </button>
          <button
            onClick={() => setNeedsNote((v) => !v)}
            style={pillStyle(needsNote, "#fff")}
            title="Jen zastávky s poznámkou"
          >
            Pozn
          </button>
        </div>
      </header>

      {/* Grid */}
      <main
        style={{
          padding: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {filtered.map((s) => (
          <StopCard
            key={s.stop_id}
            token={token}
            stop={s}
            onPhoto={(idx) =>
              setLightbox({ paths: s.annotation!.photo_paths, idx })
            }
          />
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: 60,
              color: "#888",
              fontSize: 14,
            }}
          >
            Žádné zastávky neodpovídají filtru.
          </div>
        )}
      </main>

      {lightbox && (
        <Lightbox
          paths={lightbox.paths}
          idx={lightbox.idx}
          onClose={() => setLightbox(null)}
          onNav={(idx) => setLightbox({ ...lightbox, idx })}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────

function StopCard({
  token,
  stop,
  onPhoto,
}: {
  token: string;
  stop: StopWithAnnotation;
  onPhoto: (idx: number) => void;
}) {
  const a = stop.annotation!;
  const color = STATUS_COLORS[a.status];
  const hasPhotos = a.photo_paths && a.photo_paths.length > 0;
  const heroPhoto = hasPhotos ? a.photo_paths[0] : null;
  const extras = hasPhotos ? a.photo_paths.slice(1) : [];

  return (
    <article
      style={{
        background: "#fff",
        border: "3px solid #000",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Hero photo or color band */}
      {heroPhoto ? (
        <button
          onClick={() => onPhoto(0)}
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4 / 3",
            background: "#000",
            border: "none",
            padding: 0,
            cursor: "zoom-in",
            display: "block",
            borderBottom: `4px solid ${color}`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scoutingPhotoUrl(heroPhoto)}
            alt={stop.stop_name}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          {extras.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "rgba(0,0,0,0.75)",
                color: "#fff",
                padding: "4px 8px",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              +{extras.length} fotek
            </div>
          )}
        </button>
      ) : (
        <div
          style={{
            height: 12,
            background: color,
          }}
        />
      )}

      {/* Header line: status pill + counts */}
      <div
        style={{
          padding: "12px 14px 8px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "4px 8px",
            background: color,
            color: a.status === "pending" || a.status === "blocked" ? "#fff" : "#000",
          }}
        >
          {STATUS_LABELS[a.status]}
        </span>
        {(a.oznacniku_total != null || a.oznacniku_usable != null) && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#000",
            }}
          >
            {a.oznacniku_usable ?? "?"}/{a.oznacniku_total ?? "?"} ozn.
          </span>
        )}
      </div>

      {/* Title */}
      <Link
        href={`/scouting/${token}/${stop.stop_id}`}
        style={{
          padding: "0 14px",
          color: "#000",
          textDecoration: "none",
        }}
      >
        <h3
          className="font-black"
          style={{
            fontSize: 22,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          {stop.stop_name}
        </h3>
        <div
          style={{
            fontSize: 10,
            color: "#aaa",
            letterSpacing: "0.06em",
            fontFamily: "monospace",
            marginTop: 4,
          }}
        >
          {stop.stop_id} · {stop.lat.toFixed(4)}, {stop.lon.toFixed(4)}
        </div>
      </Link>

      {/* Note */}
      {a.notes && a.notes.trim() && (
        <p
          style={{
            padding: "10px 14px 0",
            margin: 0,
            fontSize: 13,
            lineHeight: 1.45,
            color: "#222",
            whiteSpace: "pre-wrap",
            fontWeight: 400,
          }}
        >
          {a.notes}
        </p>
      )}

      {/* Extra photo thumbnails */}
      {extras.length > 0 && (
        <div
          style={{
            padding: "10px 14px 0",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 4,
          }}
        >
          {extras.slice(0, 4).map((p, i) => (
            <button
              key={p}
              onClick={() => onPhoto(i + 1)}
              style={{
                aspectRatio: "1",
                background: "#000",
                border: "2px solid #000",
                padding: 0,
                cursor: "zoom-in",
                display: "block",
                position: "relative",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={scoutingPhotoUrl(p)}
                alt=""
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Footer link to detail */}
      <div style={{ flex: 1 }} />
      <Link
        href={`/scouting/${token}/${stop.stop_id}`}
        style={{
          marginTop: 12,
          padding: "10px 14px",
          borderTop: "2px solid #eee",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#888",
          textDecoration: "none",
          textAlign: "center",
        }}
      >
        Detail / upravit →
      </Link>
    </article>
  );
}

// ──────────────────────────────────────────────────────────────────────

function Lightbox({
  paths,
  idx,
  onClose,
  onNav,
}: {
  paths: string[];
  idx: number;
  onClose: () => void;
  onNav: (idx: number) => void;
}) {
  const prev = () => onNav((idx - 1 + paths.length) % paths.length);
  const next = () => onNav((idx + 1) % paths.length);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.95)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={scoutingPhotoUrl(paths[idx])}
        alt=""
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          display: "block",
        }}
        onClick={(e) => e.stopPropagation()}
      />
      {paths.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            style={lbBtn("left")}
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            style={lbBtn("right")}
          >
            ›
          </button>
          <div
            style={{
              position: "absolute",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.7)",
              color: "#fff",
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            {idx + 1} / {paths.length}
          </div>
        </>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "#000",
          color: "#fff",
          border: "2px solid #fff",
          width: 40,
          height: 40,
          fontSize: 20,
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        ×
      </button>
    </div>
  );
}

// ── Helpers ──

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

function lbBtn(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: 16,
    transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.7)",
    color: "#fff",
    border: "2px solid #fff",
    width: 50,
    height: 50,
    fontSize: 28,
    fontWeight: 900,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  } as React.CSSProperties;
}
