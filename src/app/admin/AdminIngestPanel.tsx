"use client";

import { useState, useEffect, useRef } from "react";
import { ingestYouTubeVideoFormAction } from "./actions";
import { useFormStatus } from "react-dom";

function IngestSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto px-6 py-3 rounded-full bg-white font-bold text-xs hover:bg-gray-200 transition shadow disabled:opacity-50 flex items-center justify-center gap-2"
      style={{ color: "black" }}
    >
      {pending ? (
        <>
          <span className="animate-spin text-sm">⚡</span>
          <span>Initiating AI Ingestion...</span>
        </>
      ) : (
        <>
          <span>✨</span>
          <span>Generate Notes</span>
        </>
      )}
    </button>
  );
}

export default function AdminIngestPanel({
  topics = [],
  channels = [],
}: {
  topics: any[];
  channels: any[];
}) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [dismissedJobIds, setDismissedJobIds] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("velicham_dismissed_jobs");
      if (saved) {
        setDismissedJobIds(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const handleDismissJob = (id: string) => {
    setDismissedJobIds((prev) => {
      const next = Array.from(new Set([...prev, id]));
      try {
        localStorage.setItem("velicham_dismissed_jobs", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/admin/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const hasActiveJob = jobs.some(
    (j) => j.status === "PROCESSING" && !dismissedJobIds.includes(j.id)
  );

  useEffect(() => {
    if (!hasActiveJob) return;

    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [hasActiveJob]);

  const visibleJobs = jobs.filter((j) => !dismissedJobIds.includes(j.id));
  const activeJob = visibleJobs.find((j) => j.status === "PROCESSING");
  const completedJobs = visibleJobs.filter((j) => j.status === "COMPLETED");
  const failedJobs = visibleJobs.filter((j) => j.status === "FAILED");

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeJob?.logs?.length]);

  const DEFAULT_NOTE_TEMPLATE = `Produce a comprehensive, highly detailed note without omitting important content, arguments, or technical details from the transcript.

Required Structure:
- ## 📌 Executive Summary: A complete overview of the video's core theme and goals.
- ## 💡 Core Concepts & In-Depth Breakdown: Exhaustive breakdown of every key idea, argument, concept, or technical takeaway. Use bold terms, sub-bullet points, and clear explanations.
- ## ⏱️ Detailed Timestamped Timeline: Comprehensive chronological outline matching timestamps [MM:SS] to specific topics and demonstrations.
- ## 🎯 Key Takeaways & Conclusions: Practical summary and actionable conclusions.`;

  const [customPrompt, setCustomPrompt] = useState(DEFAULT_NOTE_TEMPLATE);

  return (
    <div className="space-y-6">
      {/* Notifications / Job Tracker Banner */}
      {visibleJobs.length > 0 && (
        <div className="space-y-3">
          {activeJob && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 space-y-3 relative">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl animate-spin shrink-0">⏳</span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white">
                      Request Being Processed
                    </div>
                    <div className="text-xs text-blue-200 truncate">{activeJob.message}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-xs font-mono font-bold bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
                    {activeJob.processedCount} / {activeJob.totalCount} Done
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDismissJob(activeJob.id)}
                    className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition"
                    title="Dismiss notification"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Auto-Scrolling Reasoning / AI Processing Log */}
              {activeJob.logs && activeJob.logs.length > 0 && (
                <div className="p-3 rounded-xl bg-black/80 border border-cyan-500/30 font-mono text-[11px] space-y-1.5 max-h-44 overflow-y-auto shadow-inner">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between border-b border-cyan-500/20 pb-1">
                    <span>🧠 AI Live Reasoning & Batch Progress</span>
                    <span className="text-[9px] font-mono text-cyan-400/80 animate-pulse">● Live Stream</span>
                  </div>
                  {activeJob.logs.map((log: string, idx: number) => (
                    <div key={idx} className="text-cyan-200/90 leading-snug flex items-start gap-2">
                      <span className="text-cyan-400 select-none">❯</span>
                      <span>{log}</span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          )}

          {failedJobs.slice(0, 2).map((j) => (
            <div
              key={j.id}
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center justify-between gap-4 relative"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl shrink-0">⚠️</span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white">
                    Ingestion Failed
                  </div>
                  <div className="text-xs text-red-200 leading-normal">{j.message}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-red-400 bg-red-500/20 px-3 py-1 rounded-full border border-red-500/30">
                  Failed
                </span>
                <button
                  type="button"
                  onClick={() => handleDismissJob(j.id)}
                  className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition"
                  title="Dismiss notification"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {completedJobs.slice(0, 2).map((j) => (
            <div
              key={j.id}
              className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between gap-4 relative"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl shrink-0">🎉</span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white">
                    Ingestion Complete!
                  </div>
                  <div className="text-xs text-emerald-200 leading-normal">{j.message}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                  Done
                </span>
                <button
                  type="button"
                  onClick={() => handleDismissJob(j.id)}
                  className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition"
                  title="Dismiss notification"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ingest Knowledge Note Card */}
      <div className="p-6 glass-card rounded-2xl border border-white/10 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Ingest Knowledge Note</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Paste a YouTube video or playlist URL. AI will auto-detect topics & channels unless specified.
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
            OpenRouter AI Powered
          </span>
        </div>

        <form action={ingestYouTubeVideoFormAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-300 uppercase tracking-wider">
              YouTube URL or Playlist *
            </label>
            <input
              name="youtubeUrl"
              type="text"
              placeholder="https://www.youtube.com/watch?v=... or https://youtube.com/playlist?list=..."
              required
              className="w-full glass-input rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-white transition-all"
            />
          </div>

          {/* Note Style / Formatting Instruction Template */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Note Style & Formatting Template (AI Instruction)
              </label>
              <button
                type="button"
                onClick={() => setCustomPrompt(DEFAULT_NOTE_TEMPLATE)}
                className="text-[11px] text-cyan-400 hover:underline font-mono"
              >
                Reset Default Template
              </button>
            </div>
            <textarea
              name="customPrompt"
              rows={4}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter instructions for AI to format and structure the note..."
              className="w-full glass-input rounded-xl px-4 py-3 text-white text-xs font-mono placeholder-gray-500 focus:outline-none focus:border-white transition-all leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300 uppercase tracking-wider">
                Topic (Optional)
              </label>
              <select
                name="topicId"
                className="w-full glass-input rounded-xl px-4 py-3 text-white text-sm bg-[#0a0a16] focus:outline-none focus:border-white transition-all"
              >
                <option value="">-- Auto-detect Topic --</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300 uppercase tracking-wider">
                Channel (Optional)
              </label>
              <select
                name="channelId"
                className="w-full glass-input rounded-xl px-4 py-3 text-white text-sm bg-[#0a0a16] focus:outline-none focus:border-white transition-all"
              >
                <option value="">-- Auto-detect Channel --</option>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <IngestSubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
