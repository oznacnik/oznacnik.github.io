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
  initialGlobalIdxByPath,
}: {
  initialClaims: PhotoFeedClaim[];
  stopsById: Record<string, string>;
  authorsById: Record<string, { name: string }>;
  worksById: Record<string, { title: string }>;
  // Mapování photo_path → globální index do PhotoLightbox.photos. Server
  // pre-počítá tohle při loadu; pro realtime nové fotky doplňujeme my
  // (po-fetch sort znovu + indexy).
  initialGlobalIdxByPath: Record<string, number>;
}) {
  const [claims, setClaims] = useState<PhotoFeedClaim[]>(initialClaims);
  const [globalIdxByPath, setGlobalIdxByPath] = useState<
    Record<string, number>
  >(initialGlobalIdxByPath);

  useEffect(() => {
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
            // Recompute global photo indexes — fotky pole pak musí mít
            // úplně stejné pořadí (sort desc by claimed_at) jako tady.
            const idx: Record<string, number> = {};
            let i = 0;
            for (const c of withPhotos) {
              for (const p of c.photo_paths) idx[p] = i++;
            }
            setGlobalIdxByPath(idx);
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
        maxWidth: 720,
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
            <PhotoBlock
              paths={c.photo_paths}
              globalIdxByPath={globalIdxByPath}
            />
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

function PhotoBlock({
  paths,
  globalIdxByPath,
}: {
  paths: string[];
  globalIdxByPath: Record<string, number>;
}) {
  if (paths.length === 1) {
    return (
      <PhotoThumb
        path={paths[0]}
        globalIdx={globalIdxByPath[paths[0]] ?? 0}
        aspect="4 / 3"
      />
    );
  }
  if (paths.length === 2) {
    // Mobil: 2 fotky pod sebou s viditelnou mezerou (snazší listovat
    // a každá zabere celou šířku). Desktop: side-by-side, vidíš obě naráz.
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2"
        style={{ background: "#000", gap: 4 }}
      >
        {paths.map((p) => (
          <PhotoThumb
            key={p}
            path={p}
            globalIdx={globalIdxByPath[p] ?? 0}
            aspect="1 / 1"
          />
        ))}
      </div>
    );
  }
  // 3+: kompaktní mřížka
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3"
      style={{ background: "#000", gap: 2 }}
    >
      {paths.map((p) => (
        <PhotoThumb
          key={p}
          path={p}
          globalIdx={globalIdxByPath[p] ?? 0}
          aspect="1 / 1"
        />
      ))}
    </div>
  );
}

function PhotoThumb({
  path,
  globalIdx,
  aspect,
}: {
  path: string;
  globalIdx: number;
  aspect: string;
}) {
  return (
    <a
      href={`#p-${globalIdx}`}
      style={{
        display: "block",
        background: "#111",
        aspectRatio: aspect,
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={scoutingPhotoUrl(path)}
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
