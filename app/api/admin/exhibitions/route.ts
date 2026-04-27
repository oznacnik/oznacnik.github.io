import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { createExhibition, setExhibitionStations } from "@/lib/db";
import type { ExhibitionStation } from "@/types";

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { stations, ...exhibitionData } = body;

  const id = await createExhibition(exhibitionData);

  if (stations?.length) {
    const exStations: Omit<ExhibitionStation, "id">[] = stations.map(
      (s: ExhibitionStation, i: number) => ({
        exhibitionId: id,
        stationId: s.stationId,
        position: i,
        hasInstallation: s.hasInstallation,
        workTitle: s.workTitle ?? "",
        notes: s.notes ?? "",
      })
    );
    await setExhibitionStations(id, exStations);
  }

  return NextResponse.json({ id });
}
