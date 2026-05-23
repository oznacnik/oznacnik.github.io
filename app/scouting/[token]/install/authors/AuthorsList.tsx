"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authorColor, displayName, type AuthorWithProgress, type Claim } from "@/lib/install";
import { supabase } from "@/lib/supabase";

interface StopMin {
  stop_id: string;
  stop_name: string;
}

export default function AuthorsList({
  token,
  authors,
  claims,
  stops,
}: {
  token: string;
  authors: AuthorWithProgress[];
  claims: Claim[];
  stops: StopMin[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>("");

  const allAuthorIds = authors.map((a) => a.id);
  const stopsById = new Map(stops.map((s) => [s.stop_id, s]));
  const claimsByAuthor = new Map<string, Claim[]>();
  for (const c of claims) {
    if (!claimsByAuthor.has(c.author_id)) claimsByAuthor.set(c.author_id, []);
    claimsByAuthor.get(c.author_id)!.push(c);
  }

  const totalRequested = authors.reduce((a, x) => a + (x.requested_stops ?? 0), 0);
  const totalClaimed = claims.length;
  const presentCount = authors.filter((a) => a.present).length;

  const togglePresent = async (id: string, present: boolean) => {
    setPendingId(id);
    const { error } = await supabase
      .from("oznacnik_authors")
      .update({ present })
      .eq("id", id);
    setPendingId(null);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  };

  const startEditName = (a: AuthorWithProgress) => {
    setEditingNameId(a.id);
    setEditingNameValue(displayName(a));
  };

  const saveName = async (id: string) => {
    const value = editingNameValue.trim();
    if (!value) {
      setEditingNameId(null);
      return;
    }
    setPendingId(id);
    const { error } = await supabase
      .from("oznacnik_authors")
      .update({ display_name: value })
      .eq("id", id);
    setPendingId(null);
    setEditingNameId(null);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header
        style={{
          background: "#000",
          color: "#fff",
          padding: "10px 16px",
          borderBottom: "4px solid #E3000B",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/scouting/${token}/install`}
            className="font-black uppercase no-underline"
            style={{ fontSize: 11, letterSpacing: "0.12em", color: "#aaa" }}
          >
            ← Vernisáž
          </Link>
          <div className="font-black uppercase" style={{ letterSpacing: "0.12em", fontSize: 12 }}>
            Autoři
          </div>
          <div style={{ width: 60 }} />
        </div>
      </header>

      <section
        style={{
          padding: "14px 16px",
          background: "#fff",
          borderBottom: "3px solid #000",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        <Stat label="Přítomno" value={`${presentCount}/${authors.length}`} accent="#00B341" />
        <Stat label="Claimnuto" value={`${totalClaimed} / ${totalRequested}`} accent="#000" />
        <Stat label="Autorů" value={authors.length} accent="#888" />
      </section>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {authors.map((a) => {
          const color = authorColor(a.id, allAuthorIds);
          const quota = a.requested_stops ?? 0;
          const filled = a.claimedStops;
          const pct = quota > 0 ? Math.min(100, Math.round((filled / quota) * 100)) : 0;
          const isFull = quota > 0 && filled >= quota;
          const isOver = quota > 0 && filled > quota;
          const myClaims = claimsByAuthor.get(a.id) ?? [];
          const dim = !a.present;

          return (
            <li
              key={a.id}
              style={{
                background: "#fff",
                borderBottom: "3px solid #000",
                padding: "14px 16px",
                opacity: dim ? 0.5 : 1,
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  style={{
                    width: 16,
                    height: 16,
                    background: color,
                    border: "2px solid #000",
                    borderRadius: 3,
                    flexShrink: 0,
                  }}
                />
                <div className="flex-1 min-w-0">
                  {editingNameId === a.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editingNameValue}
                      onChange={(e) => setEditingNameValue(e.target.value)}
                      onBlur={() => saveName(a.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveName(a.id);
                        if (e.key === "Escape") setEditingNameId(null);
                      }}
                      style={{
                        width: "100%",
                        fontSize: 18,
                        fontWeight: 900,
                        letterSpacing: "-0.02em",
                        border: "2px solid #000",
                        padding: "4px 8px",
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditName(a)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "left",
                      }}
                      className="font-black"
                      title="Klikni a uprav přezdívku"
                    >
                      <span
                        style={{
                          fontSize: 18,
                          letterSpacing: "-0.02em",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          borderBottom: "1px dashed #ccc",
                        }}
                      >
                        {displayName(a)}
                      </span>
                    </button>
                  )}
                  {a.display_name && a.display_name !== a.name && (
                    <div
                      style={{
                        fontSize: 10,
                        color: "#aaa",
                        marginTop: 2,
                        letterSpacing: "0.04em",
                      }}
                    >
                      real: {a.name}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 11,
                      color: "#888",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginTop: 4,
                    }}
                  >
                    {a.works.length} unik. {a.works.length === 1 ? "dílo" : a.works.length < 5 ? "díla" : "děl"} · {a.labelsRemaining}/{a.labelsTotal} labels free
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => togglePresent(a.id, !a.present)}
                  disabled={pendingId === a.id}
                  style={{
                    padding: "10px 14px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontFamily: "inherit",
                    border: `3px solid ${a.present ? "#00B341" : "#888"}`,
                    background: a.present ? "#00B341" : "transparent",
                    color: a.present ? "#000" : "#888",
                    cursor: pendingId === a.id ? "wait" : "pointer",
                    minWidth: 90,
                  }}
                >
                  {a.present ? "TADY" : "není"}
                </button>

                <div
                  className="font-black"
                  style={{
                    fontSize: 28,
                    letterSpacing: "-0.03em",
                    color: isOver ? "#E3000B" : isFull ? "#00B341" : "#000",
                    minWidth: 80,
                    textAlign: "right",
                  }}
                >
                  {filled}
                  <span style={{ color: "#888", fontSize: 16 }}> / {quota || "?"}</span>
                </div>
              </div>

              <div
                style={{
                  marginTop: 10,
                  height: 8,
                  background: "#eee",
                  border: "1px solid #000",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    height: "100%",
                    background: isOver ? "#E3000B" : color,
                  }}
                />
              </div>

              {myClaims.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {myClaims.map((c) => {
                    const stop = stopsById.get(c.stop_id);
                    return (
                      <Link
                        key={c.stop_id}
                        href={`/scouting/${token}/install/${c.stop_id}`}
                        style={{
                          padding: "4px 8px",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "-0.01em",
                          background: color,
                          color: "#000",
                          border: "2px solid #000",
                          textDecoration: "none",
                        }}
                      >
                        {stop?.stop_name ?? c.stop_id}
                        {c.work_ids.length > 0 && (
                          <span style={{ opacity: 0.7, marginLeft: 4 }}>· {c.work_ids.length}d</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#888",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        className="font-black"
        style={{
          fontSize: 22,
          letterSpacing: "-0.03em",
          color: accent,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}
