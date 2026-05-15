"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type StopWithAnnotation,
} from "@/lib/scouting";

interface MapInstance {
  remove: () => void;
  on: (e: string, cb: () => void) => void;
  project: (lngLat: [number, number]) => { x: number; y: number };
  flyTo: (opts: { center: [number, number]; zoom?: number }) => void;
}

export default function ScoutingMap({
  token,
  stops,
}: {
  token: string;
  stops: StopWithAnnotation[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapInstance | null>(null);
  const meEl = useRef<HTMLDivElement | null>(null);
  const [me, setMe] = useState<{ lat: number; lon: number } | null>(null);
  const [filter, setFilter] = useState<"all" | "untouched" | "scouted" | "ready" | "blocked">("all");

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const init = async () => {
      const maplibre = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");

      const style =
        process.env.NEXT_PUBLIC_MAP_STYLE ||
        "https://tiles.openfreemap.org/styles/liberty";

      const map = new maplibre.Map({
        container: mapRef.current!,
        style,
        center: [14.42, 50.075],
        zoom: 11.5,
        maxZoom: 17,
      }) as unknown as MapInstance;

      mapInstance.current = map;

      const drawMarkers = () => {
        if (!overlayRef.current) return;
        overlayRef.current.innerHTML = "";

        stops.forEach((s) => {
          const status = s.annotation?.status ?? "untouched";
          if (filter !== "all" && status !== filter) return;

          const color = STATUS_COLORS[status];
          const el = document.createElement("a");
          el.href = `/scouting/${token}/${s.stop_id}`;
          el.title = `${s.stop_name} — ${STATUS_LABELS[status]}`;
          el.style.cssText = `
            position: absolute;
            width: 12px;
            height: 12px;
            background: ${color};
            border: 2px solid #000;
            border-radius: 50%;
            pointer-events: auto;
            cursor: pointer;
            transform: translate(-50%, -50%);
            text-decoration: none;
            display: block;
          `;
          const point = map.project([s.lon, s.lat]);
          el.style.left = `${point.x}px`;
          el.style.top = `${point.y}px`;
          overlayRef.current!.appendChild(el);
        });

        // Me marker
        if (me) {
          const el = document.createElement("div");
          el.style.cssText = `
            position: absolute;
            width: 18px;
            height: 18px;
            background: #1e88ff;
            border: 3px solid #fff;
            border-radius: 50%;
            box-shadow: 0 0 0 2px #1e88ff, 0 0 16px rgba(30,136,255,0.6);
            pointer-events: none;
            transform: translate(-50%, -50%);
          `;
          const point = map.project([me.lon, me.lat]);
          el.style.left = `${point.x}px`;
          el.style.top = `${point.y}px`;
          overlayRef.current!.appendChild(el);
          meEl.current = el;
        }
      };

      map.on("load", drawMarkers);
      map.on("move", drawMarkers);
      map.on("zoom", drawMarkers);
      map.on("resize", drawMarkers);
    };

    init();
    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-draw when filter or me changes
  useEffect(() => {
    if (!mapInstance.current || !overlayRef.current) return;
    const map = mapInstance.current;
    overlayRef.current.innerHTML = "";

    stops.forEach((s) => {
      const status = s.annotation?.status ?? "untouched";
      if (filter !== "all" && status !== filter) return;
      const color = STATUS_COLORS[status];
      const el = document.createElement("a");
      el.href = `/scouting/${token}/${s.stop_id}`;
      el.title = `${s.stop_name} — ${STATUS_LABELS[status]}`;
      el.style.cssText = `
        position: absolute;
        width: 12px;
        height: 12px;
        background: ${color};
        border: 2px solid #000;
        border-radius: 50%;
        pointer-events: auto;
        cursor: pointer;
        transform: translate(-50%, -50%);
        text-decoration: none;
        display: block;
      `;
      const p = map.project([s.lon, s.lat]);
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
      overlayRef.current!.appendChild(el);
    });

    if (me) {
      const el = document.createElement("div");
      el.style.cssText = `
        position: absolute;
        width: 18px;
        height: 18px;
        background: #1e88ff;
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 0 2px #1e88ff, 0 0 16px rgba(30,136,255,0.6);
        pointer-events: none;
        transform: translate(-50%, -50%);
      `;
      const p = map.project([me.lon, me.lat]);
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
      overlayRef.current!.appendChild(el);
    }
  }, [filter, me, stops, token]);

  const findMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setMe(loc);
        mapInstance.current?.flyTo({ center: [loc.lon, loc.lat], zoom: 15 });
      },
      (err) => alert(`Geolokace selhala: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000" }}>
      <div ref={mapRef} style={{ position: "absolute", inset: 0 }} />
      <div
        ref={overlayRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Top bar */}
      <header
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          background: "rgba(0,0,0,0.85)",
          color: "#fff",
          padding: "10px 14px",
          zIndex: 5,
          borderBottom: "3px solid #E3000B",
        }}
      >
        <div className="flex items-center justify-between">
          <Link
            href={`/scouting/${token}`}
            className="font-black uppercase no-underline"
            style={{ fontSize: 11, letterSpacing: "0.12em", color: "#aaa" }}
          >
            ← Seznam
          </Link>
          <button
            onClick={findMe}
            style={{
              padding: "6px 10px",
              fontSize: 11,
              letterSpacing: "0.08em",
              fontWeight: 700,
              textTransform: "uppercase",
              fontFamily: "inherit",
              border: "2px solid #00B341",
              background: me ? "#00B341" : "transparent",
              color: me ? "#000" : "#00B341",
              cursor: "pointer",
            }}
          >
            {me ? "U mě" : "Najít mě"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {(["all", "untouched", "scouted", "ready", "blocked"] as const).map((s) => {
            const active = filter === s;
            const color = s === "all" ? "#fff" : STATUS_COLORS[s];
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: "5px 8px",
                  fontSize: 10,
                  letterSpacing: "0.06em",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  fontFamily: "inherit",
                  border: `2px solid ${color}`,
                  background: active ? color : "transparent",
                  color: active ? "#000" : color,
                  cursor: "pointer",
                }}
              >
                {s === "all" ? "Vše" : STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
      </header>
    </div>
  );
}
