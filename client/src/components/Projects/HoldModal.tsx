import { useState } from 'react';
import type { Project } from '../../types/project';

const SUGGESTIONS = [
  'Waiting for parts to arrive',
  'Waiting on 3D print to finish',
  'Need to order components',
  'Blocked by another project',
  'Taking a break from this one',
];

interface HoldModalProps {
  project: Project;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export function HoldModal({ project, onConfirm, onClose }: HoldModalProps) {
  const [reason, setReason] = useState(project.holdReason ?? '');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal__title">⏸️ Put On Hold</h3>
        <p className="modal__subtitle">{project.emoji} {project.name}</p>

        <div className="modal__field">
          <label className="modal__label">Why? (helps future-you remember)</label>
          <input
            className="modal__input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Waiting for BMS board from AliExpress"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && onConfirm(reason)}
          />
        </div>

        <div className="modal__chips">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              className={`modal__chip ${reason === s ? 'modal__chip--active' : ''}`}
              onClick={() => setReason(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="modal__footer">
          <button className="modal__btn modal__btn--cancel" onClick={onClose}>Cancel</button>
          <button className="modal__btn modal__btn--primary" onClick={() => onConfirm(reason)}>
            Put On Hold
          </button>
        </div>
      </div>
    </div>
  );
}
