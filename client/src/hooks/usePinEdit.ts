import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { Pin } from '../types/pin';
import { apiFetch } from '../utils/apiFetch';

interface UsePinEditOptions {
  pin: Pin;
}

export function usePinEdit({ pin }: UsePinEditOptions) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Ref to handle blur/click race condition:
  // When user clicks Save while textarea has focus, blur fires before click.
  // We defer the blur-triggered save and cancel it if Save button fires first.
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Snapshot of values at edit-start, used by cancel() so a concurrent
  // Socket.io update doesn't change what "Cancel" reverts to.
  const originalRef = useRef({ title: '', content: '' });

  // Cleanup pending timeout on unmount (e.g., pin deleted via Socket.io during blur)
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current !== null) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const startEdit = useCallback(() => {
    originalRef.current = { title: pin.title, content: pin.content ?? '' };
    setDraftTitle(pin.title);
    setDraftContent(pin.content ?? '');
    setIsEditing(true);
  }, [pin.title, pin.content]);

  const save = useCallback(() => {
    if (saveTimeoutRef.current !== null) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const trimmedTitle = draftTitle.trim();
    if (!trimmedTitle) return;

    setIsSaving(true);

    apiFetch(`/api/pins/${pin.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: trimmedTitle,
        content: draftContent,
      }),
    })
      .then(() => setIsEditing(false))
      .catch((err) => {
        console.error('Failed to update pin:', err);
        // Keep edit mode open so the user can retry or cancel
      })
      .finally(() => setIsSaving(false));
  }, [pin.id, draftTitle, draftContent]);

  const cancel = useCallback(() => {
    if (saveTimeoutRef.current !== null) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    setIsEditing(false);
    setDraftTitle(originalRef.current.title);
    setDraftContent(originalRef.current.content);
  }, []);

  // Deferred save for blur events. Only fires if focus leaves the entire
  // edit area — individual field-to-field tabs are handled by the container
  // onBlur with relatedTarget checking in the component.
  const deferredSave = useCallback(() => {
    if (isSaving) return;
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      save();
    }, 0);
  }, [save, isSaving]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        save();
      }
    },
    [cancel, save]
  );

  // Only trigger deferred save when focus leaves the entire edit area,
  // not when tabbing between title input and content textarea.
  const handleEditBlur = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget)) {
        deferredSave();
      }
    },
    [deferredSave]
  );

  const contentRows = useMemo(
    () => Math.max(3, Math.min(8, (draftContent.split('\n').length || 1) + 1)),
    [draftContent]
  );

  return {
    isEditing,
    draftTitle,
    draftContent,
    isSaving,
    contentRows,
    setDraftTitle,
    setDraftContent,
    startEdit,
    save,
    cancel,
    deferredSave,
    handleKeyDown,
    handleEditBlur,
  };
}
