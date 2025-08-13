import { AlertCircle } from '@/components/ui/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface SearchErrorProps {
  error: Error | unknown;
  onRetry?: () => void;
}

export function SearchError({ error, onRetry }: SearchErrorProps) {
  const errorMessage =
    error instanceof Error ? error.message : 'An unexpected error occurred';

  return (
    <Alert variant="destructive" className="mx-auto max-w-2xl">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Search Error</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>We encountered an error while searching:</p>
        <p className="bg-destructive/10 rounded p-2 font-mono text-sm">
          {errorMessage}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2"
          >
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
