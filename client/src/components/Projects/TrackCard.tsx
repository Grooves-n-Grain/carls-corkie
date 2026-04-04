import { useState, useEffect } from 'react';
import type { ProjectTrack, ProjectTask } from '../../types/project';
import { ProgressBar } from './ProgressBar';

const OWNER_ICONS: Record<string, string> = { claude: '🤖', you: '🧑‍🔧', shared: '🤝' };
const ATTACHMENT_ICONS: Record<string, string> = { code: '📄', image: '🖼️', file: '📁', link: '🔗' };

interface TrackCardProps {
  track: ProjectTrack;
  projectColor: string;
  onToggleTask: (trackId: string, taskId: string) => void;
  onUpdateTrack: (trackId: string, data: Record<string, unknown>) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
}

export function TrackCard({ track, projectColor, onToggleTask, onUpdateTrack, dragHandleProps }: TrackCardProps) {
  const [expanded, setExpanded] = useState(track.status === 'active');

  // Local task state — avoids stale closures and prevents broadcasting empty tasks
  const [localTasks, setLocalTasks] = useState<ProjectTask[]>(track.tasks);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [addingTaskId, setAddingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const isEditing = editingTaskId !== null || addingTaskId !== null;

  // Sync from server only when not editing (avoids clobbering in-progress edits)
  useEffect(() => {
    if (!isEditing) setLocalTasks(track.tasks);
  }, [track.tasks, isEditing]);

  const isLocked = track.status === 'locked';
  const doneTasks = localTasks.filter((t) => t.done).length;

  // Commit an edit to an existing task
  const commitEdit = (taskId: string, text: string) => {
    const trimmed = text.trim();
    setEditingTaskId(null);
    if (!trimmed) return; // discard if empty
    const updated = localTasks.map(t => t.id === taskId ? { ...t, text: trimmed } : t);
    setLocalTasks(updated);
    onUpdateTrack(track.id, { tasks: updated });
  };

  // Begin adding a new task (local only — nothing sent to server yet)
  const addTask = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0'));
    const id = `${hex.slice(0,4).join('')}-${hex.slice(4,6).join('')}-${hex.slice(6,8).join('')}-${hex.slice(8,10).join('')}-${hex.slice(10).join('')}`;
    const newTask: ProjectTask = { id, text: '', done: false };
    setLocalTasks(prev => [...prev, newTask]);
    setAddingTaskId(newTask.id);
    setEditingText('');
  };

  // Commit a newly-added task (sends to server for the first time)
  const commitAdd = (taskId: string, text: string) => {
    const trimmed = text.trim();
    setAddingTaskId(null);
    if (!trimmed) {
      // Cancel: remove from local state, no server call
      setLocalTasks(prev => prev.filter(t => t.id !== taskId));
      return;
    }
    const updated = localTasks.map(t => t.id === taskId ? { ...t, text: trimmed } : t);
    setLocalTasks(updated);
    onUpdateTrack(track.id, { tasks: updated });
  };

  // Delete an existing task
  const deleteTask = (taskId: string) => {
    const updated = localTasks.filter(t => t.id !== taskId);
    setLocalTasks(updated);
    onUpdateTrack(track.id, { tasks: updated });
  };

  return (
    <div className={`track-card track-card--${track.status}`}>
      <div
        className={`track-card__header ${isLocked ? '' : 'track-card__header--clickable'}`}
        onClick={() => !isLocked && setExpanded((v) => !v)}
      >
        <div className="track-card__meta">
          {dragHandleProps && (
            <button
              className="track-card__drag-handle"
              {...dragHandleProps}
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
            >
              ⠿
            </button>
          )}
          <span className="track-card__owner-icon">{OWNER_ICONS[track.owner]}</span>
          <span className="track-card__name">{track.name}</span>
          <span className={`track-card__status-badge track-card__status-badge--${track.status}`}>
            {track.status === 'done' ? '✓ Done' : track.status}
          </span>
        </div>
        {!isLocked && (
          <span className={`track-card__chevron ${expanded ? 'track-card__chevron--open' : ''}`}>▶</span>
        )}
      </div>

      {!isLocked && (
        <div className="track-card__progress">
          <ProgressBar done={doneTasks} total={localTasks.length} color={projectColor} />
        </div>
      )}

      {expanded && !isLocked && (
        <div className="track-card__body">
          {localTasks.map((task) => {
            const isNew = task.id === addingTaskId;
            const isEditingThis = task.id === editingTaskId;

            return (
              <div key={task.id} className={`track-card__task ${task.done ? 'track-card__task--done' : ''}`}>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => onToggleTask(track.id, task.id)}
                  style={{ accentColor: projectColor }}
                />
                {isNew ? (
                  <input
                    className="track-card__task-input"
                    value={editingText}
                    autoFocus
                    placeholder="Task description..."
                    onChange={(e) => setEditingText(e.target.value)}
                    onBlur={() => commitAdd(task.id, editingText)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); commitAdd(task.id, editingText); }
                      if (e.key === 'Escape') { setAddingTaskId(null); setLocalTasks(prev => prev.filter(t => t.id !== task.id)); }
                    }}
                  />
                ) : isEditingThis ? (
                  <input
                    className="track-card__task-input"
                    value={editingText}
                    autoFocus
                    onChange={(e) => setEditingText(e.target.value)}
                    onBlur={() => commitEdit(task.id, editingText)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); commitEdit(task.id, editingText); }
                      if (e.key === 'Escape') setEditingTaskId(null);
                    }}
                  />
                ) : (
                  <span
                    className="track-card__task-text"
                    onClick={() => { setEditingTaskId(task.id); setEditingText(task.text); }}
                  >
                    {task.text}
                  </span>
                )}
                {!isNew && (
                  <button
                    className="track-card__task-delete"
                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                    title="Delete task"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {localTasks.length === 0 && !addingTaskId && (
            <p className="track-card__empty">No tasks yet.</p>
          )}

          <button className="track-card__add-task" onClick={addTask}>
            ＋ Add task
          </button>

          {track.attachment && (
            <div className="track-card__attachment">
              <span className="track-card__attachment-icon">
                {ATTACHMENT_ICONS[track.attachment.type] ?? '📎'}
              </span>
              <div>
                <div className="track-card__attachment-label">{track.attachment.label}</div>
                <div className="track-card__attachment-note">{track.attachment.note}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {isLocked && (
        <div className="track-card__locked-msg">🔒 Unlocks when previous tracks complete</div>
      )}
    </div>
  );
}
