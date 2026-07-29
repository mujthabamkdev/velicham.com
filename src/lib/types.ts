import { z } from "zod";

// ============================================
// AI Output Schemas (Zod)
// ============================================

/** Schema for a single timestamped bullet point in a generated note */
export const TimestampedPointSchema = z.object({
  timestamp: z.string().describe("HH:MM:SS or MM:SS format"),
  text: z.string().describe("The summarized point"),
});

/** Schema for the full AI-generated note output */
export const GeneratedNoteSchema = z.object({
  title: z.string().optional().default("Generated Knowledge Note"),
  summary: z.string().optional().default("Summary of the knowledge note."),
  content: z.string().optional().default("Content of the note."),
  timestamps: z.array(TimestampedPointSchema).optional().default([]),
  suggestedTopic: z.string().optional().default("General Knowledge"),
});

/** Schema for AI link generation output */
export const GeneratedLinksSchema = z.object({
  content: z.string().describe("Markdown with [[slug]] links injected"),
  linkedSlugs: z.array(z.string()).describe("List of slugs that were linked"),
});

/** Schema for AI comment moderation output */
export const CommentModerationSchema = z.object({
  status: z.enum(["APPROVED", "FLAGGED"]),
  aiReply: z.string().nullable().describe("AI reply if needed, null otherwise"),
  reason: z.string().optional().describe("Reason for flagging if flagged"),
});

/** Schema for chat API request payload */
export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.object({
    type: z.enum(["HOME", "CHANNEL", "TOPIC", "NOTE"]),
    id: z.string().optional(),
  }),
});

/** Schema for YouTube ingestion request */
export const IngestionRequestSchema = z.object({
  youtubeUrl: z.string().url(),
  topicId: z.string().optional(),
  channelId: z.string().optional(),
});

// ============================================
// TypeScript Types (inferred from Zod)
// ============================================

export type TimestampedPoint = z.infer<typeof TimestampedPointSchema>;
export type GeneratedNote = z.infer<typeof GeneratedNoteSchema>;
export type GeneratedLinks = z.infer<typeof GeneratedLinksSchema>;
export type CommentModeration = z.infer<typeof CommentModerationSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type IngestionRequest = z.infer<typeof IngestionRequestSchema>;

// ============================================
// Graph Visualization Types
// ============================================

export interface GraphNode {
  id: string;
  label: string;
  type: "note" | "topic" | "channel";
  slug?: string;
  color?: string;
  size?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ============================================
// Galaxy Visualization Types
// ============================================

export interface GalaxyStar {
  id: string;
  label: string;
  slug: string;
  position: [number, number, number];
  color: string;
  size: number;
  topicId: string;
}

export interface GalaxyNebula {
  id: string;
  label: string;
  color: string;
  center: [number, number, number];
  stars: GalaxyStar[];
}

// ============================================
// Context Store Types
// ============================================

export interface AgentContext {
  type: "HOME" | "CHANNEL" | "TOPIC" | "NOTE";
  id?: string;
  title?: string;
}

export interface AgentStore {
  context: AgentContext;
  isOpen: boolean;
  messages: ChatMessage[];
  favorites: string[];
  savedNotes: string[];
  galaxyMode: "minimal" | "popular" | "favorites";
  setContext: (ctx: AgentContext) => void;
  toggleOpen: () => void;
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
  toggleFavorite: (noteId: string) => void;
  toggleSaveNote: (noteId: string) => void;
  setGalaxyMode: (mode: "minimal" | "popular" | "favorites") => void;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
