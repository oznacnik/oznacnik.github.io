/**
 * Data access layer — static mode (no database).
 * Swap this file for lib/db-firebase.ts when ready to connect Firebase.
 */
import {
  STATIONS,
  EXHIBITIONS,
  EXHIBITION_STATIONS,
} from "./static-data";
import type { Station, Exhibition, ExhibitionStation, ExhibitionStatus } from "@/types";

// ─── Stations ────────────────────────────────────────────────────────────────

export async function getAllStations(): Promise<Station[]> {
  return STATIONS;
}

export async function getStationsByIds(ids: string[]): Promise<Station[]> {
  const set = new Set(ids);
  return STATIONS.filter((s) => set.has(s.id));
}

// ─── Exhibitions ─────────────────────────────────────────────────────────────

export async function getAllExhibitions(): Promise<Exhibition[]> {
  return [...EXHIBITIONS].sort(
    (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
  );
}

export async function getExhibitionsByStatus(status: ExhibitionStatus): Promise<Exhibition[]> {
  return EXHIBITIONS.filter((e) => e.status === status).sort(
    (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
  );
}

export async function getExhibition(id: string): Promise<Exhibition | null> {
  return EXHIBITIONS.find((e) => e.id === id) ?? null;
}

export async function createExhibition(_data: Omit<Exhibition, "id" | "createdAt">): Promise<string> {
  throw new Error("Read-only static mode — connect Firebase to create exhibitions");
}

export async function updateExhibition(_id: string, _data: Partial<Exhibition>): Promise<void> {
  throw new Error("Read-only static mode — connect Firebase to edit exhibitions");
}

export async function deleteExhibition(_id: string): Promise<void> {
  throw new Error("Read-only static mode — connect Firebase to delete exhibitions");
}

// ─── Exhibition Stations ──────────────────────────────────────────────────────

export async function getExhibitionStations(exhibitionId: string): Promise<ExhibitionStation[]> {
  return EXHIBITION_STATIONS
    .filter((s) => s.exhibitionId === exhibitionId)
    .sort((a, b) => a.position - b.position);
}

export async function setExhibitionStations(
  _exhibitionId: string,
  _stations: Omit<ExhibitionStation, "id">[]
): Promise<void> {
  throw new Error("Read-only static mode");
}

export async function updateExhibitionStation(
  _id: string,
  _data: Partial<ExhibitionStation>
): Promise<void> {
  throw new Error("Read-only static mode");
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const current = EXHIBITIONS.filter((e) => e.status === "current");
  const upcoming = EXHIBITIONS.filter((e) => e.status === "upcoming");
  const past = EXHIBITIONS.filter((e) => e.status === "past");

  const activeStations = EXHIBITION_STATIONS.filter(
    (s) =>
      s.hasInstallation &&
      current.some((e) => e.id === s.exhibitionId)
  ).length;

  return {
    current: current.length,
    upcoming: upcoming.length,
    past: past.length,
    activeStations,
    totalStations: STATIONS.length,
  };
}
