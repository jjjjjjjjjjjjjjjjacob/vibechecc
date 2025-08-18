import { useState } from 'react';
import { api } from '@vibechecc/convex';
import { useConvexQuery, useConvexMutation } from '@convex-dev/react-query';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import toast from '@/utils/toast';
import {
  Twitter,
  Instagram,
  Music2,
  ExternalLink,
  Unlink,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';
import { formatDistanceToNow } from 'date-fns';

interface SocialConnectionsListProps {
  className?: string;
}

const platformIcons = {
  twitter: Twitter,
  instagram: Instagram,
  tiktok: Music2,
};

const platformLabels = {
  twitter: 'x / twitter',
  instagram: 'instagram',
  tiktok: 'tiktok',
};

const statusColors = {
  connected: 'bg-primary/10 text-primary',
  disconnected: 'bg-muted text-muted-foreground',
  expired: 'bg-destructive/10 text-destructive',
  error: 'bg-destructive/10 text-destructive',
};

export function SocialConnectionsList({
  className,
}: SocialConnectionsListProps) {
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<
    string | null
  >(null);

  const connections = useConvexQuery(
    api.social.connections.getSocialConnections
  );
  const disconnectMutation = useConvexMutation(
    api.social.connections.disconnectSocialAccount
  );

  const handleDisconnect = async (
    platform: 'twitter' | 'instagram' | 'tiktok'
  ) => {
    setDisconnectingPlatform(platform);
    try {
      await disconnectMutation({ platform });
      toast('disconnected', { duration: 3000 });
    } catch {
      toast.error('disconnect failed');
    } finally {
      setDisconnectingPlatform(null);
    }
  };

  const handleOpenProfile = (platform: string, username?: string) => {
    if (!username) return;

    const urls = {
      twitter: `https://twitter.com/${username}`,
      instagram: `https://instagram.com/${username}`,
      tiktok: `https://tiktok.com/@${username}`,
    };

    const url = urls[platform as keyof typeof urls];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!connections) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (connections.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>social connections</CardTitle>
          <CardDescription>
            connect your social accounts to share vibes directly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            no social accounts connected yet. connect your accounts in profile
            settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>social connections</CardTitle>
        <CardDescription>manage your connected social accounts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connections.map((connection) => {
          const Icon = platformIcons[connection.platform];
          const isDisconnecting = disconnectingPlatform === connection.platform;
          const isConnected = connection.connectionStatus === 'connected';
          const hasError =
            connection.connectionStatus === 'error' ||
            connection.connectionStatus === 'expired';

          return (
            <div
              key={connection.platform}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    isConnected ? 'bg-primary/10' : 'bg-muted'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      isConnected ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {platformLabels[connection.platform]}
                    </p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        statusColors[connection.connectionStatus]
                      )}
                    >
                      {connection.connectionStatus}
                    </Badge>
                  </div>

                  {connection.platformUsername && (
                    <p className="text-muted-foreground text-xs">
                      @{connection.platformUsername}
                    </p>
                  )}

                  {connection.connectedAt && (
                    <p className="text-muted-foreground text-xs">
                      connected{' '}
                      {formatDistanceToNow(new Date(connection.connectedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  )}

                  {hasError && (
                    <p className="text-destructive flex items-center gap-1 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      reconnection required
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {connection.platformUsername && isConnected && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      handleOpenProfile(
                        connection.platform,
                        connection.platformUsername
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDisconnect(connection.platform)}
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unlink className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
