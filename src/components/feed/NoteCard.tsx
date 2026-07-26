"use client";

import Link from "next/link";
import { useState } from "react";
import { useAgentStore } from "@/lib/store";

export default function NoteCard({ note }: { note: any }) {
  const { favorites, toggleFavorite } = useAgentStore();
  const [copied, setCopied] = useState(false);
  const isFav = favorites.includes(note.id);

  // Extract author name & generate a clean handle
  const authorName = note.author?.name || "Velicham Explorer";
  const authorHandle = `@${authorName.toLowerCase().replace(/\s+/g, "")}`;
  const topicTitle = note.topic?.title || "General Knowledge";

  // Parse wiki-link count
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
    <article className="glass-card rounded-2xl p-5 border border-white/10 hover:border-[--color-accent-purple]/50 transition duration-300 flex flex-col group relative animate-slide-up">
      {/* Top Header: X-post style Author & Topic badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar initial circle */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[--color-accent-purple] to-[--color-accent-cyan] flex items-center justify-center font-bold text-white shadow-md text-sm">
            {authorName.charAt(0).toUpperCase()}
          </div>
          <div className="leading-tight">
            {note.author ? (
              <Link
                href={`/channels/${note.author.id}`}
                className="font-bold text-white hover:underline text-sm block"
              >
                {authorName}
              </Link>
            ) : (
              <span className="font-bold text-white text-sm block">
                {authorName}
              </span>
            )}
            <span className="text-xs text-gray-400 font-mono">
              {authorHandle} •{" "}
              {new Date(note.createdAt || Date.now()).toLocaleDateString(
                undefined,
                { month: "short", day: "numeric" }
              )}
            </span>
          </div>
        </div>

        {/* Topic Tag */}
        {note.topic && (
          <Link
            href={`/topics/${note.topic.slug}`}
            className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[--color-accent-cyan] hover:bg-white/10 transition font-medium"
          >
            {topicTitle}
          </Link>
        )}
      </div>

      {/* Main Post Body (X Post Style - No Video Thumbnail) */}
      <Link href={`/notes/${note.slug}`} className="flex-1 block group-hover:opacity-95">
        <h3 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-[--color-accent-cyan] transition">
          {note.title}
        </h3>
        <p className="text-gray-300 text-sm leading-relaxed line-clamp-3 font-normal mb-4">
          {note.summary}
        </p>
      </Link>

      {/* X-Post Action Bar */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400 font-mono mt-auto">
        <div className="flex items-center gap-4">
          {/* Favorite Star Button */}
          <button
            onClick={handleToggleFav}
            className={`flex items-center gap-1.5 transition ${
              isFav ? "text-amber-400 font-bold" : "hover:text-amber-400"
            }`}
            title={isFav ? "Remove from Favorites" : "Add to Favorites"}
          >
            <span className="text-sm">{isFav ? "★" : "☆"}</span>
            <span>{isFav ? "Saved" : "Save"}</span>
          </button>

          {/* Comment Count */}
          <Link
            href={`/notes/${note.slug}#comments`}
            className="flex items-center gap-1.5 hover:text-[--color-accent-cyan] transition"
          >
            <span className="text-sm">💬</span>
            <span>{note.comments?.length || 0}</span>
          </Link>

          {/* Wiki-links count badge */}
          {wikiLinkCount > 0 && (
            <span className="flex items-center gap-1 text-[--color-accent-purple]" title={`${wikiLinkCount} connected wiki-links`}>
              <span>🔗</span>
              <span>{wikiLinkCount} links</span>
            </span>
          )}
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1 hover:text-white transition"
          title="Share Note"
        >
          <span>{copied ? "✓ Copied" : "↗ Share"}</span>
        </button>
      </div>
    </article>
  );
}
