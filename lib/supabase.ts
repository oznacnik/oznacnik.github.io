import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!url || !anon) {
  // eslint-disable-next-line no-console
  console.warn("Supabase: chybí NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY v .env.local");
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
