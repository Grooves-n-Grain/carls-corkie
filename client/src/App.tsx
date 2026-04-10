import { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { useFocusMode } from './hooks/useFocusMode';
import { useProjects } from './hooks/useProjects';
import { Board } from './components/Board/Board';
import { setAuthErrorHandler } from './utils/apiFetch';

function App() {
  const { pins, isConnected, connectionStatus, transport, toggleComplete, deletePin } = useSocket();
  const { isFocusMode, toggleFocusMode } = useFocusMode();
  const projectHook = useProjects();
  const [currentView, setCurrentView] = useState<'board' | 'projects'>('board');
  const [authError, setAuthError] = useState<number | null>(null);

  useEffect(() => {
    setAuthErrorHandler((status) => setAuthError(status));
    const onEv = () => setAuthError(401);
    window.addEventListener('corkie:auth-error', onEv);
    return () => {
      window.removeEventListener('corkie:auth-error', onEv);
      setAuthErrorHandler(null);
    };
  }, []);

  return (
    <>
      {authError !== null && (
        <div
          role="alert"
          style={{
            background: '#7a1a1a',
            color: '#fff',
            padding: '0.85rem 1.2rem',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '0.95rem',
            borderBottom: '2px solid #4a0000',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          <strong>Authentication failed.</strong> The client and server tokens don&apos;t match.
          Run <code style={{ background: '#4a0000', padding: '0 4px', borderRadius: 3 }}>npm run token:show</code>{' '}
          to compare, then{' '}
          <code style={{ background: '#4a0000', padding: '0 4px', borderRadius: 3 }}>npm run build</code>{' '}
          and reload after rotating.
        </div>
      )}
      <Board
        pins={pins}
        isConnected={isConnected}
        connectionStatus={connectionStatus}
        transport={transport}
        onToggleComplete={toggleComplete}
        onDelete={deletePin}
        isFocusMode={isFocusMode}
        onToggleFocusMode={toggleFocusMode}
        currentView={currentView}
        onToggleView={() => setCurrentView((v) => (v === 'board' ? 'projects' : 'board'))}
        projectHook={projectHook}
      />
    </>
  );
}

export default App;
