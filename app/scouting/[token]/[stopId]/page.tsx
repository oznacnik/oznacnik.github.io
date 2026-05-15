import { notFound } from "next/navigation";
import { assertToken, fetchStop, fetchStopsWithAnnotations } from "@/lib/scouting";
import StopDetail from "./StopDetail";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scouting — detail",
  robots: { index: false, follow: false },
};

export default async function StopPage({
  params,
}: {
  params: Promise<{ token: string; stopId: string }>;
}) {
  const { token, stopId } = await params;
  assertToken(token);

  const stop = await fetchStop(stopId);
  if (!stop) notFound();

  // Předáme všechny zastávky aby klient mohl po Save & Next vybrat
  // nejbližší podle GPS místo abecedního pořadí.
  const all = await fetchStopsWithAnnotations();
  const candidates = all.map((s) => ({
    stop_id: s.stop_id,
    stop_name: s.stop_name,
    lat: s.lat,
    lon: s.lon,
    status: s.annotation?.status ?? "untouched",
  }));

  return <StopDetail token={token} stop={stop} candidates={candidates} />;
}
