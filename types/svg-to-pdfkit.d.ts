declare module "svg-to-pdfkit" {
  import PDFDocument from "pdfkit";
  function SVGtoPDF(
    doc: InstanceType<typeof PDFDocument>,
    svg: string,
    x: number,
    y: number,
    options?: Record<string, unknown>
  ): void;
  export default SVGtoPDF;
}
