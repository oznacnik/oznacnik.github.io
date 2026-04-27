import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { OnboardingPDF } from "@/lib/onboarding-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const stream = await renderToStream(<OnboardingPDF />);
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="galerie-oznacnik-prijato.pdf"',
    },
  });
}
