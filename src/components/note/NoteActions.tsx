"use client";

import React, { useState, useEffect } from "react";
import { useAgentStore } from "@/lib/store";
import BrainMapModal from "@/components/feed/BrainMapModal";

interface NoteActionsProps {
  note: any;
}

export default function NoteActions({ note }: NoteActionsProps) {
  const { favorites, toggleFavorite, savedNotes, toggleSaveNote } = useAgentStore();
  const [copied, setCopied] = useState(false);
  const [showBrainMap, setShowBrainMap] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const isFav = favorites.includes(note.id);
  const isSaved = savedNotes.includes(note.id);
  const likeCount = isFav ? 1 : 0;
  const commentCount = note.comments?.length || 0;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/notes/${note.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    toggleFavorite(note.id);
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    toggleSaveNote(note.id);
  };

  return (
    <>
      {/* Compact Action Bar */}
      <div className="flex items-center flex-wrap gap-1.5 pt-3.5 border-t border-[#27272a] text-xs">
        {/* Comments Count Anchor */}
        <a
          href="#comments"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition leading-none"
        >
          <i className="lni lni-comments-alt text-xs leading-none" />
          <span className="leading-none">{commentCount} {commentCount === 1 ? "Comment" : "Comments"}</span>
        </a>

        {/* Like Button */}
        <button
          type="button"
          onClick={handleToggleFav}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition leading-none ${
            isFav
              ? "bg-red-500/10 border border-red-500/30 text-red-400 font-bold"
              : "bg-white/5 border border-white/5 text-gray-300 hover:text-white hover:bg-white/10"
          }`}
          title={isFav ? "Unlike Note" : "Like Note"}
        >
          <i className={`lni lni-heart text-xs leading-none ${isFav ? "text-red-500" : ""}`} />
          <span className="leading-none">{isFav ? "Liked" : "Like"}</span>
          {likeCount > 0 && <span className="font-mono text-xs font-bold leading-none">({likeCount})</span>}
        </button>

        {/* Save Note Button */}
        <button
          type="button"
          onClick={handleToggleSave}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition leading-none ${
            isSaved
              ? "bg-white text-black border border-white font-bold"
              : "bg-white/5 border border-white/5 text-gray-300 hover:text-white hover:bg-white/10"
          }`}
          title={isSaved ? "Remove from Saved Notes" : "Save Note"}
        >
          <i className={`lni lni-bookmark text-xs leading-none ${isSaved ? "fill-black" : ""}`} />
          <span className="leading-none">{isSaved ? "Saved" : "Save Note"}</span>
        </button>

        {/* Share Public URL Button */}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition font-medium leading-none"
          title="Share Public Link"
        >
          <i className="lni lni-share-alt text-xs leading-none" />
          {copied ? (
            <span className="text-emerald-400 font-bold leading-none text-[11px]">Copied Public URL!</span>
          ) : (
            <span className="leading-none">Share</span>
          )}
        </button>

        {/* Brain Map Modal Button (Pushed to Right) */}
        <button
          type="button"
          onClick={() => setShowBrainMap(true)}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-black hover:bg-gray-200 transition font-bold font-mono text-xs shadow-sm leading-none ml-auto shrink-0"
          title="Open Obsidian Brain Graph"
          style={{ color: "black" }}
        >
          <i className="lni lni-network text-xs text-black leading-none" />
          <span className="leading-none">Brain Map</span>
        </button>
      </div>

      {/* Brain Map Modal */}
      <BrainMapModal
        note={note}
        isOpen={showBrainMap}
        onClose={() => setShowBrainMap(false)}
      />
    </>
  );
}
