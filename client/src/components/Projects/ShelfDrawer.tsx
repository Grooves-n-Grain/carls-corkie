import { useState } from 'react';
import type { Project } from '../../types/project';
import { ProgressBar } from './ProgressBar';
import { getProjectProgress } from './projectUtils';

type ShelfAction = 'resume' | 'archive' | 'delete';

interface ShelfDrawerProps {
  projects: Project[];
  label: string;
  icon: string;
  color: string;
  onAction: (projectId: string, action: ShelfAction) => void;
}

export function ShelfDrawer({ projects, label, icon, color, onAction }: ShelfDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (projects.length === 0) return null;

  return (
    <div className="shelf-drawer">
      <button
        className="shelf-drawer__toggle"
        style={{ borderColor: `${color}22` }}
        onClick={() => setIsOpen((v) => !v)}
      >
        <span className="shelf-drawer__icon">{icon}</span>
        <span className="shelf-drawer__label" style={{ color }}>{label}</span>
        <span className="shelf-drawer__count" style={{ background: `${color}18`, color }}>
          {projects.length}
        </span>
        <span className={`shelf-drawer__chevron ${isOpen ? 'shelf-drawer__chevron--open' : ''}`}>▶</span>
      </button>

      {isOpen && (
        <div className="shelf-drawer__items">
          {projects.map((project) => {
            const { allTasks, doneTasks, pct } = getProjectProgress(project);
            return (
              <div
                key={project.id}
                className="shelf-card"
                style={{ borderColor: `${project.color}22`, borderLeftColor: `${project.color}44` }}
              >
                <div className="shelf-card__header">
                  <div className="shelf-card__title">
                    <span className="shelf-card__emoji">{project.emoji}</span>
                    <span className="shelf-card__name">{project.name}</span>
                  </div>
                  <span className="shelf-card__pct" style={{ color: `${project.color}88` }}>
                    {pct}%
                  </span>
                </div>
                {project.holdReason && (
                  <div className="shelf-card__hold-reason">⏸️ {project.holdReason}</div>
                )}
                <ProgressBar done={doneTasks} total={allTasks.length} color={`${project.color}88`} />
                <div className="shelf-card__actions">
                  <button
                    className="shelf-card__btn shelf-card__btn--resume"
                    onClick={() => onAction(project.id, 'resume')}
                  >
                    ▶️ Resume
                  </button>
                  {project.projectStatus === 'on-hold' && (
                    <button
                      className="shelf-card__btn shelf-card__btn--archive"
                      onClick={() => onAction(project.id, 'archive')}
                    >
                      📦
                    </button>
                  )}
                  <button
                    className="shelf-card__btn shelf-card__btn--delete"
                    onClick={() => onAction(project.id, 'delete')}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
