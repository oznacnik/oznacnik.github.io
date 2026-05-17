"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { type StopWithAnnotation } from "@/lib/scouting";
import { authorColor, type AuthorWithProgress, type Claim } from "@/lib/install";
import { supabase } from "@/lib/supabase";

// Scanner zatížený dynamicky — má native camera, nepotřebujeme při SSR
const QrScanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  { ssr: false }
);

interface QrLabelHere {
  qr_index: number;
  work_id: string;
  author_id: string;
  label_seq: number;
  placed_at: string | null;
}

export default function InstallStop({
  token,
  stop,
  authors,
  existingClaim,
  workPlacements,
  labelsHere: initialLabelsHere,
  lastAuthorId,
}: {
  token: string;
  stop: StopWithAnnotation;
  authors: AuthorWithProgress[];
  existingClaim: Claim | null;
  workPlacements: Record<string, number>;
  labelsHere: QrLabelHere[];
  lastAuthorId: string | null;
}) {
  const router = useRouter();

  // Pokud zastávka už má claim, předvyplníme. Jinak čekáme na "rozhození".
  const [authorId, setAuthorId] = useState<string>(existingClaim?.author_id ?? "");
  const [workIds, setWorkIds] = useState<string[]>(existingClaim?.work_ids ?? []);
  const [notes, setNotes] = useState<string>(existingClaim?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // QR popisky spárované s touto zastávkou
  const [labelsHere, setLabelsHere] = useState<QrLabelHere[]>(initialLabelsHere);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const allAuthorIds = useMemo(() => authors.map((a) => a.id), [authors]);
  const selectedAuthor = authors.find((a) => a.id === authorId) ?? null;

  // Autoři co ještě mají kvótu = kandidáti pro rozhození
  const candidates = useMemo(() => {
    return authors.filter((a) => {
      const quota = a.requested_stops ?? 0;
      return quota > 0 && a.claimedStops < quota;
    });
  }, [authors]);

  const rollAuthor = () => {
    if (candidates.length === 0) {
      setError("Žádný autor už nemá volnou kvótu.");
      return;
    }

    // Vyloučit minulého autora (pokud existují i jiní), aby se neopakoval
    // claim 2× po sobě.
    let pool = candidates;
    if (lastAuthorId && candidates.length > 1) {
      const filtered = candidates.filter((a) => a.id !== lastAuthorId);
      if (filtered.length > 0) pool = filtered;
    }

    // Inverse weighting: autor s MENŠÍ remaining kvótou má VĚTŠÍ šanci.
    // Důvod: malí autoři (např. Alžběta 2 zast.) se rychle naplní; velcí
    // (Nikol 13) zůstanou v poolu a dostávají postupně ostatní stopy.
    // Použijeme weight = 1 / remaining, normalizovaný.
    const weights: Array<{ id: string; w: number }> = pool.map((a) => {
      const remaining = (a.requested_stops ?? 0) - a.claimedStops;
      return { id: a.id, w: remaining > 0 ? 1 / remaining : 0 };
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

    const pickedAuthor = authors.find((a) => a.id === picked);
    setAuthorId(picked);
    // Auto-zaškrtnout díla když má autor jen 1 unikátní (typicky Vaculík).
    if (pickedAuthor && pickedAuthor.works.length === 1) {
      setWorkIds([pickedAuthor.works[0].id]);
    } else {
      setWorkIds([]);
    }
    setError(null);
  };

  const toggleWork = (workId: string) => {
    setWorkIds((prev) =>
      prev.includes(workId) ? prev.filter((id) => id !== workId) : [...prev, workId]
    );
  };

  const save = async () => {
    setError(null);
    if (!authorId) {
      setError("Nejdřív rozhodi autora.");
      return;
    }
    setSaving(true);
    try {
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

  // Naskenoval jsi QR popisek = installation source of truth:
  //   1) spáruje qr_index ↔ stop_id
  //   2) auto-claim: pokud claim ještě není, vytvoří. Pokud existuje ale s jiným
  //      autorem (random rozhodil někoho jiného), přepíše claim na qr.author
  //      a začne sbírat works od nuly. Pokud claim už je téhož autora,
  //      jen přidá work_id do work_ids.
  const handleScannedQr = async (raw: string) => {
    setScanError(null);
    const m = raw.trim().match(/\/qr\/(\d+)|^(\d+)$/);
    const qrIndex = m ? parseInt(m[1] || m[2], 10) : NaN;
    if (isNaN(qrIndex) || qrIndex <= 0) {
      setScanError(`Nepoznaný QR: ${raw.slice(0, 40)}`);
      return;
    }

    // 1) Update qr_label stop_id
    const { data: qrLabel, error: qrErr } = await supabase
      .from("oznacnik_qr_labels")
      .update({ stop_id: stop.stop_id, placed_at: new Date().toISOString() })
      .eq("qr_index", qrIndex)
      .select("qr_index, work_id, author_id, label_seq, placed_at")
      .maybeSingle();
    if (qrErr) {
      setScanError(qrErr.message);
      return;
    }
    if (!qrLabel) {
      setScanError(`QR #${qrIndex} neexistuje v DB`);
      return;
    }

    // 2) Spočti nový claim state
    const sameAuthor = authorId === qrLabel.author_id;
    const newAuthorId = qrLabel.author_id;
    const newWorkIds = sameAuthor
      ? Array.from(new Set([...workIds, qrLabel.work_id]))
      : [qrLabel.work_id]; // jiný autor → reset works na ten z QR

    // 3) Upsert claim
    const { error: claimErr } = await supabase
      .from("oznacnik_claims")
      .upsert(
        {
          stop_id: stop.stop_id,
          author_id: newAuthorId,
          work_ids: newWorkIds,
          notes: notes.trim() || null,
        },
        { onConflict: "stop_id" }
      );
    if (claimErr) {
      setScanError(`Claim selhal: ${claimErr.message}`);
      return;
    }

    // 4) Update lokální state
    setAuthorId(newAuthorId);
    setWorkIds(newWorkIds);
    setLabelsHere((prev) => {
      const without = prev.filter((l) => l.qr_index !== qrIndex);
      return [qrLabel as QrLabelHere, ...without];
    });
    setScannerOpen(false);
  };

  const unlinkLabel = async (qrIndex: number) => {
    if (!confirm(`Odpárovat popisek #${qrIndex} z této zastávky?`)) return;
    const { error: upErr } = await supabase
      .from("oznacnik_qr_labels")
      .update({ stop_id: null, placed_at: null })
      .eq("qr_index", qrIndex);
    if (upErr) {
      alert(upErr.message);
      return;
    }
    setLabelsHere((prev) => prev.filter((l) => l.qr_index !== qrIndex));
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
            Co tady visí · vybráno {workIds.length} z {selectedAuthor.works.length} motivů (kopie OK)
          </div>
          {selectedAuthor.works.length === 0 ? (
            <div style={{ color: "#888", fontSize: 13, fontStyle: "italic" }}>
              Autor nemá v DB seznam děl. Popiš co tam visí do poznámky níž.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedAuthor.works.map((w) => {
                const checked = workIds.includes(w.id);
                // Kolikrát už je dílo umístěné jinde (mimo aktuální zastávku).
                // Zahrnujeme i případy kdy je checked = už uložené v existingClaim.
                const elsewhereCount = (() => {
                  const total = workPlacements[w.id] ?? 0;
                  const wasOnThisStop = existingClaim?.work_ids.includes(w.id) ?? false;
                  return wasOnThisStop ? Math.max(0, total - 1) : total;
                })();
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => toggleWork(w.id)}
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
                      {checked ? "✓" : ""}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ letterSpacing: "-0.01em" }}>
                        {String(w.ord).padStart(2, "0")} · {w.title}
                      </div>
                      {(w.year || w.technique) && (
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
                    {elsewhereCount > 0 && (
                      <span
                        style={{
                          padding: "4px 8px",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          border: `2px solid ${checked ? "#fff" : "#000"}`,
                          background: checked ? "transparent" : "#fff",
                          color: checked ? "#fff" : "#000",
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        +{elsewhereCount}× jinde
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* QR popisky spárované s touto zastávkou */}
      {selectedAuthor && (
        <section style={{ padding: 16, background: "#fff", borderBottom: "2px solid #ddd" }}>
          <div style={eyebrow}>QR popisky na této zastávce ({labelsHere.length})</div>

          {labelsHere.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
              {labelsHere.map((l) => {
                const author = authors.find((a) => a.id === l.author_id);
                return (
                  <div
                    key={l.qr_index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      border: "2px solid #000",
                      background: "#f5f5f5",
                    }}
                  >
                    <span
                      className="font-black"
                      style={{
                        fontSize: 16,
                        letterSpacing: "-0.02em",
                        fontFamily: "monospace",
                      }}
                    >
                      #{String(l.qr_index).padStart(3, "0")}
                    </span>
                    <div style={{ flex: 1, fontSize: 12 }}>
                      {author?.name ?? l.author_id}
                    </div>
                    <button
                      onClick={() => unlinkLabel(l.qr_index)}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontFamily: "inherit",
                        border: "none",
                        background: "transparent",
                        color: "#E3000B",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      odpárovat
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "inherit",
              border: "3px dashed #000",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Naskenovat QR popisek
          </button>

          {scanError && (
            <div
              style={{
                marginTop: 8,
                padding: 8,
                border: "2px solid #E3000B",
                color: "#E3000B",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {scanError}
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

      {scannerOpen && (
        <ScannerModal
          onScan={handleScannedQr}
          onClose={() => setScannerOpen(false)}
          onManualEntry={handleScannedQr}
        />
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

// ── Scanner modal: full-screen kamera + manual fallback ──
function ScannerModal({
  onScan,
  onClose,
  onManualEntry,
}: {
  onScan: (text: string) => void;
  onClose: () => void;
  onManualEntry: (text: string) => void;
}) {
  const [manualValue, setManualValue] = useState("");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.95)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          background: "#000",
          color: "#fff",
          borderBottom: "3px solid #E3000B",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="font-black uppercase" style={{ fontSize: 13, letterSpacing: "0.12em" }}>
          Naskenuj QR popisek
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "transparent",
            color: "#fff",
            border: "2px solid #fff",
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          Zavřít
        </button>
      </div>

      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#000" }}>
        <QrScanner
          onScan={(results) => {
            const text = results?.[0]?.rawValue;
            if (text) onScan(text);
          }}
          onError={(err) => {
            console.error("[scanner]", err);
          }}
          constraints={{ facingMode: "environment" }}
          styles={{
            container: { width: "100%", height: "100%" },
            video: { width: "100%", height: "100%", objectFit: "cover" },
          }}
        />
      </div>

      <div
        style={{
          padding: 14,
          background: "#000",
          borderTop: "3px solid #E3000B",
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#888",
            marginBottom: 6,
          }}
        >
          Nebo zadej číslo ručně
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="napr. 3"
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "2px solid #fff",
              background: "#000",
              color: "#fff",
              fontFamily: "monospace",
              fontSize: 18,
              fontWeight: 700,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (manualValue) {
                onManualEntry(manualValue);
                setManualValue("");
              }
            }}
            disabled={!manualValue}
            style={{
              padding: "10px 16px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "inherit",
              border: "2px solid #E3000B",
              background: "#E3000B",
              color: "#fff",
              cursor: manualValue ? "pointer" : "not-allowed",
              opacity: manualValue ? 1 : 0.4,
            }}
          >
            Spárovat
          </button>
        </div>
      </div>
    </div>
  );
}
