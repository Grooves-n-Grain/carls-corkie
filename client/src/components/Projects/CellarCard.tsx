import { useState } from 'react';
import type { Project } from '../../types/project';
import { ProjectMenu } from './ProjectMenu';
import { getProjectProgress } from './projectUtils';

type MenuAction = 'hold' | 'resume' | 'archive' | 'delete' | 'cellar';

interface CellarCardProps {
  project: Project;
  onOpen: (id: string) => void;
  onAction: (projectId: string, action: MenuAction) => void;
}

export function CellarCard({ project, onOpen, onAction }: CellarCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const { allTasks, pct } = getProjectProgress(project);

  return (
    <div
      className="cellar-card"
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${project.name}`}
      onClick={() => onOpen(project.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(project.id); }
      }}
      style={{ borderTopColor: project.color, borderColor: `${project.color}33` } as React.CSSProperties}
    >
      <div className="cellar-card__inner">
        <div className="cellar-card__top">
          <div className="cellar-card__title-row">
            <span className="cellar-card__emoji">{project.emoji}</span>
            <div className="cellar-card__title-block">
              <h3 className="cellar-card__name">{project.name}</h3>
              <span className="cellar-card__phase">{project.phase}</span>
            </div>
          </div>
          <div className="cellar-card__menu-wrap">
            <button
              type="button"
              className="cellar-card__menu-btn"
              aria-haspopup="menu"
              aria-expanded={showMenu}
              aria-label={`Open menu for ${project.name}`}
              onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
            >
              ⋮
            </button>
            {showMenu && (
              <ProjectMenu
                project={project}
                onAction={(action) => onAction(project.id, action)}
                onClose={() => setShowMenu(false)}
              />
            )}
          </div>
        </div>

        {allTasks.length > 0 && (
          <div className="cellar-card__progress">
            <div className="cellar-card__progress-bar">
              <div className="cellar-card__progress-fill" style={{ width: `${pct}%`, background: project.color }} />
            </div>
            <span className="cellar-card__pct">{pct}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
