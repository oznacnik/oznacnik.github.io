import { notFound } from "next/navigation";
import { supabase, type ScoutingStop, type ScoutingAnnotation } from "./supabase";

export function assertToken(token: string): void {
  const expected = process.env.NEXT_PUBLIC_SCOUTING_TOKEN;
  if (!expected || token !== expected) notFound();
}

export type StopWithAnnotation = ScoutingStop & {
  annotation: ScoutingAnnotation | null;
};

export async function fetchStopsWithAnnotations(): Promise<StopWithAnnotation[]> {
  const [stopsRes, annRes] = await Promise.all([
    supabase.from("oznacnik_stops").select("*").order("stop_name"),
    supabase.from("oznacnik_annotations").select("*"),
  ]);
  if (stopsRes.error) throw stopsRes.error;
  if (annRes.error) throw annRes.error;

  const annMap = new Map<string, ScoutingAnnotation>(
    (annRes.data ?? []).map((a) => [a.stop_id, a as ScoutingAnnotation])
  );
  return (stopsRes.data ?? []).map((s) => ({
    ...(s as ScoutingStop),
    annotation: annMap.get(s.stop_id) ?? null,
  }));
}

export async function fetchStop(stopId: string): Promise<StopWithAnnotation | null> {
  const [stopRes, annRes] = await Promise.all([
    supabase.from("oznacnik_stops").select("*").eq("stop_id", stopId).maybeSingle(),
    supabase.from("oznacnik_annotations").select("*").eq("stop_id", stopId).maybeSingle(),
  ]);
  if (stopRes.error) throw stopRes.error;
  if (annRes.error) throw annRes.error;
  if (!stopRes.data) return null;
  return {
    ...(stopRes.data as ScoutingStop),
    annotation: (annRes.data as ScoutingAnnotation) ?? null,
  };
}

// Haversine distance in metres
export function distanceMetres(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export const STATUS_COLORS: Record<string, string> = {
  untouched: "#bbbbbb",
  pending: "#2962FF",
  scouted: "#FFB800",
  ready: "#00B341",
  blocked: "#E3000B",
};

export const STATUS_LABELS: Record<string, string> = {
  untouched: "Nezhodnoceno",
  pending: "Rozděláno",
  scouted: "Zhodnoceno",
  ready: "Připraveno",
  blocked: "Nepoužitelné",
};
