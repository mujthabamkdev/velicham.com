"use client";

import { create } from "zustand";
import type { AgentStore, AgentContext, ChatMessage } from "@/lib/types";

export const useAgentStore = create<AgentStore>((set) => ({
  context: { type: "HOME" },
  isOpen: false,
  messages: [],
  favorites: [],
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

  setGalaxyMode: (mode: "minimal" | "popular" | "favorites") =>
    set({ galaxyMode: mode }),
}));
