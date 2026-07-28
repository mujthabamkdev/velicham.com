"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface GenerateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GenerateNoteModal({ isOpen, onClose }: GenerateNoteModalProps) {
  const router = useRouter();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [topicPrompt, setTopicPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatusMsg("");

    if (!youtubeUrl.trim() && !topicPrompt.trim()) {
      setError("Please enter a YouTube video URL or a topic prompt");
      return;
    }

    setLoading(true);
    setStatusMsg("✨ Contacting AI models pool to generate structured note...");

    try {
      const res = await fetch("/api/notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl: youtubeUrl.trim(),
          topicPrompt: topicPrompt.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate note");
        setLoading(false);
        return;
      }

      setStatusMsg("✓ Note generated successfully! Redirecting...");
      setTimeout(() => {
        onClose();
        router.push(`/notes/${data.note.slug}`);
        router.refresh();
      }, 800);
    } catch (err: any) {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left">
        {/* Glow background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>✨</span> Generate AI Knowledge Note
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 transition rounded-lg hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Status Alert */}
        {statusMsg && (
          <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-2 animate-pulse">
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              YouTube Video URL <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={loading}
              className="w-full bg-[#0f0f11] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Topic or Custom Prompt <span className="text-gray-500">(Required if no video URL)</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Detailed breakdown of Quantum Computing fundamentals & key algorithms"
              value={topicPrompt}
              onChange={(e) => setTopicPrompt(e.target.value)}
              disabled={loading}
              className="w-full bg-[#0f0f11] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Generating...
                </>
              ) : (
                "🚀 Generate Note"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
