import { v4 as uuidv4 } from 'uuid';
import type {
  Project,
  ProjectTrack,
  ProjectTask,
  TrackAttachment,
  Pin,
  CreateProjectRequest,
  UpdateProjectRequest,
  UpdateTrackRequest,
} from '@corkboard/shared';
import db from './db.js';
import { createPin } from './pins.js';
import { setLampState } from './lamp.js';

// ─── Row Types (snake_case from DB) ──────────────────────

interface ProjectRow {
  id: string;
  name: string;
  emoji: string;
  color: string;
  phase: string;
  project_status: string;
  hold_reason: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface TrackRow {
  id: string;
  project_id: string;
  name: string;
  owner: string;
  status: string;
  tasks: string;        // JSON
  attachment: string | null;  // JSON
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ─── Converters ──────────────────────────────────────────

function rowToTrack(row: TrackRow): ProjectTrack {
  return {
    id: row.id,
    name: row.name,
    owner: row.owner as ProjectTrack['owner'],
    status: row.status as ProjectTrack['status'],
    tasks: JSON.parse(row.tasks) as ProjectTask[],
    attachment: row.attachment ? JSON.parse(row.attachment) as TrackAttachment : null,
    sortOrder: row.sort_order,
  };
}

function rowToProject(row: ProjectRow, tracks: TrackRow[]): Project {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    phase: row.phase as Project['phase'],
    projectStatus: row.project_status as Project['projectStatus'],
    holdReason: row.hold_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tracks: tracks
      .filter(t => t.project_id === row.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(rowToTrack),
  };
}

// ─── Prepared Statements ─────────────────────────────────

const statements = {
  getAllProjects: db.prepare(`
    SELECT * FROM projects
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `),
  getProjectById: db.prepare(`
    SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL
  `),
  getProjectByIdIncludeDeleted: db.prepare(`
    SELECT * FROM projects WHERE id = ?
  `),
  getTracksForProjects: db.prepare(`
    SELECT t.* FROM project_tracks t
    INNER JOIN projects p ON t.project_id = p.id
    WHERE p.deleted_at IS NULL
    ORDER BY t.sort_order ASC
  `),
  getTracksForProject: db.prepare(`
    SELECT * FROM project_tracks WHERE project_id = ? ORDER BY sort_order ASC
  `),
  insertProject: db.prepare(`
    INSERT INTO projects (id, name, emoji, color, phase, project_status, hold_reason, created_at, updated_at)
    VALUES (@id, @name, @emoji, @color, @phase, @project_status, @hold_reason, @created_at, @updated_at)
  `),
  updateProject: db.prepare(`
    UPDATE projects SET
      name = @name,
      emoji = @emoji,
      color = @color,
      phase = @phase,
      project_status = @project_status,
      hold_reason = @hold_reason,
      updated_at = @updated_at
    WHERE id = @id AND deleted_at IS NULL
  `),
  softDeleteProject: db.prepare(`
    UPDATE projects SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL
  `),
  restoreProject: db.prepare(`
    UPDATE projects SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL
  `),
  insertTrack: db.prepare(`
    INSERT INTO project_tracks (id, project_id, name, owner, status, tasks, attachment, sort_order, created_at, updated_at)
    VALUES (@id, @project_id, @name, @owner, @status, @tasks, @attachment, @sort_order, @created_at, @updated_at)
  `),
  updateTrack: db.prepare(`
    UPDATE project_tracks SET
      name = @name,
      owner = @owner,
      status = @status,
      tasks = @tasks,
      attachment = @attachment,
      updated_at = @updated_at
    WHERE id = @trackId AND project_id = @projectId
  `),
  updateTrackTasksOnly: db.prepare(`
    UPDATE project_tracks SET
      tasks = @tasks,
      updated_at = @updated_at
    WHERE id = @trackId AND project_id = @projectId
  `),
  deleteTrack: db.prepare(`
    DELETE FROM project_tracks WHERE id = ? AND project_id = ?
  `),
  updateTrackSortOrder: db.prepare(`
    UPDATE project_tracks SET sort_order = @sortOrder, updated_at = @updatedAt
    WHERE id = @trackId AND project_id = @projectId
  `),
  getTrackById: db.prepare(`
    SELECT * FROM project_tracks WHERE id = ? AND project_id = ?
  `),
  getTrackCountForProject: db.prepare(`
    SELECT COUNT(*) as count FROM project_tracks WHERE project_id = ?
  `),
};

// ─── Helpers ─────────────────────────────────────────────

function normalizeTrackTasks(rawTasks: string): { tasks: ProjectTask[]; changed: boolean } {
  let changed = false;
  const seenIds = new Set<string>();
  const parsed = JSON.parse(rawTasks) as Array<Partial<ProjectTask>>;

  const tasks = parsed.map((task) => {
    const existingId = typeof task.id === 'string' ? task.id.trim() : '';
    const hasUsableId = existingId.length > 0 && !seenIds.has(existingId);
    const id = hasUsableId ? existingId : uuidv4();

    if (!hasUsableId) {
      changed = true;
    }

    seenIds.add(id);

    return {
      id,
      text: typeof task.text === 'string' ? task.text : '',
      done: Boolean(task.done),
    };
  });

  return { tasks, changed };
}

function normalizeTrackRow(row: TrackRow): TrackRow {
  const { tasks, changed } = normalizeTrackTasks(row.tasks);

  if (!changed) {
    return row;
  }

  const updatedAt = new Date().toISOString();
  const serializedTasks = JSON.stringify(tasks);

  statements.updateTrackTasksOnly.run({
    projectId: row.project_id,
    trackId: row.id,
    tasks: serializedTasks,
    updated_at: updatedAt,
  });

  return {
    ...row,
    tasks: serializedTasks,
    updated_at: updatedAt,
  };
}

function getProjectWithTracks(id: string): Project | null {
  const row = statements.getProjectById.get(id) as ProjectRow | undefined;
  if (!row) return null;
  const tracks = (statements.getTracksForProject.all(id) as TrackRow[]).map(normalizeTrackRow);
  return rowToProject(row, tracks);
}

function onTrackCompleted(project: Project, completedTrack: ProjectTrack): Pin | null {
  // Find the next active track owned by the user (not claude)
  const nextUserTrack = project.tracks.find(
    t => t.owner !== 'claude' && t.status === 'active' && t.id !== completedTrack.id
  );

  const pinTitle = nextUserTrack
    ? `${project.emoji} ${project.name} — your turn: ${nextUserTrack.name}`
    : `${project.emoji} ${project.name} — ${completedTrack.name} complete`;

  const pinBody = nextUserTrack
    ? `Track "${completedTrack.name}" is done. Next up: ${nextUserTrack.name}`
    : `Track "${completedTrack.name}" is done. Check project for next steps.`;

  const pin = createPin({
    type: 'task',
    title: pinTitle,
    content: pinBody,
    priority: 2,
  });

  // Check if all tracks are now done (project complete)
  const allDone = project.tracks.every(
    t => t.id === completedTrack.id || t.status === 'done' || t.status === 'locked'
  );

  // Fire-and-forget lamp trigger (setLampState is async; DB ops must remain sync)
  if (allDone) {
    setLampState('success').catch(() => {});    // green — project ready to ship
  } else if (nextUserTrack) {
    setLampState('attention').catch(() => {});  // purple — your turn
  }

  return pin;
}

// ─── Exports ─────────────────────────────────────────────

export function getProjects(): Project[] {
  const projectRows = statements.getAllProjects.all() as ProjectRow[];
  const trackRows = (statements.getTracksForProjects.all() as TrackRow[]).map(normalizeTrackRow);
  return projectRows.map(p => rowToProject(p, trackRows));
}

export function getProject(id: string): Project | null {
  return getProjectWithTracks(id);
}

export function createProject(data: CreateProjectRequest): Project {
  const now = new Date().toISOString();
  const id = uuidv4();

  statements.insertProject.run({
    id,
    name: data.name,
    emoji: data.emoji ?? '🔧',
    color: data.color ?? '#e8a838',
    phase: data.phase ?? 'concept',
    project_status: data.initialStatus ?? 'active',
    hold_reason: '',
    created_at: now,
    updated_at: now,
  });

  // Insert initial tracks
  const tracks = data.tracks ?? [];
  tracks.forEach((t, index) => {
    statements.insertTrack.run({
      id: uuidv4(),
      project_id: id,
      name: t.name,
      owner: t.owner,
      status: index === 0 ? 'active' : 'waiting',
      tasks: '[]',
      attachment: null,
      sort_order: index,
      created_at: now,
      updated_at: now,
    });
  });

  return getProjectWithTracks(id)!;
}

export function updateProject(id: string, data: UpdateProjectRequest): Project | null {
  const existing = getProjectWithTracks(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  statements.updateProject.run({
    id,
    name: data.name ?? existing.name,
    emoji: data.emoji ?? existing.emoji,
    color: data.color ?? existing.color,
    phase: data.phase ?? existing.phase,
    project_status: existing.projectStatus,
    hold_reason: existing.holdReason,
    updated_at: now,
  });

  return getProjectWithTracks(id)!;
}

export function deleteProject(id: string): boolean {
  const now = new Date().toISOString();
  const result = statements.softDeleteProject.run(now, id);
  return result.changes > 0;
}

export function restoreProject(id: string): Project | null {
  const now = new Date().toISOString();
  const result = statements.restoreProject.run(now, id);
  if (result.changes === 0) return null;
  return getProjectWithTracks(id)!;
}

export function holdProject(id: string, reason: string): Project | null {
  const existing = getProjectWithTracks(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  statements.updateProject.run({
    id,
    name: existing.name,
    emoji: existing.emoji,
    color: existing.color,
    phase: existing.phase,
    project_status: 'on-hold',
    hold_reason: reason,
    updated_at: now,
  });

  return getProjectWithTracks(id)!;
}

export function resumeProject(id: string): Project | null {
  const existing = getProjectWithTracks(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  statements.updateProject.run({
    id,
    name: existing.name,
    emoji: existing.emoji,
    color: existing.color,
    phase: existing.phase,
    project_status: 'active',
    hold_reason: '',
    updated_at: now,
  });

  return getProjectWithTracks(id)!;
}

export function archiveProject(id: string): Project | null {
  const existing = getProjectWithTracks(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  statements.updateProject.run({
    id,
    name: existing.name,
    emoji: existing.emoji,
    color: existing.color,
    phase: existing.phase,
    project_status: 'archived',
    hold_reason: existing.holdReason,
    updated_at: now,
  });

  return getProjectWithTracks(id)!;
}

export function cellarProject(id: string): Project | null {
  const existing = getProjectWithTracks(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  statements.updateProject.run({
    id,
    name: existing.name,
    emoji: existing.emoji,
    color: existing.color,
    phase: existing.phase,
    project_status: 'cellar',
    hold_reason: '',
    updated_at: now,
  });

  return getProjectWithTracks(id)!;
}

export function addTrack(
  projectId: string,
  data: { name: string; owner: string }
): Project | null {
  const existing = getProjectWithTracks(projectId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const countRow = statements.getTrackCountForProject.get(projectId) as { count: number };

  statements.insertTrack.run({
    id: uuidv4(),
    project_id: projectId,
    name: data.name,
    owner: data.owner,
    status: 'waiting',
    tasks: '[]',
    attachment: null,
    sort_order: countRow.count,
    created_at: now,
    updated_at: now,
  });

  // Touch parent project updated_at
  db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, projectId);

  return getProjectWithTracks(projectId)!;
}

export function updateTrack(
  projectId: string,
  trackId: string,
  data: UpdateTrackRequest
): { project: Project; autoPin: Pin | null } | null {
  const fetchedTrackRow = statements.getTrackById.get(trackId, projectId) as TrackRow | undefined;
  const trackRow = fetchedTrackRow ? normalizeTrackRow(fetchedTrackRow) : undefined;
  if (!trackRow) return null;

  const existingTrack = rowToTrack(trackRow);
  const wasAlreadyDone = existingTrack.status === 'done';

  const now = new Date().toISOString();
  const newTasks = data.tasks ?? existingTrack.tasks;
  const newStatus = data.status ?? existingTrack.status;

  statements.updateTrack.run({
    projectId,
    trackId,
    name: data.name ?? existingTrack.name,
    owner: data.owner ?? existingTrack.owner,
    status: newStatus,
    tasks: JSON.stringify(newTasks),
    attachment: data.attachment !== undefined
      ? (data.attachment ? JSON.stringify(data.attachment) : null)
      : trackRow.attachment,
    updated_at: now,
  });

  // Touch parent project updated_at
  db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, projectId);

  const project = getProjectWithTracks(projectId)!;

  // Auto-pin bridge: fire when track transitions TO done
  let autoPin: Pin | null = null;
  if (!wasAlreadyDone && newStatus === 'done') {
    autoPin = onTrackCompleted(project, { ...existingTrack, status: 'done' });
  }

  return { project, autoPin };
}

export function deleteTrack(projectId: string, trackId: string): Project | null {
  const project = getProjectWithTracks(projectId);
  if (!project) return null;

  statements.deleteTrack.run(trackId, projectId);

  const now = new Date().toISOString();
  db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, projectId);

  return getProjectWithTracks(projectId)!;
}

export function reorderTracks(projectId: string, orderedIds: string[]): Project | null {
  const project = getProjectWithTracks(projectId);
  if (!project) return null;

  const existingIds = new Set(project.tracks.map(t => t.id));
  if (
    orderedIds.length !== existingIds.size ||
    new Set(orderedIds).size !== existingIds.size ||
    !orderedIds.every(id => existingIds.has(id))
  ) {
    return null;
  }

  const now = new Date().toISOString();
  const reorder = db.transaction(() => {
    orderedIds.forEach((trackId, index) => {
      statements.updateTrackSortOrder.run({ trackId, projectId, sortOrder: index, updatedAt: now });
    });
    db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, projectId);
  });
  reorder();

  return getProjectWithTracks(projectId)!;
}

export function toggleTask(
  projectId: string,
  trackId: string,
  taskId: string
): { project: Project; autoPin: Pin | null } | null {
  const fetchedTrackRow = statements.getTrackById.get(trackId, projectId) as TrackRow | undefined;
  const trackRow = fetchedTrackRow ? normalizeTrackRow(fetchedTrackRow) : undefined;
  if (!trackRow) return null;

  const tasks: ProjectTask[] = JSON.parse(trackRow.tasks);
  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;

  task.done = !task.done;

  // Auto-complete track when all tasks are done
  const allDone = tasks.length > 0 && tasks.every(t => t.done);
  const wasAlreadyDone = trackRow.status === 'done';
  const newStatus = allDone ? 'done' : (trackRow.status === 'done' ? 'active' : trackRow.status);

  const now = new Date().toISOString();
  statements.updateTrack.run({
    projectId,
    trackId,
    name: trackRow.name,
    owner: trackRow.owner,
    status: newStatus,
    tasks: JSON.stringify(tasks),
    attachment: trackRow.attachment,
    updated_at: now,
  });

  db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, projectId);

  const project = getProjectWithTracks(projectId)!;

  // Auto-pin when track newly becomes done
  let autoPin: Pin | null = null;
  if (!wasAlreadyDone && newStatus === 'done') {
    const completedTrack = project.tracks.find(t => t.id === trackId)!;
    autoPin = onTrackCompleted(project, completedTrack);
  }

  return { project, autoPin };
}
