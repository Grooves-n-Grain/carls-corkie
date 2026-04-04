import type { Project } from '../../types/project';

export function getProjectProgress(project: Project) {
  const allTasks = project.tracks.flatMap((t) => t.tasks);
  const doneTasks = allTasks.filter((t) => t.done).length;
  const pct = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;
  return { allTasks, doneTasks, pct };
}
