import { assertToken, fetchStopsWithAnnotations } from "@/lib/scouting";
import ScoutingMap from "./ScoutingMap";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scouting — mapa",
  robots: { index: false, follow: false },
};

export default async function MapPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  assertToken(token);

  const stops = await fetchStopsWithAnnotations();
  return <ScoutingMap token={token} stops={stops} />;
}
