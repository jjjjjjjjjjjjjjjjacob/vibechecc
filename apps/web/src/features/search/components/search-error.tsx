// icon used to visually indicate that something went wrong during search
import { AlertCircle } from 'lucide-react';
// alert primitives that style the error container and text
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// button for offering a retry action
import { Button } from '@/components/ui/button';

/**
 * Props for {@link SearchError} describing the failure and optional recovery
 * handler.
 */
interface SearchErrorProps {
  /** the error thrown from a search request */
  error: Error | unknown;
  /** optional callback to rerun the search when the user clicks retry */
  onRetry?: () => void;
}

/**
 * Renders a descriptive error alert when search operations fail. The message is
 * derived from the thrown error when available and falls back to a generic
 * description otherwise. A retry button is shown if a handler is provided.
 */
export function SearchError({ error, onRetry }: SearchErrorProps) {
  // prefer the specific error message, defaulting to a generic description
  const errorMessage =
    error instanceof Error ? error.message : 'an unexpected error occurred';

  return (
    // outer alert container styled as destructive to emphasize the failure
    <Alert variant="destructive" className="mx-auto max-w-2xl">
      {/* icon reinforces the error state visually */}
      <AlertCircle className="h-4 w-4" />
      {/* concise title for screen readers and visual users */}
      <AlertTitle>search error</AlertTitle>
      {/* description area contains the detailed message and retry action */}
      <AlertDescription className="space-y-2">
        {/* short explanation preceding the actual error text */}
        <p>we encountered an error while searching:</p>
        {/* display the message in a monospace block for readability */}
        <p className="bg-destructive/10 rounded p-2 font-mono text-sm">
          {errorMessage}
        </p>
        {/* if a retry handler is supplied, render a button to trigger it */}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2"
          >
            {/* keep call-to-action lowercase for consistency */}
            try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
