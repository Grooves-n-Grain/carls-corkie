import { useEffect, useState } from 'react';
import type { Project } from '../../types/project';
import type { useProjects } from '../../hooks/useProjects';
import { ProjectCard } from './ProjectCard';
import { ProjectDetailModal } from './ProjectDetailModal';
import { ShelfDrawer } from './ShelfDrawer';
import { NewProjectModal } from './NewProjectModal';
import { HoldModal } from './HoldModal';
import { DeleteModal } from './DeleteModal';
import { MobileProjectView } from './MobileProjectView';
import { CellarView } from './CellarView';

type FilterOwner = 'all' | 'you' | 'claude';
type MenuAction = 'hold' | 'resume' | 'archive' | 'delete' | 'cellar';

interface ProjectPipelineProps {
  projectHook: ReturnType<typeof useProjects>;
}

export function ProjectPipeline({ projectHook }: ProjectPipelineProps) {
  const {
    projects,
    activeProjects,
    onHoldProjects,
    archivedProjects,
    cellarProjects,
    createProject,
    createCellarProject,
    deleteProject,
    holdProject,
    resumeProject,
    archiveProject,
    cellarProject,
    toggleTask,
    updateTrack,
    reorderTracks,
  } = projectHook;

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [cellarSelectedId, setCellarSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOwner>('all');
  const [showNew, setShowNew] = useState(false);
  const [showNewCellarIdea, setShowNewCellarIdea] = useState(false);
  const [showCellar, setShowCellar] = useState(false);
  const [holdTarget, setHoldTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [cellarDeleteTarget, setCellarDeleteTarget] = useState<Project | null>(null);

  const selectedProject = selectedProjectId
    ? projects.find((project) => project.id === selectedProjectId) ?? null
    : null;

  const cellarSelectedProject = cellarSelectedId
    ? cellarProjects.find((p) => p.id === cellarSelectedId) ?? null
    : null;

  useEffect(() => {
    if (selectedProjectId && !selectedProject) setSelectedProjectId(null);
  }, [selectedProjectId, selectedProject]);

  const openProjectDetails = (id: string) => setSelectedProjectId(id);

  const handleCellarAction = (projectId: string, action: MenuAction) => {
    const project = cellarProjects.find((p) => p.id === projectId);
    if (!project) return;
    setCellarSelectedId((prev) => (prev === projectId ? null : prev));
    if (action === 'resume') { resumeProject(projectId); return; }
    if (action === 'archive') { archiveProject(projectId); return; }
    if (action === 'delete') { setCellarDeleteTarget(project); return; }
  };

  const handleAction = (projectId: string, action: MenuAction) => {
    const project = activeProjects.find((p) => p.id === projectId)
      ?? onHoldProjects.find((p) => p.id === projectId)
      ?? archivedProjects.find((p) => p.id === projectId);
    if (!project) return;

    setSelectedProjectId((prev) => (prev === projectId ? null : prev));

    if (action === 'hold') { setHoldTarget(project); return; }
    if (action === 'delete') { setDeleteTarget(project); return; }
    if (action === 'resume') resumeProject(projectId);
    if (action === 'archive') archiveProject(projectId);
    if (action === 'cellar') cellarProject(projectId);
  };

  const filteredActive = activeProjects.filter((p) => {
    if (filter === 'all') return true;
    return p.tracks.some((t) =>
      filter === 'you' ? t.owner === 'you' || t.owner === 'shared'
        : t.owner === 'claude' || t.owner === 'shared'
    );
  });

  return (
    <div className="project-pipeline">
      <div className="project-pipeline__mobile">
        <MobileProjectView projectHook={projectHook} />
      </div>
      <div className="project-pipeline__desktop">
        <div className="pipeline-stage-outer">
          <div className={`pipeline-stage${showCellar ? ' pipeline-stage--cellar' : ''}`}>

            {/* Board panel */}
            <div className="pipeline-stage__board">
              <div className="project-pipeline__toolbar">
                <div className="project-pipeline__filters">
                  {(['all', 'you', 'claude'] as FilterOwner[]).map((f) => (
                    <button
                      key={f}
                      className={`project-pipeline__filter ${filter === f ? 'project-pipeline__filter--active' : ''}`}
                      onClick={() => setFilter(f)}
                    >
                      {f === 'all' ? 'All' : f === 'you' ? '🧑‍🔧 Yours' : '🤖 carl'}
                    </button>
                  ))}
                </div>
                <div className="project-pipeline__toolbar-actions">
                  <button
                    className="project-pipeline__cellar-btn"
                    onClick={() => setShowCellar(true)}
                    title="The Cellar — future ideas"
                  >
                    🍷 Cellar
                  </button>
                  <button
                    className="project-pipeline__new-btn"
                    onClick={() => setShowNew(true)}
                  >
                    + New Project
                  </button>
                </div>
              </div>

              {filteredActive.length === 0 ? (
                <div className="project-pipeline__empty">
                  <div className="project-pipeline__empty-icon">🔧</div>
                  <p>No active projects. Start one!</p>
                </div>
              ) : (
                <div className="project-pipeline__cards">
                  {filteredActive.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onOpen={openProjectDetails}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              )}

              <ShelfDrawer
                projects={onHoldProjects}
                label="On Hold"
                icon="⏸️"
                color="#e8a838"
                onAction={handleAction}
              />
              <ShelfDrawer
                projects={archivedProjects}
                label="Archived"
                icon="📦"
                color="#8899aa"
                onAction={handleAction}
              />
            </div>

            {/* Cellar panel */}
            <div className="pipeline-stage__cellar">
              <CellarView
                projectHook={projectHook}
                onBack={() => setShowCellar(false)}
                onNewIdea={() => setShowNewCellarIdea(true)}
                onOpenProject={setCellarSelectedId}
                onAction={handleCellarAction}
              />
            </div>

          </div>
        </div>

        {selectedProject && (
          <ProjectDetailModal
            project={selectedProject}
            onClose={() => setSelectedProjectId(null)}
            onToggleTask={toggleTask}
            onAction={handleAction}
            onUpdateTrack={updateTrack}
            onReorderTracks={reorderTracks}
          />
        )}

        {showNew && (
          <NewProjectModal
            onClose={() => setShowNew(false)}
            onSubmit={createProject}
          />
        )}

        {showNewCellarIdea && (
          <NewProjectModal
            onClose={() => setShowNewCellarIdea(false)}
            onSubmit={createCellarProject}
          />
        )}

        {cellarSelectedProject && (
          <ProjectDetailModal
            project={cellarSelectedProject}
            onClose={() => setCellarSelectedId(null)}
            onToggleTask={toggleTask}
            onAction={handleCellarAction}
            onUpdateTrack={updateTrack}
            onReorderTracks={reorderTracks}
          />
        )}

        {cellarDeleteTarget && (
          <DeleteModal
            project={cellarDeleteTarget}
            onConfirm={() => { deleteProject(cellarDeleteTarget.id); setCellarDeleteTarget(null); }}
            onClose={() => setCellarDeleteTarget(null)}
          />
        )}

        {holdTarget && (
          <HoldModal
            project={holdTarget}
            onConfirm={(reason) => { holdProject(holdTarget.id, reason); setHoldTarget(null); }}
            onClose={() => setHoldTarget(null)}
          />
        )}

        {deleteTarget && (
          <DeleteModal
            project={deleteTarget}
            onConfirm={() => { deleteProject(deleteTarget.id); setDeleteTarget(null); }}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </div>
  );
}
