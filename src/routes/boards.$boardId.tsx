import { createFileRoute } from '@tanstack/react-router';
import { Board } from '@/components/board';
import { Skeleton } from '@/components/ui/skeleton';
import { boardQueries } from '@/queries';

export const Route = createFileRoute('/boards/$boardId')({
  component: Home,
  pendingComponent: () => (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    </div>
  ),
  loader: async ({ params, context: { queryClient } }) => {
    await queryClient.ensureQueryData(boardQueries.detail(params.boardId));
  },
});

function Home() {
  const { boardId } = Route.useParams();

  return <Board boardId={boardId} />;
}
