import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users, X } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useFollowers } from '../hooks/use-followers';
import { FollowButton } from './follow-button';
import type { User } from '@viberater/types';

interface _Follower {
  user: User | null;
  followedAt: number;
  mutualConnections?: number;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username?: string;
}

export function FollowersModal({
  isOpen,
  onClose,
  userId,
  username,
}: FollowersModalProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const { data, isLoading, loadMore, hasMore } = useFollowers(userId, {
    enabled: isOpen,
  });

  // Filter followers based on search query
  const filteredFollowers = React.useMemo(() => {
    if (!searchQuery.trim()) return data.followers;

    const query = searchQuery.toLowerCase().trim();
    return data.followers.filter((follower) => {
      const user = follower.user;
      if (!user) return false;

      const displayName =
        `${user.first_name || ''} ${user.last_name || ''}`.trim();
      const username = user.username || '';

      return (
        displayName.toLowerCase().includes(query) ||
        username.toLowerCase().includes(query)
      );
    });
  }, [data.followers, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleUserClick = (user: User) => {
    if (user.username) {
      onClose(); // Close modal first
      navigate({ to: '/users/$username', params: { username: user.username } });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background/95 border-theme-primary/20 max-w-md shadow-xl backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-lg font-bold text-transparent lowercase">
            <div className="flex items-center gap-2">
              <Users className="text-theme-primary h-5 w-5" />
              {username ? `${username}'s followers` : 'followers'}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="search followers..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-background/50 border-theme-primary/20 focus:border-theme-primary/40 pr-10 pl-10 lowercase placeholder:lowercase"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Total Count */}
          <div className="text-muted-foreground text-center text-sm">
            {searchQuery ? (
              <>
                {filteredFollowers.length} of {data.totalCount} followers
                {searchQuery && ` matching "${searchQuery}"`}
              </>
            ) : (
              <>{data.totalCount} total followers</>
            )}
          </div>

          {/* Followers List */}
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))
            ) : filteredFollowers.length === 0 ? (
              // Empty state
              <div className="py-8 text-center">
                <Users className="text-muted-foreground/50 mx-auto mb-3 h-12 w-12" />
                <p className="text-muted-foreground mb-1 font-medium">
                  {searchQuery ? 'no followers found' : 'no followers yet'}
                </p>
                <p className="text-muted-foreground/80 text-sm">
                  {searchQuery
                    ? `try adjusting your search for "${searchQuery}"`
                    : `${username || 'this user'} hasn't gained any followers yet`}
                </p>
              </div>
            ) : (
              // Followers list
              filteredFollowers.map((follower, index: number) => {
                if (!follower.user) return null;
                const user = follower.user;
                const displayName =
                  `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                  user.username ||
                  'User';

                return (
                  <div
                    key={`${user._id}-${index}`}
                    className="bg-card/30 border-border/50 hover:bg-card/50 flex items-center gap-3 rounded-lg border p-3 backdrop-blur transition-colors"
                  >
                    <div
                      className="flex flex-1 cursor-pointer items-center gap-3"
                      onClick={() => handleUserClick(user)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleUserClick(user);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${displayName}'s profile`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.image_url || user.profile_image_url}
                          alt={displayName}
                        />
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                          {displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="text-foreground truncate font-medium lowercase">
                          {displayName}
                        </p>
                        {user.username && (
                          <p className="text-muted-foreground truncate text-sm">
                            @{user.username}
                          </p>
                        )}
                      </div>
                    </div>

                    <FollowButton
                      targetUserId={user.externalId}
                      username={user.username}
                      variant="compact"
                      size="sm"
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* Load More Button */}
          {!isLoading && hasMore && !searchQuery && (
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMore}
                className="border-theme-primary/20 bg-background/50 text-foreground hover:bg-background/70"
              >
                load more followers
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
