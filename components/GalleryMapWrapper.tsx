"use client";
import dynamic from "next/dynamic";
import type { Exhibition, Station } from "@/types";

const GalleryMap = dynamic(() => import("./GalleryMap"), { ssr: false });

interface ExhibitionLine {
  exhibition: Exhibition;
  stations: Station[];
}

interface Props {
  exhibitions: Exhibition[];
  activeStations: Array<{ station: Station; exhibition: Exhibition }>;
  exhibitionLines: ExhibitionLine[];
}

export default function GalleryMapWrapper(props: Props) {
  return <GalleryMap {...props} />;
}
