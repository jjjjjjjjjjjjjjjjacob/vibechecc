import { useState } from 'react';
import { useClerk } from '@clerk/tanstack-react-start';
import { Button } from '@/components/ui/button';
import toast from '@/utils/toast';
import { Twitter, Instagram, Music2, Loader2, Plus } from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';

interface ConnectSocialButtonProps {
  platform: 'twitter' | 'instagram' | 'tiktok';
  isConnected?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showLabel?: boolean;
  className?: string;
  onConnectionComplete?: () => void;
}

const platformConfig = {
  twitter: {
    icon: Twitter,
    label: 'x / twitter',
    provider: 'oauth_twitter',
    color: 'hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]',
  },
  instagram: {
    icon: Instagram,
    label: 'instagram',
    provider: 'oauth_instagram',
    color: 'hover:bg-[#E4405F]/10 hover:text-[#E4405F]',
  },
  tiktok: {
    icon: Music2,
    label: 'tiktok',
    provider: 'oauth_tiktok',
    color:
      'hover:bg-[#000000]/10 hover:text-[#000000] dark:hover:bg-[#FFFFFF]/10 dark:hover:text-[#FFFFFF]',
  },
};

export function ConnectSocialButton({
  platform,
  isConnected = false,
  variant = 'outline',
  size = 'default',
  showLabel = true,
  className,
  onConnectionComplete,
}: ConnectSocialButtonProps) {
  const { openUserProfile } = useClerk();
  const [isConnecting, setIsConnecting] = useState(false);

  const config = platformConfig[platform];
  const Icon = config.icon;

  const handleConnect = async () => {
    if (isConnected) {
      toast('already connected', { duration: 3000 });
      return;
    }

    setIsConnecting(true);

    try {
      openUserProfile();

      toast('redirecting to settings', { duration: 3000 });

      if (onConnectionComplete) {
        onConnectionComplete();
      }
    } catch {
      toast.error('connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleConnect}
      disabled={isConnecting || isConnected}
      className={cn(
        'transition-colors',
        !isConnected && config.color,
        className
      )}
    >
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {!isConnected && <Plus className="h-4 w-4" />}
          <Icon className="h-4 w-4" />
        </>
      )}
      {showLabel && (
        <span className="ml-2">
          {isConnected
            ? `${config.label} connected`
            : `connect ${config.label}`}
        </span>
      )}
    </Button>
  );
}
