/**
 * OpenRouter Dynamic Free Models Auto-Fetcher & Scheduler
 * Automatically checks OpenRouter models endpoint once per day
 * and returns currently active free tier models.
 */

const DEFAULT_FREE_MODELS = [
  "google/gemini-2.0-flash-lite-preview-02-05:free",
  "google/gemini-2.0-pro-exp-02-05:free",
  "google/gemini-2.0-flash-thinking-exp:free",
  "deepseek/deepseek-r1:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen-2.5-coder-32b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-2-9b-it:free"
];

interface ModelCache {
  models: string[];
  lastFetched: number;
}

let cachedModels: ModelCache | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours

export async function getFreeOpenRouterModels(): Promise<string[]> {
  const now = Date.now();

  // Return cached models if still valid (< 24 hours old)
  if (cachedModels && now - cachedModels.lastFetched < CACHE_TTL_MS) {
    return cachedModels.models;
  }

  try {
    console.log("[OPENROUTER SCHEDULER] Fetching dynamic free models list from OpenRouter API...");
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 86400 } // Cache for 1 day in Next.js fetch cache
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.data)) {
        const freeModelIds: string[] = data.data
          .filter((m: any) => {
            const isFreeId = typeof m.id === "string" && m.id.endsWith(":free");
            const isZeroPrompt = m.pricing?.prompt === "0" || m.pricing?.prompt === 0;
            return isFreeId || isZeroPrompt;
          })
          .map((m: any) => m.id);

        if (freeModelIds.length > 0) {
          console.log(`[OPENROUTER SCHEDULER] Successfully loaded ${freeModelIds.length} dynamic free models.`);
          cachedModels = {
            models: freeModelIds,
            lastFetched: now
          };
          return freeModelIds;
        }
      }
    }
  } catch (err) {
    console.warn("[OPENROUTER SCHEDULER] Failed to fetch dynamic models from OpenRouter, using fallback pool:", err);
  }

  // Fallback if fetch failed
  cachedModels = {
    models: DEFAULT_FREE_MODELS,
    lastFetched: now
  };

  return DEFAULT_FREE_MODELS;
}
