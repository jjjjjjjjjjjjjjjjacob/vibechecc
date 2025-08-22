import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useHeaderNavStore } from '@/stores';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useEffect } from 'react';

const Toaster = ({ ...props }: ToasterProps) => {
  const navState = useHeaderNavStore((state) => state.navState);
  const isMobile = useMediaQuery('(max-width: 640px)');

  return (
    <Sonner
      theme="dark"
      position={isMobile ? 'top-center' : 'top-right'}
      offset={{ top: 64 }}
      {...props}
      toastOptions={{
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
        },
      }}
    />
  );
};

export { Toaster };
