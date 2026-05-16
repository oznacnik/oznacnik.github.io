import { assertToken, fetchStopsWithAnnotations } from "@/lib/scouting";
import Explorer from "./Explorer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scouting — explorer",
  robots: { index: false, follow: false },
};

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  assertToken(token);
  const stops = await fetchStopsWithAnnotations();
  return <Explorer token={token} stops={stops} />;
}
