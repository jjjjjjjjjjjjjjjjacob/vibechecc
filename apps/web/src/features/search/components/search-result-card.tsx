import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import type { SearchResult, VibeSearchResult, UserSearchResult, TagSearchResult } from '@vibechecc/types';

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
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 h-full">
        {/* Image with badge overlay */}
        <div className="aspect-[4/3] relative bg-muted">
          {result.image ? (
            <img 
              src={result.image} 
              alt={result.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">🎭</span>
            </div>
          )}
          <Badge className="absolute top-3 left-3 bg-black/70 text-white border-0">
            VIBE
          </Badge>
        </div>
        
        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-1 hover:text-primary transition-colors">
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
                <span className="text-sm font-medium ml-1">
                  {result.rating.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({result.ratingCount || 0} reviews)
                </span>
              </>
            )}
          </div>
          
          {/* Creator */}
          {result.createdBy && (
            <div className="text-sm text-muted-foreground">
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
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 h-full">
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={result.image} />
            <AvatarFallback>{result.title?.[0] || '?'}</AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-semibold text-lg">{result.title}</h3>
            <p className="text-sm text-muted-foreground">@{result.username}</p>
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
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 h-full">
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-3xl">#</span>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg">#{result.title}</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {result.count} {result.count === 1 ? 'vibe' : 'vibes'}
            </p>
          </div>
          
          <Badge variant="secondary">TAG</Badge>
        </div>
      </Card>
    </Link>
  );
}