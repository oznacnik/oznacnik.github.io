import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";

export async function GET() {
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // A4 at 96dpi: 794 x 1123px
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

    // Hit the local dev server
    await page.goto("http://localhost:3000/open-call", {
      waitUntil: "networkidle0",
      timeout: 15000,
    });

    // Hide nav and PDF download button for print version
    await page.addStyleTag({
      content: `
        header, .bar.bar-thick:first-of-type { display: none !important; }
        a[href="/api/open-call-pdf"] { display: none !important; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      `,
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="galerie-oznacnik-open-call-v2.pdf"',
      },
    });
  } finally {
    await browser.close();
  }
}
