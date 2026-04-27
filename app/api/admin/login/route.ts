import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const ok = await login(email, password);
  if (ok) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Neplatné přihlašovací údaje" }, { status: 401 });
}
