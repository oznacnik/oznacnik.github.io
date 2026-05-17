"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { type StopWithAnnotation } from "@/lib/scouting";
import { authorColor, type AuthorWithProgress, type Claim } from "@/lib/install";
import { supabase } from "@/lib/supabase";

interface QrLabelHere {
  qr_index: number;
  work_id: string;
  author_id: string;
  label_seq: number;
  placed_at: string | null;
}

interface AvailableLabel {
  qr_index: number;
  work_id: string;
  author_id: string;
  label_seq: number;
}

// Tihle autoři nesmí být přiřazeni jako 1. ani 2. claim — uživatelská
// preference (aby vernisáž "začala dobře" jinými autory).
const DEFERRED_AT_START = new Set(["krsnajedy", "terka"]);

export default function InstallStop({
  token,
  stop,
  authors,
  existingClaim,
  workPlacements,
  labelsHere: initialLabelsHere,
  lastAuthorId,
  claimsCountSoFar,
}: {
  token: string;
  stop: StopWithAnnotation;
  authors: AuthorWithProgress[];
  existingClaim: Claim | null;
  workPlacements: Record<string, number>;
  labelsHere: QrLabelHere[];
  lastAuthorId: string | null;
  claimsCountSoFar: number;
}) {
  const router = useRouter();

  // Pokud zastávka už má claim, předvyplníme. Jinak čekáme na "rozhození".
  const [authorId, setAuthorId] = useState<string>(existingClaim?.author_id ?? "");
  const [notes, setNotes] = useState<string>(existingClaim?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // QR popisky už spárované s touto zastávkou (z předchozího Save) — read-only
  // pro tuto session; reuse logika v toggleWork preferuje recyklaci těchto.
  const labelsHere = initialLabelsHere;

  // Pool volných popisků aktuálního autora (fetched po CLAIM)
  const [availableLabels, setAvailableLabels] = useState<AvailableLabel[]>([]);
  const [loadingPool, setLoadingPool] = useState(false);

  // Set vybraných qr_index na téhle zastávce. Pre-fill z labelsHere.
  // Per-physical-label tracking → každý popisek je samostatně togglable.
  const [pickedQrIndices, setPickedQrIndices] = useState<Set<number>>(
    () => new Set(initialLabelsHere.map((l) => l.qr_index))
  );

  const allAuthorIds = useMemo(() => authors.map((a) => a.id), [authors]);
  const selectedAuthor = authors.find((a) => a.id === authorId) ?? null;

  // Autoři co ještě mají kvótu = kandidáti pro rozhození
  const candidates = useMemo(() => {
    return authors.filter((a) => {
      const quota = a.requested_stops ?? 0;
      return quota > 0 && a.claimedStops < quota;
    });
  }, [authors]);

  // CLAIM = JEN náhodný výběr autora. Žádné DB zápisy, žádné přiřazení
  // popisků. Viz CLAUDE.md.
  const rollAuthor = async () => {
    if (candidates.length === 0) {
      setError("Žádný autor už nemá volnou kvótu.");
      return;
    }

    let pool = candidates;

    // Vyloučit posledního přiřazeného autora.
    if (lastAuthorId && pool.length > 1) {
      const filtered = pool.filter((a) => a.id !== lastAuthorId);
      if (filtered.length > 0) pool = filtered;
    }

    // Na 1. a 2. claim vyloučit deferred autory (krys_na_jedy, Terez).
    if (claimsCountSoFar < 2) {
      const filteredStart = pool.filter((a) => !DEFERRED_AT_START.has(a.id));
      if (filteredStart.length > 0) pool = filteredStart;
    }

    // Filter na velikost zastávky: autor potřebuje dost volných labelů +
    // ideálně 2 navíc ať mu zbyde aspoň na 1 další standardní zastávku.
    const stopOzn = stop.annotation?.oznacniku_usable ?? 2;
    const safeFit = pool.filter((a) => a.labelsRemaining >= stopOzn + 2);
    if (safeFit.length > 0) {
      pool = safeFit;
    } else {
      // Fallback: aspoň autor co tu zastávku celou pokryje
      const canFill = pool.filter((a) => a.labelsRemaining >= stopOzn);
      if (canFill.length > 0) pool = canFill;
    }

    // Inverse weighting: weight = 1 / remaining_labels.
    const weights = pool.map((a) => {
      return { id: a.id, w: a.labelsRemaining > 0 ? 1 / a.labelsRemaining : 0 };
    });
    const totalW = weights.reduce((acc, x) => acc + x.w, 0);
    if (totalW === 0) {
      setError("Žádný autor nemá volnou kvótu.");
      return;
    }
    let roll = Math.random() * totalW;
    let picked = weights[0].id;
    for (const w of weights) {
      roll -= w.w;
      if (roll <= 0) {
        picked = w.id;
        break;
      }
    }

    setError(null);
    setAuthorId(picked);
    setPickedQrIndices(new Set()); // wipe předchozí výběry

    // Async fetch labelů autora: jen ty co jsou volné NEBO už paired s touto
    // zastávkou (zachovat pre-fill z labelsHere když znovu otevřeš detail).
    setLoadingPool(true);
    try {
      const { data, error: poolErr } = await supabase
        .from("oznacnik_qr_labels")
        .select("qr_index, work_id, author_id, label_seq, stop_id")
        .eq("author_id", picked)
        .or(`stop_id.is.null,stop_id.eq.${stop.stop_id}`)
        .order("qr_index");
      if (poolErr) throw poolErr;
      setAvailableLabels((data ?? []) as AvailableLabel[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Načtení popisků selhalo");
    } finally {
      setLoadingPool(false);
    }
  };

  // Sjednocený pool labels k zobrazení = availableLabels (po CLAIM fetch)
  // OR labelsHere pokud claim existoval. Sortováno per (work ord, label_seq).
  const visibleLabels = useMemo(() => {
    const seen = new Set<number>();
    const merged: { qr_index: number; work_id: string; label_seq: number }[] = [];
    for (const l of availableLabels) {
      if (!seen.has(l.qr_index)) {
        merged.push(l);
        seen.add(l.qr_index);
      }
    }
    for (const l of labelsHere) {
      if (!seen.has(l.qr_index)) {
        merged.push({
          qr_index: l.qr_index,
          work_id: l.work_id,
          label_seq: l.label_seq,
        });
        seen.add(l.qr_index);
      }
    }
    return merged;
  }, [availableLabels, labelsHere]);

  // Unikátní work_ids odvozené z aktuálně vybraných popisků
  const workIds = useMemo(() => {
    const out = new Set<string>();
    for (const qr of pickedQrIndices) {
      const l = visibleLabels.find((v) => v.qr_index === qr);
      if (l) out.add(l.work_id);
    }
    return Array.from(out);
  }, [pickedQrIndices, visibleLabels]);

  const toggleLabel = (qrIndex: number) => {
    setPickedQrIndices((prev) => {
      const next = new Set(prev);
      if (next.has(qrIndex)) next.delete(qrIndex);
      else next.add(qrIndex);
      return next;
    });
  };

  const save = async () => {
    setError(null);
    if (!authorId) {
      setError("Nejdřív klikni CLAIM (vybere autora).");
      return;
    }
    setSaving(true);
    try {
      const newIndices = Array.from(pickedQrIndices);
      const prevIndices = labelsHere.map((l) => l.qr_index);
      const releasedIndices = prevIndices.filter((i) => !newIndices.includes(i));

      // 1) Uvolnit labels, které byly na téhle zastávce ale teď už nejsou v picku
      if (releasedIndices.length > 0) {
        const { error: relErr } = await supabase
          .from("oznacnik_qr_labels")
          .update({ stop_id: null, placed_at: null })
          .in("qr_index", releasedIndices);
        if (relErr) throw relErr;
      }

      // 2) Spárovat nově vybrané labels s touto zastávkou
      if (newIndices.length > 0) {
        const { error: pairErr } = await supabase
          .from("oznacnik_qr_labels")
          .update({ stop_id: stop.stop_id, placed_at: new Date().toISOString() })
          .in("qr_index", newIndices);
        if (pairErr) throw pairErr;
      }

      // 3) Upsert claim
      const { error: upErr } = await supabase.from("oznacnik_claims").upsert(
        {
          stop_id: stop.stop_id,
          author_id: authorId,
          work_ids: workIds,
          notes: notes.trim() || null,
        },
        { onConflict: "stop_id" }
      );
      if (upErr) throw upErr;

      router.push(`/scouting/${token}/install`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Uložení selhalo");
      setSaving(false);
    }
  };

  const release = async () => {
    if (!existingClaim) return;
    if (!confirm(`Uvolnit ${stop.stop_name}? Smaže claim ${selectedAuthor?.name ?? ""}.`)) return;
    setSaving(true);
    try {
      const { error: delErr } = await supabase
        .from("oznacnik_claims")
        .delete()
        .eq("stop_id", stop.stop_id);
      if (delErr) throw delErr;
      router.push(`/scouting/${token}/install`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Smazání selhalo");
      setSaving(false);
    }
  };

  const authorBg = selectedAuthor ? authorColor(selectedAuthor.id, allAuthorIds) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", paddingBottom: 120 }}>
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "#000",
          color: "#fff",
          padding: "10px 16px",
          zIndex: 10,
          borderBottom: "4px solid #E3000B",
        }}
      >
        <Link
          href={`/scouting/${token}/install`}
          className="font-black uppercase no-underline"
          style={{ fontSize: 11, letterSpacing: "0.12em", color: "#aaa" }}
        >
          ← Vernisáž
        </Link>
        <h1
          className="font-black"
          style={{ fontSize: "clamp(22px, 6vw, 30px)", letterSpacing: "-0.02em", marginTop: 6, lineHeight: 1.1 }}
        >
          {stop.stop_name}
        </h1>
        <div style={{ fontSize: 11, color: "#888", marginTop: 4, letterSpacing: "0.05em" }}>
          {stop.stop_id} · {stop.annotation?.oznacniku_usable ?? "?"} použitelných označníků
        </div>
      </header>

      {/* ── Autor: buď velký CLAIM button, nebo zobrazit přiřazeného ── */}
      {!selectedAuthor ? (
        <section
          style={{
            padding: 24,
            background: "#fff",
            borderBottom: "3px solid #000",
            textAlign: "center",
          }}
        >
          <div style={{ ...eyebrow, justifyContent: "center" }}>Tato zastávka je VOLNÁ</div>
          <p style={{ color: "#666", fontSize: 13, margin: "12px 0 20px", lineHeight: 1.5 }}>
            Algoritmus přiřadí náhodně autora ze zbývajících {candidates.length} kvót.
          </p>
          <button
            onClick={rollAuthor}
            disabled={candidates.length === 0}
            style={{
              width: "100%",
              padding: "28px 16px",
              fontSize: "clamp(22px, 6vw, 32px)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              fontFamily: "inherit",
              border: "4px solid #E3000B",
              background: "#E3000B",
              color: "#fff",
              cursor: candidates.length === 0 ? "not-allowed" : "pointer",
              opacity: candidates.length === 0 ? 0.4 : 1,
            }}
          >
            CLAIM
          </button>
        </section>
      ) : (
        <section
          style={{
            padding: 20,
            background: authorBg ?? "#fff",
            color: contrast(authorBg ?? "#fff"),
            borderBottom: "3px solid #000",
          }}
        >
          <div
            style={{
              ...eyebrow,
              color: contrast(authorBg ?? "#fff", 0.7),
            }}
          >
            Přiřazeno autorovi
          </div>
          <div
            className="font-black"
            style={{
              fontSize: "clamp(28px, 8vw, 44px)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              marginTop: 4,
            }}
          >
            {selectedAuthor.name}
          </div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginTop: 6,
              color: contrast(authorBg ?? "#fff", 0.75),
            }}
          >
            {selectedAuthor.claimedStops}/{selectedAuthor.requested_stops ?? "?"} zastávek · {selectedAuthor.works.length} unik. děl
          </div>

          {/* Souhlasy autora — operativní info */}
          <div className="flex flex-wrap gap-2" style={{ marginTop: 12 }}>
            <ConsentBadge
              label="POPISEK"
              ok={selectedAuthor.popisek_consent}
              onBg={authorBg ?? "#fff"}
            />
            <ConsentBadge
              label="WEB"
              ok={selectedAuthor.web_consent}
              onBg={authorBg ?? "#fff"}
            />
            <ConsentBadge
              label="FILM"
              ok={selectedAuthor.film_consent}
              onBg={authorBg ?? "#fff"}
            />
          </div>

          {/* Poznámka autora z přihlášky — důležité info na zastávce */}
          {selectedAuthor.notes && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                background: "rgba(0,0,0,0.15)",
                fontSize: 12,
                fontWeight: 400,
                lineHeight: 1.45,
                color: contrast(authorBg ?? "#fff", 0.9),
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  opacity: 0.6,
                  marginBottom: 4,
                }}
              >
                Poznámka autora
              </div>
              {selectedAuthor.notes}
            </div>
          )}

          {!existingClaim && (
            <button
              onClick={rollAuthor}
              style={{
                marginTop: 14,
                padding: "8px 14px",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "inherit",
                border: `2px solid ${contrast(authorBg ?? "#fff")}`,
                background: "transparent",
                color: contrast(authorBg ?? "#fff"),
                cursor: "pointer",
              }}
            >
              Rozhodit znova
            </button>
          )}
        </section>
      )}

      {/* ── Díla: checkboxy unik. děl autora ── */}
      {selectedAuthor && (
        <section style={{ padding: 16, background: "#fff", borderBottom: "2px solid #ddd" }}>
          <div style={eyebrow}>
            Co tady visí · vybráno {pickedQrIndices.size} z {visibleLabels.length} dostupných popisků
          </div>
          {loadingPool ? (
            <div style={{ color: "#888", fontSize: 13, fontStyle: "italic" }}>
              Načítám popisky…
            </div>
          ) : visibleLabels.length === 0 ? (
            <div style={{ color: "#888", fontSize: 13, fontStyle: "italic" }}>
              Žádné volné popisky pro tohoto autora.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {visibleLabels
                .slice()
                .sort((a, b) => {
                  const wa = selectedAuthor.works.find((w) => w.id === a.work_id);
                  const wb = selectedAuthor.works.find((w) => w.id === b.work_id);
                  const orderA = wa?.ord ?? 999;
                  const orderB = wb?.ord ?? 999;
                  if (orderA !== orderB) return orderA - orderB;
                  return a.label_seq - b.label_seq;
                })
                .map((lbl) => {
                  const w = selectedAuthor.works.find((x) => x.id === lbl.work_id);
                  const checked = pickedQrIndices.has(lbl.qr_index);
                  return (
                    <button
                      key={lbl.qr_index}
                      type="button"
                      onClick={() => toggleLabel(lbl.qr_index)}
                      style={{
                        padding: "12px 14px",
                        fontFamily: "inherit",
                        fontSize: 14,
                        fontWeight: 700,
                        textAlign: "left",
                        border: `3px solid ${checked ? "#000" : "#ddd"}`,
                        background: checked ? "#000" : "#fff",
                        color: checked ? "#fff" : "#000",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          border: `2px solid ${checked ? "#fff" : "#000"}`,
                          background: checked ? "#fff" : "transparent",
                          color: "#000",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        {checked ? "v" : ""}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ letterSpacing: "-0.01em" }}>
                          {w ? `${String(w.ord).padStart(2, "0")} · ${w.title}` : lbl.work_id}
                        </div>
                        {w && (w.year || w.technique) && (
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 400,
                              marginTop: 3,
                              color: checked ? "rgba(255,255,255,0.6)" : "#888",
                            }}
                          >
                            {[w.technique, w.year].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                      <span
                        className="font-black"
                        style={{
                          padding: "6px 10px",
                          fontSize: 16,
                          letterSpacing: "-0.02em",
                          fontFamily: "monospace",
                          background: checked ? "#fff" : "#f3f3f3",
                          color: "#000",
                          border: `2px solid ${checked ? "#fff" : "#000"}`,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                        title="QR popisek — najdi v stohu"
                      >
                        #{String(lbl.qr_index).padStart(3, "0")}
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </section>
      )}

      {/* Notes */}
      {selectedAuthor && (
        <section style={{ padding: 16, background: "#fff", borderBottom: "2px solid #ddd" }}>
          <div style={eyebrow}>Poznámka</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Volitelné — ad-hoc dílo, problém při instalaci atd."
            style={{
              width: "100%",
              minHeight: 80,
              padding: "10px 12px",
              border: "3px solid #000",
              background: "#fff",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 400,
              lineHeight: 1.5,
              outline: "none",
              resize: "vertical",
            }}
          />
        </section>
      )}

      {error && (
        <div
          style={{
            margin: 16,
            padding: 12,
            border: "3px solid #E3000B",
            color: "#E3000B",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      )}

      {/* Bottom bar */}
      {selectedAuthor && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#000",
            padding: 12,
            display: "flex",
            gap: 8,
            borderTop: "4px solid #E3000B",
          }}
        >
          {existingClaim && (
            <button
              type="button"
              onClick={release}
              disabled={saving}
              style={btnGhost(saving)}
            >
              Uvolnit
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={btnPrimary(saving)}
          >
            {saving ? "Ukládám…" : existingClaim ? "Aktualizovat" : "Uložit & propsat"}
          </button>
        </div>
      )}

    </div>
  );
}

const eyebrow: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#888",
  marginBottom: 10,
  display: "flex",
};

function btnGhost(saving: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: "16px",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontFamily: "inherit",
    border: "3px solid #E3000B",
    background: "transparent",
    color: "#E3000B",
    cursor: saving ? "wait" : "pointer",
  };
}

function btnPrimary(saving: boolean): React.CSSProperties {
  return {
    flex: 2,
    padding: "16px",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontFamily: "inherit",
    border: "3px solid #E3000B",
    background: "#E3000B",
    color: "#fff",
    cursor: saving ? "wait" : "pointer",
  };
}

function ConsentBadge({
  label,
  ok,
  onBg,
}: {
  label: string;
  ok: boolean;
  onBg: string;
}) {
  const text = contrast(onBg);
  return (
    <span
      style={{
        padding: "4px 8px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        border: `2px solid ${text}`,
        background: ok ? text : "transparent",
        color: ok ? onBg : text,
        whiteSpace: "nowrap",
      }}
    >
      {label}: {ok ? "ANO" : "NE"}
    </span>
  );
}

function contrast(bg: string, opacity = 1): string {
  const hex = bg.replace("#", "");
  if (hex.length !== 6) return "#000";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum > 0.55) return opacity < 1 ? `rgba(0,0,0,${opacity})` : "#000";
  return opacity < 1 ? `rgba(255,255,255,${opacity})` : "#fff";
}
