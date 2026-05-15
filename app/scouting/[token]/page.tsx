import { assertToken, fetchStopsWithAnnotations } from "@/lib/scouting";
import StopList from "./StopList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scouting — Galerie Označník",
  robots: { index: false, follow: false },
};

export default async function ScoutingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  assertToken(token);

  const stops = await fetchStopsWithAnnotations();

  return <StopList token={token} stops={stops} />;
}
