"use client";

import React, { useState, useEffect } from "react";
import { formatDateShort } from "@/lib/utils";

interface CommentItem {
  id: string;
  content: string;
  status: string;
  aiReply?: string | null;
  createdAt: string | Date;
  userId?: string | null;
  user?: {
    id: string;
    name?: string | null;
    email: string;
    avatar?: string | null;
    role?: string;
  } | null;
}

interface CommentSectionProps {
  noteId: string;
  initialComments: CommentItem[];
}

export default function CommentSection({ noteId, initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (!currentUser) {
      setError("Please sign in to post comments.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId,
          content: content.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to post comment");
        return;
      }

      setComments((prev) => [data.comment, ...prev]);
      setContent("");
    } catch (err: any) {
      setError("Network error. Could not post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete comment");
      }
    } catch (err) {
      alert("Failed to delete comment");
    }
  };

  return (
    <div id="comments" className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <i className="lni lni-comments-alt text-base" /> Discussion & Community ({comments.length})
        </h3>
        <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
          <i className="lni lni-sparkles text-xs" /> AI Moderated Stream
        </span>
      </div>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-[#0f0f11] border border-[#27272a] space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="You" className="w-full h-full object-cover" />
            ) : currentUser?.name ? (
              currentUser.name.charAt(0).toUpperCase()
            ) : (
              <i className="lni lni-user text-xs" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <textarea
              rows={3}
              placeholder={
                currentUser
                  ? "Share your thoughts or ask a question about this knowledge note..."
                  : "Please sign in to join the discussion..."
              }
              disabled={!currentUser || submitting}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent text-white text-xs placeholder-gray-500 focus:outline-none resize-none leading-relaxed"
            />

            {error && (
              <div className="text-red-400 text-xs flex items-center gap-1.5 pt-1">
                <i className="lni lni-warning text-xs" /> {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-[#27272a]">
              <span className="text-[11px] text-gray-500 font-mono">
                {currentUser ? `Posting as ${currentUser.name || currentUser.email}` : "Guest visitor"}
              </span>
              <button
                type="submit"
                disabled={!currentUser || submitting || !content.trim()}
                className="px-5 py-2 rounded-xl bg-white hover:bg-gray-200 text-black text-xs font-bold transition disabled:opacity-40 shadow flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <i className="lni lni-rocket text-xs" /> Post Comment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400 space-y-1">
          <p className="font-semibold text-gray-300">No comments posted yet.</p>
          <p>Be the first to share insights or ask questions about this note!</p>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          {comments.map((c) => {
            const commenterName = c.user?.name || c.user?.email.split("@")[0] || "Community Explorer";
            const isOwner = currentUser && (c.userId === currentUser.id || currentUser.role === "ADMIN");

            return (
              <div
                key={c.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#0f0f11] border border-[#27272a] space-y-3 relative group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                      {c.user?.avatar ? (
                        <img src={c.user.avatar} alt={commenterName} className="w-full h-full object-cover" />
                      ) : (
                        commenterName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{commenterName}</span>
                        {c.user?.role === "ADMIN" && (
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white font-mono text-[9px] uppercase font-bold border border-white/20">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-gray-500">
                        {formatDateShort(new Date(c.createdAt))}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <i className="lni lni-checkmark text-[10px]" /> AI Verified
                    </span>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/10 transition text-xs"
                        title="Delete comment"
                      >
                        <i className="lni lni-trash-can text-xs" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-gray-200 text-xs leading-relaxed pl-1">{c.content}</p>

                {/* AI Reply Block */}
                {c.aiReply && (
                  <div className="mt-3 p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <i className="lni lni-sparkles text-xs" /> Velicham AI Assistant
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">{c.aiReply}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
