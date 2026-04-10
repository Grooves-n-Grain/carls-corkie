import { useMemo, useState, useEffect, useCallback } from 'react';
import type { Pin } from '../../types/pin';
import type { ConnectionStatus, TransportType } from '../../hooks/useSocket';
import { TaskPin } from '../Pins/TaskPin';
import { AlertPin } from '../Pins/AlertPin';
import { NotePin } from '../Pins/NotePin';
import { LinkPin } from '../Pins/LinkPin';
import { EventPin } from '../Pins/EventPin';
import { EmailPin } from '../Pins/EmailPin';
import { OpportunityPin } from '../Pins/OpportunityPin';
import { BriefingPin } from '../Pins/BriefingPin';
import { GitHubPin } from '../Pins/GitHubPin';
import { IdeaPin } from '../Pins/IdeaPin';
import { TrackingPin } from '../Pins/TrackingPin';
import { ArticlePin } from '../Pins/ArticlePin';
import { TwitterPin } from '../Pins/TwitterPin';
import { RedditPin } from '../Pins/RedditPin';
import { YouTubePin } from '../Pins/YouTubePin';
import { HistoryPanel } from '../HistoryPanel/HistoryPanel';
import { CreatePinPanel } from '../CreatePinPanel/CreatePinPanel';
import { ProjectPipeline } from '../Projects/ProjectPipeline';
import { NewProjectModal } from '../Projects/NewProjectModal';
import type { useProjects } from '../../hooks/useProjects';
import { parseLampState, type LampState } from '../../utils/lampUtils';
import { apiFetch } from '../../utils/apiFetch';
import '../Projects/Projects.css';
import './Board.css';

interface BoardProps {
  pins: Pin[];
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  transport: TransportType;
  onToggleComplete: (id: string, currentStatus: string) => void;
  onDelete: (id: string) => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  currentView: 'board' | 'projects';
  onToggleView: () => void;
  projectHook: ReturnType<typeof useProjects>;
}

export function Board({ pins, isConnected, connectionStatus, transport, onToggleComplete, onDelete, isFocusMode, onToggleFocusMode, currentView, onToggleView, projectHook }: BoardProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [projectCreateOpen, setProjectCreateOpen] = useState(false);
  const [lampState, setLampState] = useState<LampState>('idle');

  // Poll lamp status
  useEffect(() => {
    const fetchLampStatus = async () => {
      try {
        const res = await apiFetch('/api/lamp/status');
        if (res.ok) {
          const data = await res.json();
          setLampState(parseLampState(data.state));
        }
      } catch (e) {
        // Silent fail - lamp server might be down
      }
    };

    fetchLampStatus();
    const interval = setInterval(fetchLampStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Set lamp state
  const handleSetLampState = useCallback(async (state: LampState) => {
    try {
      await apiFetch(`/api/lamp/${state}`, { method: 'POST' });
      setLampState(state);
    } catch (e) {
      console.error('Failed to set lamp state:', e);
    }
  }, []);
  // Separate active, completed, and dismissed pins
  const { activePins, completedPins, totalCount } = useMemo(() => {
    const active = pins.filter((p) => p.status === 'active');
    const completed = pins.filter((p) => p.status === 'completed');
    // Dismissed pins are hidden
    return {
      activePins: active,
      completedPins: completed,
      totalCount: active.length + completed.length
    };
  }, [pins]);

  // Render the appropriate pin component based on type
  const renderPin = (pin: Pin) => {
    switch (pin.type) {
      case 'alert':
        return (
          <AlertPin
            key={pin.id}
            pin={pin}
            onDismiss={() => onToggleComplete(pin.id, 'dismissed')}
          />
        );
      case 'note':
        return (
          <NotePin
            key={pin.id}
            pin={pin}
            onToggleComplete={() => onToggleComplete(pin.id, pin.status)}
            onDelete={() => onDelete(pin.id)}
          />
        );
      case 'link':
        return (
          <LinkPin
            key={pin.id}
            pin={pin}
            onToggleComplete={() => onToggleComplete(pin.id, pin.status)}
            onDelete={() => onDelete(pin.id)}
          />
        );
      case 'event':
        return (
          <EventPin
            key={pin.id}
            pin={pin}
            onToggleComplete={() => onToggleComplete(pin.id, pin.status)}
            onDelete={() => onDelete(pin.id)}
          />
        );
      case 'email':
        return (
          <EmailPin
            key={pin.id}
            pin={pin}
            onToggleComplete={() => onToggleComplete(pin.id, pin.status)}
            onDelete={() => onDelete(pin.id)}
          />
        );
      case 'opportunity':
        return (
          <OpportunityPin
            key={pin.id}
            pin={pin}
            onToggleComplete={() => onToggleComplete(pin.id, pin.status)}
            onDelete={() => onDelete(pin.id)}
          />
        );
      case 'briefing':
        return (
          <BriefingPin
            key={pin.id}
            pin={pin}
            onDismiss={() => onToggleComplete(pin.id, 'dismissed')}
          />
        );
      case 'github':
        return (
          <GitHubPin
            key={pin.id}
            pin={pin}
            onToggleComplete={() => onToggleComplete(pin.id, pin.status)}
            onDelete={() => onDelete(pin.id)}
          />
        );
      case 'idea':
        return (
          <IdeaPin
            key={pin.id}
            pin={pin}
            onToggleComplete={() => onToggleComplete(pin.id, pin.status)}
            onDelete={() => onDelete(pin.id)}
          />
        );
      case 'tracking':
        return (
          <TrackingPin
            key={pin.id}
            pin={pin}
            onToggleComplete={() => onToggleComplete(pin.id, pin.status)}
            onDelete={() => onDelete(pin.id)}
          />
        );
      case 'article':
        return (
          <ArticlePin
            key={pin.id}
            pin={pin}
            onToggleComplete={() => onToggleComplete(pin.id, pin.status)}
            onDelete={() => onDelete(pin.id)}
          />
        );
      case 'twitter':
        return (
          <TwitterPin
            key={pin.id}
            pin={pin}
            onToggleComplete={() => onToggleComplete(pin.id, pin.status)}
            onDelete={() => onDelete(pin.id)}
          />
        );
      case 'reddit':
        return (
          <RedditPin
            key={pin.id}
            pin={pin}
            onToggleComplete={() => onToggleComplete(pin.id, pin.status)}
            onDelete={() => onDelete(pin.id)}
          />
        );
      case 'youtube':
        return (
          <YouTubePin
            key={pin.id}
            pin={pin}
            onToggleComplete={() => onToggleComplete(pin.id, pin.status)}
            onDelete={() => onDelete(pin.id)}
          />
        );
      case 'task':
      default:
        return (
          <TaskPin
            key={pin.id}
            pin={pin}
            onToggleComplete={() => onToggleComplete(pin.id, pin.status)}
            onDelete={() => onDelete(pin.id)}
          />
        );
    }
  };

  // In focus mode, only show the highest priority active pin
  // Otherwise show all active + completed
  const displayPins = isFocusMode && activePins.length > 0
    ? [activePins[0]]
    : [...activePins, ...completedPins];

  // Connection toast message
  const connectionToast = () => {
    switch (connectionStatus) {
      case 'reconnecting':
        return { show: true, message: '🔄 Reconnecting...', type: 'warning' };
      case 'reconnected':
        return { show: true, message: '✓ Reconnected!', type: 'success' };
      case 'disconnected':
        return { show: true, message: '⚠️ Disconnected - retrying...', type: 'error' };
      default:
        return { show: false, message: '', type: '' };
    }
  };
  const toast = connectionToast();

  return (
    <div className={`board ${isFocusMode ? 'board--focus-mode' : ''}`}>
      {/* Connection status toast */}
      {toast.show && (
        <div className={`board__toast board__toast--${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="board__branding">
        <img src="/carls-corkie-alt.png" alt="carl's corkie" className="board__logo" />
        <h1 className="board__title">carl's corkie</h1>
      </div>

      <header className="board__header">
        <div className="board__controls">
          <button
            className="board__create-toggle"
            onClick={() => currentView === 'projects' ? setProjectCreateOpen(true) : setCreatePanelOpen(true)}
            title={currentView === 'projects' ? 'Create new project' : 'Create new pin'}
          >
            +<span className="board__btn-label"> New</span>
          </button>
          <button
            className="board__history-toggle"
            onClick={() => setHistoryOpen(true)}
            title="View history"
          >
            📋<span className="board__btn-label"> History</span>
          </button>
          <button
            className={`board__focus-toggle ${isFocusMode ? 'board__focus-toggle--active' : ''}`}
            onClick={onToggleFocusMode}
            title={isFocusMode ? 'Show all tasks' : 'Focus on one task'}
          >
            🎯<span className="board__btn-label"> {isFocusMode ? 'Focus Mode' : 'Focus'}</span>
          </button>
          <button
            className={`board__focus-toggle ${currentView === 'projects' ? 'board__focus-toggle--active' : ''}`}
            onClick={onToggleView}
            title={currentView === 'projects' ? 'Back to board' : 'View project pipeline'}
          >
            {currentView === 'projects' ? '🏠' : '📌'}<span className="board__btn-label">{currentView === 'projects' ? ' Dashboard' : ' Projects'}</span>
          </button>
          <div className="board__status" title={isConnected ? `Transport: ${transport}` : 'Disconnected'}>
            <span
              className={`board__status-dot ${isConnected ? (transport === 'websocket' ? 'board__status-dot--websocket' : 'board__status-dot--polling') : ''}`}
            />
            {isConnected ? (transport === 'websocket' ? 'Connected' : 'Connected (polling)') : 'Connecting...'}
          </div>
        </div>
      </header>

      <div key={currentView} className="board__view-container">
        {currentView === 'projects' ? (
          <ProjectPipeline projectHook={projectHook} />
        ) : isFocusMode ? (
          <div className="board__pins board__pins--focus">
            {displayPins.length === 0 ? (
              <div className="board__empty">
                <div className="board__empty-icon">📌</div>
                <p className="board__empty-text">
                  Nothing pinned yet. carl will add things here for you!
                </p>
              </div>
            ) : (
              displayPins.map((pin) => renderPin(pin))
            )}
          </div>
        ) : (
          <div className="board__pins--masonry">
            {displayPins.length === 0 ? (
              <div className="board__empty">
                <div className="board__empty-icon">📌</div>
                <p className="board__empty-text">
                  Nothing pinned yet. carl will add things here for you!
                </p>
              </div>
            ) : (
              displayPins.map((pin) => renderPin(pin))
            )}
          </div>
        )}
      </div>

      <div className="board__stats">
          {/* Lamp Status Lights */}
          <div className="board__lamp-status">
            <button
              className={`board__lamp-light board__lamp-light--waiting ${lampState === 'waiting' ? 'board__lamp-light--active' : ''}`}
              onClick={() => handleSetLampState('waiting')}
              title="Waiting (amber)"
            />
            <button
              className={`board__lamp-light board__lamp-light--idle ${lampState === 'idle' ? 'board__lamp-light--active' : ''}`}
              onClick={() => handleSetLampState('idle')}
              title="Idle (cyan)"
            />
            <button
              className={`board__lamp-light board__lamp-light--attention ${lampState === 'attention' ? 'board__lamp-light--active' : ''}`}
              onClick={() => handleSetLampState('attention')}
              title="Attention (purple)"
            />
            <button
              className={`board__lamp-light board__lamp-light--urgent ${lampState === 'urgent' ? 'board__lamp-light--active' : ''}`}
              onClick={() => handleSetLampState('urgent')}
              title="Urgent (red)"
            />
            <button
              className={`board__lamp-light board__lamp-light--success ${lampState === 'success' ? 'board__lamp-light--active' : ''}`}
              onClick={() => handleSetLampState('success')}
              title="Success (green)"
            />
            <button
              className={`board__lamp-light board__lamp-light--off ${lampState === 'off' ? 'board__lamp-light--active' : ''}`}
              onClick={() => handleSetLampState('off')}
              title="Off"
            />
          </div>
          
          {totalCount > 0 && (
            <>
              <div className="board__stat">
                <span className="board__stat-value">{activePins.length}</span>
                <span>active</span>
              </div>
              <div className="board__stat">
                <span className="board__stat-value">{completedPins.length}</span>
                <span>completed</span>
              </div>
            </>
          )}
        </div>

      {projectCreateOpen && (
        <NewProjectModal
          onClose={() => setProjectCreateOpen(false)}
          onSubmit={(data) => { projectHook.createProject(data); setProjectCreateOpen(false); }}
        />
      )}

      <HistoryPanel
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRestore={() => setHistoryOpen(false)}
      />

      <CreatePinPanel
        isOpen={createPanelOpen}
        onClose={() => setCreatePanelOpen(false)}
      />
    </div>
  );
}
