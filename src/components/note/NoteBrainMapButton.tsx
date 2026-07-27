"use client";

import React, { useState } from "react";
import BrainMapModal from "@/components/feed/BrainMapModal";

export default function NoteBrainMapButton({ note }: { note: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs font-mono font-semibold transition shrink-0"
      >
        <span>🧠</span>
        <span>View Obsidian Brain Map</span>
      </button>

      <BrainMapModal note={note} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
