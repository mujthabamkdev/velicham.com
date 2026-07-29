"use client";

import { create } from "zustand";
import type { AgentStore, AgentContext, ChatMessage } from "@/lib/types";

const getInitialSavedNotes = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("velicham_saved_notes");
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const useAgentStore = create<AgentStore>((set) => ({
  context: { type: "HOME" },
  isOpen: false,
  messages: [],
  favorites: [],
  savedNotes: getInitialSavedNotes(),
  galaxyMode: "minimal",

  setContext: (ctx: AgentContext) => set({ context: ctx }),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  addMessage: (msg: ChatMessage) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  clearMessages: () => set({ messages: [] }),

  toggleFavorite: (noteId: string) =>
    set((state) => ({
      favorites: state.favorites.includes(noteId)
        ? state.favorites.filter((id) => id !== noteId)
        : [...state.favorites, noteId],
    })),

  toggleSaveNote: (noteId: string) =>
    set((state) => {
      const isSaved = state.savedNotes.includes(noteId);
      const nextSaved = isSaved
        ? state.savedNotes.filter((id) => id !== noteId)
        : [...state.savedNotes, noteId];

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("velicham_saved_notes", JSON.stringify(nextSaved));
        } catch (e) {}
      }

      return { savedNotes: nextSaved };
    }),

  setGalaxyMode: (mode: "minimal" | "popular" | "favorites") =>
    set({ galaxyMode: mode }),
}));
