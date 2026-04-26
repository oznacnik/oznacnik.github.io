export interface Station {
  id: string;          // stop_id from GTFS
  name: string;        // stop_name
  lat: number;
  lng: number;
  lines: number[];     // tram line numbers serving this stop
}

export type ExhibitionStatus = 'current' | 'upcoming' | 'past';

export interface Exhibition {
  id: string;
  title: string;               // "LINKA 12: LEHOVEC — BALABENKA"
  subtitle?: string;           // optional claim / název výstavy
  artist?: string;             // jméno umělce/ce
  artistBio?: string;          // krátký popis umělce/ce
  color: string;               // HEX barva výstavy
  lineNumbers: number[];       // čísla tramvajových linek (jedna nebo více)
  direction: string;           // "směr Lehovec"
  startStationId: string;
  endStationId: string;
  status: ExhibitionStatus;
  openedAt: string;            // ISO date string
  closedAt?: string;           // ISO date string | null = probíhá
  curatorialText: string;      // markdown
  visitInfo: string;
  createdAt: string;
}

export interface ExhibitionStation {
  id: string;
  exhibitionId: string;
  stationId: string;
  position: number;            // pořadí zastávky
  hasInstallation: boolean;
  workTitle?: string;
  notes?: string;
}
