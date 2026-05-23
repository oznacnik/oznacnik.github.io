"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface MapStop {
  stop_id: string;
  stop_name: string;
  lat: number;
  lon: number;
}

export interface MapAuthor {
  id: string;
  publicName: string;
  color: string;
}

export interface MapClaim {
  stop_id: string;
  author_id: string;
  claimed_at: string;
}

interface MapInstance {
  remove: () => void;
  on: (event: string, cb: () => void) => void;
  project: (lngLat: [number, number]) => { x: number; y: number };
}

export default function LiveMap({
  stops,
  authors,
  initialClaims,
}: {
  stops: MapStop[];
  authors: MapAuthor[];
  initialClaims: MapClaim[];
}) {
  const [claims, setClaims] = useState<MapClaim[]>(initialClaims);
  const mapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapInstance | null>(null);

  const stopsById = useMemo(() => {
    const m = new Map<string, MapStop>();
    for (const s of stops) m.set(s.stop_id, s);
    return m;
  }, [stops]);

  const authorsById = useMemo(() => {
    const m = new Map<string, MapAuthor>();
    for (const a of authors) m.set(a.id, a);
    return m;
  }, [authors]);

  // Realtime subscribe
  useEffect(() => {
    const channel = supabase
      .channel("vernisaz-map-claims")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "oznacnik_claims" },
        async () => {
          const { data } = await supabase
            .from("oznacnik_claims")
            .select("stop_id, author_id, claimed_at");
          if (data) setClaims(data as MapClaim[]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Init map (jen jednou)
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const init = async () => {
      const maplibre = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");
      const map = new maplibre.Map({
        container: mapRef.current!,
        // Positron je světlý monochromatický styl, drží kontrast i bez
        // grayscale filtru a Liberty občas vychází úplně bíle.
        style: "https://tiles.openfreemap.org/styles/positron",
        center: [14.42, 50.075],
        zoom: 11,
        // Žádná interakce — mapa je čistě informativní (státicky ukazuje
        // claimnuté zastávky), žádný zoom/scroll/pan/rotace.
        interactive: false,
        attributionControl: false,
      }) as unknown as MapInstance;
      mapInstance.current = map;

      const draw = () => drawMarkers();
      map.on("load", draw);
      // Při interactive:false se „move/zoom" neemitují, ale resize ano
      // (responsive layout). To stačí na re-pozicování markerů.
      map.on("resize", draw);
    };
    init();

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-draw markers when claims change
  useEffect(() => {
    drawMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claims]);

  const drawMarkers = () => {
    if (!overlayRef.current || !mapInstance.current) return;
    const map = mapInstance.current;
    overlayRef.current.innerHTML = "";

    for (const c of claims) {
      const stop = stopsById.get(c.stop_id);
      const author = authorsById.get(c.author_id);
      if (!stop || !author) continue;
      const el = document.createElement("div");
      el.title = `${stop.stop_name} · ${author.publicName}`;
      el.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        background: #000;
        pointer-events: none;
        transform: translate(-50%, -50%);
      `;
      const p = map.project([stop.lon, stop.lat]);
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
      overlayRef.current.appendChild(el);
    }
  };

  return (
    <div style={{ position: "relative", minHeight: 500, height: 600, background: "#fff" }}>
      <div
        ref={mapRef}
        style={{
          position: "absolute",
          inset: 0,
        }}
      />
      <div
        ref={overlayRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      />
      <div
        className="font-black uppercase"
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          fontSize: 10,
          letterSpacing: "0.16em",
          color: "#000",
        }}
      >
        {claims.length} {claims.length === 1 ? "zastávka" : claims.length < 5 ? "zastávky" : "zastávek"}
      </div>
    </div>
  );
}
