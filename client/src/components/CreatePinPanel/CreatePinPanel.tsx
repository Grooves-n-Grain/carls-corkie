import { useState, useCallback } from 'react';
import type { PinType } from '../../../../shared/types';
import { PinTypeSelector } from './PinTypeSelector';
import { TaskForm } from './forms/TaskForm';
import { NoteForm } from './forms/NoteForm';
import { LinkForm } from './forms/LinkForm';
import { EventForm } from './forms/EventForm';
import { AlertForm } from './forms/AlertForm';
import { EmailForm } from './forms/EmailForm';
import { BriefingForm } from './forms/BriefingForm';
import { GitHubForm } from './forms/GitHubForm';
import './CreatePinPanel.css';

interface CreatePinPanelProps {
  isOpen: boolean;
  onClose: () => void;
  apiUrl: string;
}

export function CreatePinPanel({ isOpen, onClose, apiUrl }: CreatePinPanelProps) {
  const [selectedType, setSelectedType] = useState<PinType>('task');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = useCallback(() => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  }, []);

  const renderForm = () => {
    const formProps = { apiUrl, onSuccess: handleSuccess };

    switch (selectedType) {
      case 'task':
        return <TaskForm {...formProps} />;
      case 'note':
        return <NoteForm {...formProps} />;
      case 'link':
        return <LinkForm {...formProps} />;
      case 'event':
        return <EventForm {...formProps} />;
      case 'alert':
        return <AlertForm {...formProps} />;
      case 'email':
        return <EmailForm {...formProps} />;
      case 'briefing':
        return <BriefingForm {...formProps} />;
      case 'github':
        return <GitHubForm {...formProps} />;
      default:
        return <TaskForm {...formProps} />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`create-panel__backdrop ${isOpen ? 'create-panel__backdrop--open' : ''}`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside className={`create-panel ${isOpen ? 'create-panel--open' : ''}`}>
        <header className="create-panel__header">
          <h2>+ New Pin</h2>
          <button className="create-panel__close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="create-panel__content">
          {showSuccess && (
            <div className="create-panel__success">Pin created!</div>
          )}

          <PinTypeSelector value={selectedType} onChange={setSelectedType} />

          {renderForm()}
        </div>
      </aside>
    </>
  );
}
