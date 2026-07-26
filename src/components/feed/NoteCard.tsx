"use client";

import Link from "next/link";
import { useState } from "react";
import { useAgentStore } from "@/lib/store";

export default function NoteCard({ note }: { note: any }) {
  const { favorites, toggleFavorite } = useAgentStore();
  const [copied, setCopied] = useState(false);
  const isFav = favorites.includes(note.id);

  const authorName = note.author?.name || "Velicham Explorer";
  const authorHandle = `@${authorName.toLowerCase().replace(/\s+/g, "")}`;
  const topicTitle = note.topic?.title;

  // Count connected links
  const wikiLinkMatches = (note.content || "").match(/\[\[(.*?)\]\]/g);
  const wikiLinkCount = wikiLinkMatches ? wikiLinkMatches.length : 0;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/notes/${note.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(note.id);
  };

  return (
    <article className="glass-card rounded-2xl p-5 border border-white/10 hover:border-[--color-accent-purple]/50 transition duration-300 flex flex-col group relative">
      {/* Top Header: Author Avatar & Handle + Topic Chip */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[--color-accent-purple] to-[--color-accent-cyan] flex items-center justify-center font-bold text-white shadow text-xs shrink-0">
            {authorName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 leading-tight">
            {note.author ? (
              <Link
                href={`/channels/${note.author.id}`}
                className="font-bold text-white hover:underline text-xs truncate block"
              >
                {authorName}
              </Link>
            ) : (
              <span className="font-bold text-white text-xs truncate block">
                {authorName}
              </span>
            )}
            <span className="text-[11px] text-gray-400 font-mono">
              {authorHandle}
            </span>
          </div>
        </div>

        {topicTitle && (
          <Link
            href={`/topics/${note.topic.slug}`}
            className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[--color-accent-cyan] hover:bg-white/10 transition font-medium shrink-0"
          >
            {topicTitle}
          </Link>
        )}
      </div>

      {/* Main Content Area (Text Only - Title with YouTube link preview + Summary) */}
      <div className="flex-1 space-y-2 mb-4">
        <Link href={`/notes/${note.slug}`} className="block group-hover:opacity-95">
          <h3 className="text-base font-bold text-white leading-snug group-hover:text-[--color-accent-cyan] transition">
            {note.title}
          </h3>
        </Link>

        <p className="text-gray-300 text-xs leading-relaxed line-clamp-3 font-normal">
          {note.summary}
        </p>

        {/* Source Video Link Chip */}
        {note.youtubeUrl && (
          <a
            href={note.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[--color-accent-pink] hover:underline pt-1"
          >
            <span>▶</span>
            <span>YouTube Source ↗</span>
          </a>
        )}
      </div>

      {/* Action Bar */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400 font-mono mt-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleFav}
            className={`flex items-center gap-1 transition ${
              isFav ? "text-amber-400 font-bold" : "hover:text-amber-400"
            }`}
          >
            <span>{isFav ? "★" : "☆"}</span>
            <span>{isFav ? "Saved" : "Save"}</span>
          </button>

          <Link
            href={`/notes/${note.slug}#comments`}
            className="flex items-center gap-1 hover:text-[--color-accent-cyan] transition"
          >
            <span>💬</span>
            <span>{note.comments?.length || 0}</span>
          </Link>

          {wikiLinkCount > 0 && (
            <span className="flex items-center gap-1 text-[--color-accent-purple]" title={`${wikiLinkCount} linked topics`}>
              <span>🔗</span>
              <span>{wikiLinkCount}</span>
            </span>
          )}
        </div>

        <button
          onClick={handleShare}
          className="flex items-center gap-1 hover:text-white transition"
        >
          <span>{copied ? "✓ Copied" : "↗ Share"}</span>
        </button>
      </div>
    </article>
  );
}
