"use client";

import dynamic from "next/dynamic";
import { useAgentStore } from "@/lib/store";
import type { GalaxyNebula, GalaxyStar } from "@/lib/types";

const GalaxyCanvas = dynamic(
  () => import("@/components/galaxy/GalaxyCanvas"),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#030014]" />,
  }
);

export default function GalaxyWrapper({
  nebulas = [],
  onStarClick,
}: {
  nebulas?: GalaxyNebula[];
  onStarClick?: (star: GalaxyStar) => void;
}) {
  const { galaxyMode, setGalaxyMode, favorites } = useAgentStore();

  return (
    <div className="relative w-full h-full">
      <GalaxyCanvas
        nebulas={nebulas}
        mode={galaxyMode}
        favoriteCount={favorites.length}
        onStarClick={onStarClick ?? (() => {})}
      />

      {/* Interactive Galaxy Controls Overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full glass border border-white/10 shadow-2xl backdrop-blur-md pointer-events-auto">
        <button
          onClick={() => setGalaxyMode("minimal")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            galaxyMode === "minimal"
              ? "bg-[--color-accent-purple] text-white shadow-lg glow-purple"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          ✨ Minimal Space
        </button>

        <button
          onClick={() => setGalaxyMode("popular")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            galaxyMode === "popular"
              ? "bg-[--color-accent-cyan] text-white shadow-lg glow-cyan"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          🔥 Popular Interests
        </button>

        <button
          onClick={() => setGalaxyMode("favorites")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            galaxyMode === "favorites"
              ? "bg-[--color-accent-pink] text-white shadow-lg glow-purple"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          ⭐ My Favorites ({favorites.length})
        </button>

        {galaxyMode !== "minimal" && (
          <button
            onClick={() => setGalaxyMode("minimal")}
            className="px-2.5 py-1.5 rounded-full text-xs text-gray-400 hover:text-red-400 hover:bg-white/5 transition"
            title="Reset Galaxy"
          >
            🔄 Reset
          </button>
        )}
      </div>
    </div>
  );
}
