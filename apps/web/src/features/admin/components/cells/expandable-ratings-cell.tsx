import * as React from 'react';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/tailwind-utils';

interface Rating {
  _id?: string;
  userId: string;
  user?: {
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  emoji: string;
  value: number;
  review: string;
  createdAt: string;
}

interface ExpandableRatingsCellProps {
  ratings: Rating[];
  className?: string;
  previewCount?: number;
}

export function ExpandableRatingsCell({
  ratings = [],
  className,
  previewCount = 3,
}: ExpandableRatingsCellProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  if (!ratings || ratings.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">no ratings</span>
    );
  }

  const avgRating = Math.round(
    (ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length) * 10
  ) / 10;

  const displayRatings = isExpanded ? ratings : ratings.slice(0, previewCount);
  const hasMore = ratings.length > previewCount;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm">{avgRating}★</span>
          <span className="text-xs text-muted-foreground">
            ({ratings.length} rating{ratings.length !== 1 ? 's' : ''})
          </span>
        </div>
        {hasMore && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 px-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                expand
              </>
            )}
          </Button>
        )}
      </div>

      {/* Ratings list */}
      <div className="space-y-1">
        {displayRatings.map((rating, index) => {
          const userName = rating.user?.username || 
            `${rating.user?.first_name || ''} ${rating.user?.last_name || ''}`.trim() || 
            'anonymous';
          
          return (
            <div
              key={rating._id || index}
              className="flex flex-col space-y-1 p-2 rounded bg-muted/30 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {rating.emoji} {rating.value}★
                  </Badge>
                  <span className="text-muted-foreground">
                    by {userName}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(rating.createdAt).toLocaleDateString()}
                </span>
              </div>
              {rating.review && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {rating.review}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more indicator when collapsed */}
      {!isExpanded && ratings.length > previewCount && (
        <div className="text-xs text-muted-foreground text-center">
          +{ratings.length - previewCount} more rating{ratings.length - previewCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}