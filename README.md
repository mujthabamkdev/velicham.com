# 🌌 VELICHAM - Illuminate Your Knowledge

Velicham (Malayalam for "Light/Illumination") is an AI-powered, connected knowledge platform. It automatically ingests YouTube videos (lectures, talks, tutorials), transcribes them, and uses LLMs to generate deeply structured, beautifully formatted markdown notes. 

The platform then interlinks these concepts into an Obsidian-style knowledge graph, presented in a cosmic, modern social-feed UI.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- SQLite (comes pre-configured)

### 2. Environment Variables
Create a `.env` file in the root with the following variables:
```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication & Security
JWT_SECRET="your-secure-jwt-secret-key-min-32-chars"
ENCRYPTION_SECRET="your-encryption-key-for-aes-256-gcm-32-bytes"

# AI APIs
GEMINI_API_KEY="your-gemini-key" # Optional fallback
OPENROUTER_API_KEY="your-openrouter-key" # Required for Admin background ingestion
```

### 3. Installation
```bash
npm install
```

### 4. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 5. Run Development Server
```bash
npm run dev
```
Access the application at [http://localhost:3000](http://localhost:3000).

---

## 🤖 Agentic Development Guide

This project is highly optimized for **AI Agent Development**. We have established strict guidelines and dedicated "Skills" to help agents quickly context-switch and write perfectly compliant code.

### Global Agent Rules
Please refer to [**`.agents/AGENTS.md`**](./.agents/AGENTS.md) for the mandatory development rules, covering Design System, Authentication, and Type Casting.

### Agent Skills
Agents operating in this repository will automatically discover the following skills located in the `.agents/skills/` directory:

1. **`velicham-styling`**: Guidelines for the strict black & white monochrome UI, Glassmorphism, Tailwind 4 tokens, and Lineicons 4.0 usage.
2. **`velicham-db`**: Instructions for Prisma ORM, type casting, schema changes, and data modeling.
3. **`velicham-ai`**: Deep dive into the OpenRouter model pool, Gemini integrations, AI prompt engineering, and JSON generation resilience.
4. **`velicham-api`**: Architectural overview of Next.js 16 App Router, Background Jobs, and Zustand global state.

If you are an AI Agent, **always check these skills** before making major structural or visual changes.

---

## 🏗️ Architecture Stack

- **Framework**: Next.js 16.2 (App Router + Turbopack)
- **Database**: Prisma ORM with SQLite
- **Styling**: Tailwind CSS v4 (Monochrome Theme)
- **Icons**: Lineicons 4.0 (CDN)
- **State Management**: Zustand (Client-side)
- **AI Processing**: OpenRouter (Dynamic Free Tier Models) & Gemini
- **Authentication**: Custom JWT (via `jose`) with HTTP-only Cookies
- **Security**: AES-256-GCM Encryption for user API keys at rest

## 🔑 Key Features

- **Automated YouTube Ingestion**: Paste a YouTube link; the server fetches metadata, downloads the transcript, and generates comprehensive notes.
- **Bi-Directional Graph Linking**: Mentions of concepts are automatically linked to their respective notes, creating a living "Brain".
- **Cosmic UI**: A hyper-modern, minimalist black and white interface with glassmorphism effects.
- **Malayalam Language Support**: Automatic detection and native generation of content in Malayalam (മലയാളം) if the source video is in Malayalam.
- **BYOK (Bring Your Own Key)**: Users can supply their own OpenRouter keys (securely encrypted) to bypass system rate limits.
