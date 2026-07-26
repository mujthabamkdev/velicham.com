import { GoogleGenAI, Type } from '@google/genai';
import {
  GeneratedNoteSchema,
  GeneratedLinksSchema,
  CommentModerationSchema,
  type GeneratedNote,
  type GeneratedLinks,
  type CommentModeration,
} from '@/lib/types';

const ai = new GoogleGenAI({});

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

export async function generateNoteFromTranscript(transcript: string, videoTitle?: string): Promise<GeneratedNote> {
  const chunks = chunkText(transcript, 10000, 1000);
  let finalContentToProcess = transcript;

  // Semantic chunking for large transcripts
  if (chunks.length > 1) {
    const summaries = [];
    for (let i = 0; i < chunks.length; i++) {
        const res = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `Summarize this segment of a video transcript. Extract the key concepts and their timestamps. Keep the timestamps accurate. Segment:\n\n${chunks[i]}`
        });
        summaries.push(`--- Segment ${i+1} ---\n${res.text}`);
    }
    finalContentToProcess = summaries.join('\n\n');
  }

  const prompt = `
Generate a structured note from the following transcript${videoTitle ? ` for the video "${videoTitle}"` : ''}.
Ensure the output follows these constraints:
- title: A concise, accurate title
- summary: A brief summary (max 500 characters)
- content: Full markdown content formatted with headings, bullet points, and emphasizing key concepts. Include timestamps where relevant.
- timestamps: An array of the most important timestamped points (format HH:MM:SS or MM:SS).

Transcript/Summaries:
${finalContentToProcess}
  `;

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
                }
            },
            required: ['title', 'summary', 'content', 'timestamps']
        }
    }
  });

  const textResp = response.text;
  if (!textResp) throw new Error("Empty response from AI");
  
  const json = JSON.parse(textResp);
  return GeneratedNoteSchema.parse(json);
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
}

export async function moderateComment(commentText: string): Promise<CommentModeration> {
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
