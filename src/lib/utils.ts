export function slugify(text: string): string {
  if (!text) return `note-${Date.now()}`;
  const slug = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-\u0d00-\u0d7f]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/(^-|-$)+/g, '');

  return slug || `note-${Date.now()}`;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatDate(date: Date): string {
  const m = MONTHS[date.getUTCMonth()];
  const d = date.getUTCDate();
  const y = date.getUTCFullYear();
  return `${m} ${d}, ${y}`;
}

export function formatDateShort(date: Date): string {
  const m = MONTHS[date.getUTCMonth()];
  const d = date.getUTCDate();
  return `${m} ${d}`;
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
  let sectionIdx = 0;
  let html = content
    // Replace [[Concept]] with clean inline concept link in normal read view
    .replace(/\[\[([^\]]+)\]\]/g, (match, text) => {
      const slug = slugify(text);
      const cleanText = text.trim();
      return `<a href="/notes/${slug}" data-concept="${cleanText}" class="wiki-link text-cyan-400 hover:underline font-medium transition" data-slug="${slug}">${cleanText}</a>`;
    })
    // Simple bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Simple italics
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Headers with data attributes
    .replace(/^### (.*$)/gim, (match, text) => {
      sectionIdx++;
      const cleanHeading = text.replace(/^[^\w\s\u0d00-\u0d7f]+/, '').trim();
      return `<h3 data-heading="${cleanHeading}">${text}</h3>`;
    })
    .replace(/^## (.*$)/gim, (match, text) => {
      sectionIdx++;
      const cleanHeading = text.replace(/^[^\w\s\u0d00-\u0d7f]+/, '').trim();
      return `<h2 data-heading="${cleanHeading}">${text}</h2>`;
    })
    .replace(/^# (.*$)/gim, (match, text) => {
      sectionIdx++;
      const cleanHeading = text.replace(/^[^\w\s\u0d00-\u0d7f]+/, '').trim();
      return `<h1 data-heading="${cleanHeading}">${text}</h1>`;
    })
    // Newlines
    .replace(/\n/g, '<br/>');
    
  return html;
}

export interface BrainNode {
  id: string;
  label: string;
  type: 'ROOT_NOTE' | 'SECTION' | 'CONCEPT' | 'TIMESTAMP' | 'TOPIC' | 'LINKED_NOTE';
  slug?: string;
  detail?: string;
  color?: string;
}

export interface BrainEdge {
  source: string;
  target: string;
  label?: string;
}

export function extractBrainNodesAndLinks(note: {
  id: string;
  title: string;
  content: string;
  topic?: { id: string; title: string; slug: string } | null;
  timestamps?: string | null;
  outgoingRelations?: Array<{ targetNote: { id: string; title: string; slug: string } }>;
}): { nodes: BrainNode[]; edges: BrainEdge[] } {
  const nodes: BrainNode[] = [];
  const edges: BrainEdge[] = [];

  // Root note node
  const rootId = `root_${note.id}`;
  nodes.push({
    id: rootId,
    label: note.title,
    type: 'ROOT_NOTE',
    color: '#a855f7' // Purple
  });

  // Topic Node
  if (note.topic) {
    const topicId = `topic_${note.topic.id}`;
    nodes.push({
      id: topicId,
      label: `#${note.topic.title}`,
      type: 'TOPIC',
      slug: note.topic.slug,
      color: '#06b6d4' // Cyan
    });
    edges.push({ source: rootId, target: topicId, label: 'belongs to topic' });
  }

  // Parse Main Section Headings (## Heading)
  const headingRegex = /^##+\s+(.*$)/gim;
  let match;
  let sectionIndex = 0;
  while ((match = headingRegex.exec(note.content)) !== null) {
    sectionIndex++;
    const rawHeading = match[1].trim();
    const sectionLabel = rawHeading.replace(/^[^\w\s\u0d00-\u0d7f]+/, '').trim();
    if (sectionLabel) {
      const sectionId = `sec_${sectionIndex}`;
      nodes.push({
        id: sectionId,
        label: sectionLabel,
        type: 'SECTION',
        color: '#ec4899' // Pink
      });
      edges.push({ source: rootId, target: sectionId, label: 'main section' });
    }
  }

  // Connected Outgoing Notes
  if (note.outgoingRelations) {
    note.outgoingRelations.forEach((rel) => {
      if (rel.targetNote) {
        const targetId = `note_${rel.targetNote.id}`;
        nodes.push({
          id: targetId,
          label: rel.targetNote.title,
          type: 'LINKED_NOTE',
          slug: rel.targetNote.slug,
          color: '#3b82f6' // Blue
        });
        edges.push({ source: rootId, target: targetId, label: 'linked note' });
      }
    });
  }

  return { nodes, edges };
}
