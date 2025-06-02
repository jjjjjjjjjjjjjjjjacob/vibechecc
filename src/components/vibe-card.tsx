import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardFooter } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { StarRating } from './star-rating';
import { cn } from '../utils/tailwind-utils';
import { SimpleVibePlaceholder } from './simple-vibe-placeholder';
import { useState } from 'react';
import { EmojiReactions } from './emoji-reaction';
import { useUser } from '@clerk/tanstack-react-start';
import type { Vibe, EmojiReaction } from '../types';

interface VibeCardProps {
  vibe: Vibe;
  compact?: boolean;
  preview?: boolean;
}

export function VibeCard({ vibe, compact, preview }: VibeCardProps) {
  const [imageError, setImageError] = useState(false);
  const [reactions, setReactions] = useState<EmojiReaction[]>(
    vibe.reactions || []
  );
  const { user } = useUser();

  // Calculate average rating
  const averageRating =
    vibe.ratings.length > 0
      ? vibe.ratings.reduce((sum, r) => sum + r.rating, 0) / vibe.ratings.length
      : 0;

  // Determine if we should use a placeholder
  const usePlaceholder = !vibe.image || imageError;

  // Extract context keywords from vibe for emoji suggestions
  const contextKeywords = React.useMemo(() => {
    const keywords: string[] = [];
    
    // Extract words from title and description
    const titleWords = vibe.title.toLowerCase().split(/\W+/).filter(word => word.length > 2);
    const descriptionWords = vibe.description?.toLowerCase().split(/\W+/).filter(word => word.length > 2) || [];
    
    keywords.push(...titleWords, ...descriptionWords);
    
    // Add some context-based keywords based on common patterns
    const title = vibe.title.toLowerCase();
    const description = vibe.description?.toLowerCase() || '';
    
    // Add contextual keywords based on content analysis
    if (title.includes('money') || title.includes('rich') || title.includes('expensive') || description.includes('money')) {
      keywords.push('money', 'rich', 'expensive');
    }
    if (title.includes('time') || title.includes('clock') || title.includes('fast') || description.includes('time')) {
      keywords.push('time', 'fast', 'speed');
    }
    if (title.includes('love') || title.includes('heart') || description.includes('love')) {
      keywords.push('love', 'heart');
    }
    if (title.includes('fire') || title.includes('hot') || description.includes('fire')) {
      keywords.push('fire', 'hot', 'amazing');
    }
    
    return [...new Set(keywords)]; // Remove duplicates
  }, [vibe.title, vibe.description]);

  // Handle emoji reactions
  const handleReact = (emoji: string) => {
    if (preview || !user?.id) return;

    // Find if this emoji already exists in reactions
    const existingReactionIndex = reactions.findIndex((r) => r.emoji === emoji);

    if (existingReactionIndex >= 0) {
      // Check if user already reacted with this emoji
      const existingReaction = reactions[existingReactionIndex];
      const userIndex = existingReaction.users.indexOf(user.id);

      if (userIndex >= 0) {
        // User already reacted, remove their reaction
        const updatedReaction = {
          ...existingReaction,
          count: Math.max(0, existingReaction.count - 1),
          users: existingReaction.users.filter((id) => id !== user.id),
        };

        // If no users left, remove the reaction entirely
        if (updatedReaction.users.length === 0) {
          setReactions(reactions.filter((r) => r.emoji !== emoji));
        } else {
          const newReactions = [...reactions];
          newReactions[existingReactionIndex] = updatedReaction;
          setReactions(newReactions);
        }
      } else {
        // User hasn't reacted with this emoji yet, add their reaction
        const updatedReaction = {
          ...existingReaction,
          count: existingReaction.count + 1,
          users: [...existingReaction.users, user.id],
        };

        const newReactions = [...reactions];
        newReactions[existingReactionIndex] = updatedReaction;
        setReactions(newReactions);
      }
    } else {
      // This emoji doesn't exist in reactions yet, add it
      setReactions([
        ...reactions,
        {
          emoji,
          count: 1,
          users: [user.id],
        },
      ]);
    }
  };

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200 hover:shadow-md',
        !compact && 'h-full'
      )}
    >
      {preview ? (
        <div className="block h-full">
          <div className="relative">
            <div
              className={cn(
                'relative overflow-hidden',
                compact ? 'aspect-[4/3]' : 'aspect-video'
              )}
            >
              {usePlaceholder ? (
                <SimpleVibePlaceholder title={vibe.title} />
              ) : (
                <img
                  src={vibe.image}
                  alt={vibe.title}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={() => setImageError(true)}
                />
              )}
            </div>
          </div>

          <CardContent className={cn('p-4', compact && 'p-3')}>
            <h3
              className={cn(
                'line-clamp-1 font-bold',
                compact ? 'text-base' : 'text-lg'
              )}
            >
              {vibe.title}
            </h3>

            {!compact && (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                {vibe.description}
              </p>
            )}
          </CardContent>

          <CardFooter
            className={cn(
              'flex flex-col items-start gap-2 p-4 pt-0',
              compact && 'p-3 pt-0'
            )}
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                {vibe.createdBy ? (
                  <>
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={vibe.createdBy.avatar}
                        alt={vibe.createdBy.name}
                      />
                      <AvatarFallback>
                        {vibe.createdBy.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground text-xs">
                      {vibe.createdBy.name}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    Unknown User
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <StarRating value={averageRating} readOnly size="sm" />
                <span className="text-xs font-medium">
                  {averageRating > 0 ? averageRating.toFixed(1) : '-'}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({vibe.ratings.length})
                </span>
              </div>
            </div>

            {reactions.length > 0 && (
              <div
                className="w-full"
                onClick={(e) => {
                  // Prevent navigation when clicking reactions
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <EmojiReactions
                  reactions={reactions}
                  onReact={handleReact}
                  showAddButton={!preview}
                  contextKeywords={contextKeywords}
                />
              </div>
            )}
          </CardFooter>
        </div>
      ) : (
        <Link
          to="/vibes/$vibeId"
          params={{ vibeId: vibe.id }}
          className="block h-full"
        >
          <div className="relative">
            <div
              className={cn(
                'relative overflow-hidden',
                compact ? 'aspect-[4/3]' : 'aspect-video'
              )}
            >
              {usePlaceholder ? (
                <SimpleVibePlaceholder title={vibe.title} />
              ) : (
                <img
                  src={vibe.image}
                  alt={vibe.title}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={() => setImageError(true)}
                />
              )}
            </div>
          </div>

          <CardContent className={cn('p-4', compact && 'p-3')}>
            <h3
              className={cn(
                'line-clamp-1 font-bold',
                compact ? 'text-base' : 'text-lg'
              )}
            >
              {vibe.title}
            </h3>

            {!compact && (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                {vibe.description}
              </p>
            )}
          </CardContent>

          <CardFooter
            className={cn(
              'flex flex-col items-start gap-2 p-4 pt-0',
              compact && 'p-3 pt-0'
            )}
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                {vibe.createdBy ? (
                  <>
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={vibe.createdBy.avatar}
                        alt={vibe.createdBy.name}
                      />
                      <AvatarFallback>
                        {vibe.createdBy.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground text-xs">
                      {vibe.createdBy.name}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    Unknown User
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <StarRating value={averageRating} readOnly size="sm" />
                <span className="text-xs font-medium">
                  {averageRating > 0 ? averageRating.toFixed(1) : '-'}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({vibe.ratings.length})
                </span>
              </div>
            </div>

            {reactions.length > 0 && (
              <div
                className="w-full"
                onClick={(e) => {
                  // Prevent navigation when clicking reactions
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <EmojiReactions
                  reactions={reactions}
                  onReact={handleReact}
                  showAddButton={!preview}
                  contextKeywords={contextKeywords}
                />
              </div>
            )}
          </CardFooter>
        </Link>
      )}
    </Card>
  );
}
