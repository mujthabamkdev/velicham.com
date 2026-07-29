"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NoteCard from "./NoteCard";
import { useAgentStore } from "@/lib/store";

export default function SocialFeed({
  notes,
  showTabs = true,
}: {
  notes: any[];
  showTabs?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"forYou" | "following">("forYou");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const [followedUserIds, setFollowedUserIds] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { favorites } = useAgentStore();

  useEffect(() => {
    fetch("/api/users/follow")
      .then((res) => res.json())
      .then((data) => {
        if (data?.followedUserIds) {
          setFollowedUserIds(data.followedUserIds);
        }
        if (data?.currentUserId) {
          setCurrentUserId(data.currentUserId);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleFollow = async (targetUserId: string) => {
    try {
      const res = await fetch("/api/users/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.following) {
          setFollowedUserIds((prev) => [...prev, targetUserId]);
        } else {
          setFollowedUserIds((prev) => prev.filter((id) => id !== targetUserId));
        }
      }
    } catch (e) {
      console.error("Failed to toggle follow:", e);
    }
  };

  let filteredNotes =
    showTabs && activeTab === "following"
      ? notes.filter(
          (n) =>
            (n.userCreatorId && followedUserIds.includes(n.userCreatorId)) ||
            favorites.includes(n.id)
        )
      : notes;

  if (searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase();
    filteredNotes = filteredNotes.filter(
      (n) =>
        n.title?.toLowerCase().includes(q) ||
        n.summary?.toLowerCase().includes(q) ||
        n.topic?.title?.toLowerCase().includes(q)
    );
  }

  const visibleNotes = filteredNotes.slice(0, visibleCount);

  return (
    <div className="w-full space-y-10 flex flex-col items-center font-sans">
      {/* Search Controls */}
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <div className="p-4 sm:p-5 glass-card space-y-2">
          <div className="relative w-full">
            <svg
              className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search notes by concept, topic, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[--color-accent-cyan] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation (Optional) */}
      {showTabs && (
        <div className="flex items-center justify-between border-b border-[#27272a] pb-3 w-full max-w-4xl mx-auto">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveTab("forYou")}
              className={`text-sm font-bold relative transition-colors ${
                activeTab === "forYou" ? "text-white" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              For You
              {activeTab === "forYou" && (
                <div className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-white rounded-t-md" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("following")}
              className={`text-sm font-bold relative transition-colors ${
                activeTab === "following" ? "text-white" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Following
              {activeTab === "following" && (
                <div className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-white rounded-t-md" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Grid Feed Container */}
      <div className="w-full">
        {(!filteredNotes || filteredNotes.length === 0) ? (
          <div className="p-12 sm:p-16 text-center my-8 glass-card max-w-2xl mx-auto">
            <div className="text-4xl mb-4">🌌</div>
            <h3 className="text-lg font-bold text-white mb-2">
              {activeTab === "following"
                ? "No notes from followed users yet"
                : "No notes matching your criteria"}
            </h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
              {activeTab === "following"
                ? "Follow note creators to see their generated knowledge notes in this feed!"
                : "No knowledge notes available in your stream right now."}
            </p>
          </div>
        ) : (
          /* Single Column Centered Stream (1 note per row) */
          <div className="flex flex-col items-center gap-8 max-w-2xl mx-auto w-full">
            {visibleNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isFollowing={note.userCreatorId ? followedUserIds.includes(note.userCreatorId) : false}
                onToggleFollow={handleToggleFollow}
                currentUserId={currentUserId || undefined}
              />
            ))}
          </div>
        )}

        {/* Pagination Load More Button */}
        {visibleCount < filteredNotes.length && (
          <div className="flex justify-center pt-10 font-mono">
            <button
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="px-8 py-3 rounded-full border border-[#27272a] text-gray-300 hover:text-white hover:border-white/40 hover:bg-white/5 transition font-semibold text-xs bg-transparent"
            >
              Load More ({filteredNotes.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}