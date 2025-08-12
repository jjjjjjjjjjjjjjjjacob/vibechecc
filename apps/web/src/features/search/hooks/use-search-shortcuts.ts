import { useEffect } from 'react';

/**
 * Configuration options for `useSearchShortcuts`.
 *
 * @property onOpen - callback fired when the shortcut requests the search UI to open
 * @property onClose - optional callback fired when the shortcut requests closing
 * @property enabled - when false, no listeners are registered
 */
interface UseSearchShortcutsOptions {
  /** callback executed when cmd/ctrl+k is pressed */
  onOpen: () => void;
  /** optional callback executed when escape is pressed */
  onClose?: () => void;
  /** flag to toggle keyboard listener registration */
  enabled?: boolean;
}

/**
 * Registers global keyboard handlers that open or close the search dialog.
 *
 * Listens for cmd/ctrl+k to open the interface and for escape to close it when
 * an `onClose` handler is supplied. Listeners are removed on cleanup.
 */
export function useSearchShortcuts({
  onOpen,
  onClose,
  enabled = true,
}: UseSearchShortcutsOptions) {
  useEffect(() => {
    // exit early when shortcuts are disabled
    if (!enabled) return;

    // respond to keyboard events that open or close search
    const handleKeyDown = (e: KeyboardEvent) => {
      // open the search interface with cmd/ctrl+k
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }

      // close the interface with escape when an onClose handler exists
      if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        onClose();
      }
    };

    // bind the handler to global keydown events
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      // clean up listener on unmount or when deps change
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onOpen, onClose, enabled]);
}
