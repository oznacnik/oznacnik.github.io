import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_TARGET = "galerieoznacnik@proton.me";

interface Work {
  title: string;
  year: string;
  technique: string;
  count: string;
}

interface Payload {
  name: string;
  email: string;
  stops: string;
  works: Work[];
  annotation: string;
  web: "yes" | "no";
  popisek: "yes" | "no";
  film: "yes" | "no";
  vernisageDate: string;
  notes: string;
}

function fmt(p: Payload): string {
  const yn = (v: string) => (v === "yes" ? "ano" : v === "no" ? "ne" : "—");
  const totalCopies = p.works.reduce((acc, w) => {
    const n = parseInt(w.count, 10);
    return acc + (isNaN(n) ? 0 : n);
  }, 0);
  const works =
    p.works.length === 0
      ? "(žádná díla nevyplněna)"
      : p.works
          .map(
            (w, i) =>
              `  ${i + 1}. ${w.title || "(bez názvu)"} (${w.year || "?"}, ${
                w.technique || "?"
              }) × ${w.count || "?"} ks`
          )
          .join("\n");

  const stopsNum = parseInt(p.stops, 10);
  const slots = stopsNum > 0 ? stopsNum * 2 : 0;

  return [
    "Galerie Označník — formulář pro přijaté autory",
    "──────────────────────────────────────────────",
    "",
    `Jméno:   ${p.name}`,
    `E-mail:  ${p.email}`,
    "",
    `Zastávek:    ${p.stops}  (= ${slots} označníků)`,
    `Kopií celkem: ${totalCopies}  ${
      slots ? (totalCopies === slots ? "✓" : `(rozdíl ${totalCopies - slots})`) : ""
    }`,
    "",
    "Seznam děl:",
    works,
    "",
    "Anotace autora:",
    p.annotation || "(nevyplněno)",
    "",
    `Web galerie:        ${yn(p.web)}`,
    `Popisek u díla:     ${yn(p.popisek)}`,
    `Film (souhlas):     ${yn(p.film)}`,
    `Termín vernisáže:   ${p.vernisageDate || "—"}`,
    "",
    "Cokoliv dalšího:",
    p.notes || "(nic)",
    "",
    "──────────────────────────────────────────────",
  ].join("\n");
}

interface SendResult {
  ok: boolean;
  status?: number;
  detail?: string;
}

async function sendViaResend(payload: Payload, body: string): Promise<SendResult | null> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  const from = process.env.RESEND_FROM ?? "Galerie Označník <onboarding@resend.dev>";
  const to = process.env.RESEND_TO ?? DEFAULT_TARGET;

  const subject = `Přihláška / ${payload.name}`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: payload.email,
      subject,
      text: body,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[prijato-submit] Resend error:", res.status, errText);
    return { ok: false, status: res.status, detail: errText };
  }
  return { ok: true };
}

export async function POST(req: Request) {
  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  if (!payload.name?.trim() || !payload.email?.trim()) {
    return NextResponse.json({ ok: false, error: "missing required fields" }, { status: 400 });
  }

  const body = fmt(payload);
  const result = await sendViaResend(payload, body);

  if (result === null) {
    console.log("\n[prijato-submit] no RESEND_API_KEY — logging only:\n");
    console.log(body);
    console.log();
    return NextResponse.json({ ok: true, sent: false, reason: "no_api_key" });
  }

  if (!result.ok) {
    // Even when Resend rejects, persist via console so the submission isn't lost.
    console.log("\n[prijato-submit] resend rejected — logging payload:\n");
    console.log(body);
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: "resend_rejected",
      status: result.status,
      detail: result.detail,
    });
  }

  return NextResponse.json({ ok: true, sent: true });
}
