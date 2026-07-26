import { YoutubeTranscript } from 'youtube-transcript';

export function extractVideoId(url: string): string {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes('youtube.com')) {
      return parsedUrl.searchParams.get('v') || '';
    }
    if (parsedUrl.hostname.includes('youtu.be')) {
      return parsedUrl.pathname.slice(1);
    }
    return url; // fallback, assume it's already an ID
  } catch (error) {
    // If URL parsing fails, it might just be a raw ID
    return url;
  }
}

export async function fetchTranscript(videoId: string): Promise<string> {
  try {
    const id = extractVideoId(videoId);
    if (!id) {
      throw new Error('Invalid YouTube video ID or URL');
    }

    const transcript = await YoutubeTranscript.fetchTranscript(id);
    
    // Combine segments into a single string with timestamps
    return transcript
      .map((t: any) => {
        const minutes = Math.floor(t.offset / 1000 / 60);
        const seconds = Math.floor((t.offset / 1000) % 60);
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        return `[${timeStr}] ${t.text}`;
      })
      .join('\n');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch transcript: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching the transcript');
  }
}

export async function fetchPlaylistVideoIds(playlistUrl: string): Promise<string[]> {
  try {
    const url = new URL(playlistUrl);
    const listId = url.searchParams.get('list');
    
    if (!listId) {
      throw new Error('Invalid playlist URL: missing "list" parameter');
    }

    const response = await fetch(`https://www.youtube.com/playlist?list=${listId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch playlist page: ${response.statusText}`);
    }

    const html = await response.text();
    const videoIdRegex = /"videoId":"([^"]+)"/g;
    const matches = [...html.matchAll(videoIdRegex)];
    
    const ids = matches.map(m => m[1]);
    
    // Remove duplicates
    const uniqueIds = [...new Set(ids)];
    return uniqueIds;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch playlist video IDs: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching playlist video IDs');
  }
}
