import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * Wrapper around the Sonner toaster with project-wide default styling.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          // default toast surface and text colors
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          // primary button within toast
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          // secondary cancel button
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
