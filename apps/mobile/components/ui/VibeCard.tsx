import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardFooter } from './Card';
import { Avatar, AvatarImage, AvatarFallback } from './Avatar';
import { Badge } from './Badge';
import { Skeleton } from './Skeleton';

const vibeCardVariants = cva('relative overflow-hidden', {
  variants: {
    variant: {
      default: 'h-full',
      compact: 'h-32',
      'feed-grid': 'h-full',
      'feed-masonry': 'h-full break-inside-avoid',
      'feed-single': 'h-full',
      list: 'h-24',
    },
    size: {
      sm: 'w-full',
      default: 'w-full',
      lg: 'w-full',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

const vibeImageVariants = cva('w-full object-cover', {
  variants: {
    variant: {
      default: 'aspect-video',
      compact: 'aspect-[4/3]',
      'feed-grid': 'aspect-[3/4]',
      'feed-masonry': 'aspect-[3/4]',
      'feed-single': 'aspect-[9/16]',
      list: 'h-full',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface VibeCardProps extends VariantProps<typeof vibeCardVariants> {
  vibe?: {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    tags?: string[];
    createdBy?: {
      id: string;
      username?: string;
      full_name?: string;
      avatar_url?: string;
    };
    rating?: {
      emoji: string;
      value: number;
      count: number;
    };
    shareCount?: number;
  };
  loading?: boolean;
  className?: string;
  style?: any; // Allow style prop for animations
  onPress?: () => void;
  onUserPress?: () => void;
  onSharePress?: () => void;
  onRatingPress?: () => void;
}

function VibeCardSkeleton({ variant }: { variant: VibeCardProps['variant'] }) {
  return (
    <Card
      className={cn(
        vibeCardVariants({ variant }),
        'bg-card/20 border-border/50'
      )}
    >
      {/* Avatar skeleton */}
      <View className="absolute left-2 top-2 z-10">
        <Skeleton shape="circle" className="h-6 w-6" />
      </View>

      {/* Image skeleton */}
      <Skeleton
        className={cn(vibeImageVariants({ variant }))}
        shape="rectangle"
      />

      {/* Content skeleton */}
      <CardContent className="p-standard-sm">
        <Skeleton className="mb-2 h-5 w-3/4" />
        {variant !== 'compact' && (
          <>
            <Skeleton className="mb-1 h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </>
        )}
      </CardContent>

      {/* Footer skeleton */}
      <CardFooter className="p-standard-sm pt-0">
        <View className="flex flex-row items-center gap-2">
          <Skeleton shape="circle" className="h-8 w-8" />
          <View className="flex flex-col gap-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </View>
        </View>
      </CardFooter>
    </Card>
  );
}

export function VibeCard({
  vibe,
  variant = 'default',
  size = 'default',
  loading = false,
  className,
  onPress,
  onUserPress,
  onSharePress,
  onRatingPress,
}: VibeCardProps) {
  if (loading) {
    return <VibeCardSkeleton variant={variant} />;
  }

  if (!vibe) return null;

  const getUserInitials = (user: VibeCardProps['vibe']['createdBy']) => {
    if (!user) return '?';
    if (user.full_name) {
      return user.full_name
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return '?';
  };

  const getUserDisplayName = (user: VibeCardProps['vibe']['createdBy']) => {
    if (!user) return 'Unknown';
    return user.full_name || user.username || 'Unknown';
  };

  // List variant has different layout
  if (variant === 'list') {
    return (
      <TouchableOpacity
        onPress={onPress}
        className={cn(
          'group relative h-24 overflow-hidden rounded-lg',
          className
        )}
        activeOpacity={0.95}
      >
        <ImageBackground
          source={{ uri: vibe.imageUrl }}
          className="h-full w-full"
          imageStyle={{ borderRadius: 8 }}
        >
          {/* Gradient overlay */}
          <View className="gradient-overlay-dark absolute inset-0" />

          {/* Content overlay */}
          <View className="relative z-10 flex h-full flex-row items-center justify-between p-4">
            {/* Left side: Avatar and title */}
            <View className="flex min-w-0 flex-1 flex-row items-center gap-3">
              {vibe.createdBy && (
                <TouchableOpacity onPress={onUserPress} activeOpacity={0.8}>
                  <Avatar size="default" className="border-2 border-white/20">
                    <AvatarImage
                      source={{ uri: vibe.createdBy.avatar_url }}
                      alt={getUserDisplayName(vibe.createdBy)}
                    />
                    <AvatarFallback className="bg-background/50">
                      {getUserInitials(vibe.createdBy)}
                    </AvatarFallback>
                  </Avatar>
                </TouchableOpacity>
              )}
              <View className="min-w-0 flex-1">
                <Text className="line-clamp-1 text-base font-bold text-white">
                  {vibe.title}
                </Text>
                <Text className="line-clamp-1 text-sm text-white/70">
                  {getUserDisplayName(vibe.createdBy)}
                </Text>
              </View>
            </View>

            {/* Right side: Rating display */}
            <View className="ml-4 flex-shrink-0">
              {vibe.rating ? (
                <TouchableOpacity
                  onPress={onRatingPress}
                  className="flex flex-row items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm"
                  activeOpacity={0.8}
                >
                  <Text className="text-lg">{vibe.rating.emoji}</Text>
                  <View className="flex flex-col">
                    <Text className="text-sm font-medium text-white">
                      {vibe.rating.value.toFixed(1)}
                    </Text>
                    <Text className="text-xs text-white/50">
                      {vibe.rating.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={onRatingPress}
                  className="rounded-full bg-white/10 px-3 py-2 backdrop-blur-sm"
                  activeOpacity={0.8}
                >
                  <Text className="text-sm text-white/70">rate this</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  // Standard card variants
  return (
    <Card
      className={cn(
        vibeCardVariants({ variant, size }),
        'bg-card/20 border-border/50',
        className
      )}
    >
      {/* Avatar positioned absolutely in upper left corner */}
      {vibe.createdBy && (
        <View className="absolute left-2 top-2 z-10">
          <TouchableOpacity onPress={onUserPress} activeOpacity={0.8}>
            <Avatar size="sm" className="shadow-md">
              <AvatarImage
                source={{ uri: vibe.createdBy.avatar_url }}
                alt={getUserDisplayName(vibe.createdBy)}
              />
              <AvatarFallback className="bg-background/50 border-none">
                {getUserInitials(vibe.createdBy)}
              </AvatarFallback>
            </Avatar>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity onPress={onPress} activeOpacity={0.95}>
        {/* Image */}
        <View className="relative overflow-hidden">
          {vibe.imageUrl ? (
            <Image
              source={{ uri: vibe.imageUrl }}
              className={cn(vibeImageVariants({ variant }))}
              resizeMode="cover"
            />
          ) : (
            <View
              className={cn(
                vibeImageVariants({ variant }),
                'bg-muted flex items-center justify-center'
              )}
            >
              <Text className="text-muted-foreground text-sm">
                {vibe.title}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <CardContent
          className={cn('p-standard-sm', variant === 'compact' && 'p-2')}
        >
          <View
            className={cn(
              'flex flex-row items-start justify-between gap-2',
              variant === 'compact' && 'items-center'
            )}
          >
            <Text
              className={cn(
                'flex-1 font-bold leading-tight',
                variant === 'feed-masonry' || variant === 'feed-single'
                  ? 'line-clamp-3 text-lg'
                  : variant === 'compact'
                    ? 'line-clamp-1 text-base'
                    : 'line-clamp-1 text-lg'
              )}
            >
              {vibe.title}
            </Text>

            {/* Share button for compact variant */}
            {variant === 'compact' && (
              <TouchableOpacity onPress={onSharePress} activeOpacity={0.8}>
                <Text className="text-primary">Share</Text>
              </TouchableOpacity>
            )}
          </View>

          {variant !== 'compact' && vibe.description && (
            <Text
              className={cn(
                'text-muted-foreground mt-2 text-sm leading-relaxed',
                variant === 'feed-masonry' || variant === 'feed-single'
                  ? 'line-clamp-5'
                  : 'line-clamp-2'
              )}
            >
              {vibe.description}
            </Text>
          )}
        </CardContent>
      </TouchableOpacity>

      {/* Footer */}
      <CardFooter
        className={cn(
          'p-standard-sm flex flex-col items-start gap-3 pt-0',
          variant === 'compact' && 'gap-2'
        )}
      >
        {/* Rating Display */}
        <View className="w-full">
          {vibe.rating ? (
            <TouchableOpacity
              onPress={onRatingPress}
              className="flex flex-row items-center gap-2"
              activeOpacity={0.8}
            >
              <Text className="text-2xl">{vibe.rating.emoji}</Text>
              <View className="flex flex-col">
                <Text className="text-sm font-semibold">
                  {vibe.rating.value.toFixed(1)} stars
                </Text>
                <Text className="text-muted-foreground text-xs">
                  {vibe.rating.count} rating{vibe.rating.count !== 1 ? 's' : ''}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onRatingPress}
              className="bg-secondary/50 self-start rounded-full px-3 py-1"
              activeOpacity={0.8}
            >
              <Text className="text-muted-foreground text-sm font-medium">
                be the first to rate
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tags and Share Button */}
        {variant !== 'compact' && (
          <View className="flex w-full flex-row items-center justify-between gap-2">
            {/* Tags */}
            <View className="flex flex-1 flex-row flex-wrap gap-1">
              {vibe.tags && vibe.tags.length > 0
                ? vibe.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                    >
                      #{tag}
                    </Badge>
                  ))
                : null}
            </View>

            {/* Share Button */}
            <TouchableOpacity onPress={onSharePress} activeOpacity={0.8}>
              <Text className="text-primary text-sm">Share</Text>
            </TouchableOpacity>
          </View>
        )}
      </CardFooter>
    </Card>
  );
}
