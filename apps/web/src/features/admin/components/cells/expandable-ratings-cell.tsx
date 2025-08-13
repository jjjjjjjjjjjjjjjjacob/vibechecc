import * as React from 'react';
import { ChevronDown, ChevronUp } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/tailwind-utils';
import type { Rating } from '@viberatr/types';

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
    return <span className="text-muted-foreground text-sm">no ratings</span>;
  }

  const avgRating =
    Math.round(
      (ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length) * 10
    ) / 10;

  const displayRatings = isExpanded ? ratings : ratings.slice(0, previewCount);
  const hasMore = ratings.length > previewCount;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{avgRating}★</span>
          <span className="text-muted-foreground text-xs">
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
                <ChevronUp className="mr-1 h-3 w-3" />
                collapse
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-3 w-3" />
                expand
              </>
            )}
          </Button>
        )}
      </div>

      {/* Ratings list */}
      <div className="space-y-1">
        {displayRatings.map((rating, index) => {
          const userName =
            rating.user?.username ||
            `${rating.user?.first_name || ''} ${rating.user?.last_name || ''}`.trim() ||
            'anonymous';

          return (
            <div
              key={rating._id || index}
              className="bg-muted/30 flex flex-col space-y-1 rounded p-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="px-1.5 py-0 text-xs">
                    {rating.emoji} {rating.value}★
                  </Badge>
                  <span className="text-muted-foreground">by {userName}</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  {new Date(rating.createdAt).toLocaleDateString()}
                </span>
              </div>
              {rating.review && (
                <p className="text-muted-foreground line-clamp-2 text-xs">
                  {rating.review}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more indicator when collapsed */}
      {!isExpanded && ratings.length > previewCount && (
        <div className="text-muted-foreground text-center text-xs">
          +{ratings.length - previewCount} more rating
          {ratings.length - previewCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
