import { useEffect } from 'react';

interface UseSearchShortcutsOptions {
  onOpen: () => void;
  onClose?: () => void;
  enabled?: boolean;
}

export function useSearchShortcuts({
  onOpen,
  onClose,
  enabled = true,
}: UseSearchShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }
      
      // Close with Escape
      if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onOpen, onClose, enabled]);
}