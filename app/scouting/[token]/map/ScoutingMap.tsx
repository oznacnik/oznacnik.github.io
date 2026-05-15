"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [filter, setFilter] = useState<"all" | "untouched" | "pending" | "scouted" | "ready" | "blocked">("all");
  const [hideUntouched, setHideUntouched] = useState(true);
  const [showRoute, setShowRoute] = useState(true);

  // Časová sekvence anotovaných zastávek = trasa scoutingu
  const route = useMemo(
    () =>
      stops
        .filter((s) => s.annotation && s.annotation.status !== "untouched")
        .map((s) => ({
          stop_id: s.stop_id,
          stop_name: s.stop_name,
          lat: s.lat,
          lon: s.lon,
          updated_at: s.annotation!.updated_at,
        }))
        .sort((a, b) => a.updated_at.localeCompare(b.updated_at)),
    [stops]
  );

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const init = async () => {
      const maplibre = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");

      // Bílá prázdná "mapa" — žádné dlaždice, jen souřadnicový prostor.
      // Markery se kreslí v overlay divu nad ní.
      const blankStyle = {
        version: 8 as const,
        sources: {},
        layers: [
          {
            id: "background",
            type: "background" as const,
            paint: { "background-color": "#ffffff" },
          },
        ],
      };

      const map = new maplibre.Map({
        container: mapRef.current!,
        style: blankStyle,
        center: [14.42, 50.075],
        zoom: 11.5,
        maxZoom: 17,
      }) as unknown as MapInstance;

      mapInstance.current = map;

      const drawRoute = () => {
        if (!showRoute || route.length < 2) return;
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.style.cssText = `
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        `;
        const points = route
          .map((r) => {
            const p = map.project([r.lon, r.lat]);
            return `${p.x},${p.y}`;
          })
          .join(" ");
        const polyline = document.createElementNS(svgNS, "polyline");
        polyline.setAttribute("points", points);
        polyline.setAttribute("fill", "none");
        polyline.setAttribute("stroke", "#000");
        polyline.setAttribute("stroke-width", "2");
        polyline.setAttribute("stroke-dasharray", "4 4");
        polyline.setAttribute("stroke-linejoin", "round");
        polyline.setAttribute("stroke-linecap", "round");
        polyline.setAttribute("opacity", "0.55");
        svg.appendChild(polyline);
        overlayRef.current!.appendChild(svg);
      };

      const drawMarkers = () => {
        if (!overlayRef.current) return;
        overlayRef.current.innerHTML = "";
        drawRoute();

        stops.forEach((s) => {
          const status = s.annotation?.status ?? "untouched";
          if (filter !== "all" && status !== filter) return;
          if (hideUntouched && status === "untouched") return;

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

    if (showRoute && route.length >= 2) {
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
      const points = route
        .map((r) => {
          const p = map.project([r.lon, r.lat]);
          return `${p.x},${p.y}`;
        })
        .join(" ");
      const polyline = document.createElementNS(svgNS, "polyline");
      polyline.setAttribute("points", points);
      polyline.setAttribute("fill", "none");
      polyline.setAttribute("stroke", "#000");
      polyline.setAttribute("stroke-width", "2");
      polyline.setAttribute("stroke-dasharray", "4 4");
      polyline.setAttribute("stroke-linejoin", "round");
      polyline.setAttribute("stroke-linecap", "round");
      polyline.setAttribute("opacity", "0.55");
      svg.appendChild(polyline);
      overlayRef.current.appendChild(svg);
    }

    stops.forEach((s) => {
      const status = s.annotation?.status ?? "untouched";
      if (filter !== "all" && status !== filter) return;
      if (hideUntouched && status === "untouched") return;
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
  }, [filter, me, stops, token, hideUntouched, showRoute, route]);

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
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowRoute((v) => !v)}
              style={{
                padding: "6px 10px",
                fontSize: 11,
                letterSpacing: "0.08em",
                fontWeight: 700,
                textTransform: "uppercase",
                fontFamily: "inherit",
                border: "2px solid #fff",
                background: showRoute ? "#fff" : "transparent",
                color: showRoute ? "#000" : "#fff",
                cursor: "pointer",
              }}
              title={showRoute ? "Skrýt trasu scoutingu" : "Zobrazit trasu scoutingu"}
            >
              {showRoute ? "✓ Trasa" : "Trasa"}
            </button>
            <button
              onClick={() => setHideUntouched((v) => !v)}
              style={{
                padding: "6px 10px",
                fontSize: 11,
                letterSpacing: "0.08em",
                fontWeight: 700,
                textTransform: "uppercase",
                fontFamily: "inherit",
                border: "2px solid #fff",
                background: hideUntouched ? "transparent" : "#fff",
                color: hideUntouched ? "#fff" : "#000",
                cursor: "pointer",
              }}
              title={hideUntouched ? "Zobrazit i nezhodnocené" : "Skrýt nezhodnocené"}
            >
              {hideUntouched ? "+ Nezhodnocené" : "− Nezhodnocené"}
            </button>
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
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {(["all", "untouched", "pending", "scouted", "ready", "blocked"] as const).map((s) => {
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
