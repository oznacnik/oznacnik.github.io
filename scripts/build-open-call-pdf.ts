import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";

const svgPath = path.join(process.cwd(), "public/open-call.svg");
const outPath = path.join(process.cwd(), "public/open-call.pdf");

const svgContent = fs.readFileSync(svgPath, "utf-8");

const doc = new PDFDocument({
  size: "A4",
  margin: 0,
  info: {
    Title: "Galerie Označník / Výzva Zlobit",
    Author: "Galerie Označník",
  },
});

const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

SVGtoPDF(doc, svgContent, 0, 0, {
  width: 595.28,
  height: 841.89,
  preserveAspectRatio: "xMidYMid meet",
});

doc.end();

stream.on("finish", () => {
  console.log(`PDF saved to ${outPath}`);
});
