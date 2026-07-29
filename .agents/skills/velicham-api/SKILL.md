---
name: velicham-api
description: >
  API & Architecture skill for Velicham.com. Handles Next.js 16 App Router conventions, 
  Server Actions, API routes, background jobs, YouTube ingestion, and global state 
  (Zustand). Trigger for backend logic, routing, data fetching, or background task tasks.
---

# Velicham API & Architecture Skill

## Next.js 16 App Router Architecture

Velicham uses the **App Router** (`src/app`).

- **Pages (`page.tsx`)**: Server Components by default. Data is fetched directly via Prisma in the component (e.g., `const notes = await db.note.findMany()`).
- **Client Components**: Any interactive UI component (Modals, Buttons, Zustand store) must have `"use client"` at the top.
- **API Routes (`route.ts`)**: Located in `src/app/api/...`. Used for client-to-server communication when Server Actions are not suitable.

## State Management (Zustand)

Global state is managed via Zustand in `src/lib/store.ts`.
- Manages AI Chat context (`context`, `messages`, `isOpen`).
- Manages UI preferences (`galaxyMode`, `favorites`).
- **Rule**: Only use Zustand for genuinely global UI state. Form state or modal toggles should usually be local `useState`.

## API Routes & Security

All API routes must verify the user session. We use custom JWT cookies, **not** NextAuth.

```typescript
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // For Admin-only routes:
  // if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // ... business logic
}
```

## YouTube Ingestion System

The core feature of Velicham is turning YouTube videos into notes. This logic lives in `src/app/admin/actions.ts` (Server Actions).

### Workflow:
1. Extract Video ID.
2. Fetch Metadata (`fetchVideoMetadata`).
3. Fetch Transcript (`fetchTranscript`).
4. Generate AI Note (`generateNoteFromTranscript`).
5. Generate Links (`generateLinks`).
6. Save to Prisma DB.

### Background Jobs System
Because transcription and generation can take several minutes (especially for playlists or long videos), Velicham uses a simple in-memory job tracker (`src/lib/jobs.ts`).

- `createJob(url, count)`: Creates a job.
- `addJobLog(id, text)`: Appends to the job's log.
- `updateJobProgress(id, count)`: Updates progress.
- `failJob(id, err)`: Marks job as failed.

API routes that trigger ingestion return the `jobId` immediately, and the client polls the job status to show a progress UI (e.g., `MiniDashboard.tsx`).
