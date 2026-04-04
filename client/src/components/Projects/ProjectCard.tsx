import { useState } from 'react';
import type { Project } from '../../types/project';
import { PhaseIndicator } from './PhaseIndicator';
import { ProgressBar } from './ProgressBar';
import { ProjectMenu } from './ProjectMenu';
import { getRotation } from '../../utils/pinUtils';
import { getProjectProgress } from './projectUtils';

type MenuAction = 'hold' | 'resume' | 'archive' | 'delete' | 'cellar';

interface ProjectCardProps {
  project: Project;
  onOpen: (id: string) => void;
  onAction: (projectId: string, action: MenuAction) => void;
}

export function ProjectCard({ project, onOpen, onAction }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const { allTasks, doneTasks, pct } = getProjectProgress(project);
  const activeTracks = project.tracks.filter((t) => t.status === 'active');
  const rotation = getRotation(project.id, 30);

  const handleOpen = () => onOpen(project.id);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpen();
    }
  };

  return (
    <div
      className="project-card"
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${project.name}`}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      style={{
        borderTopColor: project.color,
        borderColor: `${project.color}33`,
        '--pin-rotation': `${rotation}deg`,
      } as React.CSSProperties}
    >
      <div className="project-card__inner">
        <div className="project-card__top">
          <div className="project-card__title-row">
            <span className="project-card__emoji">{project.emoji}</span>
            <div className="project-card__title-block">
              <h3 className="project-card__name">{project.name}</h3>
              <PhaseIndicator currentPhase={project.phase} />
            </div>
          </div>
          <div className="project-card__actions">
            <span className="project-card__pct" style={{ color: project.color }}>{pct}%</span>
            <div className="project-card__menu-wrap">
              <button
                type="button"
                className="project-card__menu-btn"
                aria-haspopup="menu"
                aria-expanded={showMenu}
                aria-label={`Open menu for ${project.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setShowMenu((value) => !value);
                }}
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
        </div>

        <div className="project-card__progress-row">
          <ProgressBar done={doneTasks} total={allTasks.length} color={project.color} />
          {activeTracks.length > 0 && (
            <div className="project-card__active-tracks">
              {activeTracks.map((track) => (
                <span key={track.id} className="project-card__track-chip">
                  {track.owner === 'claude' ? '🤖' : track.owner === 'you' ? '🧑‍🔧' : '🤝'} {track.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
