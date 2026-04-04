import { useState, useEffect } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import type { Project, MenuAction } from '../../types/project';
import { PhaseIndicator } from './PhaseIndicator';
import { ProgressBar } from './ProgressBar';
import { SortableTrackCard } from './SortableTrackCard';
import { ProjectMenu } from './ProjectMenu';

interface ProjectDetailViewProps {
  project: Project;
  headingId: string;
  onClose: () => void;
  onToggleTask: (projectId: string, trackId: string, taskId: string) => void;
  onAction: (projectId: string, action: MenuAction) => void;
  onUpdateTrack: (projectId: string, trackId: string, data: Record<string, unknown>) => void;
  onReorderTracks: (projectId: string, order: string[]) => Promise<Project | null>;
}

export function ProjectDetailView({
  project,
  headingId,
  onClose,
  onToggleTask,
  onAction,
  onUpdateTrack,
  onReorderTracks,
}: ProjectDetailViewProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [localTracks, setLocalTracks] = useState(project.tracks);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) setLocalTracks(project.tracks);
  }, [project.tracks, isDragging]);

  const allTasks = project.tracks.flatMap((track) => track.tasks);
  const doneTasks = allTasks.filter((task) => task.done).length;
  const pct = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;
  const activeTracks = project.tracks.filter((track) => track.status === 'active');
  const yourActive = activeTracks.filter((track) => track.owner === 'you' || track.owner === 'shared');
  const claudeActive = activeTracks.filter((track) => track.owner === 'claude' || track.owner === 'shared');

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setIsDragging(false);
      return;
    }

    const oldIndex = localTracks.findIndex((track) => track.id === active.id);
    const newIndex = localTracks.findIndex((track) => track.id === over.id);
    const reordered = arrayMove(localTracks, oldIndex, newIndex);

    setLocalTracks(reordered);
    const result = await onReorderTracks(project.id, reordered.map((track) => track.id));
    setIsDragging(false);
    if (!result) setLocalTracks(project.tracks);
  };

  return (
    <div
      className="project-detail-view"
      style={{ '--project-color': project.color } as React.CSSProperties}
    >
      <div className="project-detail-view__header">
        <div className="project-detail-view__title-row">
          <span className="project-detail-view__emoji">{project.emoji}</span>
          <div className="project-detail-view__title-block">
            <h2 id={headingId} className="project-detail-view__name">{project.name}</h2>
            <PhaseIndicator currentPhase={project.phase} />
          </div>
        </div>
        <div className="project-detail-view__actions">
          <span className="project-detail-view__pct" style={{ color: project.color }}>{pct}%</span>
          <div className="project-card__menu-wrap">
            <button
              type="button"
              className="project-card__menu-btn"
              aria-haspopup="menu"
              aria-expanded={showMenu}
              aria-label={`Open menu for ${project.name}`}
              onClick={() => setShowMenu((value) => !value)}
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
          <button
            type="button"
            className="project-detail-view__close"
            aria-label={`Close details for ${project.name}`}
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </div>

      <div className="project-detail-view__progress-row">
        <ProgressBar done={doneTasks} total={allTasks.length} color={project.color} />
      </div>

      <div className="project-detail-view__body">
        {(yourActive.length > 0 || claudeActive.length > 0) && (
          <div className="project-card__focus-summary project-detail-view__focus-summary">
            {yourActive.length > 0 && (
              <div className="project-card__focus-col">
                <div className="project-card__focus-label">Your focus</div>
                {yourActive.map((track) => (
                  <div key={track.id} className="project-card__focus-track">→ {track.name}</div>
                ))}
              </div>
            )}
            {claudeActive.length > 0 && (
              <div className="project-card__focus-col">
                <div className="project-card__focus-label">Claude's working on</div>
                {claudeActive.map((track) => (
                  <div key={track.id} className="project-card__focus-track">→ {track.name}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <DndContext
          collisionDetection={closestCenter}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={localTracks.map((track) => track.id)} strategy={verticalListSortingStrategy}>
            {localTracks.map((track) => (
              <SortableTrackCard
                key={track.id}
                track={track}
                projectColor={project.color}
                onToggleTask={(trackId, taskId) => onToggleTask(project.id, trackId, taskId)}
                onUpdateTrack={(trackId, data) => onUpdateTrack(project.id, trackId, data)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
