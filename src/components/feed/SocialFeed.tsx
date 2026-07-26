"use client";

import NoteCard from "./NoteCard";
import { useState } from "react";

export default function SocialFeed({ notes }: { notes: any[] }) {
  const [visibleCount, setVisibleCount] = useState(6);

  const visibleNotes = notes.slice(0, visibleCount);

  if (!notes || notes.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-[#0c0728] text-center border border-white/10 max-w-md mx-auto my-8">
        <div className="text-3xl mb-3">🌌</div>
        <h3 className="text-lg font-bold text-white mb-2">No notes available yet</h3>
        <p className="text-gray-400 text-xs mb-5 leading-relaxed">
          Ingest YouTube videos in Mission Control to generate short connected notes!
        </p>
        <a
          href="/admin"
          className="inline-block px-5 py-2.5 rounded-full bg-[--color-accent-purple] text-white font-semibold text-xs hover:bg-purple-600 transition shadow-lg glow-purple"
        >
          Go to Mission Control →
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto space-y-4">
      {/* Timeline Stream: One Post Per Row (X.com style) */}
      <div className="space-y-4">
        {visibleNotes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>

      {/* Pagination Load More Button */}
      {visibleCount < notes.length && (
        <div className="flex justify-center pt-4 pb-8">
          <button
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="px-6 py-2.5 rounded-full border border-white/20 text-gray-200 hover:text-white hover:border-[--color-accent-cyan] hover:bg-white/5 transition font-semibold text-xs shadow-md"
          >
            Load More Posts ({notes.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
