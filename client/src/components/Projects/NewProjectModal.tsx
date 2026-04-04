import { useState } from 'react';
import type { CreateProjectRequest, TrackOwner } from '../../types/project';

const COLORS = ['#e8a838', '#4ecdc4', '#f7786b', '#a8e6cf', '#c3a6ff', '#ff6b6b'];

interface TrackDraft { name: string; owner: TrackOwner; }

interface NewProjectModalProps {
  onClose: () => void;
  onSubmit: (data: CreateProjectRequest) => void;
}

export function NewProjectModal({ onClose, onSubmit }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🔧');
  const [color, setColor] = useState(COLORS[Math.floor(Math.random() * COLORS.length)]);
  const [tracks, setTracks] = useState<TrackDraft[]>([
    { name: 'Code', owner: 'claude' },
    { name: 'Hardware / Build', owner: 'you' },
    { name: 'Publish', owner: 'shared' },
  ]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      emoji,
      color,
      phase: 'concept',
      tracks: tracks.filter((t) => t.name.trim()),
    });
    onClose();
  };

  const updateTrack = (i: number, field: keyof TrackDraft, value: string) => {
    const next = tracks.map((t, idx) =>
      idx === i ? { ...t, [field]: value } : t
    );
    setTracks(next);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal__title">New Project</h2>

        <div className="modal__field">
          <label className="modal__label">Name</label>
          <input
            className="modal__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. FPV Proximity Alert"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <div className="modal__row">
          <div className="modal__field modal__field--narrow">
            <label className="modal__label">Emoji</label>
            <input
              className="modal__input modal__input--emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
            />
          </div>
          <div className="modal__field">
            <label className="modal__label">Color</label>
            <div className="modal__color-swatches">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`modal__swatch ${color === c ? 'modal__swatch--selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="modal__field">
          <label className="modal__label">Tracks</label>
          {tracks.map((t, i) => (
            <div key={i} className="modal__track-row">
              <input
                className="modal__input"
                value={t.name}
                onChange={(e) => updateTrack(i, 'name', e.target.value)}
                placeholder="Track name"
              />
              <select
                className="modal__select"
                value={t.owner}
                onChange={(e) => updateTrack(i, 'owner', e.target.value)}
              >
                <option value="you">🧑‍🔧 You</option>
                <option value="claude">🤖 Claude</option>
                <option value="shared">🤝 Shared</option>
              </select>
              {tracks.length > 1 && (
                <button
                  className="modal__track-remove"
                  onClick={() => setTracks(tracks.filter((_, idx) => idx !== i))}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            className="modal__add-track"
            onClick={() => setTracks([...tracks, { name: '', owner: 'you' }])}
          >
            + Add Track
          </button>
        </div>

        <div className="modal__footer">
          <button className="modal__btn modal__btn--cancel" onClick={onClose}>Cancel</button>
          <button className="modal__btn modal__btn--primary" onClick={handleSubmit}>Create Project</button>
        </div>
      </div>
    </div>
  );
}
