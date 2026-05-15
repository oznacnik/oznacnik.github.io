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

  // Načti další zastávku abychom mohli "save & next" navigovat
  const all = await fetchStopsWithAnnotations();
  const idx = all.findIndex((s) => s.stop_id === stopId);
  const nextStop = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  return <StopDetail token={token} stop={stop} nextStopId={nextStop?.stop_id ?? null} />;
}
