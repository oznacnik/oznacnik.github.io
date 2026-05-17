import { assertToken, fetchStopsWithAnnotations } from "@/lib/scouting";
import { fetchAuthors, fetchClaims, fetchWorks, buildAuthorsWithProgress } from "@/lib/install";
import InstallList from "./InstallList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vernisáž — instalace",
  robots: { index: false, follow: false },
};

export default async function InstallPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  assertToken(token);

  const [stops, authors, works, claims] = await Promise.all([
    fetchStopsWithAnnotations(),
    fetchAuthors(),
    fetchWorks(),
    fetchClaims(),
  ]);

  // Bereme jen ready zastávky — to jsou ty, co máme ověřené jako instalable
  const readyStops = stops.filter((s) => s.annotation?.status === "ready");
  const authorsWithProgress = buildAuthorsWithProgress(authors, works, claims);

  return (
    <InstallList
      token={token}
      readyStops={readyStops}
      authors={authorsWithProgress}
      claims={claims}
    />
  );
}
