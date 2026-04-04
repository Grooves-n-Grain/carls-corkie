import type { Project } from '../../types/project';

interface DeleteModalProps {
  project: Project;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteModal({ project, onConfirm, onClose }: DeleteModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--danger" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal__title modal__title--danger">🗑️ Delete Project</h3>
        <p className="modal__body">
          Are you sure you want to delete{' '}
          <strong>{project.emoji} {project.name}</strong>?
          This can't be undone. Consider archiving instead if you might want it later.
        </p>
        <div className="modal__footer">
          <button className="modal__btn modal__btn--cancel" onClick={onClose}>Cancel</button>
          <button className="modal__btn modal__btn--delete" onClick={onConfirm}>
            Delete Forever
          </button>
        </div>
      </div>
    </div>
  );
}
