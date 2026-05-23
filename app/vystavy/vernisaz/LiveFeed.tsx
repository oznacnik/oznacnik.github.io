"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, scoutingPhotoUrl } from "@/lib/supabase";
import { isPlaceholderTitle } from "@/lib/install";

export interface FeedClaim {
  stop_id: string;
  author_id: string;
  work_ids: string[];
  photo_paths: string[];
  claimed_at: string;
}

export default function LiveFeed({
  initialClaims,
  stopsById,
  authorsById,
  worksById,
}: {
  initialClaims: FeedClaim[];
  stopsById: Record<string, string>; // stop_id -> stop_name
  authorsById: Record<string, { name: string; color: string }>;
  worksById: Record<string, { title: string }>;
}) {
  const [claims, setClaims] = useState<FeedClaim[]>(initialClaims);

  useEffect(() => {
    // Subscribe na INSERT/UPDATE/DELETE oznacnik_claims, re-fetch při změně.
    // (Jednodušší než zachytávat payload diff per event.)
    const channel = supabase
      .channel("vernisaz-claims")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "oznacnik_claims" },
        async () => {
          const { data } = await supabase
            .from("oznacnik_claims")
            .select("stop_id, author_id, work_ids, photo_paths, claimed_at")
            .order("claimed_at", { ascending: false });
          if (data) setClaims(data as FeedClaim[]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sorted = useMemo(
    () =>
      [...claims].sort((a, b) =>
        b.claimed_at.localeCompare(a.claimed_at)
      ),
    [claims]
  );

  return (
    <div
      style={{
        background: "#fff",
        color: "#000",
        padding: 24,
      }}
    >
      <div
        className="font-black uppercase"
        style={{
          fontSize: 11,
          letterSpacing: "0.16em",
          color: "#000",
          marginBottom: 18,
        }}
      >
        Live feed · poslední claimy
      </div>

      {sorted.length === 0 ? (
        <div style={{ color: "#888", fontSize: 13, fontStyle: "italic" }}>
          Vernisáž zatím nezačala.
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {sorted.slice(0, 50).map((c) => {
            const stop = stopsById[c.stop_id];
            const author = authorsById[c.author_id];
            const realWorks = (c.work_ids ?? [])
              .map((id) => worksById[id]?.title)
              .filter((t): t is string => !!t && !isPlaceholderTitle(t));
            const time = new Date(c.claimed_at);
            // Hierarchie: dílo (největší) → autor → zastávka. Když dílo
            // chybí (placeholder, anonymní autor bez seznamu), spadne
            // primární řádek na autora a zastávka zůstane sekundární.
            const headline = realWorks.length > 0
              ? realWorks.join(" · ")
              : (author?.name ?? c.author_id);
            const subline = realWorks.length > 0
              ? (author?.name ?? c.author_id)
              : null;
            return (
              <li
                key={c.stop_id + "-" + c.claimed_at}
                style={{
                  padding: "14px 0",
                  borderBottom: "1px solid #e5e5e5",
                }}
              >
                <div
                  className="font-black"
                  style={{
                    fontSize: 18,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  {headline}
                </div>
                {subline && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#444",
                      marginTop: 2,
                    }}
                  >
                    {subline}
                  </div>
                )}
                <div
                  className="flex items-baseline justify-between gap-3 flex-wrap"
                  style={{ marginTop: 6 }}
                >
                  <span
                    className="uppercase"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      color: "#888",
                    }}
                  >
                    @ {stop ?? c.stop_id}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "#888",
                      fontFamily: "monospace",
                      letterSpacing: 0,
                    }}
                  >
                    {time.toLocaleTimeString("cs-CZ", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {c.photo_paths && c.photo_paths.length > 0 && (
                  <div
                    style={{
                      marginTop: 10,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                      gap: 4,
                    }}
                  >
                    {c.photo_paths.slice(0, 6).map((p) => (
                      <a
                        key={p}
                        href={scoutingPhotoUrl(p)}
                        target="_blank"
                        rel="noopener"
                        style={{
                          display: "block",
                          aspectRatio: "1",
                          background: "#f5f5f5",
                          overflow: "hidden",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={scoutingPhotoUrl(p)}
                          alt=""
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </a>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
