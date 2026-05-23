import { assertToken, fetchStopsWithAnnotations } from "@/lib/scouting";
import {
  buildAuthorsWithProgress,
  fetchAuthors,
  fetchClaims,
  fetchLabelsUsedByAuthor,
  fetchWorks,
} from "@/lib/install";
import AuthorsList from "./AuthorsList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vernisáž — autoři",
  robots: { index: false, follow: false },
};

export default async function AuthorsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  assertToken(token);

  const [stops, authors, works, claims, labelsUsed] = await Promise.all([
    fetchStopsWithAnnotations(),
    fetchAuthors(),
    fetchWorks(),
    fetchClaims(),
    fetchLabelsUsedByAuthor(),
  ]);

  const list = buildAuthorsWithProgress(authors, works, claims, labelsUsed);

  return (
    <AuthorsList
      token={token}
      authors={list}
      claims={claims}
      stops={stops.map((s) => ({ stop_id: s.stop_id, stop_name: s.stop_name }))}
    />
  );
}
