import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/pin';
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '../types/project';
import { config } from '../config';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useProjects() {
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const sock: TypedSocket = io(config.socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    sock.on('projects:sync', (synced) => {
      setProjects(synced);
    });

    sock.on('project:created', (project) => {
      setProjects((prev) => [project, ...prev.filter((p) => p.id !== project.id)]);
    });

    sock.on('project:updated', (project) => {
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
    });

    sock.on('project:deleted', ({ id }) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    });

    setSocket(sock);
    return () => { sock.close(); };
  }, []);

  // ─── Actions ───────────────────────────────────────────

  const createProject = useCallback(async (data: CreateProjectRequest): Promise<Project | null> => {
    try {
      const res = await fetch(`${config.apiUrl}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }, []);

  const updateProject = useCallback(async (id: string, data: UpdateProjectRequest): Promise<Project | null> => {
    try {
      const res = await fetch(`${config.apiUrl}/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }, []);

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${config.apiUrl}/api/projects/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch { return false; }
  }, []);

  const holdProject = useCallback(async (id: string, reason: string): Promise<Project | null> => {
    try {
      const res = await fetch(`${config.apiUrl}/api/projects/${id}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }, []);

  const resumeProject = useCallback(async (id: string): Promise<Project | null> => {
    try {
      const res = await fetch(`${config.apiUrl}/api/projects/${id}/resume`, { method: 'POST' });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }, []);

  const archiveProject = useCallback(async (id: string): Promise<Project | null> => {
    try {
      const res = await fetch(`${config.apiUrl}/api/projects/${id}/archive`, { method: 'POST' });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }, []);

  const cellarProject = useCallback(async (id: string): Promise<Project | null> => {
    try {
      const res = await fetch(`${config.apiUrl}/api/projects/${id}/cellar`, { method: 'POST' });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }, []);

  const createCellarProject = useCallback(async (data: CreateProjectRequest): Promise<Project | null> => {
    return createProject({ ...data, initialStatus: 'cellar' });
  }, [createProject]);

  const toggleTask = useCallback((projectId: string, trackId: string, taskId: string) => {
    socket?.emit('project:task:toggle', { projectId, trackId, taskId });
  }, [socket]);

  const updateTrack = useCallback(async (
    projectId: string,
    trackId: string,
    data: Record<string, unknown>
  ): Promise<Project | null> => {
    try {
      const res = await fetch(`${config.apiUrl}/api/projects/${projectId}/tracks/${trackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }, []);

  const reorderTracks = useCallback(async (
    projectId: string,
    order: string[]
  ): Promise<Project | null> => {
    try {
      const res = await fetch(`${config.apiUrl}/api/projects/${projectId}/tracks/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }, []);

  // ─── Derived state ────────────────────────────────────

  const activeProjects = projects.filter((p) => p.projectStatus === 'active');
  const onHoldProjects = projects.filter((p) => p.projectStatus === 'on-hold');
  const archivedProjects = projects.filter((p) => p.projectStatus === 'archived');
  const cellarProjects = projects.filter((p) => p.projectStatus === 'cellar');

  return {
    projects,
    activeProjects,
    onHoldProjects,
    archivedProjects,
    cellarProjects,
    createProject,
    updateProject,
    deleteProject,
    holdProject,
    resumeProject,
    archiveProject,
    cellarProject,
    createCellarProject,
    toggleTask,
    updateTrack,
    reorderTracks,
  };
}
