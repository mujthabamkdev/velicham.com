"use client";

import { useState } from "react";
import { ingestYouTubeVideoFormAction } from "@/app/admin/actions";
import { ComposerSubmitButton } from "./ComposerSubmitButton";

export default function FeedComposer() {
  const [inputUrl, setInputUrl] = useState("");

  return (
    <form action={ingestYouTubeVideoFormAction} className="p-6 glass-card flex items-start gap-4 space-y-0 w-full">
      <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center font-bold shadow-md text-sm shrink-0" style={{ color: "black" }}>
        V
      </div>

      <div className="flex-1 space-y-3.5 min-w-0">
        <input
          name="youtubeUrl"
          type="text"
          placeholder="Paste YouTube URL or Playlist here..."
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          className="w-full glass-input rounded-xl px-4 py-3 text-white text-sm placeholder-gray-400 focus:outline-none focus:border-white transition-all"
          required
        />

        <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
          {/* Action icons */}
          <div className="flex items-center gap-2 text-gray-300">
            <button type="button" className="p-2 rounded-lg hover:bg-white/10 hover:text-white transition-colors" title="Add Video Link">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="17" x2="22" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
              </svg>
            </button>
            <button type="button" className="p-2 rounded-lg hover:bg-white/10 hover:text-white transition-colors" title="Graph Concept">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            </button>
            <button type="button" className="p-2 rounded-lg hover:bg-white/10 hover:text-white transition-colors" title="AI Polish">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          </div>

          {/* Submit Action */}
          <ComposerSubmitButton />
        </div>
      </div>
    </form>
  );
}
