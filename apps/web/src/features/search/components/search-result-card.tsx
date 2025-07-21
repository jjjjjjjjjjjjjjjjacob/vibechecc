import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import type {
  SearchResult,
  VibeSearchResult,
  UserSearchResult,
  TagSearchResult,
} from '@vibechecc/types';

interface SearchResultCardProps {
  result: SearchResult;
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  if (result.type === 'vibe') {
    return <VibeResultCard result={result as VibeSearchResult} />;
  }

  if (result.type === 'user') {
    return <UserResultCard result={result as UserSearchResult} />;
  }

  if (result.type === 'tag') {
    return <TagResultCard result={result as TagSearchResult} />;
  }

  return null;
}

function VibeResultCard({ result }: { result: VibeSearchResult }) {
  return (
    <Link to="/vibes/$vibeId" params={{ vibeId: result.id }}>
      <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-lg">
        {/* Image with badge overlay */}
        <div className="bg-muted relative aspect-[4/3]">
          {result.image ? (
            <img
              src={result.image}
              alt={result.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-4xl">🎭</span>
            </div>
          )}
          <Badge className="absolute top-3 left-3 border-0 bg-black/70 text-white">
            VIBE
          </Badge>
        </div>

        <CardContent className="space-y-3 p-4">
          {/* Title */}
          <h3 className="hover:text-primary line-clamp-1 text-lg font-semibold transition-colors">
            {result.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${result.rating && i < Math.floor(result.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            {result.rating && (
              <>
                <span className="ml-1 text-sm font-medium">
                  {result.rating.toFixed(1)}
                </span>
                <span className="text-muted-foreground text-sm">
                  ({result.ratingCount || 0} reviews)
                </span>
              </>
            )}
          </div>

          {/* Creator */}
          {result.createdBy && (
            <div className="text-muted-foreground text-sm">
              Created by {result.createdBy.name}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function UserResultCard({ result }: { result: UserSearchResult }) {
  return (
    <Link to="/users/$username" params={{ username: result.username }}>
      <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-lg">
        <div className="flex flex-col items-center space-y-4 p-6 text-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={result.image} />
            <AvatarFallback>{result.title?.[0] || '?'}</AvatarFallback>
          </Avatar>

          <div>
            <h3 className="text-lg font-semibold">{result.title}</h3>
            <p className="text-muted-foreground text-sm">@{result.username}</p>
          </div>

          <div className="flex gap-4 text-sm">
            <div>
              <p className="font-semibold">{result.vibeCount}</p>
              <p className="text-muted-foreground">Vibes</p>
            </div>
            <div>
              <p className="font-semibold">{result.followerCount || 0}</p>
              <p className="text-muted-foreground">Followers</p>
            </div>
          </div>

          <Badge variant="secondary">USER</Badge>
        </div>
      </Card>
    </Link>
  );
}

function TagResultCard({ result }: { result: TagSearchResult }) {
  return (
    <Link to="/search" search={{ tags: [result.title] }}>
      <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-lg">
        <div className="flex flex-col items-center space-y-4 p-6 text-center">
          <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full">
            <span className="text-3xl">#</span>
          </div>

          <div>
            <h3 className="text-lg font-semibold">#{result.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {result.count} {result.count === 1 ? 'vibe' : 'vibes'}
            </p>
          </div>

          <Badge variant="secondary">TAG</Badge>
        </div>
      </Card>
    </Link>
  );
}
