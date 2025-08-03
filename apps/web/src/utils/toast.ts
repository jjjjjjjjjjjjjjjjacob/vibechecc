import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  duration?: number;
  icon?: string;
  id?: string | number;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      duration: options?.duration,
      icon: options?.icon,
      id: options?.id,
      className: options?.className,
      action: options?.action,
    });
  },
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      duration: options?.duration,
      icon: options?.icon,
      id: options?.id,
      className: options?.className,
      action: options?.action,
    });
  },
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      duration: options?.duration,
      icon: options?.icon,
      id: options?.id,
      className: options?.className,
      action: options?.action,
    });
  },
  loading: (message: string, options?: { id?: string | number }) => {
    return sonnerToast.loading(message, options);
  },
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
  // Default toast function
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

// Make default function callable directly
export default Object.assign(
  (
    message: string,
    options?: { duration?: number; icon?: string; className?: string }
  ) => toast.default(message, options),
  toast
);
