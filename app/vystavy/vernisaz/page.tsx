import Link from "next/link";
import { fetchStopsWithAnnotations } from "@/lib/scouting";
import {
  authorColor,
  buildAuthorsWithProgress,
  fetchAuthors,
  fetchClaims,
  fetchWorks,
} from "@/lib/install";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vernisáž 2026 — Galerie Označník",
};

export default async function VernisazPage() {
  const [stops, authors, works, claims] = await Promise.all([
    fetchStopsWithAnnotations(),
    fetchAuthors(),
    fetchWorks(),
    fetchClaims(),
  ]);

  const stopsById = new Map(stops.map((s) => [s.stop_id, s]));
  const worksById = new Map(works.map((w) => [w.id, w]));
  const authorsWithProgress = buildAuthorsWithProgress(authors, works, claims);

  // Anonymizace: autoři s web_consent=false dostanou displayName "Anonym"
  // (případně "Anonym 1/2/3" pokud je jich víc) a skryje se jim anotace.
  // Zastávky a díla zůstávají viditelné — jen bez identifikace autora.
  const anonAuthors = authorsWithProgress.filter((a) => !a.web_consent);
  let anonIdx = 0;
  const displayAuthors = authorsWithProgress.map((a) => {
    if (a.web_consent) {
      return { ...a, displayName: a.name, displayAnnotation: a.annotation };
    }
    anonIdx++;
    return {
      ...a,
      displayName: anonAuthors.length === 1 ? "Anonym" : `Anonym ${anonIdx}`,
      displayAnnotation: null as string | null,
    };
  });

  const allAuthorIds = displayAuthors.map((a) => a.id);
  const authorsById = new Map(displayAuthors.map((a) => [a.id, a]));

  // Seskupit claimy po autorech
  const claimsByAuthor = new Map<string, typeof claims>();
  for (const c of claims) {
    if (!claimsByAuthor.has(c.author_id)) claimsByAuthor.set(c.author_id, []);
    claimsByAuthor.get(c.author_id)!.push(c);
  }

  // Všichni autoři, seřazení: nejdřív kdo má claimy, pak ostatní; anonymy
  // na konec (ne kvůli důležitosti, jen aby seskupení dávalo smysl).
  const authorsSorted = [...displayAuthors].sort((a, b) => {
    const aCount = claimsByAuthor.get(a.id)?.length ?? 0;
    const bCount = claimsByAuthor.get(b.id)?.length ?? 0;
    if (aCount !== bCount) return bCount - aCount;
    if (a.web_consent !== b.web_consent) return a.web_consent ? -1 : 1;
    return a.displayName.localeCompare(b.displayName, "cs");
  });

  const totalStops = claims.length;
  const totalAuthors = displayAuthors.length;

  return (
    <div>
      {/* Hero */}
      <section className="px-6 pt-12 pb-0">
        <div className="type-label mb-4" style={{ color: "#bbb" }}>
          Praha · {new Date().toLocaleDateString("cs-CZ")}
        </div>
        <div
          className="font-black uppercase leading-none"
          style={{
            fontSize: "clamp(56px, 12vw, 140px)",
            letterSpacing: "-0.04em",
            lineHeight: 0.85,
          }}
        >
          VERNISÁŽ<br />
          <span style={{ color: "#E3000B" }}>2026</span>
        </div>
        <div className="mt-8 max-w-2xl">
          <div className="bar bar-thin mb-4" />
          <p className="type-body" style={{ fontWeight: 400 }}>
            Kolektivní výstava napříč Prahou. {totalAuthors} {plural(totalAuthors, "autor", "autoři", "autorů")} na {totalStops} {plural(totalStops, "zastávce", "zastávkách", "zastávkách")}. Každá zastávka přidělená jednomu autorovi, díla v reklamních rámech tramvajových označníků.
          </p>
          <div className="bar bar-thin mt-4" />
        </div>
      </section>

      <div className="bar bar-thick mt-12" />

      {/* Stats strip */}
      <section className="grid grid-cols-2 lg:grid-cols-3 border-b-4 border-black">
        <Stat label="Autorů" value={totalAuthors} />
        <Stat label="Zastávek" value={totalStops} hideBorder />
        <Stat label="Děl celkem" value={claims.reduce((acc, c) => acc + c.work_ids.length, 0)} hideBorder={false} />
      </section>

      {/* Autoři */}
      <section className="px-6 py-12">
        <h2 className="type-lg mb-8">Autoři</h2>
        <div className="flex flex-col gap-8">
          {authorsSorted.map((a) => {
            const color = authorColor(a.id, allAuthorIds);
            const myClaims = claimsByAuthor.get(a.id) ?? [];
            return (
              <div key={a.id} className="frame overflow-hidden">
                <div style={{ background: color, height: 12 }} />
                <div className="p-6">
                  <div className="flex items-baseline justify-between gap-4 flex-wrap mb-2">
                    <h3
                      className="font-black uppercase leading-none"
                      style={{
                        fontSize: "clamp(24px, 4vw, 44px)",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {a.displayName}
                    </h3>
                    <span
                      className="type-label"
                      style={{ color: myClaims.length === 0 ? "#ccc" : "#888" }}
                    >
                      {myClaims.length === 0
                        ? "zatím bez zastávky"
                        : `${myClaims.length} ${plural(myClaims.length, "zastávka", "zastávky", "zastávek")}`}
                    </span>
                  </div>
                  {a.displayAnnotation && (
                    <p
                      className="prose-gallery"
                      style={{ marginTop: 12, maxWidth: 720 }}
                    >
                      {a.displayAnnotation}
                    </p>
                  )}
                  {myClaims.length === 0 && (
                    <div
                      className="type-label"
                      style={{
                        marginTop: 16,
                        color: "#bbb",
                        fontStyle: "italic",
                        letterSpacing: "0.06em",
                        textTransform: "none",
                      }}
                    >
                      Zastávky se přiřadí během vernisáže.
                    </div>
                  )}
                  <div
                    className="grid gap-3 mt-6"
                    style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
                  >
                    {myClaims.map((c) => {
                      const stop = stopsById.get(c.stop_id);
                      const claimedWorks = c.work_ids
                        .map((id) => worksById.get(id))
                        .filter((w): w is NonNullable<typeof w> => !!w);
                      return (
                        <div
                          key={c.stop_id}
                          style={{
                            border: "2px solid #000",
                            padding: 12,
                            background: "#fff",
                          }}
                        >
                          <div
                            className="font-black"
                            style={{
                              fontSize: 15,
                              letterSpacing: "-0.01em",
                              marginBottom: 6,
                            }}
                          >
                            {stop?.stop_name ?? c.stop_id}
                          </div>
                          {claimedWorks.length === 0 ? (
                            <div
                              style={{
                                fontSize: 11,
                                color: "#aaa",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                              }}
                            >
                              Díla nezadána
                            </div>
                          ) : (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                              {claimedWorks.map((w) => (
                                <li
                                  key={w.id}
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 400,
                                    color: "#333",
                                    lineHeight: 1.4,
                                    marginBottom: 2,
                                  }}
                                >
                                  · {w.title}
                                  {(w.year || w.technique) && (
                                    <span style={{ color: "#999" }}>
                                      {" "}
                                      ({[w.technique, w.year].filter(Boolean).join(", ")})
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                          {c.notes && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "#666",
                                fontStyle: "italic",
                                marginTop: 8,
                                paddingTop: 8,
                                borderTop: "1px solid #eee",
                              }}
                            >
                              {c.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* Zastávky podle abecedy */}
      {claims.length > 0 && (
        <>
          <div className="bar bar-thick" />
          <section className="px-6 py-12">
            <h2 className="type-lg mb-8">Všechny zastávky</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[...claims]
                .sort((a, b) => {
                  const an = stopsById.get(a.stop_id)?.stop_name ?? "";
                  const bn = stopsById.get(b.stop_id)?.stop_name ?? "";
                  return an.localeCompare(bn, "cs");
                })
                .map((c) => {
                  const stop = stopsById.get(c.stop_id);
                  const author = authorsById.get(c.author_id);
                  const color = authorColor(c.author_id, allAuthorIds);
                  return (
                    <li
                      key={c.stop_id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "12px 0",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          background: color,
                          border: "2px solid #000",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="font-black" style={{ fontSize: 16, letterSpacing: "-0.01em" }}>
                          {stop?.stop_name ?? c.stop_id}
                        </div>
                        <div
                          className="type-label"
                          style={{ color: "#888", textTransform: "none", marginTop: 2 }}
                        >
                          {author?.displayName ?? c.author_id}
                          {c.work_ids.length > 0 && (
                            <> · {c.work_ids.length} {plural(c.work_ids.length, "dílo", "díla", "děl")}</>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </section>
        </>
      )}

      <div className="bar bar-thick" />
      <div className="px-6 py-6 flex justify-between items-center">
        <Link href="/" className="nav-link">← Všechny výstavy</Link>
        <span className="type-label" style={{ color: "#aaa" }}>
          Galerie Označník · {new Date().getFullYear()}
        </span>
      </div>
      <div className="bar" />
    </div>
  );
}

function Stat({ label, value, hideBorder = false }: { label: string; value: number; hideBorder?: boolean }) {
  return (
    <div className="px-6 py-6" style={{ borderRight: hideBorder ? "none" : "4px solid black" }}>
      <div className="type-label mb-2" style={{ color: "#888" }}>{label}</div>
      <div
        className="font-black leading-none"
        style={{ fontSize: "clamp(28px, 4vw, 56px)", letterSpacing: "-0.03em" }}
      >
        {value}
      </div>
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}
