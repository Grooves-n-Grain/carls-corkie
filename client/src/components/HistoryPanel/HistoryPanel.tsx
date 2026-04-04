import { useState, useEffect } from 'react';
import { formatTimeAgo } from '../../utils/dateUtils';
import './HistoryPanel.css';

interface DeletedPin {
  id: string;
  type: string;
  title: string;
  content?: string;
  deletedAt: string;
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  apiUrl: string;
  onRestore?: () => void;
}

function getTypeEmoji(type: string): string {
  switch (type) {
    case 'task': return '✓';
    case 'note': return '📝';
    case 'link': return '🔗';
    case 'event': return '📅';
    case 'alert': return '⚠️';
    default: return '📌';
  }
}

export function HistoryPanel({ isOpen, onClose, apiUrl, onRestore }: HistoryPanelProps) {
  const [deletedPins, setDeletedPins] = useState<DeletedPin[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = () => {
    setLoading(true);
    fetch(`${apiUrl}/api/pins/history/deleted`)
      .then(res => res.json())
      .then(data => {
        setDeletedPins(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, apiUrl]);

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/pins/${id}/restore`, { method: 'POST' });
      if (res.ok) {
        // Remove from local list
        setDeletedPins(prev => prev.filter(p => p.id !== id));
        // Notify parent to refresh
        onRestore?.();
      }
    } catch (err) {
      console.error('Failed to restore pin:', err);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`history-panel__backdrop ${isOpen ? 'history-panel__backdrop--open' : ''}`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <aside className={`history-panel ${isOpen ? 'history-panel--open' : ''}`}>
        <header className="history-panel__header">
          <h2>📋 History</h2>
          <button className="history-panel__close" onClick={onClose}>×</button>
        </header>

        <div className="history-panel__content">
          {loading ? (
            <p className="history-panel__empty">Loading...</p>
          ) : deletedPins.length === 0 ? (
            <p className="history-panel__empty">No deleted items yet</p>
          ) : (
            <ul className="history-panel__list">
              {deletedPins.map(pin => (
                <li 
                  key={pin.id} 
                  className="history-panel__item"
                  onClick={() => handleRestore(pin.id)}
                  title="Click to restore"
                >
                  <span className="history-panel__type">{getTypeEmoji(pin.type)}</span>
                  <div className="history-panel__details">
                    <span className="history-panel__title">{pin.title}</span>
                    <span className="history-panel__time">{formatTimeAgo(pin.deletedAt)}</span>
                  </div>
                  <span className="history-panel__restore">↩</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
