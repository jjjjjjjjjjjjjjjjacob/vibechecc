import { forwardRef } from 'react';

/**
 * Button component used to cancel dialogs or forms.
 * It forwards its ref for parent components to control focus.
 */
export const CancelButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>((props, ref) => {
  return (
    <button
      // Allow parent components to access the DOM node
      ref={ref}
      // Ensure the button never submits a form implicitly
      type="button"
      // Make the element focusable for keyboard navigation
      tabIndex={0}
      // Pass any additional props to the native button
      {...props}
      // Apply consistent styling for the cancel action
      className="rounded-lg p-2 text-left text-sm font-medium hover:bg-slate-200 focus:bg-slate-200"
    />
  );
});
