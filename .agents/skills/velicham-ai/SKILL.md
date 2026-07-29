---
name: velicham-ai
description: >
  AI integration skill for Velicham.com. Handles OpenRouter, Gemini, prompt engineering, 
  video transcript processing, JSON generation, AI routing, and the OpenRouter 
  free models pool logic. Trigger for any AI, LLM, prompt, model, or generation tasks.
---

# Velicham AI Skill

## AI Integration Architecture

Velicham heavily relies on AI to process YouTube transcripts into structured knowledge notes. All AI logic is centralized in `src/lib/ai/gemini.ts`.

### Model Hierarchy
1. **Primary Fallback (OpenRouter Free Pool)**: Uses a rotating pool of free models on OpenRouter (e.g., Gemini 2.0 Flash, Llama 3, DeepSeek-R1). Managed by `getFreeOpenRouterModels()` in `src/lib/ai/openrouter-models.ts`.
2. **Direct Gemini**: Used if `GEMINI_API_KEY` is provided.

### Key Functions (`src/lib/ai/gemini.ts`)

1. **`generateNoteFromTranscript(transcript, title, prompt, jobId, customApiKey)`**
   - **Purpose**: Ingests transcripts and generates a comprehensive Markdown note with metadata.
   - **Behavior**: For long videos (>18k chars / ~15m), it chunks the transcript and processes it in batches, then synthesizes a master document.
   - **Output Format**: Strictly typed JSON matching `GeneratedNoteSchema`.

2. **`generateLinks(content, existingSlugs)`**
   - **Purpose**: Creates Obsidian-style bi-directional links (`[[Concept]]`) by matching text against existing notes/topics.

3. **`moderateComment(commentText)`**
   - **Purpose**: Moderates user comments (APPROVED | FLAGGED) and optionally generates an AI reply.

4. **`streamChat(message, systemContext)`**
   - **Purpose**: Powers the floating AI Assistant on the site.

## API Keys & Access Control

- **Admin Ingestion**: Admins use the system's `OPENROUTER_API_KEY` (from `.env`).
- **User Ingestion**: Regular users **MUST** provide their own OpenRouter API key in their Profile. This key is stored encrypted (AES-256-GCM) in the database (`openRouterApiKey`).
- When a regular user triggers an ingestion, their decrypted key is passed to the AI functions.

## JSON Parsing Resilience

LLMs often return malformed JSON (especially free models). `gemini.ts` contains a robust `cleanAndParseJSON` function that handles:
- Removing Markdown code blocks (````json ... ````).
- Extracting objects from surrounding text.
- Auto-repairing unterminated strings or unclosed braces.
- Falling back to regex extraction if parsing completely fails.
Do not modify this parser unless it is failing on a specific edge case.

## System Prompts & Malayalam Support

The prompt explicitly tells the AI to generate content in **Malayalam (മലയാളം)** if the transcript or video title contains Malayalam characters. Keep this logic intact when modifying prompts.
