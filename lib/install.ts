import { supabase } from "./supabase";

export interface Author {
  id: string;
  name: string;
  email: string | null;
  annotation: string | null;
  web_consent: boolean;
  popisek_consent: boolean;
  film_consent: boolean;
  notes: string | null;
  requested_stops: number | null;
}

export interface Work {
  id: string;
  author_id: string;
  ord: number;
  title: string;
  year: number | null;
  technique: string | null;
}

export interface Claim {
  stop_id: string;
  author_id: string;
  work_ids: string[];
  notes: string | null;
  claimed_at: string;
  updated_at: string;
}

// 8 dobře rozeznatelných barev pro autory (sladěno s DPP estetikou)
const AUTHOR_PALETTE = [
  "#E3000B", // DPP red
  "#2962FF", // blue
  "#00B341", // green
  "#FFB800", // amber
  "#9C27B0", // purple
  "#FF6F00", // orange
  "#00ACC1", // cyan
  "#8B5CF6", // violet
  "#EC407A", // pink
  "#5D4037", // brown
];

export function authorColor(authorId: string, allIds: string[]): string {
  const idx = allIds.indexOf(authorId);
  if (idx === -1) return "#888";
  return AUTHOR_PALETTE[idx % AUTHOR_PALETTE.length];
}

export async function fetchAuthors(): Promise<Author[]> {
  const { data, error } = await supabase
    .from("oznacnik_authors")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Author[];
}

export async function fetchWorks(): Promise<Work[]> {
  const { data, error } = await supabase
    .from("oznacnik_works")
    .select("*")
    .order("author_id")
    .order("ord");
  if (error) throw error;
  return (data ?? []) as Work[];
}

export async function fetchClaims(): Promise<Claim[]> {
  const { data, error } = await supabase
    .from("oznacnik_claims")
    .select("*");
  if (error) throw error;
  return (data ?? []) as Claim[];
}

// Mapa author_id → kolik labelů má spárováno s nějakou zastávkou
export async function fetchLabelsUsedByAuthor(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("oznacnik_qr_labels")
    .select("author_id")
    .not("stop_id", "is", null);
  if (error) throw error;
  const out: Record<string, number> = {};
  for (const r of (data ?? []) as { author_id: string }[]) {
    out[r.author_id] = (out[r.author_id] ?? 0) + 1;
  }
  return out;
}

// ── Pomocníci pro UI ─────────────────────────────────────────────────

export interface AuthorWithProgress extends Author {
  claimedStops: number;
  labelsTotal: number; // = requested_stops × 2
  labelsUsed: number; // = počet labelů s stop_id != null
  labelsRemaining: number; // labelsTotal − labelsUsed
  works: Work[];
}

export function buildAuthorsWithProgress(
  authors: Author[],
  works: Work[],
  claims: Claim[],
  labelsUsedByAuthor: Record<string, number> = {}
): AuthorWithProgress[] {
  const claimedByAuthor: Record<string, number> = {};
  for (const c of claims) claimedByAuthor[c.author_id] = (claimedByAuthor[c.author_id] ?? 0) + 1;
  const worksByAuthor: Record<string, Work[]> = {};
  for (const w of works) {
    if (!worksByAuthor[w.author_id]) worksByAuthor[w.author_id] = [];
    worksByAuthor[w.author_id].push(w);
  }
  return authors.map((a) => {
    const labelsTotal = (a.requested_stops ?? 0) * 2;
    const labelsUsed = labelsUsedByAuthor[a.id] ?? 0;
    return {
      ...a,
      claimedStops: claimedByAuthor[a.id] ?? 0,
      labelsTotal,
      labelsUsed,
      labelsRemaining: Math.max(0, labelsTotal - labelsUsed),
      works: worksByAuthor[a.id] ?? [],
    };
  });
}

// ── Auto-assign: náhodné rozhození ready zastávek autorům dle kvót ─

export interface Assignment {
  stop_id: string;
  author_id: string;
}

/**
 * Náhodně přiřadí zastávky autorům podle jejich requested_stops.
 *
 * - Každá zastávka má max 1 autora (1:1)
 * - Každý autor dostane přesně tolik zastávek, kolik požadoval
 *   (pokud je zastávek dost; jinak proporcionálně méně)
 * - Když je víc zastávek než požadováno, zbytek zůstane neclaimnutý
 *
 * Vrací plán; mazání/zápis do DB řeší volající.
 */
export function randomAssign(
  authors: Author[],
  stopIds: string[]
): Assignment[] {
  // Shuffle stops (Fisher–Yates)
  const stops = [...stopIds];
  for (let i = stops.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [stops[i], stops[j]] = [stops[j], stops[i]];
  }

  // Total requested vs available
  const requested = authors.reduce((acc, a) => acc + (a.requested_stops ?? 0), 0);
  const available = stops.length;
  const scale = requested > available && requested > 0 ? available / requested : 1;

  // Pro každého autora: kolik dostane (proporcionálně pokud nedostatek)
  const quotas = authors.map((a) => ({
    id: a.id,
    quota: Math.max(0, Math.round((a.requested_stops ?? 0) * scale)),
  }));

  // Když po proporcionálním zaokrouhlení suma neodpovídá, srovnej.
  const adjustToFit = (target: number) => {
    let sum = quotas.reduce((acc, q) => acc + q.quota, 0);
    let i = 0;
    while (sum > target && i < 10000) {
      const idx = quotas.findIndex((q) => q.quota > 0);
      if (idx === -1) break;
      quotas[idx].quota -= 1;
      sum -= 1;
      i++;
    }
    while (sum < target && i < 10000) {
      // přidávej proporcionálně podle požadavku
      const targetAuthor = quotas.reduce((best, cur) => {
        const reqBest = authors.find((a) => a.id === best.id)?.requested_stops ?? 0;
        const reqCur = authors.find((a) => a.id === cur.id)?.requested_stops ?? 0;
        return reqCur - cur.quota > reqBest - best.quota ? cur : best;
      });
      targetAuthor.quota += 1;
      sum += 1;
      i++;
    }
  };
  adjustToFit(Math.min(requested, available));

  // Přiřaď
  const assignments: Assignment[] = [];
  let cursor = 0;
  for (const q of quotas) {
    for (let i = 0; i < q.quota && cursor < stops.length; i++) {
      assignments.push({ stop_id: stops[cursor++], author_id: q.id });
    }
  }
  return assignments;
}
