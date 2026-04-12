// Shared checklist parsing/serialization for TaskPin and NotePin.
// Content is stored as plain text with markdown-style checkboxes: [ ] / [x]
// and bullet characters that get normalized to checkbox syntax on toggle.

// Bullet characters we recognize as checklist items
export const BULLET_RE = /^([\u25B8\u25CF\u25A0\u2022\u2023\u25E6\u25AA\u25AB\u25B9►●■•‣◦▪▫\-\*])\s*(.*)/;
// Markdown-style checkbox: [ ] or [x]
export const CHECKBOX_RE = /^\[([ xX])\]\s*(.*)/;

export interface ContentLine {
  type: 'text' | 'checklist';
  text: string;
  checked: boolean;
  bullet?: string;
  originalIndex: number;
}

export function parseContent(content: string): ContentLine[] {
  return content.split('\n').map((line, i) => {
    const cbMatch = line.match(CHECKBOX_RE);
    if (cbMatch) {
      return {
        type: 'checklist' as const,
        text: cbMatch[2],
        checked: cbMatch[1].toLowerCase() === 'x',
        originalIndex: i,
      };
    }
    const bulletMatch = line.match(BULLET_RE);
    if (bulletMatch) {
      return {
        type: 'checklist' as const,
        text: bulletMatch[2],
        checked: false,
        bullet: bulletMatch[1],
        originalIndex: i,
      };
    }
    return {
      type: 'text' as const,
      text: line,
      checked: false,
      originalIndex: i,
    };
  });
}

export function serializeContent(lines: ContentLine[]): string {
  return lines.map((line) => {
    if (line.type === 'checklist') {
      const mark = line.checked ? 'x' : ' ';
      return `[${mark}] ${line.text}`;
    }
    return line.text;
  }).join('\n');
}
