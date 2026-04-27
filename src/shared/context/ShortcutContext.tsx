import React, { createContext, useEffect, useRef, useCallback } from 'react';

type ShortcutCallback = (e: KeyboardEvent) => void;
type ShortcutRegistry = Map<string, ShortcutCallback[]>;

interface ShortcutContextValue {
  registerShortcut: (keys: string, callback: ShortcutCallback) => void;
  unregisterShortcut: (keys: string, callback: ShortcutCallback) => void;
}

export const ShortcutContext = createContext<ShortcutContextValue | null>(null);

export const ShortcutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const registry = useRef<ShortcutRegistry>(new Map());

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in an input
    const target = e.target as HTMLElement;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;

    // Normalize shortcut string (e.g., "Ctrl+Shift+Z")
    const keys = [];
    if (e.ctrlKey || e.metaKey) keys.push('Ctrl');
    if (e.shiftKey) keys.push('Shift');
    if (e.altKey) keys.push('Alt');
    if (e.key && !['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      keys.push(e.key.toUpperCase());
    }

    const shortcutKey = keys.join('+').toUpperCase();
    const callbacks = registry.current.get(shortcutKey);

    if (callbacks && callbacks.length > 0) {
      e.preventDefault();
      callbacks.forEach(cb => cb(e));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const registerShortcut = useCallback((keys: string, callback: ShortcutCallback) => {
    const normalized = keys.toUpperCase();
    const current = registry.current.get(normalized) || [];
    registry.current.set(normalized, [...current, callback]);
  }, []);

  const unregisterShortcut = useCallback((keys: string, callback: ShortcutCallback) => {
    const normalized = keys.toUpperCase();
    const current = registry.current.get(normalized) || [];
    registry.current.set(normalized, current.filter(cb => cb !== callback));
  }, []);

  return (
    <ShortcutContext.Provider value={{ registerShortcut, unregisterShortcut }}>
      {children}
    </ShortcutContext.Provider>
  );
};
