"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, scoutingPhotoUrl } from "@/lib/supabase";
import { isPlaceholderTitle } from "@/lib/install";

export interface PhotoFeedClaim {
  stop_id: string;
  author_id: string;
  work_ids: string[];
  photo_paths: string[];
  claimed_at: string;
}

export default function PhotoFeed({
  initialClaims,
  stopsById,
  authorsById,
  worksById,
}: {
  initialClaims: PhotoFeedClaim[];
  stopsById: Record<string, string>;
  authorsById: Record<string, { name: string }>;
  worksById: Record<string, { title: string }>;
}) {
  const [claims, setClaims] = useState<PhotoFeedClaim[]>(initialClaims);

  useEffect(() => {
    // Realtime: cokoli se v oznacnik_claims hne, re-fetchnout.
    const channel = supabase
      .channel("home-photo-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "oznacnik_claims" },
        async () => {
          const { data } = await supabase
            .from("oznacnik_claims")
            .select("stop_id, author_id, work_ids, photo_paths, claimed_at")
            .order("claimed_at", { ascending: false });
          if (data) {
            const withPhotos = (data as PhotoFeedClaim[]).filter(
              (c) => (c.photo_paths ?? []).length > 0
            );
            setClaims(withPhotos);
          }
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

  if (sorted.length === 0) {
    return (
      <div
        style={{
          padding: "40px 24px",
          textAlign: "center",
          color: "#888",
          fontSize: 13,
          fontStyle: "italic",
        }}
      >
        Žádné fotky z vernisáže zatím nebyly nahrány.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      {sorted.map((c) => {
        const stopName = stopsById[c.stop_id] ?? c.stop_id;
        const authorName = authorsById[c.author_id]?.name ?? "—";
        const works = (c.work_ids ?? [])
          .map((id) => worksById[id]?.title)
          .filter((t): t is string => !!t && !isPlaceholderTitle(t));
        const time = new Date(c.claimed_at);
        return (
          <article
            key={c.stop_id + "-" + c.claimed_at}
            style={{
              borderBottom: "4px solid #000",
            }}
          >
            <PhotoBlock paths={c.photo_paths} />
            <div style={{ padding: "20px 24px" }}>
              <div
                className="font-black uppercase leading-none"
                style={{
                  fontSize: "clamp(20px, 3vw, 32px)",
                  letterSpacing: "-0.03em",
                }}
              >
                {stopName}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  color: "#000",
                  fontWeight: 700,
                }}
              >
                {authorName}
              </div>
              {works.length > 0 && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: "#555",
                    lineHeight: 1.4,
                  }}
                >
                  {works.join(" · ")}
                </div>
              )}
              <div
                className="type-label"
                style={{
                  marginTop: 10,
                  color: "#888",
                  fontFamily: "monospace",
                  letterSpacing: 0,
                }}
              >
                {time.toLocaleString("cs-CZ", {
                  day: "numeric",
                  month: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PhotoBlock({ paths }: { paths: string[] }) {
  if (paths.length === 1) {
    return (
      <a
        href={scoutingPhotoUrl(paths[0])}
        target="_blank"
        rel="noopener"
        style={{
          display: "block",
          width: "100%",
          background: "#000",
          aspectRatio: "4/3",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={scoutingPhotoUrl(paths[0])}
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
    );
  }
  // 2+ fotek: hlavní vlevo, mřížka vpravo (na velkém viewportu) /
  // jednoduchý grid na malém.
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 2,
        background: "#000",
      }}
    >
      {paths.map((p) => (
        <a
          key={p}
          href={scoutingPhotoUrl(p)}
          target="_blank"
          rel="noopener"
          style={{
            display: "block",
            aspectRatio: "1",
            background: "#111",
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
  );
}
