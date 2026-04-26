"use client";
import { useEffect, useRef } from "react";
import type { Exhibition, Station } from "@/types";

interface ExhibitionLine {
  exhibition: Exhibition;
  stations: Station[];
}

interface GalleryMapProps {
  exhibitions: Exhibition[];
  activeStations: Array<{ station: Station; exhibition: Exhibition }>;
  exhibitionLines: ExhibitionLine[];
}

export default function GalleryMap({ activeStations, exhibitionLines }: GalleryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);
  // refs to each marker div so we can move them without React re-renders
  const markerEls = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let map: {
      remove: () => void;
      on: (event: string, cb: () => void) => void;
      addSource: (id: string, source: object) => void;
      addLayer: (layer: object) => void;
      project: (lngLat: [number, number]) => { x: number; y: number };
    } | null = null;

    const initMap = async () => {
      const maplibre = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");

      const mapStyle =
        process.env.NEXT_PUBLIC_MAP_STYLE ||
        "https://tiles.openfreemap.org/styles/liberty";

      map = new maplibre.Map({
        container: mapRef.current!,
        style: mapStyle,
        center: [14.42, 50.075],
        zoom: 11.5,
        maxZoom: 14,
      }) as typeof map;

      mapInstance.current = map;

      // ── Create colored HTML markers in the overlay div ──────────────────
      // (overlay is a sibling outside the grayscale filter)
      if (overlayRef.current) {
        overlayRef.current.innerHTML = "";
        markerEls.current = activeStations.map(({ station, exhibition }) => {
          const el = document.createElement("div");
          el.style.cssText = `
            position: absolute;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: ${exhibition.color};
            border: 3px solid #000;
            box-sizing: border-box;
            pointer-events: none;
            transform: translate(-9px, -9px);
          `;
          el.title = station.name;
          overlayRef.current!.appendChild(el);
          return el;
        });
      }

      // ── Sync marker positions to map ─────────────────────────────────────
      const syncMarkers = () => {
        if (!map) return;
        activeStations.forEach(({ station }, i) => {
          const el = markerEls.current[i];
          if (!el) return;
          const { x, y } = map!.project([station.lng, station.lat]);
          el.style.left = `${x}px`;
          el.style.top = `${y}px`;
        });
      };

      map!.on("load", () => {
        // ── Route lines per exhibition ──────────────────────────────────
        for (const { exhibition, stations } of exhibitionLines) {
          if (stations.length < 2) continue;

          map!.addSource(`line-${exhibition.id}`, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: stations.map((s) => [s.lng, s.lat]),
              },
            },
          });

          map!.addLayer({
            id: `line-shadow-${exhibition.id}`,
            type: "line",
            source: `line-${exhibition.id}`,
            paint: { "line-color": "#000", "line-width": 7, "line-opacity": 0.18 },
            layout: { "line-cap": "round", "line-join": "round" },
          });

          map!.addLayer({
            id: `line-${exhibition.id}`,
            type: "line",
            source: `line-${exhibition.id}`,
            paint: {
              "line-color": exhibition.color,
              "line-width": 4,
              "line-opacity": 0.95,
            },
            layout: { "line-cap": "round", "line-join": "round" },
          });
        }

        syncMarkers();
      });

      // Update on every render frame (pan, zoom, etc.)
      map!.on("render", syncMarkers);
    };

    initMap().catch(console.error);

    return () => {
      map?.remove();
      mapInstance.current = null;
      markerEls.current = [];
    };
  }, [activeStations, exhibitionLines]);

  return (
    // Outer wrapper: positions the grayscale map + colored overlay as siblings
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Map canvas — grayscale */}
      <div
        ref={mapRef}
        style={{ width: "100%", height: "100%", filter: "grayscale(1) contrast(1.08)" }}
      />
      {/* Colored markers overlay — NOT filtered */}
      <div
        ref={overlayRef}
        style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}
      />
    </div>
  );
}
