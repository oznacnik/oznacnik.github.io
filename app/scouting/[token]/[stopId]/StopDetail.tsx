"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  distanceMetres,
  type StopWithAnnotation,
} from "@/lib/scouting";
import { supabase, SCOUTING_BUCKET, scoutingPhotoUrl, type ScoutingStatus } from "@/lib/supabase";

const STATUSES: ScoutingStatus[] = ["untouched", "pending", "scouted", "ready", "blocked"];

interface Candidate {
  stop_id: string;
  stop_name: string;
  lat: number;
  lon: number;
  status: ScoutingStatus;
}

export default function StopDetail({
  token,
  stop,
  candidates,
}: {
  token: string;
  stop: StopWithAnnotation;
  candidates: Candidate[];
}) {
  const router = useRouter();
  const a = stop.annotation;

  const [total, setTotal] = useState<string>(a?.oznacniku_total?.toString() ?? "");
  const [usable, setUsable] = useState<string>(a?.oznacniku_usable?.toString() ?? "");
  const [status, setStatus] = useState<ScoutingStatus>(a?.status ?? "untouched");
  const [notes, setNotes] = useState<string>(a?.notes ?? "");
  const [photos, setPhotos] = useState<string[]>(a?.photo_paths ?? []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      const newPaths: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop() || "jpg";
        const ts = Date.now();
        const path = `${stop.stop_id}/${ts}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(SCOUTING_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        newPaths.push(path);
      }
      setPhotos((p) => [...p, ...newPaths]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload selhal");
    } finally {
      setUploading(false);
      e.target.value = ""; // ať jde uploadnout stejný soubor znovu
    }
  };

  const removePhoto = async (path: string) => {
    if (!confirm("Smazat fotku?")) return;
    const { error: delErr } = await supabase.storage
      .from(SCOUTING_BUCKET)
      .remove([path]);
    if (delErr) {
      alert(`Mazání selhalo: ${delErr.message}`);
      return;
    }
    setPhotos((p) => p.filter((x) => x !== path));
  };

  const getLocation = (): Promise<{ lat: number; lon: number }> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolokace není dostupná"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => reject(new Error(err.message)),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    });

  const findNearestNext = (me: { lat: number; lon: number }): Candidate | null => {
    // Pouze ještě nezhodnocené (untouched). Vše ostatní (scouted/ready/blocked)
    // je už anotované a přeskakujeme.
    const pool = candidates.filter(
      (c) => c.stop_id !== stop.stop_id && c.status === "untouched"
    );
    if (pool.length === 0) return null;
    return pool.reduce((best, cur) =>
      distanceMetres(me, cur) < distanceMetres(me, best) ? cur : best
    );
  };

  const save = async (advance: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const totalNum = total === "" ? null : parseInt(total, 10);
      const usableNum = usable === "" ? null : parseInt(usable, 10);
      const { error: saveErr } = await supabase
        .from("oznacnik_annotations")
        .upsert(
          {
            stop_id: stop.stop_id,
            oznacniku_total: totalNum,
            oznacniku_usable: usableNum,
            status,
            notes: notes.trim() || null,
            photo_paths: photos,
          },
          { onConflict: "stop_id" }
        );
      if (saveErr) throw saveErr;

      if (advance) {
        try {
          const me = await getLocation();
          const next = findNearestNext(me);
          if (next) {
            router.push(`/scouting/${token}/${next.stop_id}`);
            router.refresh();
            return;
          }
        } catch (geoErr) {
          // Geolokace selhala / odmítnuta → spadnem do listu
          console.warn("[scouting] geolokace selhala, jdu na seznam:", geoErr);
        }
      }

      router.push(`/scouting/${token}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Uložení selhalo");
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7", paddingBottom: 120 }}>
      {/* Header */}
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
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "#aaa",
          }}
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
          {stop.stop_name}
        </h1>
        <div style={{ fontSize: 11, color: "#888", marginTop: 4, letterSpacing: "0.05em" }}>
          {stop.stop_id} · {stop.lat.toFixed(5)}, {stop.lon.toFixed(5)}
        </div>
      </header>

      {/* Status pills */}
      <section style={{ padding: 16, background: "#fff", borderBottom: "2px solid #ddd" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", marginBottom: 8 }}>
          Stav
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((st) => {
            const active = status === st;
            const color = STATUS_COLORS[st];
            return (
              <button
                key={st}
                onClick={() => setStatus(st)}
                style={{
                  padding: "12px 16px",
                  fontSize: 13,
                  letterSpacing: "0.06em",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  fontFamily: "inherit",
                  border: `3px solid ${color}`,
                  background: active ? color : "#fff",
                  color: active ? "#000" : color,
                  cursor: "pointer",
                  flex: "1 1 calc(50% - 8px)",
                  minWidth: 0,
                }}
              >
                {STATUS_LABELS[st]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Označníky counts */}
      <section style={{ padding: 16, background: "#fff", borderBottom: "2px solid #ddd" }}>
        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <NumberField
            label="Označníků celkem"
            value={total}
            onChange={setTotal}
          />
          <NumberField
            label="Použitelných"
            value={usable}
            onChange={setUsable}
            color="#00B341"
          />
        </div>
      </section>

      {/* Photos */}
      <section style={{ padding: 16, background: "#fff", borderBottom: "2px solid #ddd" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", marginBottom: 10 }}>
          Fotky ({photos.length})
        </div>
        {photos.length > 0 && (
          <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}>
            {photos.map((p) => (
              <div key={p} style={{ position: "relative", aspectRatio: "1", overflow: "hidden", border: "2px solid #000" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={scoutingPhotoUrl(p)}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <button
                  onClick={() => removePhoto(p)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: "#000",
                    color: "#fff",
                    border: "none",
                    width: 24,
                    height: 24,
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <label
          style={{
            display: "block",
            padding: "16px",
            border: "3px dashed #000",
            textAlign: "center",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: uploading ? "wait" : "pointer",
            background: uploading ? "#eee" : "#fff",
          }}
        >
          {uploading ? "Nahrávám…" : "Pořídit / vybrat fotku"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handlePhoto}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
      </section>

      {/* Notes */}
      <section style={{ padding: 16, background: "#fff", borderBottom: "2px solid #ddd" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", marginBottom: 8 }}>
          Poznámka
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Volitelně, např. typ rámů, problematický šroub atd."
          style={{
            width: "100%",
            minHeight: 100,
            padding: "12px 14px",
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
        <button
          onClick={() => save(false)}
          disabled={saving}
          style={{
            flex: 1,
            padding: "16px",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "inherit",
            border: "3px solid #fff",
            background: "transparent",
            color: "#fff",
            cursor: saving ? "wait" : "pointer",
          }}
        >
          {saving ? "Ukládám…" : "Uložit"}
        </button>
        {candidates.length > 1 && (
          <button
            onClick={() => save(true)}
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
            title="Uloží a navede tě GPSkou na nejbližší zastávku, kterou jsi ještě nedoanotoval"
          >
            {saving ? "Ukládám…" : "Uložit & nejbližší →"}
          </button>
        )}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  color = "#000",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  color?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", marginBottom: 8 }}>
        {label}
      </div>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder="0"
        style={{
          width: "100%",
          padding: "16px",
          border: `4px solid ${color}`,
          background: "#fff",
          fontFamily: "inherit",
          fontSize: 36,
          fontWeight: 900,
          color,
          textAlign: "center",
          outline: "none",
          letterSpacing: "-0.04em",
        }}
      />
    </div>
  );
}
