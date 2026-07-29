<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Velicham.com — Agent Development Rules

## Project Identity
Velicham is an AI-powered knowledge platform built with **Next.js 16.2.12 (App Router + Turbopack)**, **Prisma (SQLite)**, **TailwindCSS 4**, and **TypeScript 5**. It ingests YouTube videos, generates structured AI notes via OpenRouter/Gemini, and presents them in a social-media-style feed with an Obsidian-like brain graph.

## Mandatory Rules for All Agents

### 1. Design System — Black & White Monochrome ONLY
- **NEVER** use purple, indigo, cyan, pink, or any colored accent.
- Primary accent: `#ffffff` (white). Secondary: `#a3a3a3` (gray).
- Buttons: `bg-white text-black` (primary), `bg-white/10 text-white` (secondary).
- Focus borders: `focus:border-white`. Hover borders: `hover:border-white/30`.
- Background: `#000000` (void), cards: `bg-[#18181b]`, inputs: `bg-[#0f0f11]`.
- Refer to `src/app/globals.css` `@theme` block for all design tokens.

### 2. Icon System — Lineicons 4.0 ONLY
- **NEVER** use emojis (✨, 🔑, ⚡, etc.) or inline SVGs in UI components.
- Always use `<i className="lni lni-{icon-name}" />` from [Lineicons 4.0](https://lineicons.com/icons/).
- CDN is loaded in `globals.css` and `layout.tsx`. No npm package needed.
- Common icons: `lni-search-alt`, `lni-sparkles`, `lni-bolt`, `lni-key`, `lni-heart`, `lni-bookmark`, `lni-trash-can`, `lni-pencil`, `lni-folder`, `lni-close`, `lni-warning`, `lni-arrow-left`, `lni-exit`, `lni-rocket`, `lni-network`, `lni-share-alt`, `lni-comments-alt`, `lni-reload`, `lni-lock`, `lni-book`, `lni-checkmark`.

### 3. Prisma — Type Casting Required
- Prisma Client types may lag behind schema changes. Always cast `db.user` as `(db.user as any)` for fields like `openRouterApiKey` that may not be in the generated types.
- After schema changes: always run `npx prisma generate` then `npx prisma db push`.
- Database: SQLite at `prisma/dev.db`. Import via `import { db } from "@/lib/db"` or `import db from "@/lib/db"`.

### 4. Authentication Pattern
- Custom JWT auth via `jose` + HTTP-only cookies. **NOT** NextAuth.
- Session cookie name: `velicham_session`. Duration: 7 days.
- Server-side: `import { getSessionUser } from "@/lib/auth"`. Returns `UserSession | null`.
- Password hashing: `bcryptjs`. JWT secret: `process.env.JWT_SECRET`.
- Default admin: `admin@velicham.com` / `admin123`.
- Roles: `ADMIN` and `USER` (Prisma enum).

### 5. API Route Pattern
- All API routes use Next.js App Router conventions: `src/app/api/{resource}/route.ts`.
- Export `GET`, `POST`, `DELETE` etc. as async functions.
- Always check session first: `const session = await getSessionUser(); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });`
- Admin-only routes should additionally check `session.role === "ADMIN"`.

### 6. Component Architecture
- Server Components by default (pages in `src/app/`).
- Client Components: add `"use client"` directive. Used for interactive UI.
- `Header` is rendered ONCE in `layout.tsx`. **NEVER** render `<Header />` inside page components.
- State management: Zustand store at `src/lib/store.ts`.

### 7. AI Integration
- Primary AI: OpenRouter free models pool (auto-rotated, cached 24h).
- Fallback: Direct Gemini API if `GEMINI_API_KEY` is set.
- User-generated notes require user's own OpenRouter API key (stored encrypted in DB).
- Admin-generated notes can use system API key.
- AI module: `src/lib/ai/gemini.ts`. Functions: `generateNoteFromTranscript`, `generateLinks`, `moderateComment`, `streamChat`.
- Encryption: `src/lib/encryption.ts` (AES-256-GCM).

### 8. Build & Verification
- Always verify changes: `npx tsc --noEmit` then `npm run build`.
- Dev server: `npm run dev` (Turbopack).
- No build warnings should be introduced.

### 9. File Path Alias
- `@/*` maps to `./src/*`. Always use `@/lib/...`, `@/components/...`, etc.
