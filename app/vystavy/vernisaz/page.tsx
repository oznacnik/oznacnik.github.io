import { redirect } from "next/navigation";

// Vernisáž 2026 je teď přímo na hlavní stránce. Tahle route už nemá
// vlastní obsah, redirect na / zachovává historické linky (QR PDF,
// share, db.ts buildVernisazExhibition apod.).
export default function VernisazRedirect() {
  redirect("/");
}
