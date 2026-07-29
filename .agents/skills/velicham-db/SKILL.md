---
name: velicham-db
description: >
  Database skill for Velicham.com. Handles Prisma ORM (SQLite), schema changes, 
  database migrations, querying, user roles, types casting, and models 
  (User, Note, Channel, Topic, Follow, NoteRelation, Comment). Trigger for 
  any database, ORM, data fetching, or schema related tasks.
---

# Velicham Database Skill (Prisma & SQLite)

## Database Setup

Velicham uses **Prisma** with a **SQLite** database (`prisma/dev.db`).

- Schema Location: `prisma/schema.prisma`
- Database Client: `src/lib/db.ts`
- Usage:
  ```typescript
  import db from "@/lib/db";
  // or
  import { db } from "@/lib/db";
  ```

## CRITICAL Rule: Type Casting (`any`)

Because Prisma types sometimes lag behind schema updates in Next.js 16 development mode, you **MUST** frequently cast models to `any` when accessing newly added fields, to prevent TypeScript compilation errors.

Example:
```typescript
// If openRouterApiKey is recently added
const user = await (db.user as any).findUnique({
  where: { id: userId }
});
const key = user?.openRouterApiKey;
```

## Schema Modification Workflow

Whenever you change `prisma/schema.prisma`:
1. Run `npx prisma generate` to update the Prisma Client types.
2. Run `npx prisma db push` to push the schema to `dev.db` (do not use migrations for local dev unless explicitly asked).
3. If there are type errors, cast the `db.ModelName` to `(db.ModelName as any)`.

## Data Models Overview

1. **User**: Represents platform users. Has `role` (USER | ADMIN), custom `openRouterApiKey` (encrypted), `password` (hashed).
2. **Channel**: YouTube channels whose videos were ingested.
3. **Topic**: Subjects/Categories for Notes.
4. **Note**: The core knowledge entity generated from a YouTube video transcript.
5. **NoteRelation**: Bi-directional links between Notes (simulating an Obsidian-like brain graph).
6. **Follow**: Follow mapping between Users.
7. **Comment**: User comments on notes with AI moderation.

## Common Queries

### Fetching Notes for Feed
```typescript
const notes = await db.note.findMany({
  orderBy: { createdAt: "desc" },
  take: 20,
  include: {
    topic: true,
    author: true, // The Channel
    userCreator: true, // The User who created it
    comments: true,
  },
});
```

### Checking User Session
Sessions are managed via HTTP-only JWT cookies, NOT NextAuth.
```typescript
import { getSessionUser } from "@/lib/auth";

const session = await getSessionUser();
if (!session) {
  // Not authenticated
}
if (session.role === "ADMIN") {
  // Is Admin
}
```

## Security & Passwords
- Passwords are hashed using `bcryptjs` (`hashPassword`, `verifyPassword` in `src/lib/auth.ts`).
- `openRouterApiKey` is encrypted at rest using AES-256-GCM (`src/lib/encryption.ts`).
