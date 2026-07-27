export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
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
  let html = content
    // Replace [[Concept]] with obsidian styled concept link in normal read view
    .replace(/\[\[([^\]]+)\]\]/g, (match, text) => {
      const slug = slugify(text);
      return `<a href="/notes/${slug}" class="wiki-link inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 font-mono text-xs transition no-underline" data-slug="${slug}">🧠 ${text}</a>`;
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

  // Parse Section Headings (## Heading)
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
      edges.push({ source: rootId, target: sectionId, label: 'section' });
    }
  }

  // Parse Obsidian Wikilinks ([[Concept Name]])
  const wikiRegex = /\[\[([^\]]+)\]\]/g;
  const seenConcepts = new Set<string>();
  while ((match = wikiRegex.exec(note.content)) !== null) {
    const conceptText = match[1].trim();
    if (conceptText && !seenConcepts.has(conceptText)) {
      seenConcepts.add(conceptText);
      const conceptId = `concept_${slugify(conceptText)}`;
      nodes.push({
        id: conceptId,
        label: `[[${conceptText}]]`,
        type: 'CONCEPT',
        slug: slugify(conceptText),
        color: '#10b981' // Emerald
      });
      edges.push({ source: rootId, target: conceptId, label: 'maps concept' });
    }
  }

  // Parse Timestamps
  if (note.timestamps) {
    try {
      const parsedTs = typeof note.timestamps === 'string' ? JSON.parse(note.timestamps) : note.timestamps;
      if (Array.isArray(parsedTs)) {
        parsedTs.slice(0, 5).forEach((ts: any, idx: number) => {
          const tsId = `ts_${idx}`;
          const label = `${ts.timestamp || '00:00'} ${ts.text || ts.label || ''}`.trim();
          nodes.push({
            id: tsId,
            label,
            type: 'TIMESTAMP',
            color: '#eab308' // Yellow
          });
          edges.push({ source: rootId, target: tsId, label: 'timestamp' });
        });
      }
    } catch (e) {
      // ignore
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
