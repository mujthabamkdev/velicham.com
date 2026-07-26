"use client";

import dynamic from "next/dynamic";
import type { GalaxyNebula, GalaxyStar } from "@/lib/types";

const GalaxyCanvas = dynamic(
  () => import("@/components/galaxy/GalaxyCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#030014]" />
    ),
  }
);

export default function GalaxyWrapper({
  nebulas,
  onStarClick,
}: {
  nebulas: GalaxyNebula[];
  onStarClick?: (star: GalaxyStar) => void;
}) {
  return (
    <GalaxyCanvas
      nebulas={nebulas}
      onStarClick={onStarClick ?? (() => {})}
    />
  );
}
