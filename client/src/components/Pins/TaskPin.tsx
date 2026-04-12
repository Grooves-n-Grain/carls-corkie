import { useMemo } from 'react';
import type { Pin } from '../../types/pin';
import { getRotation } from '../../utils/pinUtils';
import { parseContent, toggleChecklistItem } from '../../utils/pinContentUtils';
import { usePinEdit } from '../../hooks/usePinEdit';
import './TaskPin.css';

interface TaskPinProps {
  pin: Pin;
  onToggleComplete: () => void;
  onDelete: () => void;
}

export function TaskPin({ pin, onToggleComplete, onDelete }: TaskPinProps) {
  const isCompleted = pin.status === 'completed';
  const rotation = getRotation(pin.id);

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
    handleKeyDown,
    handleEditBlur,
    isSaving,
  } = usePinEdit({ pin });

  const priorityClass = pin.priority
    ? `task-pin__priority--${pin.priority === 1 ? 'high' : pin.priority === 2 ? 'medium' : 'low'}`
    : '';

  const parsedLines = useMemo(
    () => (pin.content ? parseContent(pin.content) : []),
    [pin.content]
  );
  const hasChecklist = parsedLines.some((l) => l.type === 'checklist');

  return (
    <article
      className={`task-pin ${isCompleted ? 'task-pin--completed' : ''} ${isEditing ? 'task-pin--editing' : ''}`}
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
        <div
          className="task-pin__text"
          onDoubleClick={isEditing ? undefined : startEdit}
          onBlur={isEditing ? handleEditBlur : undefined}
        >
          {isEditing ? (
            <>
              <input
                className="task-pin__title-input"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                aria-label="Edit title"
              />
              <textarea
                className="task-pin__content-input"
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={contentRows}
                placeholder="Task content..."
                aria-label="Edit content"
              />
              <div className="task-pin__edit-actions">
                <button
                  className="task-pin__edit-cancel"
                  onMouseDown={(e) => { e.preventDefault(); cancel(); }}
                >
                  Cancel
                </button>
                <button
                  className="task-pin__edit-save"
                  disabled={!draftTitle.trim() || isSaving}
                  onMouseDown={(e) => { e.preventDefault(); save(); }}
                >
                  Save
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="task-pin__title">{pin.title}</h3>
              {pin.content && (
                hasChecklist ? (
                  <div
                    className="task-pin__checklist"
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
                    {parsedLines.map((line, i) => {
                      if (line.type === 'checklist') {
                        return (
                          <label key={i} className={`task-pin__item ${line.checked ? 'task-pin__item--checked' : ''}`}>
                            <input
                              type="checkbox"
                              checked={line.checked}
                              onChange={() => toggleChecklistItem(pin.id, pin.content!, i)}
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
                  <p className="task-pin__description">{pin.content}</p>
                )
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
