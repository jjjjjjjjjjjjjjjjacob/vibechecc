import * as React from 'react'; // base React utilities

import { cn } from '../../utils/tailwind-utils'; // class name merger

/**
 * Styled textarea component with forwarded ref.
 * Mirrors the design of other input elements in the app.
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // base styles and focus ring handling
        'border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[60px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className // allow caller to override styles
      )}
      ref={ref} // expose DOM node to parent components
      {...props} // spread any additional textarea attributes
    />
  );
});
Textarea.displayName = 'Textarea'; // helpful for debugging in React DevTools

export { Textarea }; // named export for consistent import style
