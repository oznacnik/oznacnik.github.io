import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function QrLandingPage({
  params,
}: {
  params: Promise<{ index: string }>;
}) {
  const { index } = await params;
  const qrIndex = parseInt(index, 10);

  if (!isNaN(qrIndex) && qrIndex > 0) {
    // Log scan (anonymně — UA + referrer, žádné IP)
    const h = await headers();
    const ua = h.get("user-agent") ?? null;
    const ref = h.get("referer") ?? null;

    try {
      await supabase.from("oznacnik_qr_scans").insert({
        qr_index: qrIndex,
        user_agent: ua,
        referrer: ref,
      });
    } catch (err) {
      // Fail silently — uživatel má dostat výstavu, ne error
      console.error("[qr-scan] log selhal:", err);
    }
  }

  // Redirect na vernisáž (později se může změnit na work-specific stránku)
  redirect("/vystavy/vernisaz");
}
