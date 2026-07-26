"use client";

import NoteCard from "./NoteCard";
import { useState } from "react";

export default function SocialFeed({ notes }: { notes: any[] }) {
  const [visibleCount, setVisibleCount] = useState(6);

  const visibleNotes = notes.slice(0, visibleCount);

  if (!notes || notes.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center border border-white/10 max-w-xl mx-auto">
        <div className="text-4xl mb-4">🌌</div>
        <h3 className="text-xl font-bold text-white mb-2">No notes ingested yet</h3>
        <p className="text-gray-400 text-sm mb-6">
          Head over to Mission Control to ingest YouTube videos into short connected notes!
        </p>
        <a
          href="/admin"
          className="inline-block px-5 py-2.5 rounded-full bg-[--color-accent-purple] text-white font-medium text-sm hover:bg-purple-600 transition shadow-lg glow-purple"
        >
          Go to Mission Control →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleNotes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>

      {visibleCount < notes.length && (
        <div className="flex justify-center pt-6">
          <button
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="px-6 py-2.5 rounded-full border border-white/20 text-gray-200 hover:text-white hover:border-[--color-accent-cyan] hover:bg-white/5 transition font-medium text-sm shadow-md"
          >
            Load More Discovery Posts ({notes.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
