"use client";

import React, { useState, useEffect } from "react";
import { CHARACTER_AVATARS, CharacterAvatar } from "@/lib/avatars";

interface AvatarPickerModalProps {
  isOpen: boolean;
  currentAvatar?: string | null;
  onClose: () => void;
  onSelectAvatar: (avatarUrl: string) => Promise<void>;
}

export default function AvatarPickerModal({
  isOpen,
  currentAvatar,
  onClose,
  onSelectAvatar,
}: AvatarPickerModalProps) {
  const [selectedUrl, setSelectedUrl] = useState<string>(
    currentAvatar || CHARACTER_AVATARS[0].url
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedUrl(currentAvatar || CHARACTER_AVATARS[0].url);
      setError("");
    }
  }, [isOpen, currentAvatar]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await onSelectAvatar(selectedUrl);
      onClose();
    } catch (e: any) {
      console.error("Failed to set avatar:", e);
      setError(e?.message || "Failed to save profile photo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#18181b] border border-[#27272a] p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="lni lni-user text-lg" /> Choose Your Character Avatar
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Select one of the 20 character avatars for your profile picture.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full text-sm"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <i className="lni lni-warning text-sm" /> {error}
          </div>
        )}

        {/* 20 Character Avatars Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 py-2">
          {CHARACTER_AVATARS.map((avatar: CharacterAvatar) => {
            const isSelected = selectedUrl === avatar.url;
            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setSelectedUrl(avatar.url)}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-white/10 border-white ring-2 ring-white scale-105"
                    : "bg-[#0f0f11] border-[#27272a] hover:border-gray-500 hover:bg-white/5"
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-black border border-white/20 overflow-hidden flex items-center justify-center shadow-md">
                  <img
                    src={avatar.url}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[11px] font-mono font-medium text-gray-300 truncate w-full text-center">
                  {avatar.name}
                </span>

                {isSelected && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-black font-bold rounded-full text-[10px] flex items-center justify-center">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#27272a]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-bold transition shadow hover:bg-gray-200 disabled:opacity-50"
          >
            {saving ? "Updating..." : "Set Profile Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
