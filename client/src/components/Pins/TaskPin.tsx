import { useCallback } from 'react';
import type { Pin } from '../../types/pin';
import { getRotation } from '../../utils/pinUtils';
import { apiFetch } from '../../utils/apiFetch';
import './TaskPin.css';

interface TaskPinProps {
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
    // First check for markdown checkboxes
    const cbMatch = line.match(CHECKBOX_RE);
    if (cbMatch) {
      return {
        type: 'checklist' as const,
        text: cbMatch[2],
        checked: cbMatch[1].toLowerCase() === 'x',
        originalIndex: i,
      };
    }
    // Then check for bullet characters — treat as unchecked checklist items
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

export function TaskPin({ pin, onToggleComplete, onDelete }: TaskPinProps) {
  const isCompleted = pin.status === 'completed';
  const rotation = getRotation(pin.id);

  const priorityClass = pin.priority
    ? `task-pin__priority--${pin.priority === 1 ? 'high' : pin.priority === 2 ? 'medium' : 'low'}`
    : '';

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
        // PATCH the pin content via API
        apiFetch(`/api/pins/${pin.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ content: newContent }),
        }).catch((err) => console.error('Failed to update task content:', err));
      }
    },
    [pin.id, pin.content]
  );

  return (
    <article
      className={`task-pin ${isCompleted ? 'task-pin--completed' : ''}`}
      style={{ '--pin-rotation': `${rotation}deg` } as React.CSSProperties}
      aria-label={`Task: ${pin.title}`}
    >
      {/* Priority dot */}
      {pin.priority && (
        <div
          className={`task-pin__priority ${priorityClass}`}
          title={`Priority: ${pin.priority === 1 ? 'High' : pin.priority === 2 ? 'Medium' : 'Low'}`}
        />
      )}

      {/* Delete button */}
      <div className="task-pin__actions">
        <button
          className="task-pin__delete"
          onClick={onDelete}
          title="Delete"
          aria-label="Delete task"
        >
          ×
        </button>
      </div>

      <div className="task-pin__content">
        {/* Card-level checkbox (mark whole card complete) */}
        <label className="task-pin__checkbox">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={onToggleComplete}
            aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          />
          <span className="task-pin__checkbox-visual" />
        </label>

        {/* Text content */}
        <div className="task-pin__text">
          <h3 className="task-pin__title">{pin.title}</h3>
          {pin.content && (
            hasChecklist ? (
              <div className="task-pin__checklist">
                {parsedLines.map((line, i) => {
                  if (line.type === 'checklist') {
                    return (
                      <label key={i} className={`task-pin__item ${line.checked ? 'task-pin__item--checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={line.checked}
                          onChange={() => handleItemToggle(i)}
                          className="task-pin__item-input"
                        />
                        <span className="task-pin__item-box" />
                        <span className="task-pin__item-text">{line.text}</span>
                      </label>
                    );
                  }
                  if (line.text.trim()) {
                    return <div key={i} className="task-pin__item-label">{line.text}</div>;
                  }
                  return <div key={i} className="task-pin__item-spacer" />;
                })}
              </div>
            ) : (
              <p className="task-pin__description">
                {pin.content.split('\n').map((line, i) => (
                  <span key={i}>{line}{'\n'}</span>
                ))}
              </p>
            )
          )}
        </div>
      </div>
    </article>
  );
}
