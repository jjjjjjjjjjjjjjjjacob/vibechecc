import { forwardRef } from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { VibeResult } from './result-items/vibe-result';
import { UserResult } from './result-items/user-result';
import { TagResult } from './result-items/tag-result';
import type {
  VibeSearchResult,
  UserSearchResult,
  TagSearchResult,
} from '@vibechecc/types';

interface InstantSearchPreviewProps {
  isVisible: boolean;
  isLoading: boolean;
  results?: {
    vibes: VibeSearchResult[];
    users: UserSearchResult[];
    tags: TagSearchResult[];
  };
  query: string;
  onResultClick?: () => void;
}

export const InstantSearchPreview = forwardRef<
  HTMLDivElement,
  InstantSearchPreviewProps
>(({ isVisible, isLoading, results, query, onResultClick }, ref) => {
  if (!isVisible) return null;

  const hasResults =
    results &&
    (results.vibes.length > 0 ||
      results.users.length > 0 ||
      results.tags.length > 0);

  return (
    <Card
      ref={ref}
      className="absolute top-full right-0 left-0 z-50 mt-2 shadow-lg"
    >
      <ScrollArea className="max-h-[400px]">
        {isLoading ? (
          <CardContent className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        ) : hasResults ? (
          <>
            {results.vibes.length > 0 && (
              <div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Vibes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 pb-2">
                  {results.vibes.map((vibe) => (
                    <Link
                      key={vibe.id}
                      to="/vibe/$id"
                      params={{ id: vibe.id }}
                      onClick={onResultClick}
                      className="block"
                    >
                      <div className="hover:bg-muted rounded-md p-2 transition-colors">
                        <div className="font-medium">{vibe.title}</div>
                        <div className="text-muted-foreground text-sm">
                          {vibe.subtitle}
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </div>
            )}

            {results.users.length > 0 && (
              <div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Users</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 pb-2">
                  {results.users.map((user) => (
                    <Link
                      key={user.id}
                      to="/profile/$id"
                      params={{ id: user.id }}
                      onClick={onResultClick}
                      className="block"
                    >
                      <div className="hover:bg-muted flex items-center gap-2 rounded-md p-2 transition-colors">
                        {user.image && (
                          <img
                            src={user.image}
                            alt={user.title}
                            className="h-8 w-8 rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-medium">{user.title}</div>
                          <div className="text-muted-foreground text-sm">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </div>
            )}

            {results.tags.length > 0 && (
              <div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 pb-2">
                  {results.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      to="/search"
                      search={{ q: '', tags: [tag.title] }}
                      onClick={onResultClick}
                      className="block"
                    >
                      <div className="hover:bg-muted rounded-md p-2 transition-colors">
                        <div className="font-medium">#{tag.title}</div>
                        <div className="text-muted-foreground text-sm">
                          {tag.subtitle}
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </div>
            )}

            <CardContent className="border-t pt-2 pb-3">
              <Link
                to="/search"
                search={{ q: query }}
                onClick={onResultClick}
                className="text-primary text-sm hover:underline"
              >
                View all results for "{query}"
              </Link>
            </CardContent>
          </>
        ) : (
          <CardContent className="text-muted-foreground p-4 text-center">
            No results found for "{query}"
          </CardContent>
        )}
      </ScrollArea>
    </Card>
  );
});

InstantSearchPreview.displayName = 'InstantSearchPreview';
