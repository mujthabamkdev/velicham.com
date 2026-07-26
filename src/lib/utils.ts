export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function parseWikiLinks(content: string): { text: string, slug: string }[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const links: { text: string, slug: string }[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const text = match[1];
    links.push({ text, slug: slugify(text) });
  }
  
  return links;
}

export function renderMarkdownWithLinks(content: string): string {
  if (!content) return '';
  // Basic markdown replacement for demo purposes
  let html = content
    // Replace [[text]] with a link
    .replace(/\[\[([^\]]+)\]\]/g, (match, text) => {
      const slug = slugify(text);
      return `<a href="/notes/${slug}" class="wiki-link" data-slug="${slug}">${text}</a>`;
    })
    // Simple bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Simple italics
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Newlines
    .replace(/\n/g, '<br/>');
    
  return html;
}
