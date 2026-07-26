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

  // Extract wiki links count
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
    <article className="p-4 sm:p-5 rounded-2xl bg-[#0c0728]/70 backdrop-blur-md border border-white/10 hover:border-white/20 transition duration-200 shadow-lg">
      <div className="flex items-start gap-3.5">
        {/* Left Column: Author Avatar */}
        <div className="shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[--color-accent-purple] to-[--color-accent-cyan] flex items-center justify-center font-bold text-white shadow text-sm">
            {authorName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Right Column: X-style Main Post Body */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Row: Name, Handle, Date, Topic Chip */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0 text-xs">
              {note.author ? (
                <Link
                  href={`/channels/${note.author.id}`}
                  className="font-bold text-white hover:underline truncate"
                >
                  {authorName}
                </Link>
              ) : (
                <span className="font-bold text-white truncate">
                  {authorName}
                </span>
              )}
              <span className="text-gray-400 font-mono text-[11px]">
                {authorHandle}
              </span>
              <span className="text-gray-500 font-mono">·</span>
              <span className="text-gray-400 font-mono text-[11px]">
                {new Date(note.createdAt || Date.now()).toLocaleDateString(
                  undefined,
                  { month: "short", day: "numeric" }
                )}
              </span>
            </div>

            {topicTitle && (
              <Link
                href={`/topics/${note.topic.slug}`}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[--color-accent-cyan] hover:bg-white/10 transition font-medium shrink-0"
              >
                {topicTitle}
              </Link>
            )}
          </div>

          {/* Note Title (Clickable Post Link) */}
          <Link href={`/notes/${note.slug}`} className="block group">
            <h3 className="text-base font-bold text-white leading-snug group-hover:text-[--color-accent-cyan] transition">
              {note.title}
            </h3>
          </Link>

          {/* Note Summary */}
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed line-clamp-3">
            {note.summary}
          </p>

          {/* YouTube Video Title Source Link */}
          {note.youtubeUrl && (
            <div className="pt-1">
              <a
                href={note.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 transition text-[11px] font-mono"
              >
                <span>▶ Original Source:</span>
                <span className="underline truncate max-w-[240px]">
                  {note.title}
                </span>
                <span>↗</span>
              </a>
            </div>
          )}

          {/* Bottom Action Bar (X.com Style Buttons Row) */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400 font-mono">
            {/* Comment Option */}
            <Link
              href={`/notes/${note.slug}#comments`}
              className="flex items-center gap-1.5 hover:text-[--color-accent-cyan] transition py-1 px-2 rounded-lg hover:bg-white/5"
            >
              <span>💬</span>
              <span>{note.comments?.length || 0}</span>
            </Link>

            {/* Wiki-links Count Option */}
            {wikiLinkCount > 0 ? (
              <span
                className="flex items-center gap-1.5 text-[--color-accent-purple] py-1 px-2"
                title={`${wikiLinkCount} linked topics`}
              >
                <span>🔗</span>
                <span>{wikiLinkCount} links</span>
              </span>
            ) : (
              <span className="text-transparent">.</span>
            )}

            {/* Favorite Star Option */}
            <button
              onClick={handleToggleFav}
              className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition ${
                isFav
                  ? "text-amber-400 font-bold bg-amber-400/10"
                  : "hover:text-amber-400 hover:bg-white/5"
              }`}
            >
              <span>{isFav ? "★" : "☆"}</span>
              <span>{isFav ? "Saved" : "Save"}</span>
            </button>

            {/* Share Option */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 hover:text-white transition py-1 px-2 rounded-lg hover:bg-white/5"
            >
              <span>{copied ? "✓ Copied" : "↗ Share"}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
