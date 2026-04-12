import { useCallback } from 'react';
import type { Pin } from '../../types/pin';
import { getRotation } from '../../utils/pinUtils';
import { apiFetch } from '../../utils/apiFetch';
import { parseContent, serializeContent } from '../../utils/pinContentUtils';
import { usePinEdit } from '../../hooks/usePinEdit';
import './NotePin.css';

interface NotePinProps {
  pin: Pin;
  onToggleComplete: () => void;
  onDelete: () => void;
}

export function NotePin({ pin, onToggleComplete, onDelete }: NotePinProps) {
  const rotation = getRotation(pin.id, 60);
  const isCompleted = pin.status === 'completed';

  const {
    isEditing,
    draftTitle,
    draftContent,
    contentRows,
    setDraftTitle,
    setDraftContent,
    startEdit,
    save,
    cancel,
    deferredSave,
    handleKeyDown,
  } = usePinEdit({ pin });

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

  // Only trigger deferred save when focus leaves the entire edit area,
  // not when tabbing between title input and content textarea.
  const handleEditBlur = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget)) {
        deferredSave();
      }
    },
    [deferredSave]
  );

  return (
    <article
      className={`note-pin ${isCompleted ? 'note-pin--completed' : ''} ${isEditing ? 'note-pin--editing' : ''}`}
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
        <div
          className="note-pin__text"
          onDoubleClick={isEditing ? undefined : startEdit}
          onBlur={isEditing ? handleEditBlur : undefined}
        >
          {isEditing ? (
            <>
              <input
                className="note-pin__title-input"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                aria-label="Edit title"
              />
              <textarea
                className="note-pin__content-input"
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={contentRows}
                placeholder="Note content..."
                aria-label="Edit content"
              />
              <div className="note-pin__edit-actions">
                <button
                  className="note-pin__edit-cancel"
                  onMouseDown={(e) => { e.preventDefault(); cancel(); }}
                >
                  Cancel
                </button>
                <button
                  className="note-pin__edit-save"
                  disabled={!draftTitle.trim()}
                  onMouseDown={(e) => { e.preventDefault(); save(); }}
                >
                  Save
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="note-pin__title">{pin.title}</h3>
              {pin.content && (
                hasChecklist ? (
                  <div
                    className="note-pin__checklist"
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
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
            </>
          )}
        </div>
      </div>

      {/* Note icon/indicator */}
      {!isEditing && (
        <div className="note-pin__indicator" title="Reference note">
          📝
        </div>
      )}
    </article>
  );
}
