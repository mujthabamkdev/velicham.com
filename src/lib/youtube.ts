import { YoutubeTranscript } from 'youtube-transcript';

export function extractVideoId(url: string): string {
  try {
    const trimmed = url.trim();
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }
    const parsedUrl = new URL(trimmed);
    if (parsedUrl.hostname.includes('youtube.com')) {
      return parsedUrl.searchParams.get('v') || '';
    }
    if (parsedUrl.hostname.includes('youtu.be')) {
      return parsedUrl.pathname.slice(1).split('/')[0];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    return '';
  } catch (error) {
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
      return url.trim();
    }
    return '';
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

export async function fetchVideoMetadata(videoId: string): Promise<{ channelId: string; channelName: string; title: string }> {
  try {
    const id = extractVideoId(videoId);
    if (!id) throw new Error('Invalid YouTube video ID or URL');

    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
    const response = await fetch(oembedUrl);

    if (response.ok) {
      const data = await response.json();
      let channelId = data.author_name;
      if (data.author_url) {
        const handleMatch = data.author_url.match(/@([^/]+)/);
        if (handleMatch) channelId = handleMatch[1];
      }
      return {
        channelId: channelId || 'UC_default',
        channelName: data.author_name || 'YouTube Channel',
        title: data.title || `Video ${id}`
      };
    }

    return {
      channelId: 'UC_default',
      channelName: 'YouTube Channel',
      title: `YouTube Video (${id})`
    };
  } catch (error) {
    return {
      channelId: 'UC_default',
      channelName: 'YouTube Channel',
      title: `YouTube Video (${videoId})`
    };
  }
}
