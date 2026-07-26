'use client';

import NoteCard from './NoteCard';
import { useEffect, useRef, useState } from 'react';

export default function SocialFeed({ notes }: { notes: any[] }) {
  const [visibleNotes, setVisibleNotes] = useState(notes.slice(0, 6));
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {visibleNotes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
      {visibleNotes.length < notes.length && (
        <div className="col-span-full flex justify-center mt-8">
          <button 
            onClick={() => setVisibleNotes(notes.slice(0, visibleNotes.length + 6))}
            className="px-6 py-2 rounded-full border border-[--color-accent-cyan] text-[--color-accent-cyan] hover:bg-[--color-accent-cyan] hover:text-white transition"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
