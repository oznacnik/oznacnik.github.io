"use client";

import { useCallback, useEffect, useState } from "react";
import { scoutingPhotoUrl } from "@/lib/supabase";

export interface PhotoEntry {
  path: string;
  stop_name: string;
  author_name: string;
  work_titles: string[]; // už filtrováno (placeholder odstraněn)
  claimed_at: string;
  photo_idx_in_claim: number;
  total_photos_in_claim: number;
}

// Lightbox je trigger-ovaný URL hashem (#p-{idx}). Tím že to není
// React state v parent komponentě, můžou na něj odkazovat jak fotky v
// PhotoFeed (client), tak server-side rendered odkazy v sekci Autoři
// — bez prop-drillingu / kontextu.
export default function PhotoLightbox({ photos }: { photos: PhotoEntry[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const readHash = useCallback(() => {
    if (typeof window === "undefined") return null;
    const m = window.location.hash.match(/^#p-(\d+)$/);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    if (!isFinite(n) || n < 0 || n >= photos.length) return null;
    return n;
  }, [photos.length]);

  useEffect(() => {
    setOpenIdx(readHash());
    const onHash = () => setOpenIdx(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [readHash]);

  const close = useCallback(() => {
    // history.replaceState — nezpůsobí scroll a vyčistí hash bez nového záznamu
    if (window.location.hash.startsWith("#p-")) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
      setOpenIdx(null);
    }
  }, []);

  const goto = useCallback(
    (i: number) => {
      if (i < 0 || i >= photos.length) return;
      history.replaceState(null, "", `#p-${i}`);
      setOpenIdx(i);
    },
    [photos.length]
  );

  useEffect(() => {
    if (openIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") goto(openIdx - 1);
      else if (e.key === "ArrowRight") goto(openIdx + 1);
    };
    window.addEventListener("keydown", onKey);
    // zamknout scroll body
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIdx, close, goto]);

  if (openIdx === null) return null;
  const p = photos[openIdx];
  const hasPrev = openIdx > 0;
  const hasNext = openIdx < photos.length - 1;
  const time = new Date(p.claimed_at);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.94)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          color: "#fff",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 12,
          letterSpacing: "0.06em",
        }}
      >
        <div
          className="font-black uppercase"
          style={{ letterSpacing: "0.16em", fontSize: 11 }}
        >
          {openIdx + 1} / {photos.length}
        </div>
        <button
          onClick={close}
          aria-label="Zavřít"
          style={{
            background: "transparent",
            color: "#fff",
            border: "2px solid #fff",
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Zavřít ✕
        </button>
      </div>

      {/* Photo area */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 12px",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={scoutingPhotoUrl(p.path)}
          alt={`${p.stop_name} · ${p.author_name}`}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />

        {hasPrev && (
          <button
            onClick={() => goto(openIdx - 1)}
            aria-label="Předchozí"
            style={navBtnStyle("left")}
          >
            ‹
          </button>
        )}
        {hasNext && (
          <button
            onClick={() => goto(openIdx + 1)}
            aria-label="Další"
            style={navBtnStyle("right")}
          >
            ›
          </button>
        )}
      </div>

      {/* Caption */}
      <div
        style={{
          background: "#000",
          color: "#fff",
          padding: "16px 20px",
          borderTop: "1px solid #222",
        }}
      >
        <div
          className="font-black uppercase leading-none"
          style={{
            fontSize: "clamp(20px, 3vw, 28px)",
            letterSpacing: "-0.02em",
          }}
        >
          {p.stop_name}
        </div>
        <div style={{ marginTop: 6, fontSize: 14, color: "#ddd" }}>
          {p.author_name}
        </div>
        {p.work_titles.length > 0 && (
          <div style={{ marginTop: 2, fontSize: 13, color: "#aaa" }}>
            {p.work_titles.join(" · ")}
          </div>
        )}
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: "#777",
            fontFamily: "monospace",
            letterSpacing: 0,
          }}
        >
          {time.toLocaleString("cs-CZ", {
            day: "numeric",
            month: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {p.total_photos_in_claim > 1 &&
            ` · foto ${p.photo_idx_in_claim + 1}/${p.total_photos_in_claim}`}
        </div>
      </div>
    </div>
  );
}

function navBtnStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: 8,
    transform: "translateY(-50%)",
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    border: "none",
    fontSize: 32,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}
