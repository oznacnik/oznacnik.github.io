import { createClient } from "@supabase/supabase-js";

// Při buildu (page-data collection) Vercel volá moduly před tím, než se
// načtou env vars. Placeholder URL umožní createClient() neselhat při
// importu — skutečné požadavky stejně proběhnou až za běhu, kdy už
// proměnné jsou.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY není nastaveno — používám placeholder, požadavky selžou."
  );
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
});

export const SCOUTING_BUCKET = "oznacnik-scouting";

export function scoutingPhotoUrl(path: string): string {
  return supabase.storage.from(SCOUTING_BUCKET).getPublicUrl(path).data.publicUrl;
}

export interface ScoutingStop {
  stop_id: string;
  stop_name: string;
  lat: number;
  lon: number;
}

export type ScoutingStatus = "untouched" | "pending" | "scouted" | "ready" | "blocked";

export interface ScoutingAnnotation {
  stop_id: string;
  oznacniku_total: number | null;
  oznacniku_usable: number | null;
  status: ScoutingStatus;
  notes: string | null;
  photo_paths: string[];
  updated_at: string;
}
