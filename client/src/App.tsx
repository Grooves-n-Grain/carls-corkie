import { useState } from 'react';
import { useSocket, API_URL } from './hooks/useSocket';
import { useFocusMode } from './hooks/useFocusMode';
import { useProjects } from './hooks/useProjects';
import { Board } from './components/Board/Board';

function App() {
  const { pins, isConnected, connectionStatus, transport, toggleComplete, deletePin } = useSocket();
  const { isFocusMode, toggleFocusMode } = useFocusMode();
  const projectHook = useProjects();
  const [currentView, setCurrentView] = useState<'board' | 'projects'>('board');

  return (
    <Board
      pins={pins}
      isConnected={isConnected}
      connectionStatus={connectionStatus}
      transport={transport}
      onToggleComplete={toggleComplete}
      onDelete={deletePin}
      isFocusMode={isFocusMode}
      onToggleFocusMode={toggleFocusMode}
      apiUrl={API_URL}
      currentView={currentView}
      onToggleView={() => setCurrentView((v) => (v === 'board' ? 'projects' : 'board'))}
      projectHook={projectHook}
    />
  );
}

export default App;
