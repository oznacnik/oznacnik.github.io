import PrijatoForm from "./PrijatoForm";
import { COPY } from "./copy";

// Tolerantní přístup k volitelným polím v COPY (uživatel je může mazat).
const opt = (obj: object, key: string): string | undefined =>
  (obj as Record<string, unknown>)[key] as string | undefined;

export const metadata = {
  title: COPY.meta.title,
  robots: { index: false, follow: false },
};

const DPP = "#E3000B";

export default function PrijatoPage() {
  return (
    <div>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="px-6 pt-12 pb-0">
        <div className="type-label mb-4" style={{ color: "#bbb" }}>
          {COPY.hero.kicker}
        </div>
        <div
          className="font-black uppercase leading-none"
          style={{ fontSize: "clamp(64px, 14vw, 200px)", letterSpacing: "-0.05em", lineHeight: 0.85, color: DPP }}
        >
          {COPY.hero.line1}
        </div>
      </section>

      <div className="bar bar-thick mt-12" />

      {/* ── DEADLINE BANNER (nahoře) ──────────────────────────────────────── */}
      <section
        className="px-6 py-8 border-b-4 border-black flex flex-wrap items-baseline gap-x-8 gap-y-3"
        style={{ background: "#000" }}
      >
        <div className="type-label" style={{ color: "#888" }}>
          {COPY.deadline.label}
        </div>
        <div
          className="font-black"
          style={{
            fontSize: "clamp(28px, 5vw, 56px)",
            letterSpacing: "-0.03em",
            color: DPP,
            lineHeight: 1,
          }}
        >
          {COPY.deadline.date}
        </div>
      </section>

      {/* ── PEREX ─────────────────────────────────────────────────────────── */}
      <section className="px-6 py-10 border-b-4 border-black">
        <p
          className="font-black leading-none uppercase"
          style={{ fontSize: "clamp(22px, 4vw, 44px)", letterSpacing: "-0.03em", lineHeight: 0.95, maxWidth: 900 }}
        >
          {COPY.perex.headline}{" "}
          <span style={{ color: DPP }}>{COPY.perex.accent}</span>
          {opt(COPY.perex, "tail") ? ` ${opt(COPY.perex, "tail")}` : ""}
        </p>
        {opt(COPY.perex, "body") && (
          <p className="type-body mt-6" style={{ maxWidth: 720 }}>
            {opt(COPY.perex, "body")}
          </p>
        )}
      </section>

      {/* ── FORM ──────────────────────────────────────────────────────────── */}
      <PrijatoForm />

      <div className="bar bar-thick" />

      {/* ── KONTAKT ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-10">
        <div className="type-label mb-3" style={{ color: DPP }}>
          {COPY.contact.label}
        </div>
        <a
          href={`mailto:${COPY.contact.email}`}
          className="font-black"
          style={{
            fontSize: "clamp(15px, 2vw, 22px)",
            color: DPP,
            textDecoration: "underline",
            letterSpacing: "-0.01em",
          }}
        >
          {COPY.contact.email}
        </a>
        <p className="type-body mt-4" style={{ maxWidth: 520 }}>
          {COPY.contact.body}
        </p>
      </section>

      <div className="bar bar-thick" />
    </div>
  );
}
