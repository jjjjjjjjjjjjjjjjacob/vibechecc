// Worker for generating story canvas images off the main thread
import type { Vibe, User, EmojiRating, Rating } from '@vibechecc/types';
import type { LayoutOption } from '@/hooks/use-story-canvas';

interface GenerateCanvasMessage {
  type: 'generate';
  id: string;
  vibe: Vibe;
  author: User;
  ratings: (EmojiRating | Rating)[];
  shareUrl: string;
  imageUrl?: string | null;
  layoutOption: LayoutOption;
  colors: {
    background: string;
    foreground: string;
    themePrimary: string;
    themeSecondary: string;
  };
  isDarkMode: boolean;
}

interface CanvasResultMessage {
  type: 'result';
  id: string;
  blob: Blob | null;
  error?: string;
}

self.addEventListener(
  'message',
  async (event: MessageEvent<GenerateCanvasMessage>) => {
    const {
      type,
      id,
      vibe: _vibe,
      author: _author,
      ratings: _ratings,
      shareUrl: _shareUrl,
      imageUrl: _imageUrl,
      layoutOption: _layoutOption,
      colors,
      isDarkMode,
    } = event.data;

    if (type !== 'generate') return;

    try {
      // Create offscreen canvas
      const canvas = new OffscreenCanvas(1080, 1920);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Adapt colors based on theme mode
      const storyColors = isDarkMode
        ? {
            background: '#0a0a0a',
            foreground: '#fafafa',
            primary: colors.themePrimary || '#ec4899',
            secondary: colors.themeSecondary || '#f97316',
            muted: '#1a1a1a',
            mutedForeground: '#a1a1aa',
            card: '#141414',
            cardForeground: '#fafafa',
          }
        : {
            background: '#fafafa',
            foreground: '#0a0a0a',
            primary: colors.themePrimary || '#ec4899',
            secondary: colors.themeSecondary || '#f97316',
            muted: '#f4f4f5',
            mutedForeground: '#71717a',
            card: '#ffffff',
            cardForeground: '#0a0a0a',
          };

      // Solid background
      ctx.fillStyle = storyColors.background;
      ctx.fillRect(0, 0, 1080, 1920);

      // Draw header
      ctx.textBaseline = 'top';
      ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';

      // Create gradient for vibechecc text
      const headerGradient = ctx.createLinearGradient(80, 80, 400, 80);
      headerGradient.addColorStop(0, storyColors.primary);
      headerGradient.addColorStop(1, storyColors.secondary);
      ctx.fillStyle = headerGradient;
      ctx.fillText('vibechecc', 80, 80);

      ctx.font = '36px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = storyColors.mutedForeground;
      ctx.fillText('share your vibe', 580, 100);

      // Draw main card
      const cardY = 200;
      const cardHeight = 1400;
      const cardX = 60;
      const cardWidth = 960;
      const borderRadius = 32;

      // Card background
      ctx.fillStyle = storyColors.card;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, borderRadius);
      ctx.fill();

      // ... Continue with the rest of the canvas generation logic
      // This is a simplified version - you would port the full logic from use-story-canvas.ts

      // Convert to blob
      const blob = await canvas.convertToBlob({
        type: 'image/png',
        quality: 0.95,
      });

      // Send result back to main thread
      self.postMessage({
        type: 'result',
        id,
        blob,
      } as CanvasResultMessage);
    } catch (error) {
      self.postMessage({
        type: 'result',
        id,
        blob: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      } as CanvasResultMessage);
    }
  }
);

export {};
