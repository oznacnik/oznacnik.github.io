"use client";

import { useMemo, useState } from "react";
import { COPY } from "./copy";

const DPP = "#E3000B";

// Tolerantní přístup k volitelným polím v COPY (uživatel je může mazat).
const opt = (obj: object, key: string): string | undefined =>
  (obj as Record<string, unknown>)[key] as string | undefined;

interface Work {
  title: string;
  year: string;
  technique: string;
  count: string;
}

interface FormState {
  name: string;
  email: string;
  stops: string;
  works: Work[];
  annotation: string;
  web: "yes" | "no" | "";
  popisek: "yes" | "no" | "";
  film: "yes" | "no" | "";
  notes: string;
}

const EMPTY_WORK: Work = { title: "", year: "", technique: "", count: "1" };

const INITIAL: FormState = {
  name: "",
  email: "",
  stops: "",
  works: [{ ...EMPTY_WORK }],
  annotation: "",
  web: "yes",
  popisek: "yes",
  film: "yes",
  notes: "",
};

function isFilled(s: FormState): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!s.name.trim()) missing.push("jméno");
  if (!s.email.trim() || !/^\S+@\S+\.\S+$/.test(s.email)) missing.push("e-mail");
  if (!s.stops || parseInt(s.stops, 10) < 1) missing.push("zastávky");
  if (!s.works.some((w) => w.title.trim())) missing.push("seznam děl");
  if (!s.web) missing.push("web");
  if (!s.popisek) missing.push("popisek");
  if (!s.film) missing.push("film");
  return { ok: missing.length === 0, missing };
}

const TOTAL_REQUIRED = 7;

function filledCount(s: FormState): number {
  let n = 0;
  if (s.name.trim()) n++;
  if (s.email.trim() && /^\S+@\S+\.\S+$/.test(s.email)) n++;
  if (s.stops && parseInt(s.stops, 10) >= 1) n++;
  if (s.works.some((w) => w.title.trim())) n++;
  if (s.web) n++;
  if (s.popisek) n++;
  if (s.film) n++;
  return n;
}

// ── Visual primitives ─────────────────────────────────────────────────

function Row({
  num,
  title,
  subtitle,
  hint,
  children,
}: {
  num: string;
  title: string;
  subtitle?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex border-b-4 border-black">
      <div
        className="font-black leading-none pt-8 pb-8 shrink-0 border-r-4 border-black flex items-start justify-start pl-6"
        style={{
          fontSize: "clamp(36px, 5vw, 56px)",
          letterSpacing: "-0.04em",
          color: DPP,
          width: "clamp(80px, 10vw, 110px)",
        }}
      >
        {num}
      </div>
      <div className="px-6 py-8 flex-1 min-w-0">
        <div
          className="font-black uppercase"
          style={{ fontSize: "clamp(18px, 2.5vw, 26px)", letterSpacing: "-0.02em" }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            className="font-black uppercase mt-2"
            style={{
              fontSize: 12,
              letterSpacing: "0.16em",
              color: "#000",
            }}
          >
            {subtitle}
          </div>
        )}
        {hint && (
          <p className="type-body mt-4 mb-5" style={{ color: "#444", maxWidth: 640 }}>
            {hint}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-black mb-5"
      style={{
        background: "#000",
        color: "#fff",
        padding: "16px 20px",
        fontSize: 14,
        lineHeight: 1.5,
        letterSpacing: "-0.01em",
        maxWidth: 720,
      }}
    >
      {children}
    </div>
  );
}

const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  border: "3px solid #000",
  background: "#fff",
  fontFamily: "inherit",
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: "-0.01em",
  outline: "none",
};

const textareaBase: React.CSSProperties = {
  ...inputBase,
  minHeight: 120,
  fontWeight: 400,
  lineHeight: 1.5,
  resize: "vertical",
};

function Pill({
  active,
  onClick,
  children,
  size = "md",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  const padding = size === "lg" ? "16px 22px" : "11px 16px";
  const fontSize = size === "lg" ? 18 : 13;
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-black uppercase"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding,
        border: `3px solid ${active ? DPP : "#000"}`,
        background: active ? DPP : "#fff",
        color: active ? "#fff" : "#000",
        cursor: "pointer",
        fontSize,
        letterSpacing: size === "lg" ? "-0.01em" : "0.04em",
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      {children}
    </button>
  );
}

function ErrorLine({ visible, text }: { visible: boolean; text: string }) {
  if (!visible) return null;
  return (
    <div className="type-label mt-2" style={{ color: DPP }}>
      {text}
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────────────────

export default function PrijatoForm() {
  const [s, setS] = useState<FormState>(INITIAL);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "ok" | "warning" | "error">(
    "idle"
  );
  const [submitDetail, setSubmitDetail] = useState<string>("");

  const status = useMemo(() => isFilled(s), [s]);
  const filled = useMemo(() => filledCount(s), [s]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setS((p) => ({ ...p, [key]: value }));
  };
  const blur = (key: string) => setTouched((p) => new Set(p).add(key));

  const updateWork = (idx: number, patch: Partial<Work>) => {
    setS((p) => ({
      ...p,
      works: p.works.map((w, i) => (i === idx ? { ...w, ...patch } : w)),
    }));
  };
  const addWork = () => {
    setS((p) => ({ ...p, works: [...p.works, { ...EMPTY_WORK }] }));
  };
  const removeWork = (idx: number) => {
    setS((p) => ({
      ...p,
      works: p.works.length > 1 ? p.works.filter((_, i) => i !== idx) : p.works,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status.ok) {
      setTouched(
        new Set([
          "name",
          "email",
          "stops",
          "works",
          "web",
          "popisek",
          "film",
        ])
      );
      return;
    }
    setSubmitState("sending");
    setSubmitDetail("");
    try {
      const res = await fetch("/api/prijato-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...s,
          works: s.works.filter((w) => w.title.trim() || w.year.trim() || w.technique.trim()),
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        sent?: boolean;
        reason?: string;
        status?: number;
        detail?: string;
        error?: string;
      };
      console.log("[prijato-submit response]", data);
      if (!data.ok) {
        setSubmitState("error");
        setSubmitDetail(data.error ?? "Server odpověděl s chybou.");
        return;
      }
      if (data.sent) {
        setSubmitState("ok");
        return;
      }
      // ok=true ale sent=false → odpověď uložena na serveru, ale e-mail nedošel
      setSubmitState("warning");
      const reason =
        data.reason === "no_api_key"
          ? "RESEND_API_KEY není nastavený."
          : data.reason === "resend_rejected"
          ? `Resend odmítl (HTTP ${data.status}): ${data.detail ?? ""}`
          : "E-mail se neodeslal z neznámého důvodu.";
      setSubmitDetail(reason);
    } catch (err) {
      console.error("[prijato-submit error]", err);
      setSubmitState("error");
      setSubmitDetail(err instanceof Error ? err.message : "Síťová chyba.");
    }
  };

  if (submitState === "ok") {
    return (
      <section className="px-6 py-16 border-b-4 border-black">
        <div className="type-label mb-4" style={{ color: DPP }}>
          {COPY.success.eyebrow}
        </div>
        <h2
          className="font-black uppercase leading-none mb-6"
          style={{ fontSize: "clamp(40px, 8vw, 96px)", letterSpacing: "-0.04em", lineHeight: 0.9 }}
        >
          {COPY.success.title1}
          <br />
          <span style={{ color: DPP }}>{COPY.success.title2}</span>
        </h2>
        <p className="type-body" style={{ maxWidth: 640 }}>
          {COPY.success.body}
        </p>
        <button
          type="button"
          onClick={() => {
            setS(INITIAL);
            setTouched(new Set());
            setSubmitState("idle");
          }}
          className="font-black mt-6"
          style={{
            color: DPP,
            textDecoration: "underline",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            font: "inherit",
            fontSize: 14,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {COPY.success.again}
        </button>
      </section>
    );
  }

  const f = COPY.fields;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* 01 — Jméno */}
      <Row num={f.name.num} title={f.name.title} subtitle={opt(f.name, "subtitle")} hint={opt(f.name, "hint")}>
        <input
          type="text"
          value={s.name}
          onChange={(e) => set("name", e.target.value)}
          onBlur={() => blur("name")}
          style={{ ...inputBase, maxWidth: 520 }}
          placeholder={f.name.placeholder}
        />
        <ErrorLine visible={touched.has("name") && !s.name.trim()} text={f.name.error} />
      </Row>

      {/* 02 — E-mail */}
      <Row num={f.email.num} title={f.email.title} subtitle={opt(f.email, "subtitle")} hint={opt(f.email, "hint")}>
        <input
          type="email"
          value={s.email}
          onChange={(e) => set("email", e.target.value)}
          onBlur={() => blur("email")}
          style={{ ...inputBase, maxWidth: 520 }}
          placeholder={f.email.placeholder}
        />
        <ErrorLine
          visible={touched.has("email") && !/^\S+@\S+\.\S+$/.test(s.email)}
          text={f.email.error}
        />
      </Row>

      {/* 03 — Počet zastávek (free numeric input, no upper cap) */}
      <Row num={f.stops.num} title={f.stops.title} subtitle={opt(f.stops, "subtitle")} hint={opt(f.stops, "hint")}>
        <div className="flex items-baseline gap-5 flex-wrap">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={s.stops}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, "");
              set("stops", v);
            }}
            onBlur={() => blur("stops")}
            placeholder={f.stops.placeholder}
            style={{
              width: 120,
              padding: "16px 20px",
              border: `4px solid ${DPP}`,
              background: "#fff",
              fontFamily: "inherit",
              fontSize: 56,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: DPP,
              outline: "none",
              textAlign: "center",
            }}
          />
          {(() => {
            const n = parseInt(s.stops, 10);
            const stopsForm =
              !n || n === 0
                ? f.stops.unitForms.many
                : n === 1
                ? f.stops.unitForms.one
                : n >= 2 && n <= 4
                ? f.stops.unitForms.few
                : f.stops.unitForms.many;
            return (
              <div
                className="font-black uppercase"
                style={{ fontSize: 14, letterSpacing: "0.16em", color: "#000" }}
              >
                {stopsForm}
              </div>
            );
          })()}
          {(() => {
            const n = parseInt(s.stops, 10);
            if (!n || n < 1) return null;
            const slots = n * 2;
            const suffix = slots === 1 ? "" : slots < 5 ? "Y" : "Ů";
            const text = f.stops.computedLabel
              .replace(/{{slots}}/g, String(slots))
              .replace(/{{suffix}}/g, suffix);
            return (
              <div
                className="font-black uppercase"
                style={{
                  fontSize: 14,
                  letterSpacing: "0.16em",
                  color: DPP,
                }}
              >
                {text}
              </div>
            );
          })()}
        </div>
        <ErrorLine
          visible={touched.has("stops") && (!s.stops || parseInt(s.stops, 10) < 1)}
          text={f.stops.error}
        />
      </Row>

      {/* 04 — Seznam děl (dynamic list, propojeno s 03) */}
      <Row
        num={f.works.num}
        title={f.works.title}
        subtitle={opt(f.works, "subtitle")}
        hint={opt(f.works, "hint")}
      >
        {(() => {
          const stopsNum = parseInt(s.stops, 10);
          if (!stopsNum) {
            return <Callout>{f.works.calloutNoStops}</Callout>;
          }
          const slots = stopsNum * 2;
          const stopsSuffix = stopsNum === 1 ? "ku" : stopsNum < 5 ? "ky" : "ek";
          const slotsSuffix = slots === 1 ? "" : slots < 5 ? "y" : "ů";
          const text = f.works.calloutWithStops
            .replace(/{{stops}}/g, String(stopsNum))
            .replace(/{{stopsSuffix}}/g, stopsSuffix)
            .replace(/{{slots}}/g, String(slots))
            .replace(/{{slotsSuffix}}/g, slotsSuffix);
          return <Callout>{text}</Callout>;
        })()}
        <div className="flex flex-col gap-3" style={{ maxWidth: 720 }}>
          {s.works.map((w, i) => (
            <div
              key={i}
              className="border-4 border-black p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="type-label" style={{ color: DPP }}>
                  Dílo {String(i + 1).padStart(2, "0")}
                </div>
                {s.works.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeWork(i)}
                    className="font-black uppercase"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      color: "#888",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    {f.works.removeLabel}
                  </button>
                )}
              </div>
              <div>
                <div className="type-label mb-1" style={{ color: "#888" }}>
                  {f.works.titleLabel}
                </div>
                <input
                  type="text"
                  value={w.title}
                  onChange={(e) => updateWork(i, { title: e.target.value })}
                  style={inputBase}
                  placeholder={f.works.titlePlaceholder}
                />
              </div>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "100px 1fr 110px" }}
              >
                <div>
                  <div className="type-label mb-1" style={{ color: "#888" }}>
                    {f.works.yearLabel}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={w.year}
                    onChange={(e) => updateWork(i, { year: e.target.value })}
                    style={inputBase}
                    placeholder={f.works.yearPlaceholder}
                  />
                </div>
                <div>
                  <div className="type-label mb-1" style={{ color: "#888" }}>
                    {f.works.techniqueLabel}
                  </div>
                  <input
                    type="text"
                    value={w.technique}
                    onChange={(e) => updateWork(i, { technique: e.target.value })}
                    style={inputBase}
                    placeholder={f.works.techniquePlaceholder}
                  />
                </div>
                <div>
                  <div className="type-label mb-1" style={{ color: DPP }}>
                    {f.works.countLabel}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={w.count}
                    onChange={(e) =>
                      updateWork(i, { count: e.target.value.replace(/[^0-9]/g, "") })
                    }
                    style={{ ...inputBase, textAlign: "center", color: DPP }}
                    placeholder={f.works.countPlaceholder}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Live total: porovnání součtu kopií se sloty */}
          {(() => {
            const total = s.works.reduce((acc, w) => {
              const n = parseInt(w.count, 10);
              return acc + (isNaN(n) ? 0 : n);
            }, 0);
            const stopsNum = parseInt(s.stops, 10);
            const slots = stopsNum > 0 ? stopsNum * 2 : 0;
            let statusText: string;
            let statusColor: string;
            if (!slots) {
              statusText = f.works.totalNoStops;
              statusColor = "#888";
            } else if (total === slots) {
              statusText = f.works.totalOk;
              statusColor = "#000";
            } else if (total < slots) {
              statusText = f.works.totalShort.replace("{{n}}", String(slots - total));
              statusColor = DPP;
            } else {
              statusText = f.works.totalOver.replace("{{n}}", String(total - slots));
              statusColor = DPP;
            }
            return (
              <div
                className="font-black uppercase flex items-baseline justify-between gap-4"
                style={{
                  border: `4px solid ${statusColor === DPP ? DPP : "#000"}`,
                  background: statusColor === "#000" ? "#000" : "#fff",
                  color: statusColor === "#000" ? "#fff" : "#000",
                  padding: "14px 20px",
                  marginTop: 4,
                }}
              >
                <span style={{ fontSize: 12, letterSpacing: "0.16em" }}>
                  {f.works.totalLabel}
                </span>
                <span style={{ fontSize: 22, letterSpacing: "-0.02em" }}>
                  {total} / {slots || "?"}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.16em",
                    color: statusColor === "#000" ? "#fff" : statusColor,
                  }}
                >
                  {statusText}
                </span>
              </div>
            );
          })()}

          <button
            type="button"
            onClick={addWork}
            className="font-black uppercase"
            style={{
              alignSelf: "flex-start",
              border: "3px dashed #000",
              background: "#fff",
              padding: "12px 18px",
              fontSize: 13,
              letterSpacing: "0.08em",
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            {f.works.addLabel}
          </button>
        </div>
        <ErrorLine
          visible={touched.has("works") && !s.works.some((w) => w.title.trim())}
          text={f.works.error}
        />
      </Row>

      {/* 05 — Anotace autora */}
      <Row num={f.annotation.num} title={f.annotation.title} subtitle={opt(f.annotation, "subtitle")} hint={opt(f.annotation, "hint")}>
        <textarea
          value={s.annotation}
          onChange={(e) => set("annotation", e.target.value.slice(0, f.annotation.maxLength))}
          style={{ ...textareaBase, maxWidth: 720 }}
          placeholder={f.annotation.placeholder}
        />
        <div className="type-label mt-2" style={{ color: "#aaa" }}>
          {s.annotation.length} / {f.annotation.maxLength}
        </div>
      </Row>

      {/* 06 — Web galerie */}
      <Row num={f.web.num} title={f.web.title} subtitle={opt(f.web, "subtitle")} hint={opt(f.web, "hint")}>
        <div>
          <Pill active={s.web === "yes"} onClick={() => set("web", "yes")}>
            {f.web.yes}
          </Pill>
          <Pill active={s.web === "no"} onClick={() => set("web", "no")}>
            {f.web.no}
          </Pill>
        </div>
        <ErrorLine visible={touched.has("web") && !s.web} text={f.web.error} />
      </Row>

      {/* 07 — Popisek */}
      <Row num={f.popisek.num} title={f.popisek.title} subtitle={opt(f.popisek, "subtitle")} hint={opt(f.popisek, "hint")}>
        <div>
          <Pill active={s.popisek === "yes"} onClick={() => set("popisek", "yes")}>
            {f.popisek.yes}
          </Pill>
          <Pill active={s.popisek === "no"} onClick={() => set("popisek", "no")}>
            {f.popisek.no}
          </Pill>
        </div>
        <ErrorLine visible={touched.has("popisek") && !s.popisek} text={f.popisek.error} />
      </Row>

      {/* 08 — Film */}
      <Row num={f.film.num} title={f.film.title} subtitle={opt(f.film, "subtitle")} hint={opt(f.film, "hint")}>
        <div>
          <Pill active={s.film === "yes"} onClick={() => set("film", "yes")}>
            {f.film.yes}
          </Pill>
          <Pill active={s.film === "no"} onClick={() => set("film", "no")}>
            {f.film.no}
          </Pill>
        </div>
        <ErrorLine visible={touched.has("film") && !s.film} text={f.film.error} />
      </Row>

      {/* 10 — Cokoliv dalšího */}
      <Row num={f.notes.num} title={f.notes.title} subtitle={opt(f.notes, "subtitle")} hint={opt(f.notes, "hint")}>
        <textarea
          value={s.notes}
          onChange={(e) => set("notes", e.target.value)}
          style={{ ...textareaBase, maxWidth: 720 }}
          placeholder={f.notes.placeholder}
        />
      </Row>

      {/* Submit */}
      <div className="px-6 py-12 flex flex-wrap gap-6 items-center">
        <button
          type="submit"
          disabled={submitState === "sending"}
          className="font-black uppercase"
          style={{
            background: DPP,
            color: "#fff",
            border: `4px solid ${DPP}`,
            padding: "20px 32px",
            fontSize: "clamp(18px, 2.5vw, 28px)",
            letterSpacing: "-0.01em",
            cursor: submitState === "sending" ? "wait" : "pointer",
            opacity: submitState === "sending" ? 0.6 : 1,
          }}
        >
          {submitState === "sending" ? COPY.submit.sending : COPY.submit.idle}
        </button>
        {(submitState === "error" || submitState === "warning") && (
          <div
            className="type-body"
            style={{
              color: submitState === "warning" ? "#000" : DPP,
              border: `3px solid ${submitState === "warning" ? "#000" : DPP}`,
              padding: "12px 16px",
              flexBasis: "100%",
              maxWidth: 720,
            }}
          >
            <strong>
              {submitState === "warning"
                ? "Odpověď uložena, ale e-mail se neodeslal."
                : COPY.submit.error}
            </strong>
            {submitDetail && (
              <div style={{ fontSize: 13, marginTop: 6, color: "#666" }}>{submitDetail}</div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
