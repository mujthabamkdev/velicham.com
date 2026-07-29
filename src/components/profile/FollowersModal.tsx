"use client";

import React from "react";

interface FollowerUser {
  id: string;
  name?: string | null;
  email: string;
  avatar?: string | null;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  followers: FollowerUser[];
  count: number;
}

export default function FollowersModal({
  isOpen,
  onClose,
  followers,
  count,
}: FollowersModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#18181b] border border-[#27272a] p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5 text-left max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="lni lni-heart text-lg text-red-500" /> Your Followers ({count})
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Users following your account to get updates on your generated knowledge notes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Followers List */}
        {followers.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 space-y-1">
            <p className="font-semibold text-gray-300">No followers yet.</p>
            <p>Share your generated knowledge notes to gain followers!</p>
          </div>
        ) : (
          <div className="space-y-3 py-1">
            {followers.map((f) => {
              const displayName = f.name || f.email.split("@")[0];
              const handle = `@${displayName.toLowerCase().replace(/\s+/g, "")}`;

              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#0f0f11] border border-[#27272a] hover:border-gray-500 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-white text-black font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                      {f.avatar ? (
                        <img src={f.avatar} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{displayName}</h4>
                      <p className="text-[11px] font-mono text-gray-400 truncate">{handle}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-white/10 text-white font-mono text-[10px] uppercase font-bold border border-white/20">
                    Follower
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end pt-3 border-t border-[#27272a]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white text-black text-xs font-bold transition hover:bg-gray-200 shadow"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
