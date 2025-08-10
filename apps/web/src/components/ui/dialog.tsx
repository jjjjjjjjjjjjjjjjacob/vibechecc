'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';

import { cn } from '@/utils/tailwind-utils';

type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root>;

function Dialog({ ...props }: DialogProps) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  scaleFactor = 1,
  scaleOffset = '14px',
  shouldScaleBackground = false,
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay> & {
  scaleFactor?: number;
  scaleOffset?: string;
  shouldScaleBackground?: boolean;
}) {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!shouldScaleBackground) return;

    const vaulOpen = !!document.querySelector('[data-vaul-drawer]');
    const wrapper = document.querySelector(
      '[data-vaul-drawer-wrapper]'
    ) as HTMLElement | null;
    if (vaulOpen || !wrapper) return;

    const TRANSITION = '0.5s cubic-bezier(0.32, 0.72, 0, 1)';
    const BORDER_RADIUS = 8;
    const WINDOW_TOP_OFFSET = 26;

    const prev = {
      transformOrigin: wrapper.style.transformOrigin,
      transitionProperty: wrapper.style.transitionProperty,
      transitionDuration: wrapper.style.transitionDuration,
      transitionTimingFunction: wrapper.style.transitionTimingFunction,
      borderRadius: wrapper.style.borderRadius,
      overflow: wrapper.style.overflow,
      transform: wrapper.style.transform,
    };
    const prevBodyBg = document.body.style.background;

    const scale =
      Math.abs(window.innerWidth - WINDOW_TOP_OFFSET * scaleFactor) /
      window.innerWidth;
    wrapper.style.transformOrigin = 'top';
    wrapper.style.transitionProperty = 'transform, border-radius';
    wrapper.style.transitionDuration = TRANSITION.split(' ')[0];
    wrapper.style.transitionTimingFunction = TRANSITION.split(' ')
      .slice(1)
      .join(' ');
    wrapper.style.borderRadius = `${BORDER_RADIUS}px`;
    wrapper.style.overflow = 'hidden';
    wrapper.style.transform = `scale(${scale}) translate3d(0, calc(env(safe-area-inset-top) + ${scaleOffset}), 0)`;

    // Darken the page background behind the overlay similarly to drawer behavior
    try {
      const root = document.documentElement;
      const cssBg = getComputedStyle(root)
        .getPropertyValue('--background')
        .trim();
      if (cssBg) {
        document.body.style.background = cssBg;
      }
    } catch {}

    return () => {
      wrapper.style.transformOrigin = prev.transformOrigin;
      wrapper.style.transitionProperty = prev.transitionProperty;
      wrapper.style.transitionDuration = prev.transitionDuration;
      wrapper.style.transitionTimingFunction = prev.transitionTimingFunction;
      wrapper.style.borderRadius = prev.borderRadius;
      wrapper.style.overflow = prev.overflow;
      wrapper.style.transform = prev.transform;
      document.body.style.background = prevBodyBg;
    };
  }, [shouldScaleBackground, scaleFactor, scaleOffset]);

  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 backdrop-blur-2xs fixed inset-0 z-50 backdrop-blur-[2px]',
        className
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  container,
  showCloseButton = true,
  scaleFactor,
  scaleOffset,
  shouldScaleBackground = false,
  dialogOverlayClassName,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  container?: HTMLElement;
  showCloseButton?: boolean;
  dialogOverlayClassName?: string;
  scaleFactor?: number;
  scaleOffset?: string;
  shouldScaleBackground?: boolean;
}) {
  return (
    <DialogPortal data-slot="dialog-portal" container={container}>
      <DialogOverlay
        scaleFactor={scaleFactor}
        className={dialogOverlayClassName}
        shouldScaleBackground={shouldScaleBackground}
        scaleOffset={scaleOffset}
      />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
