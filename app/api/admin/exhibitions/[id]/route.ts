import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { updateExhibition, deleteExhibition, setExhibitionStations } from "@/lib/db";
import type { ExhibitionStation } from "@/types";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { stations, ...exhibitionData } = body;

  await updateExhibition(id, exhibitionData);

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

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await deleteExhibition(id);
  return NextResponse.json({ ok: true });
}
