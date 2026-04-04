import { useState } from 'react';

const STORAGE_KEY = 'corkboard_focus_mode';

export function useFocusMode() {
  const [isFocusMode, setIsFocusMode] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const toggleFocusMode = () => {
    setIsFocusMode(prev => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, String(newValue));
      return newValue;
    });
  };

  return { isFocusMode, toggleFocusMode };
}
