import { GoogleGenAI, Type } from '@google/genai';
import {
  GeneratedNoteSchema,
  GeneratedLinksSchema,
  CommentModerationSchema,
  type GeneratedNote,
  type GeneratedLinks,
  type CommentModeration,
} from '@/lib/types';
import { addJobLog } from '@/lib/jobs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy-key-for-openrouter" });

function cleanAndParseJSON(rawStr: string): any {
  let cleaned = rawStr.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  // 1. Direct parse
  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    // 2. Extract inner brace contents
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(extracted);
      } catch (e2) {
        // Continue to auto-repair
      }
    }

    // 3. Auto-repair unterminated strings / unclosed JSON braces
    try {
      let repaired = cleaned;
      if (firstBrace !== -1) {
        repaired = repaired.slice(firstBrace);
      }

      let inString = false;
      let escaped = false;
      const stack: string[] = [];

      for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (char === '\\') {
          escaped = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
          continue;
        }
        if (!inString) {
          if (char === '{' || char === '[') stack.push(char);
          else if (char === '}') {
            if (stack[stack.length - 1] === '{') stack.pop();
          } else if (char === ']') {
            if (stack[stack.length - 1] === '[') stack.pop();
          }
        }
      }

      if (inString) {
        repaired += '"';
      }

      while (stack.length > 0) {
        const last = stack.pop();
        if (last === '{') repaired += '}';
        else if (last === '[') repaired += ']';
      }

      return JSON.parse(repaired);
    } catch (e3) {
      // 4. Guaranteed regex extraction fallback
      const titleMatch = cleaned.match(/"title"\s*:\s*"([^"]+)"/);
      const summaryMatch = cleaned.match(/"summary"\s*:\s*"([^"]+)"/);
      const topicMatch = cleaned.match(/"suggestedTopic"\s*:\s*"([^"]+)"/);

      return {
        title: titleMatch ? titleMatch[1] : "Generated Knowledge Note",
        summary: summaryMatch ? summaryMatch[1] : "Detailed note extracted from transcript.",
        content: cleaned,
        timestamps: [{ timestamp: "00:00", text: "Overview" }],
        suggestedTopic: topicMatch ? topicMatch[1] : "Knowledge"
      };
    }
  }
}

async function callOpenRouterAI(prompt: string): Promise<string> {
  // First try direct Gemini API if GEMINI_API_KEY is available
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (e) {
      console.warn("Direct Gemini API failed, falling back to OpenRouter free models...", e);
    }
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const models = [
    "google/gemini-2.0-flash-lite-preview-02-05:free",
    "google/gemini-2.0-pro-exp-02-05:free",
    "google/gemini-2.0-flash-thinking-exp:free",
    "deepseek/deepseek-r1:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen-2.5-coder-32b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "google/gemma-2-9b-it:free"
  ];

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Velicham Knowledge Platform"
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 4096,
            temperature: 0.3
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.choices && data.choices[0] && data.choices[0].message?.content) {
            return data.choices[0].message.content;
          }
        } else {
          const errText = await response.text().catch(() => "");
          console.warn(`OpenRouter model ${model} (attempt ${attempt + 1}) returned status ${response.status}: ${errText}`);
        }
      } catch (e: any) {
        console.warn(`OpenRouter model ${model} (attempt ${attempt + 1}) failed: ${e?.message || e}`);
      }
    }
  }
  throw new Error("All AI models (Direct Gemini & OpenRouter free pool) timed out or failed. Please check your network connection or API keys.");
}

function chunkText(text: string, chunkSize: number = 10000, overlap: number = 1000): string[] {
  if (text.length <= chunkSize) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + chunkSize;
    if (end < text.length) {
      const nextNewline = text.lastIndexOf('\n', end);
      if (nextNewline > start + overlap) {
        end = nextNewline;
      }
    }
    chunks.push(text.slice(start, end));
    start = end - overlap;
    if (start < 0) start = 0;
    if (start >= text.length) break; 
  }
  return chunks;
}

function isMalayalamContent(text: string): boolean {
  const malayalamRegex = /[\u0D00-\u0D7F]/;
  if (malayalamRegex.test(text)) return true;
  const transliteratedRegex = /\b(prabhashanam|namangal|saviseshatha|nabiyude|snehithan|sahaba|malayalam|pravachakan|keralam|islamic|matham)\b/i;
  return transliteratedRegex.test(text);
}

export async function generateNoteFromTranscript(
  transcript: string, 
  videoTitle?: string,
  customPrompt?: string,
  jobId?: string
): Promise<GeneratedNote> {
  const isMalayalam = isMalayalamContent(videoTitle || '') || isMalayalamContent(transcript);
  const languageDirective = isMalayalam
    ? `STRICT LANGUAGE RULE: The video content is in MALAYALAM (മലയാളം). You MUST generate ALL JSON fields (title, summary, content, headings, bullet points, timestamps text, suggestedTopic) in NATIVE MALAYALAM SCRIPT (മലയാളം). Do NOT output in English!`
    : `LANGUAGE RULE: Match the primary language of the video transcript.`;

  // For long videos (>18,000 transcript chars / >15 mins), process in chronological time-sliced batches
  if (transcript.length > 18000) {
    const numBatches = transcript.length > 60000 ? 4 : 3;
    const batchSize = Math.ceil(transcript.length / numBatches);
    const sectionSummaries: string[] = [];

    for (let i = 0; i < numBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(transcript.length, (i + 1) * batchSize);
      const chunkText = transcript.slice(start, end);

      const firstTs = chunkText.match(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/)?.[1] || `${i * 15}:00`;
      const lastTsMatch = [...chunkText.matchAll(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g)];
      const lastTs = lastTsMatch.length > 0 ? lastTsMatch[lastTsMatch.length - 1][1] : `${(i + 1) * 15}:00`;

      if (jobId) {
        addJobLog(jobId, `⏱️ Processing Time Batch ${i + 1}/${numBatches} [${firstTs} ➔ ${lastTs}]...`);
      }

      const batchPrompt = `
You are analyzing Batch ${i + 1} of ${numBatches} of a video transcript (${firstTs} to ${lastTs})${videoTitle ? ` for "${videoTitle}"` : ''}.

EXHAUSTIVE NO-COMPRESSION DIRECTIVE:
1. Do NOT summarize, condense, or omit ANY detail, argument, story, or explanation from this transcript segment [${firstTs} to ${lastTs}]!
2. Include ALL discussions in full detail formatted into structured bullet points, subheadings (###), Obsidian concept tags [[Concept]], and timestamps.

${languageDirective}

Transcript Segment (${firstTs} to ${lastTs}):
${chunkText}
      `;

      try {
        const batchNoteText = await callOpenRouterAI(batchPrompt);
        sectionSummaries.push(`### ⏱️ Video Timeline Section [${firstTs} - ${lastTs}]\n${batchNoteText}`);
      } catch (err) {
        console.warn(`Batch ${i + 1} AI call failed, using fallback segment text`, err);
        sectionSummaries.push(`### ⏱️ Video Timeline Section [${firstTs} - ${lastTs}]\n${chunkText.slice(0, 3000)}`);
      }
    }

    if (jobId) {
      addJobLog(jobId, `⚡ Synthesizing master knowledge document across all time sections (00:00 to End)...`);
    }

    const fullBatchText = sectionSummaries.join('\n\n');

    const synthesisPrompt = `
You are an expert AI knowledge note creator.
Combine the following section notes into ONE master, full-length, beautifully formatted knowledge document.

CRITICAL EXHAUSTIVE CONTENT RULES:
1. The note MUST cover the ENTIRE video timeline from start to finish (00:00 to the end). Do NOT omit any section!
2. Do NOT condense into brief summaries. Include ALL details, explanations, sub-concepts, and timestamp points from all time batches below.
3. Structure with:
${customPrompt || `- ## 📌 Executive Summary\n- ## 💡 Core Concepts & In-Depth Breakdown\n- ## ⏱️ Detailed Timestamped Timeline\n- ## 🎯 Key Takeaways & Conclusions`}

4. OBSIDIAN BRAIN TAGGING RULE: Tag core topics and key section concepts using Obsidian-style double brackets, e.g. [[Core Concept Name]] or [[Key Topic]].

${languageDirective}

CRITICAL: Return ONLY a raw valid JSON object with no markdown surrounding it:
{
  "title": "Title in native video language",
  "summary": "Brief summary in native video language under 500 characters",
  "content": "Exhaustive, full-length, multi-section markdown document in native video language covering all time sections from start to end",
  "timestamps": [
    {"timestamp": "00:00", "text": "Overview"}
  ],
  "suggestedTopic": "1-3 word classification"
}

Section Notes from All Time Batches:
${fullBatchText.slice(0, 45000)}
    `;

    const rawResp = await callOpenRouterAI(synthesisPrompt);
    const parsed = cleanAndParseJSON(rawResp);
    return GeneratedNoteSchema.parse(parsed);
  }

  // Single-pass processing for short transcripts (<18,000 chars)
  const prompt = `
Generate a comprehensive, highly detailed note from the transcript${videoTitle ? ` for "${videoTitle}"` : ''}.
  `;

  try {
    if (process.env.OPENROUTER_API_KEY || true) {
      const openRouterPrompt = `
You are an expert AI knowledge note creator.
Generate an EXHAUSTIVE, FULL-LENGTH, IN-DEPTH knowledge note from the following transcript${videoTitle ? ` for the video "${videoTitle}"` : ''}.

CRITICAL EXHAUSTIVE LENGTH & DETAIL RULES:
1. Do NOT produce a short, brief, or condensed 3-4 paragraph summary note!
2. Capture ALL core arguments, technical explanations, sub-concepts, quotes, and examples from beginning to end of the transcript.
3. Structure into clear, beautifully formatted sections with sub-headings (###), bold key terms (**term**), sub-bullet points, and timestamp references [MM:SS].
4. OBSIDIAN BRAIN TAGGING RULE: Tag core topics and key section concepts using Obsidian-style double brackets, e.g. [[Core Concept Name]] or [[Key Topic]].

FORMATTING & STRUCTURAL TEMPLATE:
${customPrompt || `Produce a comprehensive, highly detailed note structured into:
- ## 📌 Executive Summary
- ## 💡 Core Concepts & In-Depth Breakdown
- ## ⏱️ Detailed Timestamped Timeline & Key Moments
- ## 🎯 Key Takeaways & Practical Conclusions`}

LANGUAGE RULE:
If the transcript or video title is in Malayalam (or contains Malayalam text/spoken content), generate the entire title, summary, content, timestamps, and suggestedTopic in native Malayalam script. Otherwise, generate in English.

CRITICAL: Return ONLY a raw valid JSON object with no markdown surrounding it (do NOT wrap in \`\`\`json):
{
  "title": "A concise, accurate title",
  "summary": "A brief summary under 500 characters",
  "content": "Exhaustive, full-length, multi-section markdown document strictly adhering to the formatting template and exhaustiveness rules above",
  "timestamps": [
    {"timestamp": "00:00", "text": "Overview"}
  ],
  "suggestedTopic": "1-3 word classification"
}

Transcript:
${transcript}
      `;

      const rawResp = await callOpenRouterAI(openRouterPrompt);
      const parsed = cleanAndParseJSON(rawResp);
      return GeneratedNoteSchema.parse(parsed);
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("No AI API key found");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
          responseMimeType: 'application/json',
          responseSchema: {
              type: Type.OBJECT,
              properties: {
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING, description: 'max 500 chars' },
                  content: { type: Type.STRING, description: 'Full markdown content with timestamped bullet points' },
                  timestamps: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              timestamp: { type: Type.STRING },
                              text: { type: Type.STRING }
                          },
                          required: ['timestamp', 'text']
                      }
                  },
                  suggestedTopic: { type: Type.STRING, description: 'A concise 1-3 word topic classification' }
              },
              required: ['title', 'summary', 'content', 'timestamps', 'suggestedTopic']
          }
      }
    });

    const textResp = response.text || "";
    if (!textResp) throw new Error("Empty response from AI");
    
    const json = JSON.parse(textResp);
    return GeneratedNoteSchema.parse(json);
  } catch (error) {
    console.warn("AI note generation failed/skipped, using fallback parser:", error instanceof Error ? error.message : error);
    
    // Heuristic fallback
    const fallbackTitle = videoTitle || (transcript.slice(0, 60).replace(/\[\d{2}:\d{2}\]/g, '').trim() + "...");
    const fallbackSummary = transcript.slice(0, 450).replace(/\[\d{2}:\d{2}\]/g, '').trim() + "...";
    
    // Extract basic timestamp markers from transcript format [MM:SS]
    const timestampMatches = [...transcript.matchAll(/\[(\d{2}:\d{2}(?::\d{2})?)\]\s*([^[\n]+)/g)];
    const timestamps = timestampMatches.slice(0, 5).map(m => ({
      timestamp: m[1],
      text: m[2].trim()
    }));

    if (timestamps.length === 0) {
      timestamps.push({ timestamp: "00:00", text: "Overview & Introduction" });
    }

    return {
      title: fallbackTitle,
      summary: fallbackSummary,
      content: `## Summary\n${fallbackSummary}\n\n## Transcript Notes\n` + transcript.slice(0, 3000),
      timestamps,
      suggestedTopic: "General Knowledge"
    };
  }
}

export async function generateLinks(content: string, existingSlugs: string[]): Promise<GeneratedLinks> {
  const prompt = `
You are an expert at linking markdown content. 
Given the following markdown content, identify concepts that strongly match any of the provided existing slugs, and replace those concepts in the text with a markdown link in the format [[slug]].
Do not create links for any slugs that are NOT in the list.

Existing Slugs:
${existingSlugs.join(', ')}

Content:
${content}
  `;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
          responseMimeType: 'application/json',
          responseSchema: {
              type: Type.OBJECT,
              properties: {
                  content: { type: Type.STRING, description: 'Markdown with [[slug]] links injected' },
                  linkedSlugs: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                  }
              },
              required: ['content', 'linkedSlugs']
          }
      }
    });

    const textResp = response.text;
    if (!textResp) throw new Error("Empty response from AI");
    
    const parsed = GeneratedLinksSchema.parse(JSON.parse(textResp));
    
    // Post-validate to strip hallucinated links
    const validSlugs = new Set(existingSlugs);
    const regex = /\[\[(.*?)\]\]/g;
    const finalContent = parsed.content.replace(regex, (match, slug) => {
        if (validSlugs.has(slug)) {
            return match;
        }
        return slug;
    });
    
    const validatedLinkedSlugs = parsed.linkedSlugs.filter(slug => validSlugs.has(slug));

    return {
        content: finalContent,
        linkedSlugs: validatedLinkedSlugs
    };
  } catch (error) {
    return {
      content,
      linkedSlugs: []
    };
  }
}

export async function moderateComment(commentText: string): Promise<CommentModeration> {
  if (!process.env.GEMINI_API_KEY) {
    return { status: "APPROVED", aiReply: null, reason: "Approved by default" };
  }

  const prompt = `
Evaluate the following comment for toxicity, spam, and misinformation.
If it is completely safe and constructive, status is APPROVED.
If it contains spam, hate speech, severe toxicity, or blatant misinformation, status is FLAGGED.
If FLAGGED, optionally provide a brief reason and an aiReply addressing the issue mildly.

Comment:
"${commentText}"
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                status: { type: Type.STRING, enum: ["APPROVED", "FLAGGED"] },
                aiReply: { type: Type.STRING, nullable: true },
                reason: { type: Type.STRING }
            },
            required: ['status']
        }
    }
  });

  const textResp = response.text;
  if (!textResp) throw new Error("Empty response from AI");
  
  const json = JSON.parse(textResp);
  
  // Sometimes AI returns aiReply as undefined instead of null, let's normalize
  if (json.aiReply === undefined) json.aiReply = null;
  
  return CommentModerationSchema.parse(json);
}

export async function* streamChat(message: string, systemContext: string): AsyncIterable<string> {
    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.0-flash',
        contents: message,
        config: {
            systemInstruction: systemContext
        }
    });

    for await (const chunk of responseStream) {
        if (chunk.text) {
            yield chunk.text;
        }
    }
}

export async function translateNoteContent(title: string, summary: string, content: string, targetLang: 'en' | 'ml') {
  const prompt = `
You are an expert bilingual translator for English and Malayalam.
Translate the following structured note into ${targetLang === 'ml' ? 'Malayalam (Malayalam script)' : 'English'}.
Preserve markdown formatting, headings, bullet points, and timestamp markers like [00:00].

Return ONLY a raw valid JSON object with no markdown around it:
{
  "title": "Translated title",
  "summary": "Translated summary",
  "content": "Translated markdown content"
}

Input:
Title: ${title}
Summary: ${summary}
Content:
${content}
  `;

  try {
    const raw = await callOpenRouterAI(prompt);
    const parsed = cleanAndParseJSON(raw);
    return {
      title: parsed.title || title,
      summary: parsed.summary || summary,
      content: parsed.content || content,
    };
  } catch (e) {
    return { title, summary, content };
  }
}
