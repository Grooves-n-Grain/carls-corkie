import { useEffect, useRef } from 'react';
import type { Project, MenuAction } from '../../types/project';

interface ProjectMenuProps {
  project: Project;
  onAction: (action: MenuAction) => void;
  onClose: () => void;
}

export function ProjectMenu({ project, onAction, onClose }: ProjectMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items: { label: string; action: MenuAction; danger?: boolean }[] = [];
  if (project.projectStatus === 'active') {
    items.push({ label: '⏸️  Put On Hold', action: 'hold' });
    items.push({ label: '📦  Archive', action: 'archive' });
    items.push({ label: '🍷  Send to Cellar', action: 'cellar' });
  } else if (project.projectStatus === 'on-hold') {
    items.push({ label: '▶️  Resume', action: 'resume' });
    items.push({ label: '📦  Archive', action: 'archive' });
  } else if (project.projectStatus === 'archived') {
    items.push({ label: '▶️  Reactivate', action: 'resume' });
  } else if (project.projectStatus === 'cellar') {
    items.push({ label: '▶️  Bring to Board', action: 'resume' });
    items.push({ label: '📦  Archive', action: 'archive' });
  }
  items.push({ label: '🗑️  Delete', action: 'delete', danger: true });

  return (
    <div ref={menuRef} className="project-menu">
      {items.map((item, i) => (
        <div key={i}>
          {item.danger && <div className="project-menu__divider" />}
          <button
            className={`project-menu__item ${item.danger ? 'project-menu__item--danger' : ''}`}
            onClick={() => { onAction(item.action); onClose(); }}
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );
}
