import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { useUser, useClerk } from '@clerk/tanstack-react-start';
import { useCurrentUser } from '../queries';
import { FollowStats } from '@/features/follows/components';

export function ProfileSnapshotCard() {
  const { user: clerkUser } = useUser();
  const { openUserProfile } = useClerk();
  const { data: convexUser } = useCurrentUser();

  if (!clerkUser || !convexUser) return null;

  const username = convexUser.username || '';
  const firstName = convexUser.first_name || '';
  const lastName = convexUser.last_name || '';
  const imageUrl = convexUser.image_url || clerkUser.imageUrl;

  const displayName =
    `${firstName || ''} ${lastName || ''}`.trim() ||
    username ||
    clerkUser.fullName ||
    clerkUser.firstName ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    'User';

  const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
  const userJoinDate = convexUser.created_at
    ? new Date(convexUser.created_at).toLocaleDateString()
    : clerkUser.createdAt
      ? new Date(clerkUser.createdAt).toLocaleDateString()
      : 'Unknown';

  return (
    <Card className="flex w-full border-none !bg-transparent shadow-none">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
              <AvatarImage
                src={imageUrl}
                alt={displayName}
                className="object-cover"
              />
              <AvatarFallback className="text-base sm:text-lg">
                {displayName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="from-theme-primary to-theme-secondary mb-1 bg-gradient-to-r bg-clip-text text-lg font-bold text-transparent lowercase sm:text-xl">
              {displayName}
            </h2>
            {username && (
              <p className="text-muted-foreground mb-1 text-sm">@{username}</p>
            )}
            {userEmail && (
              <p className="text-muted-foreground mb-1 text-sm break-all">
                {userEmail}
              </p>
            )}
            <p className="text-muted-foreground mb-3 text-xs">
              member since {userJoinDate}
            </p>

            <div className="mb-3">
              <FollowStats
                userId={convexUser.externalId}
                onFollowersClick={() => {}}
                onFollowingClick={() => {}}
                variant="default"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link to="/profile">view profile</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openUserProfile?.()}
              >
                settings
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
