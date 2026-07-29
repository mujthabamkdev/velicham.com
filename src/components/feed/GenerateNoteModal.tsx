"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_NOTE_TEMPLATE = `Produce a comprehensive, highly detailed note without omitting important content, arguments, or technical details from the transcript.

Required Structure:
- ## 📌 Executive Summary: A complete overview of the video's core theme and goals.
- ## 💡 Core Concepts & In-Depth Breakdown: Exhaustive breakdown of every key idea, argument, concept, or technical takeaway. Use bold terms, sub-bullet points, and clear explanations.
- ## ⏱️ Detailed Timestamped Timeline: Comprehensive chronological outline matching timestamps [MM:SS] to specific topics and demonstrations.
- ## 🎯 Key Takeaways & Conclusions: Practical summary and actionable conclusions.`;

interface GenerateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GenerateNoteModal({ isOpen, onClose }: GenerateNoteModalProps) {
  const router = useRouter();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [topicPrompt, setTopicPrompt] = useState("");
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_NOTE_TEMPLATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [requiresApiKey, setRequiresApiKey] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  if (!isOpen) return null;

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setStatusMsg("");
    setError("");
    setRequiresApiKey(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatusMsg("");
    setRequiresApiKey(false);

    if (!youtubeUrl.trim() && !topicPrompt.trim() && !customPrompt.trim()) {
      setError("Please enter a YouTube video URL, a topic prompt, or AI instructions");
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setStatusMsg("✨ Contacting OpenRouter AI models pool to generate structured note...");

    try {
      const res = await fetch("/api/notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl: youtubeUrl.trim(),
          topicPrompt: topicPrompt.trim(),
          customPrompt: customPrompt.trim(),
        }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate note");
        if (data.requiresApiKey) {
          setRequiresApiKey(true);
        }
        setLoading(false);
        setStatusMsg("");
        return;
      }

      setStatusMsg("✓ Note generated successfully! Redirecting...");
      setTimeout(() => {
        handleCancel();
        router.push(`/notes/${data.note.slug}`);
        router.refresh();
      }, 800);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Note generation request aborted by user.");
        return;
      }
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
      setStatusMsg("");
    } finally {
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <i className="lni lni-sparkles text-base" /> Generate AI Knowledge Note
          </h2>
          <button
            type="button"
            onClick={handleCancel}
            className="text-gray-400 hover:text-white p-1 transition rounded-lg hover:bg-white/10"
            title="Close and cancel request"
          >
            <i className="lni lni-close text-xs" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <i className="lni lni-warning text-sm text-red-400" /> {error}
            </div>
            {requiresApiKey && (
              <button
                type="button"
                onClick={() => {
                  handleCancel();
                  router.push("/profile/api-keys");
                }}
                className="mt-1 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-200 text-black font-bold text-xs self-start transition shadow flex items-center gap-1.5"
              >
                <i className="lni lni-key text-xs" /> Set Up API Key in Profile →
              </button>
            )}
          </div>
        )}

        {/* Status Alert */}
        {statusMsg && (
          <div className="mt-4 p-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs flex items-center justify-between gap-2 animate-pulse">
            <div className="flex items-center gap-2">
              <i className="lni lni-sparkles text-xs" />
              <span>{statusMsg}</span>
            </div>
            {loading && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-[10px] font-mono font-bold text-white transition"
              >
                Stop / Cancel
              </button>
            )}
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
              placeholder="https://www.youtube.com/watch?v=... or https://youtube.com/shorts/..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={loading}
              className="w-full bg-[#0f0f11] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Topic or Subject Prompt <span className="text-gray-500">(Required if no video URL)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Detailed breakdown of Quantum Computing fundamentals & key algorithms"
              value={topicPrompt}
              onChange={(e) => setTopicPrompt(e.target.value)}
              disabled={loading}
              className="w-full bg-[#0f0f11] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white transition resize-none"
            />
          </div>

          {/* AI Note Style & Formatting Template Instruction */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-300">
                Note Style & AI Formatting Instruction
              </label>
              <button
                type="button"
                onClick={() => setCustomPrompt(DEFAULT_NOTE_TEMPLATE)}
                className="text-[11px] text-gray-400 hover:text-white underline font-mono"
              >
                Reset Default Template
              </button>
            </div>
            <textarea
              rows={5}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={loading}
              className="w-full bg-[#0f0f11] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs font-mono text-gray-300 placeholder-gray-500 focus:outline-none focus:border-white transition leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#27272a]">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-gray-200 text-black text-xs font-bold transition disabled:opacity-50 flex items-center gap-2 shadow"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <i className="lni lni-rocket text-xs" /> Generate Note
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
