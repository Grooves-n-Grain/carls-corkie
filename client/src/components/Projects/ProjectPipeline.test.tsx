import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Project } from '../../types/project';
import { useProjects } from '../../hooks/useProjects';
import { ProjectPipeline } from './ProjectPipeline';

const sampleProject: Project = {
  id: 'project-1',
  name: 'Cyber Lamp',
  emoji: '🤖',
  color: '#4ecdc4',
  phase: 'build',
  projectStatus: 'active',
  holdReason: '',
  createdAt: '2026-04-02T00:00:00.000Z',
  updatedAt: '2026-04-02T00:00:00.000Z',
  tracks: [
    {
      id: 'track-1',
      name: 'Electronics',
      owner: 'you',
      status: 'active',
      tasks: [
        { id: 'task-1', text: 'Wire prototype', done: false },
      ],
      attachment: null,
      sortOrder: 0,
    },
    {
      id: 'track-2',
      name: 'Firmware',
      owner: 'claude',
      status: 'waiting',
      tasks: [
        { id: 'task-2', text: 'Tune animations', done: false },
      ],
      attachment: null,
      sortOrder: 1,
    },
  ],
};

function createProjectHook(
  overrides: Partial<ReturnType<typeof useProjects>> = {},
): ReturnType<typeof useProjects> {
  const base = {
    projects: [sampleProject],
    activeProjects: [sampleProject],
    onHoldProjects: [],
    archivedProjects: [],
    cellarProjects: [],
    cellarProject: vi.fn(async () => null),
    createCellarProject: vi.fn(async () => null),
    createProject: vi.fn(async () => null),
    updateProject: vi.fn(async () => null),
    deleteProject: vi.fn(async () => true),
    holdProject: vi.fn(async () => null),
    resumeProject: vi.fn(async () => null),
    archiveProject: vi.fn(async () => null),
    toggleTask: vi.fn(),
    updateTrack: vi.fn(async () => null),
    reorderTracks: vi.fn(async () => null),
  } satisfies ReturnType<typeof useProjects>;

  return {
    ...base,
    ...overrides,
  };
}

describe('ProjectPipeline', () => {
  it('opens and closes the desktop project detail modal', () => {
    const projectHook = createProjectHook();
    const { container } = render(<ProjectPipeline projectHook={projectHook} />);

    const desktopCard = container.querySelector('.project-pipeline__desktop .project-card');
    expect(desktopCard).not.toBeNull();

    fireEvent.click(desktopCard as HTMLElement);

    expect(screen.getByRole('dialog', { name: /Cyber Lamp/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Close details for Cyber Lamp/i }));

    expect(screen.queryByRole('dialog', { name: /Cyber Lamp/i })).not.toBeInTheDocument();
  });

  it('closes the detail modal on Escape', () => {
    const projectHook = createProjectHook();
    const { container } = render(<ProjectPipeline projectHook={projectHook} />);

    fireEvent.click(container.querySelector('.project-pipeline__desktop .project-card') as HTMLElement);
    expect(screen.getByRole('dialog', { name: /Cyber Lamp/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: /Cyber Lamp/i })).not.toBeInTheDocument();
  });

  it('opens the card menu without opening the detail modal', () => {
    const projectHook = createProjectHook();
    const { container } = render(<ProjectPipeline projectHook={projectHook} />);

    fireEvent.click(container.querySelector('.project-pipeline__desktop .project-card__menu-btn') as HTMLElement);

    expect(screen.getByRole('button', { name: /Put On Hold/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /Cyber Lamp/i })).not.toBeInTheDocument();
  });
});
