import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  duration?: number;
  icon?: string;
  id?: string | number;
  className?: string;
}

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      duration: options?.duration,
      icon: options?.icon,
      id: options?.id,
      className: options?.className,
    });
  },
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      duration: options?.duration,
      icon: options?.icon,
      id: options?.id,
      className: options?.className,
    });
  },
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      duration: options?.duration,
      icon: options?.icon,
      id: options?.id,
      className: options?.className,
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
