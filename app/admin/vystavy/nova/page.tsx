import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllStations } from "@/lib/db";
import ExhibitionForm from "@/components/ExhibitionForm";

export default async function NovaVystavaPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin/login");

  let allStations: import("@/types").Station[] = [];
  try {
    allStations = await getAllStations();
  } catch {
    // Firebase not configured
  }

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <div className="px-6 pt-8 pb-4">
        <h1
          className="font-black uppercase"
          style={{ fontSize: "clamp(24px, 4vw, 48px)", letterSpacing: "-0.03em", color: "#fff" }}
        >
          Nová výstava
        </h1>
      </div>
      <div className="bar bar-thick" style={{ background: "#222" }} />
      <ExhibitionForm mode="create" allStations={allStations} />
    </div>
  );
}
