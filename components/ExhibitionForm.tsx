"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Exhibition, ExhibitionStation, Station } from "@/types";

const EXHIBITION_COLORS = [
  "#E3000B", "#0057A8", "#00843D", "#F5A623",
  "#9B59B6", "#1ABC9C", "#E67E22", "#2C3E50",
  "#C0392B", "#16A085",
];

interface ExhibitionFormProps {
  initial?: Exhibition;
  initialStations?: ExhibitionStation[];
  allStations: Station[];
  mode: "create" | "edit";
}

export default function ExhibitionForm({
  initial,
  initialStations = [],
  allStations,
  mode,
}: ExhibitionFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [color, setColor] = useState(initial?.color ?? "#E3000B");
  const [lineNumber, setLineNumber] = useState(initial?.lineNumbers?.join(", ") ?? "");
  const [direction, setDirection] = useState(initial?.direction ?? "");
  const [startStationId, setStartStationId] = useState(initial?.startStationId ?? "");
  const [endStationId, setEndStationId] = useState(initial?.endStationId ?? "");
  const [status, setStatus] = useState<"current" | "upcoming" | "past">(initial?.status ?? "upcoming");
  const [openedAt, setOpenedAt] = useState(initial?.openedAt?.slice(0, 10) ?? "");
  const [closedAt, setClosedAt] = useState(initial?.closedAt?.slice(0, 10) ?? "");
  const [curatorialText, setCuratorialText] = useState(initial?.curatorialText ?? "");
  const [visitInfo, setVisitInfo] = useState(initial?.visitInfo ?? "");

  // Stations on this exhibition's segment
  const [exStations, setExStations] = useState<ExhibitionStation[]>(initialStations);

  // Derived: stations that serve the selected line
  const lineNums = lineNumber.split(",").map((n) => parseInt(n.trim())).filter(Boolean);
  const lineStations = allStations
    .filter((s) => lineNums.some((n) => s.lines.includes(n)))
    .sort((a, b) => a.name.localeCompare(b.name, "cs"));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-generate title from line + start + end
  useEffect(() => {
    if (!title && lineNumber && startStationId && endStationId) {
      const start = allStations.find((s) => s.id === startStationId);
      const end = allStations.find((s) => s.id === endStationId);
      if (start && end) {
        setTitle(`LINKY ${lineNumber.replace(/,\s*/g, "·")}: ${start.name.toUpperCase()} — ${end.name.toUpperCase()}`);
      }
    }
  }, [lineNumber, startStationId, endStationId, allStations, title]);

  // When start+end change, build segment station list
  function buildSegment() {
    if (!startStationId || !endStationId) return;
    const segStations = lineStations;
    const startIdx = segStations.findIndex((s) => s.id === startStationId);
    const endIdx = segStations.findIndex((s) => s.id === endStationId);
    if (startIdx === -1 || endIdx === -1) return;
    const slice = startIdx <= endIdx
      ? segStations.slice(startIdx, endIdx + 1)
      : segStations.slice(endIdx, startIdx + 1).reverse();

    setExStations(
      slice.map((s, i) => ({
        id: `temp_${i}`,
        exhibitionId: initial?.id ?? "",
        stationId: s.id,
        position: i,
        hasInstallation: false,
        workTitle: "",
        notes: "",
      }))
    );
  }

  function toggleInstallation(idx: number) {
    setExStations((prev) =>
      prev.map((s, i) =>
        i === idx ? { ...s, hasInstallation: !s.hasInstallation } : s
      )
    );
  }

  function updateWorkTitle(idx: number, val: string) {
    setExStations((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, workTitle: val } : s))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        title,
        subtitle,
        color,
        lineNumbers: lineNumber.split(",").map((n) => parseInt(n.trim())).filter(Boolean),
        direction,
        startStationId,
        endStationId,
        status,
        openedAt: new Date(openedAt).toISOString(),
        closedAt: closedAt ? new Date(closedAt).toISOString() : null,
        curatorialText,
        visitInfo,
        stations: exStations,
      };

      const url =
        mode === "create"
          ? "/api/admin/exhibitions"
          : `/api/admin/exhibitions/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Chyba");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Neznámá chyba");
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Opravdu smazat tuto výstavu?")) return;
    setLoading(true);

    const res = await fetch(`/api/admin/exhibitions/${initial!.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Chyba při mazání");
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "#111",
    border: "4px solid #333",
    color: "#fff",
    padding: "10px 14px",
    width: "100%",
    fontFamily: "inherit",
    fontSize: 13,
    letterSpacing: "0.04em",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "#666",
    marginBottom: 6,
  };

  const stationsMap = Object.fromEntries(allStations.map((s) => [s.id, s]));

  return (
    <form onSubmit={handleSubmit} style={{ color: "#fff" }}>
      <div className="grid lg:grid-cols-2 gap-8 px-6 py-8">
        {/* Left: exhibition metadata */}
        <div className="flex flex-col gap-6">
          {/* Color picker */}
          <div>
            <label style={labelStyle}>Barva výstavy</label>
            <div className="flex gap-2 flex-wrap">
              {EXHIBITION_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 32,
                    height: 32,
                    background: c,
                    border: color === c ? "4px solid #fff" : "4px solid transparent",
                    cursor: "pointer",
                  }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: 32, height: 32, border: "4px solid #333", cursor: "pointer", padding: 0 }}
              />
            </div>
          </div>

          {/* Line number */}
          <div>
            <label style={labelStyle}>Číslo linky</label>
            <input
              type="number"
              value={lineNumber}
              onChange={(e) => setLineNumber(e.target.value)}
              required
              min={1}
              style={inputStyle}
              placeholder="12"
            />
          </div>

          {/* Start + End station */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Počáteční zastávka</label>
              <select
                value={startStationId}
                onChange={(e) => setStartStationId(e.target.value)}
                style={{ ...inputStyle }}
              >
                <option value="">— Vybrat —</option>
                {lineStations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Koncová zastávka</label>
              <select
                value={endStationId}
                onChange={(e) => setEndStationId(e.target.value)}
                style={{ ...inputStyle }}
              >
                <option value="">— Vybrat —</option>
                {lineStations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={buildSegment}
            style={{
              background: "#222",
              border: "4px solid #444",
              color: "#aaa",
              padding: "8px 16px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Sestavit úsek ze zastávek →
          </button>

          {/* Direction */}
          <div>
            <label style={labelStyle}>Směr (zobrazovací text)</label>
            <input
              type="text"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              style={inputStyle}
              placeholder="směr Lehovec"
            />
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>Název výstavy</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={inputStyle}
              placeholder="LINKA 12: LEHOVEC — BALABENKA"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label style={labelStyle}>Podtitul (volitelný)</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              style={inputStyle}
            >
              <option value="upcoming">Připravovaná</option>
              <option value="current">Aktuální (probíhá)</option>
              <option value="past">Archiv (ukončená)</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Datum zahájení</label>
              <input
                type="date"
                value={openedAt}
                onChange={(e) => setOpenedAt(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Datum ukončení (prázdné = probíhá)</label>
              <input
                type="date"
                value={closedAt}
                onChange={(e) => setClosedAt(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Curatorial text */}
          <div>
            <label style={labelStyle}>Kurátorský text (markdown)</label>
            <textarea
              value={curatorialText}
              onChange={(e) => setCuratorialText(e.target.value)}
              rows={8}
              style={{ ...inputStyle, resize: "vertical" }}
              placeholder="Výstava se zabývá..."
            />
          </div>

          {/* Visit info */}
          <div>
            <label style={labelStyle}>Informace pro návštěvníky (markdown)</label>
            <textarea
              value={visitInfo}
              onChange={(e) => setVisitInfo(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
              placeholder="Nastupte na lince 12 směr Lehovec..."
            />
          </div>
        </div>

        {/* Right: station list */}
        <div>
          <label style={labelStyle}>
            Zastávky na úseku ({exStations.length}) — označte kde je instalace
          </label>

          {exStations.length === 0 ? (
            <div style={{ border: "4px solid #222", padding: "2rem", color: "#444" }}>
              <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
                Nejprve vyberte linku, počáteční a koncovou zastávku, pak klikněte &ldquo;Sestavit úsek&rdquo;
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {exStations.map((es, i) => {
                const station = stationsMap[es.stationId];
                return (
                  <div
                    key={`${es.stationId}_${i}`}
                    style={{
                      borderBottom: "4px solid #111",
                      background: es.hasInstallation ? "#0d1a0d" : "#0a0a0a",
                      padding: "10px 14px",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleInstallation(i)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: `3px solid ${es.hasInstallation ? color : "#444"}`,
                        background: es.hasInstallation ? color : "transparent",
                        cursor: "pointer",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em", color: es.hasInstallation ? color : "#fff" }}>
                        {station?.name ?? es.stationId}
                      </div>
                      {es.hasInstallation && (
                        <input
                          type="text"
                          value={es.workTitle ?? ""}
                          onChange={(e) => updateWorkTitle(i, e.target.value)}
                          placeholder="Název díla (volitelný)"
                          style={{
                            marginTop: 6,
                            background: "#111",
                            border: "2px solid #333",
                            color: "#aaa",
                            padding: "4px 8px",
                            fontSize: 11,
                            width: "100%",
                            fontFamily: "inherit",
                            outline: "none",
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="bar" style={{ background: "#222" }} />
      <div className="px-6 py-6 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "#333" : "var(--dpp)",
              color: "#fff",
              border: "none",
              padding: "12px 24px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: loading ? "default" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {loading ? "Ukládám..." : mode === "create" ? "Vytvořit výstavu" : "Uložit změny"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin")}
            style={{
              background: "transparent",
              color: "#555",
              border: "4px solid #333",
              padding: "12px 24px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Zrušit
          </button>
        </div>

        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            style={{
              background: "transparent",
              color: "#555",
              border: "4px solid #222",
              padding: "12px 24px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Smazat výstavu
          </button>
        )}
      </div>

      {error && (
        <div className="px-6 pb-4 type-label" style={{ color: "var(--dpp)" }}>
          Chyba: {error}
        </div>
      )}
    </form>
  );
}
