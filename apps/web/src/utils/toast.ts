import { toast as sonnerToast } from 'sonner';

/**
 * Configuration options accepted by each toast helper. These map to the
 * options supported by the `sonner` library but keep types explicit so
 * callers know what values are allowed.
 */
interface ToastOptions {
  duration?: number; // how long the toast should stay visible in ms
  icon?: string; // optional emoji/icon rendered alongside the message
  id?: string | number; // identifier to allow dismissing a specific toast
  className?: string; // additional class names for custom styling
  action?: {
    label: string; // text for an optional action button
    onClick: () => void; // handler when the action button is clicked
  };
}

/**
 * Thin wrapper around `sonner` providing semantic helpers for common toast
 * types. Each helper simply forwards to `sonner` with the provided options.
 */
export const toast = {
  /** show a green success toast */
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      // forward custom settings through to the underlying library
      duration: options?.duration,
      icon: options?.icon,
      id: options?.id,
      className: options?.className,
      action: options?.action,
    });
  },

  /** show a red error toast to indicate a problem */
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      duration: options?.duration,
      icon: options?.icon,
      id: options?.id,
      className: options?.className,
      action: options?.action,
    });
  },

  /** show an informational toast */
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      duration: options?.duration,
      icon: options?.icon,
      id: options?.id,
      className: options?.className,
      action: options?.action,
    });
  },

  /** render a persistent loading toast that must be dismissed manually */
  loading: (message: string, options?: { id?: string | number }) => {
    return sonnerToast.loading(message, options);
  },

  /** dismiss a toast by id or clear all when no id is provided */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  /** generic toast when a specific style is not required */
  default: (message: string, options?: ToastOptions) => {
    return sonnerToast(message, {
      duration: options?.duration,
      icon: options?.icon,
      id: options?.id,
      className: options?.className,
      action: options?.action,
    });
  },
};

// Export a callable function that also exposes the named helpers above
export default Object.assign(
  (
    message: string,
    options?: { duration?: number; icon?: string; className?: string }
  ) => toast.default(message, options),
  toast,
);

