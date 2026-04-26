import type { Station, Exhibition, ExhibitionStation } from "@/types";

export const STATIONS: Station[] = [
  // Linka 12 — Lehovec → Balabenka (Chomps)
  { id: "L12-01", name: "Lehovec",              lat: 50.097400, lng: 14.511600, lines: [12] },
  { id: "L12-02", name: "Sídliště Hloubětín",   lat: 50.097800, lng: 14.505200, lines: [12] },
  { id: "L12-03", name: "Hloubětín",             lat: 50.098100, lng: 14.497800, lines: [12] },
  { id: "L12-04", name: "Starý Hloubětín",       lat: 50.097600, lng: 14.491200, lines: [12] },
  { id: "L12-05", name: "Vozovna Hloubětín",     lat: 50.097000, lng: 14.484600, lines: [12] },
  { id: "L12-06", name: "Nový Hloubětín",        lat: 50.096200, lng: 14.478100, lines: [12] },
  { id: "L12-07", name: "Kolbenova",             lat: 50.096800, lng: 14.470900, lines: [12] },
  { id: "L12-08", name: "Poštovská",             lat: 50.095800, lng: 14.464300, lines: [12] },
  { id: "L12-09", name: "Špitálská",             lat: 50.096100, lng: 14.458200, lines: [12] },
  { id: "L12-10", name: "Nádraží Vysočany",      lat: 50.099500, lng: 14.470200, lines: [12] },
  { id: "L12-11", name: "Poliklinika Vysočany",  lat: 50.101200, lng: 14.474800, lines: [12] },
  { id: "L12-12", name: "Divadlo Gong",          lat: 50.102800, lng: 14.479100, lines: [12] },
  { id: "L12-13", name: "Balabenka",             lat: 50.104755, lng: 14.482805, lines: [12] },

  // Linka 17 — úsek nábřeží (Golden Shit)
  { id: "U32Z1P", name: "Bílá labuť",          lat: 50.090168, lng: 14.435472, lines: [17] },
  { id: "U999R",  name: "Náměstí Republiky",   lat: 50.088000, lng: 14.429800, lines: [17] },
  { id: "U999S",  name: "Dlouhá třída",        lat: 50.090100, lng: 14.422400, lines: [17] },
  { id: "U999T",  name: "Právnická fakulta",   lat: 50.091900, lng: 14.416000, lines: [17] },
  { id: "U999U",  name: "Staroměstská",        lat: 50.086900, lng: 14.416800, lines: [17] },
  { id: "U999V",  name: "Národní divadlo",     lat: 50.081000, lng: 14.413600, lines: [17] },
  { id: "U999W",  name: "Jiráskovo náměstí",   lat: 50.075300, lng: 14.414900, lines: [17] },
];

export const EXHIBITIONS: Exhibition[] = [
  {
    id: "ex-17-namrep",
    title: "LINKA 17: BÍLÁ LABUŤ — JIRÁSKOVO NÁM.",
    subtitle: "Golden Shit",
    artist: "Matouš Holub",
    artistBio: "Tom je umělec širokého záběru s nelidskou vášní pro motivy, které demontují kontext, přičemž důsledně udržuje křehkou rovnováhu mezi absurdností, základními formami výsměchu a konceptem parodie.",
    color: "#0057A8",
    lineNumbers: [17],
    direction: "směr Průhonice",
    startStationId: "U32Z1P",
    endStationId: "U999W",
    status: "past",
    openedAt: "2026-03-01T00:00:00.000Z",
    closedAt: "2026-03-27T00:00:00.000Z",
    curatorialText: `Sedm zastávek podél Vltavy. Linka 17 kopíruje nábřeží od Starého Města přes Národní třídu k Jiráskovu náměstí.

Výstava Golden Shit pracuje s motivem hodnoty a odpadku. Tisky jsou vloženy do volných reklamních rámečků bez lepidla.`,
    visitInfo: `Linka 17, směr Průhonice. Nastoupte na Bílé labuti nebo Náměstí Republiky. Výstava končí na Jiráskově náměstí.`,
    createdAt: "2026-02-10T10:00:00.000Z",
  },
];

export const EXHIBITION_STATIONS: ExhibitionStation[] = [
  // Linka 17 — Golden Shit
  { id: "es-17-01", exhibitionId: "ex-17-namrep", stationId: "U32Z1P", position: 0, hasInstallation: true  },
  { id: "es-17-02", exhibitionId: "ex-17-namrep", stationId: "U999R",  position: 1, hasInstallation: false },
  { id: "es-17-03", exhibitionId: "ex-17-namrep", stationId: "U999S",  position: 2, hasInstallation: true  },
  { id: "es-17-04", exhibitionId: "ex-17-namrep", stationId: "U999T",  position: 3, hasInstallation: false },
  { id: "es-17-05", exhibitionId: "ex-17-namrep", stationId: "U999U",  position: 4, hasInstallation: true  },
  { id: "es-17-06", exhibitionId: "ex-17-namrep", stationId: "U999V",  position: 5, hasInstallation: true  },
  { id: "es-17-07", exhibitionId: "ex-17-namrep", stationId: "U999W",  position: 6, hasInstallation: false },
];
