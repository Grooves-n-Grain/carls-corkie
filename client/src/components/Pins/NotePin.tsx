import { useCallback } from 'react';
import type { Pin } from '../../types/pin';
import { getRotation } from '../../utils/pinUtils';
import { apiFetch } from '../../utils/apiFetch';
import './NotePin.css';

interface NotePinProps {
  pin: Pin;
  onToggleComplete: () => void;
  onDelete: () => void;
}

// Bullet characters we recognize as checklist items
const BULLET_RE = /^([\u25B8\u25CF\u25A0\u2022\u2023\u25E6\u25AA\u25AB\u25B9►●■•‣◦▪▫\-\*])\s*(.*)/;
// Markdown-style checkbox: [ ] or [x]
const CHECKBOX_RE = /^\[([ xX])\]\s*(.*)/;

interface ContentLine {
  type: 'text' | 'checklist';
  text: string;
  checked: boolean;
  bullet?: string;
  originalIndex: number;
}

function parseContent(content: string): ContentLine[] {
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

function serializeContent(lines: ContentLine[]): string {
  return lines.map((line) => {
    if (line.type === 'checklist') {
      const mark = line.checked ? 'x' : ' ';
      return `[${mark}] ${line.text}`;
    }
    return line.text;
  }).join('\n');
}

export function NotePin({ pin, onToggleComplete, onDelete }: NotePinProps) {
  const rotation = getRotation(pin.id, 60);
  const isCompleted = pin.status === 'completed';

  const parsedLines = pin.content ? parseContent(pin.content) : [];
  const hasChecklist = parsedLines.some((l) => l.type === 'checklist');

  const handleItemToggle = useCallback(
    (lineIndex: number) => {
      if (!pin.content) return;
      const lines = parseContent(pin.content);
      const target = lines[lineIndex];
      if (target && target.type === 'checklist') {
        target.checked = !target.checked;
        const newContent = serializeContent(lines);
        apiFetch(`/api/pins/${pin.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ content: newContent }),
        }).catch((err) => console.error('Failed to update note content:', err));
      }
    },
    [pin.id, pin.content]
  );

  return (
    <article
      className={`note-pin ${isCompleted ? 'note-pin--completed' : ''}`}
      style={{ '--pin-rotation': `${rotation}deg` } as React.CSSProperties}
      aria-label={`Note: ${pin.title}`}
    >
      {/* Delete pushpin */}
      <button
        className="note-pin__delete-pin"
        onClick={onDelete}
        title="Remove from board"
        aria-label="Delete note"
      />

      {/* Content */}
      <div className="note-pin__content">
        {/* Card-level checkbox */}
        <label className="note-pin__checkbox">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={onToggleComplete}
            aria-label={isCompleted ? 'Mark as active' : 'Mark as complete'}
          />
          <span className="note-pin__checkbox-visual" />
        </label>

        {/* Text */}
        <div className="note-pin__text">
          <h3 className="note-pin__title">{pin.title}</h3>
          {pin.content && (
            hasChecklist ? (
              <div className="note-pin__checklist">
                {parsedLines.map((line, i) => {
                  if (line.type === 'checklist') {
                    return (
                      <label key={i} className={`note-pin__item ${line.checked ? 'note-pin__item--checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={line.checked}
                          onChange={() => handleItemToggle(i)}
                          className="note-pin__item-input"
                        />
                        <span className="note-pin__item-box" />
                        <span className="note-pin__item-text">{line.text}</span>
                      </label>
                    );
                  }
                  if (line.text.trim()) {
                    return <div key={i} className="note-pin__item-label">{line.text}</div>;
                  }
                  return <div key={i} className="note-pin__item-spacer" />;
                })}
              </div>
            ) : (
              <p className="note-pin__description">{pin.content}</p>
            )
          )}
        </div>
      </div>

      {/* Note icon/indicator */}
      <div className="note-pin__indicator" title="Reference note">
        📝
      </div>
    </article>
  );
}
