import { forwardRef } from 'react'; // expose ref from button to parent components

/**
 * Simple button used for save actions across the app.
 * Forwarding the ref lets callers imperatively focus the element when needed.
 */
export const SaveButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>((props, ref) => {
  return (
    <button
      ref={ref} // pass through the ref so parents can access the button element directly
      // safari doesn't focus a button after click by default; assigning a
      // tab index forces the element to be focusable which restores expected behavior
      tabIndex={0}
      {...props} // allow consumers to override any default button props
      // rounded corners, blue background, padding, left-aligned label, small font size
      // and white text create a consistent visual style
      className="rounded-lg bg-blue-500 p-2 text-left text-sm font-medium text-white"
    />
  );
});
