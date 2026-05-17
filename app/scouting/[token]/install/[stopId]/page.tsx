import { notFound } from "next/navigation";
import { assertToken, fetchStop } from "@/lib/scouting";
import { fetchAuthors, fetchClaims, fetchWorks, buildAuthorsWithProgress } from "@/lib/install";
import { supabase } from "@/lib/supabase";
import InstallStop from "./InstallStop";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vernisáž — claim",
  robots: { index: false, follow: false },
};

export default async function InstallStopPage({
  params,
}: {
  params: Promise<{ token: string; stopId: string }>;
}) {
  const { token, stopId } = await params;
  assertToken(token);

  const stop = await fetchStop(stopId);
  if (!stop) notFound();

  const [authors, works, claims] = await Promise.all([
    fetchAuthors(),
    fetchWorks(),
    fetchClaims(),
  ]);

  const authorsWithProgress = buildAuthorsWithProgress(authors, works, claims);
  const existingClaim = claims.find((c) => c.stop_id === stopId) ?? null;

  // Počet umístění každého díla napříč všemi claimy (NE jen na této zastávce).
  // Slouží jako vodítko: "tohle dílo už visí na X dalších zastávkách".
  const workPlacements: Record<string, number> = {};
  for (const c of claims) {
    for (const wid of c.work_ids) {
      workPlacements[wid] = (workPlacements[wid] ?? 0) + 1;
    }
  }

  // Mapa work_id → qr_index (pro zobrazení "QR #N" u každého díla)
  const { data: qrLabels } = await supabase
    .from("oznacnik_qr_labels")
    .select("qr_index, work_id");
  const qrByWork: Record<string, number> = {};
  for (const l of (qrLabels ?? []) as { qr_index: number; work_id: string }[]) {
    qrByWork[l.work_id] = l.qr_index;
  }

  // Poslední claim (kvůli avoid-back-to-back v random algoritmu)
  const lastClaim = [...claims]
    .filter((c) => c.stop_id !== stopId)
    .sort((a, b) => b.claimed_at.localeCompare(a.claimed_at))[0];

  return (
    <InstallStop
      token={token}
      stop={stop}
      authors={authorsWithProgress}
      existingClaim={existingClaim}
      workPlacements={workPlacements}
      qrByWork={qrByWork}
      lastAuthorId={lastClaim?.author_id ?? null}
    />
  );
}
