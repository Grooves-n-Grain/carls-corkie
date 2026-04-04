import type { useProjects } from '../../hooks/useProjects';
import { CellarCard } from './CellarCard';

type MenuAction = 'hold' | 'resume' | 'archive' | 'delete' | 'cellar';

interface CellarViewProps {
  projectHook: ReturnType<typeof useProjects>;
  onBack: () => void;
  onNewIdea: () => void;
  onOpenProject: (id: string) => void;
  onAction: (projectId: string, action: MenuAction) => void;
}

export function CellarView({ projectHook, onBack, onNewIdea, onOpenProject, onAction }: CellarViewProps) {
  const { cellarProjects } = projectHook;

  return (
    <div className="cellar-view">
      <div className="cellar-view__toolbar">
        <button className="cellar-view__back-btn" onClick={onBack}>
          ← Board
        </button>
        <div className="cellar-view__title">
          <span className="cellar-view__icon">🍷</span>
          <h2 className="cellar-view__heading">The Cellar</h2>
          <span className="cellar-view__subtitle">ideas aging to perfection</span>
        </div>
        <button
          className="cellar-view__new-btn"
          onClick={onNewIdea}
        >
          + New Idea
        </button>
      </div>

      {cellarProjects.length === 0 ? (
        <div className="cellar-view__empty">
          <div className="cellar-view__empty-icon">🍷</div>
          <p>No ideas in the cellar yet.</p>
          <p className="cellar-view__empty-hint">Move a project here from the board, or add a new idea.</p>
        </div>
      ) : (
        <div className="cellar-view__cards">
          {cellarProjects.map((project) => (
            <CellarCard
              key={project.id}
              project={project}
              onOpen={onOpenProject}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
