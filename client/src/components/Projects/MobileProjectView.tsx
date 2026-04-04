import { useState } from 'react';
import type { useProjects } from '../../hooks/useProjects';

interface Props {
  projectHook: ReturnType<typeof useProjects>;
}

export function MobileProjectView({ projectHook }: Props) {
  const { activeProjects, onHoldProjects, toggleTask } = projectHook;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="mobile-projects">
      {activeProjects.length === 0 ? (
        <div className="mobile-projects__empty">
          <span>🔧</span>
          <p>No active projects. Start one from desktop!</p>
        </div>
      ) : (
        activeProjects.map((project) => {
          const allTasks = project.tracks.flatMap((t) => t.tasks);
          const doneTasks = allTasks.filter((t) => t.done).length;
          const pct = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;
          const isExpanded = expandedId === project.id;
          const activeTracks = project.tracks.filter((t) => t.status !== 'locked' && t.tasks.length > 0);

          return (
            <div
              key={project.id}
              className={`mobile-project ${isExpanded ? 'mobile-project--expanded' : ''}`}
              style={{ '--project-color': project.color } as React.CSSProperties}
            >
              <button className="mobile-project__header" onClick={() => toggle(project.id)}>
                <span className="mobile-project__emoji">{project.emoji}</span>
                <span className="mobile-project__name">{project.name}</span>
                <div className="mobile-project__meta">
                  <span className="mobile-project__pct">{pct}%</span>
                  <span className={`mobile-project__chevron ${isExpanded ? 'mobile-project__chevron--open' : ''}`}>›</span>
                </div>
              </button>

              <div className="mobile-project__summary">
                <div className="mobile-project__progress">
                  <div className="mobile-project__progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="mobile-project__phase">{project.phase}</span>
              </div>

              <div className="mobile-project__body">
                <div className="mobile-project__body-inner">
                  {activeTracks.map((track) => (
                    <div key={track.id} className="mobile-track">
                      <div className="mobile-track__header">
                        <span className="mobile-track__name">{track.name}</span>
                        <span className={`mobile-track__owner mobile-track__owner--${track.owner}`}>
                          {track.owner}
                        </span>
                      </div>
                      {track.tasks.map((task) => (
                        <label
                          key={task.id}
                          className={`mobile-task ${task.done ? 'mobile-task--done' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() => toggleTask(project.id, track.id, task.id)}
                          />
                          <span className="mobile-task__text">{task.text}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })
      )}

      {onHoldProjects.length > 0 && (
        <p className="mobile-projects__shelf-note">
          ⏸ {onHoldProjects.length} project{onHoldProjects.length > 1 ? 's' : ''} on hold
        </p>
      )}
    </div>
  );
}
