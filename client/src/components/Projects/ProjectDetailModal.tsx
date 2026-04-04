import { useEffect } from 'react';
import type { Project, MenuAction } from '../../types/project';
import { ProjectDetailView } from './ProjectDetailView';

interface ProjectDetailModalProps {
  project: Project;
  onClose: () => void;
  onToggleTask: (projectId: string, trackId: string, taskId: string) => void;
  onAction: (projectId: string, action: MenuAction) => void;
  onUpdateTrack: (projectId: string, trackId: string, data: Record<string, unknown>) => void;
  onReorderTracks: (projectId: string, order: string[]) => Promise<Project | null>;
}

export function ProjectDetailModal({
  project,
  onClose,
  onToggleTask,
  onAction,
  onUpdateTrack,
  onReorderTracks,
}: ProjectDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal project-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`project-detail-title-${project.id}`}
        onClick={(event) => event.stopPropagation()}
      >
        <ProjectDetailView
          project={project}
          headingId={`project-detail-title-${project.id}`}
          onClose={onClose}
          onToggleTask={onToggleTask}
          onAction={onAction}
          onUpdateTrack={onUpdateTrack}
          onReorderTracks={onReorderTracks}
        />
      </div>
    </div>
  );
}
