import { useEffect, useState } from 'react';
import { loadFontsAdaptively, getConnectionSpeed } from '@/lib/font-optimization';

/**
 * Component to handle optimized font loading for mobile performance
 * Loads core emojis immediately, extended emojis on fast connections
 */
export function OptimizedFontLoader() {
  useEffect(() => {
    // Load fonts adaptively based on connection speed
    loadFontsAdaptively();

    // Log performance info in development
    if (process.env.NODE_ENV === 'development') {
      const speed = getConnectionSpeed();
      console.log(`📱 Font loading strategy: ${speed} connection detected`);
      
      // Monitor font loading
      if ('fonts' in document) {
        document.fonts.ready.then(() => {
          console.log('✅ All fonts loaded');
        });
      }
    }
  }, []);

  return null; // This component only handles font loading side effects
}

/**
 * Hook to check if extended emoji fonts are available
 * Useful for progressive enhancement in emoji components
 */
export function useExtendedEmojiSupport() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (!('fonts' in document)) {
      setIsSupported(false);
      return;
    }

    // Check if extended font is loaded
    document.fonts.ready.then(() => {
      const hasExtended = document.fonts.check('1em "Noto Color Emoji Extended"');
      setIsSupported(hasExtended);
    });
  }, []);

  return isSupported;
}