import { forwardRef } from 'react';

export const CancelButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>((props, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      tabIndex={0}
      {...props}
      className="hover:bg-muted focus:bg-muted rounded-lg p-2 text-left text-sm font-medium"
    />
  );
});
