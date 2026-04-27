import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats, getAllExhibitions } from "@/lib/db";
import Link from "next/link";
import type { Exhibition } from "@/types";

export default async function AdminDashboard() {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin/login");

  let stats = { current: 0, upcoming: 0, past: 0, activeStations: 0, totalStations: 0 };
  let exhibitions: Exhibition[] = [];

  try {
    [stats, exhibitions] = await Promise.all([
      getDashboardStats(),
      getAllExhibitions(),
    ]);
  } catch {
    // Firebase not configured
  }

  return (
    <div style={{ background: "#000", minHeight: "100vh", color: "#fff" }}>
      <div className="px-6 pt-10 pb-8">
        <h1
          className="font-black uppercase leading-none"
          style={{ fontSize: "clamp(32px, 6vw, 64px)", letterSpacing: "-0.03em", color: "#fff" }}
        >
          Dashboard
        </h1>
      </div>

      <div className="bar bar-thick" style={{ background: "#222" }} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 border-b-4" style={{ borderColor: "#222" }}>
        {[
          { label: "Aktuální", value: stats.current, color: "var(--dpp)" },
          { label: "Připravované", value: stats.upcoming, color: "#fff" },
          { label: "Archiv", value: stats.past, color: "#666" },
          { label: "Aktivní zastávky", value: stats.activeStations, color: "var(--dpp)" },
          { label: "Zastávek celkem", value: stats.totalStations, color: "#444" },
        ].map((s, i) => (
          <div
            key={i}
            className="px-6 py-6"
            style={{ borderRight: i < 4 ? "4px solid #222" : "none" }}
          >
            <div className="type-label mb-2" style={{ color: "#555" }}>{s.label}</div>
            <div
              className="font-black leading-none"
              style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.04em", color: s.color }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Exhibitions list */}
      <div className="px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2
            className="font-black uppercase"
            style={{ fontSize: "clamp(18px, 2.5vw, 28px)", letterSpacing: "-0.02em", color: "#fff" }}
          >
            Výstavy
          </h2>
          <Link
            href="/admin/vystavy/nova"
            className="type-label px-4 py-2 no-underline"
            style={{ background: "var(--dpp)", color: "#fff" }}
          >
            + Nová výstava
          </Link>
        </div>

        {exhibitions.length === 0 ? (
          <div className="px-4 py-6" style={{ border: "4px solid #222" }}>
            <p className="type-label" style={{ color: "#444" }}>
              {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
                ? "Žádné výstavy"
                : "Firebase není nakonfigurovaný — doplňte .env.local"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            {exhibitions.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center gap-4 px-4 py-4"
                style={{
                  borderBottom: "4px solid #111",
                  background: "#0a0a0a",
                }}
              >
                <div
                  className="font-black shrink-0 leading-none"
                  style={{
                    fontSize: "clamp(20px, 3vw, 32px)",
                    letterSpacing: "-0.04em",
                    color: ex.color,
                    minWidth: "2.5ch",
                  }}
                >
                  {ex.lineNumbers.join("·")}
                </div>

                <div className="flex-1">
                  <div
                    className="font-black uppercase"
                    style={{ fontSize: "clamp(13px, 1.5vw, 16px)", letterSpacing: "-0.01em", color: "#fff" }}
                  >
                    {ex.title}
                  </div>
                  <div className="type-label mt-0.5" style={{ color: "#555" }}>
                    {ex.status === "current" ? "Probíhá" : ex.status === "upcoming" ? "Připravuje se" : "Ukončeno"}
                    {" · "}
                    {new Date(ex.openedAt).toLocaleDateString("cs-CZ")}
                  </div>
                </div>

                <div
                  className="shrink-0 px-2 py-1 type-label"
                  style={{
                    background: ex.status === "current" ? "var(--dpp)" : "#222",
                    color: ex.status === "current" ? "#fff" : "#666",
                  }}
                >
                  {ex.status}
                </div>

                <Link
                  href={`/admin/vystavy/${ex.id}`}
                  className="type-label no-underline shrink-0"
                  style={{ color: "#555" }}
                >
                  Upravit →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
