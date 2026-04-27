import { isAuthenticated } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getExhibition, getExhibitionStations, getAllStations, getAllExhibitions } from "@/lib/db";

export async function generateStaticParams() {
  const exhibitions = await getAllExhibitions();
  return exhibitions.map((e) => ({ id: e.id }));
}
import ExhibitionForm from "@/components/ExhibitionForm";

export default async function EditVystavaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin/login");

  const { id } = await params;

  let exhibition = null;
  let exStations: import("@/types").ExhibitionStation[] = [];
  let allStations: import("@/types").Station[] = [];

  try {
    [exhibition, exStations, allStations] = await Promise.all([
      getExhibition(id),
      getExhibitionStations(id),
      getAllStations(),
    ]);
  } catch {
    // Firebase not configured
  }

  if (!exhibition) return notFound();

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <div className="px-6 pt-8 pb-4" style={{ borderBottom: "4px solid #111" }}>
        <div className="type-label mb-2" style={{ color: "#555" }}>
          Linka {exhibition.lineNumbers.join(" · ")}
        </div>
        <h1
          className="font-black uppercase"
          style={{ fontSize: "clamp(20px, 3.5vw, 40px)", letterSpacing: "-0.03em", color: "#fff" }}
        >
          {exhibition.title}
        </h1>
      </div>
      <div className="bar bar-thick" style={{ background: "#222" }} />
      <ExhibitionForm
        mode="edit"
        initial={exhibition}
        initialStations={exStations}
        allStations={allStations}
      />
    </div>
  );
}
