import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";

export async function GET() {
  const svgPath = path.join(process.cwd(), "public/open-call.svg");
  const svgContent = fs.readFileSync(svgPath, "utf-8");

  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    info: {
      Title: "Galerie Označník / Výzva Zlobit",
      Author: "Galerie Označník",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  SVGtoPDF(doc, svgContent, 0, 0, {
    width: 595.28,
    height: 841.89,
    preserveAspectRatio: "xMidYMid meet",
  });

  doc.end();

  const buffer = await new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="galerie-oznacnik-open-call.pdf"',
    },
  });
}
