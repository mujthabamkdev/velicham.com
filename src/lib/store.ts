"use client";

import { create } from "zustand";
import type { AgentStore, AgentContext, ChatMessage } from "@/lib/types";

export const useAgentStore = create<AgentStore>((set) => ({
  context: { type: "HOME" },
  isOpen: false,
  messages: [],

  setContext: (ctx: AgentContext) => set({ context: ctx }),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  addMessage: (msg: ChatMessage) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  clearMessages: () => set({ messages: [] }),
}));
