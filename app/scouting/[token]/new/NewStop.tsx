"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NewStop({ token }: { token: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolokace není dostupná");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLon(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      (err) => {
        setError(`Geolokace selhala: ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Doplň název zastávky");
      return;
    }
    const latN = parseFloat(lat);
    const lonN = parseFloat(lon);
    if (isNaN(latN) || isNaN(lonN)) {
      setError("Doplň GPS souřadnice (nebo „Použít mou polohu“)");
      return;
    }
    if (latN < 49 || latN > 51 || lonN < 13 || lonN > 16) {
      setError("Souřadnice jsou mimo rozumný rozsah pro Prahu (lat 49–51, lon 13–16)");
      return;
    }

    setSaving(true);
    try {
      const stop_id = `custom-${Date.now().toString(36)}`;
      const { error: insErr } = await supabase
        .from("oznacnik_stops")
        .insert({
          stop_id,
          stop_name: name.trim(),
          lat: latN,
          lon: lonN,
        });
      if (insErr) throw insErr;
      router.push(`/scouting/${token}/${stop_id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vytvoření selhalo");
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7", paddingBottom: 120 }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "#000",
          color: "#fff",
          padding: "12px 16px",
          zIndex: 10,
          borderBottom: "4px solid #E3000B",
        }}
      >
        <Link
          href={`/scouting/${token}`}
          className="font-black uppercase no-underline"
          style={{ fontSize: 11, letterSpacing: "0.12em", color: "#aaa" }}
        >
          ← Seznam
        </Link>
        <h1
          className="font-black"
          style={{
            fontSize: "clamp(22px, 6vw, 30px)",
            letterSpacing: "-0.02em",
            marginTop: 6,
            lineHeight: 1.1,
          }}
        >
          Nová zastávka
        </h1>
        <div style={{ fontSize: 11, color: "#888", marginTop: 4, letterSpacing: "0.05em" }}>
          Pro místa která nejsou v GTFS datech (custom-{"{"}timestamp{"}"})
        </div>
      </header>

      <form onSubmit={submit}>
        {/* Name */}
        <section style={{ padding: 16, background: "#fff", borderBottom: "2px solid #ddd" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#888",
              marginBottom: 8,
            }}
          >
            Název zastávky
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="např. Anděl"
            autoFocus
            style={{
              width: "100%",
              padding: "16px",
              border: "3px solid #000",
              background: "#fff",
              fontFamily: "inherit",
              fontSize: 18,
              fontWeight: 700,
              outline: "none",
            }}
          />
        </section>

        {/* GPS */}
        <section style={{ padding: 16, background: "#fff", borderBottom: "2px solid #ddd" }}>
          <div className="flex items-center justify-between mb-3">
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#888",
              }}
            >
              GPS souřadnice
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              style={{
                padding: "8px 12px",
                fontSize: 11,
                letterSpacing: "0.08em",
                fontWeight: 700,
                textTransform: "uppercase",
                fontFamily: "inherit",
                border: "2px solid #00B341",
                background: locating ? "#eee" : "#00B341",
                color: locating ? "#888" : "#000",
                cursor: locating ? "wait" : "pointer",
              }}
            >
              {locating ? "Hledám…" : "Použít mou polohu"}
            </button>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "#aaa",
                  marginBottom: 4,
                  textTransform: "uppercase",
                }}
              >
                Lat
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={lat}
                onChange={(e) => setLat(e.target.value.replace(/[^0-9.\-]/g, ""))}
                placeholder="50.087811"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "3px solid #000",
                  background: "#fff",
                  fontFamily: "monospace",
                  fontSize: 14,
                  fontWeight: 700,
                  outline: "none",
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "#aaa",
                  marginBottom: 4,
                  textTransform: "uppercase",
                }}
              >
                Lon
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={lon}
                onChange={(e) => setLon(e.target.value.replace(/[^0-9.\-]/g, ""))}
                placeholder="14.421269"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "3px solid #000",
                  background: "#fff",
                  fontFamily: "monospace",
                  fontSize: 14,
                  fontWeight: 700,
                  outline: "none",
                }}
              />
            </div>
          </div>
        </section>

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

        {/* Bottom save bar */}
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
          <Link
            href={`/scouting/${token}`}
            style={{
              flex: 1,
              padding: "16px",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "inherit",
              textAlign: "center",
              border: "3px solid #fff",
              background: "transparent",
              color: "#fff",
              textDecoration: "none",
            }}
          >
            Zrušit
          </Link>
          <button
            type="submit"
            disabled={saving}
            style={{
              flex: 1.4,
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
            }}
          >
            {saving ? "Vytvářím…" : "Vytvořit & otevřít →"}
          </button>
        </div>
      </form>
    </div>
  );
}
