import { useState, useCallback, useRef } from 'react';
import toast from '@/utils/toast';
import type { Vibe, User, EmojiRating } from '@vibechecc/types';
import { computeUserDisplayName, getUserAvatarUrl } from '@/utils/user-utils';
import { format } from 'date-fns';
import QRCode from 'qrcode';
import { extractThemeColors, hexToRgba } from '@/utils/theme-color-extractor';

interface UseThemeCanvasImageOptions {
  filename?: string;
}

export function useThemeCanvasImage(options: UseThemeCanvasImageOptions = {}) {
  const { filename = 'vibe-share.png' } = options;
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const generateCanvasImage = useCallback(
    async (
      vibe: Vibe,
      author: User,
      ratings: EmojiRating[] = [],
      shareUrl: string
    ): Promise<Blob | null> => {
      setIsGenerating(true);

      try {
        // Get current theme colors
        const colors = extractThemeColors();
        console.log('Theme colors extracted:', colors);

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Create gradient background using user's theme colors
        const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
        gradient.addColorStop(
          0,
          hexToRgba(colors.themePrimary || colors.primary, 0.1)
        );
        gradient.addColorStop(0.5, colors.background);
        gradient.addColorStop(
          1,
          hexToRgba(colors.themeSecondary || colors.secondary, 0.05)
        );
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1920);

        // Add decorative blobs using theme colors
        ctx.globalAlpha = 0.3;

        // Top left blob with theme primary
        const blob1 = ctx.createRadialGradient(200, 200, 0, 200, 200, 300);
        blob1.addColorStop(
          0,
          hexToRgba(colors.themePrimary || colors.primary, 0.4)
        );
        blob1.addColorStop(1, 'transparent');
        ctx.fillStyle = blob1;
        ctx.beginPath();
        ctx.arc(200, 200, 300, 0, Math.PI * 2);
        ctx.fill();

        // Bottom right blob with theme secondary
        const blob2 = ctx.createRadialGradient(880, 1720, 0, 880, 1720, 400);
        blob2.addColorStop(
          0,
          hexToRgba(colors.themeSecondary || colors.accent, 0.3)
        );
        blob2.addColorStop(1, 'transparent');
        ctx.fillStyle = blob2;
        ctx.beginPath();
        ctx.arc(880, 1720, 400, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;

        // Set up text styles
        ctx.textBaseline = 'top';

        // Draw header using theme primary color
        ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = colors.themePrimary || colors.primary;
        ctx.fillText('vibechecc', 80, 80);

        ctx.font = '36px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = colors.mutedForeground;
        ctx.fillText('share your vibe', 580, 100);

        // Draw card with rounded corners and shadow
        const cardY = 200;
        const cardHeight = 1400;
        const cardX = 80;
        const cardWidth = 920;
        const borderRadius = 24;

        // Card shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 50;
        ctx.shadowOffsetY = 25;

        // Card background
        ctx.fillStyle = hexToRgba(colors.card, 0.95);
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, borderRadius);
        ctx.fill();

        // Card border with theme color
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = hexToRgba(colors.themePrimary || colors.primary, 0.2);
        ctx.lineWidth = 4;
        ctx.stroke();

        // Inner content padding
        const contentX = cardX + 60;
        const contentWidth = cardWidth - 120;

        // Author section
        const authorY = cardY + 60;

        // Avatar background
        ctx.fillStyle = colors.muted;
        ctx.beginPath();
        ctx.arc(contentX + 48, authorY + 48, 48, 0, Math.PI * 2);
        ctx.fill();

        // Avatar border with theme color
        ctx.strokeStyle = hexToRgba(colors.themePrimary || colors.primary, 0.2);
        ctx.lineWidth = 4;
        ctx.stroke();

        // Try to load avatar image
        const avatarUrl = getUserAvatarUrl(author);
        if (avatarUrl) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = avatarUrl;
            });

            // Clip to circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(contentX + 48, authorY + 48, 44, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, contentX + 4, authorY + 4, 88, 88);
            ctx.restore();
          } catch {
            // Fallback to initials if image fails
            const displayName = computeUserDisplayName(author);
            const initials = displayName.slice(0, 2).toUpperCase();
            ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = colors.foreground;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(initials, contentX + 48, authorY + 48);
          }
        } else {
          // Draw initials
          const displayName = computeUserDisplayName(author);
          const initials = displayName.slice(0, 2).toUpperCase();
          ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = colors.foreground;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(initials, contentX + 48, authorY + 48);
        }

        // Author name
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '600 36px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = colors.foreground;
        const displayName = computeUserDisplayName(author);
        ctx.fillText(displayName, contentX + 120, authorY + 20);

        if (author.username) {
          ctx.font = '28px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = colors.mutedForeground;
          ctx.fillText(`@${author.username}`, contentX + 120, authorY + 65);
        }

        // Vibe title
        const contentY = authorY + 140;
        ctx.font = 'bold 60px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = colors.foreground;

        // Word wrap title
        const words = vibe.title.split(' ');
        let line = '';
        let y = contentY;
        const maxWidth = contentWidth;

        for (const word of words) {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, contentX, y);
            line = word + ' ';
            y += 75;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, contentX, y);

        // Vibe description
        const descY = y + 100;
        ctx.font = '36px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = hexToRgba(colors.foreground, 0.9);

        // Word wrap description
        const descWords = vibe.description.split(' ');
        line = '';
        y = descY;
        let lineCount = 0;
        const maxLines = 6;

        for (const word of descWords) {
          if (lineCount >= maxLines) break;
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, contentX, y);
            line = word + ' ';
            y += 50;
            lineCount++;
          } else {
            line = testLine;
          }
        }
        if (lineCount < maxLines && line) {
          ctx.fillText(line, contentX, y);
          y += 50;
        }

        // Tags
        if (vibe.tags && vibe.tags.length > 0) {
          y += 40;
          ctx.font = '500 28px system-ui, -apple-system, sans-serif';
          let tagX = contentX;

          for (const tag of vibe.tags.slice(0, 5)) {
            const tagText = `#${tag}`;
            const metrics = ctx.measureText(tagText);
            const tagWidth = metrics.width + 48;

            if (tagX + tagWidth > contentX + contentWidth) {
              tagX = contentX;
              y += 60;
            }

            // Tag background with theme color
            ctx.fillStyle = hexToRgba(
              colors.themePrimary || colors.primary,
              0.1
            );
            ctx.beginPath();
            ctx.roundRect(tagX, y, tagWidth, 48, 24);
            ctx.fill();

            // Tag text with theme color
            ctx.fillStyle = colors.themePrimary || colors.primary;
            ctx.fillText(tagText, tagX + 24, y + 12);

            tagX += tagWidth + 12;
          }
          y += 60;
        }

        // Top emoji reactions
        if (ratings.length > 0) {
          const topEmojis = ratings
            .reduce(
              (acc, rating) => {
                const existing = acc.find((e) => e.emoji === rating.emoji);
                if (existing) {
                  existing.count++;
                } else {
                  acc.push({ emoji: rating.emoji, count: 1 });
                }
                return acc;
              },
              [] as { emoji: string; count: number }[]
            )
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

          if (topEmojis.length > 0) {
            y += 40;
            ctx.font = '500 28px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = colors.mutedForeground;
            ctx.fillText('top reactions', contentX, y);
            y += 45;

            let emojiX = contentX;
            for (const { emoji, count } of topEmojis) {
              // Emoji background
              ctx.fillStyle = colors.muted;
              const emojiWidth = 100 + (count > 9 ? 20 : 0);
              ctx.beginPath();
              ctx.roundRect(emojiX, y, emojiWidth, 64, 32);
              ctx.fill();

              // Emoji
              ctx.font = '40px system-ui, -apple-system, sans-serif';
              ctx.fillText(emoji, emojiX + 12, y + 12);

              // Count
              ctx.font = '600 28px system-ui, -apple-system, sans-serif';
              ctx.fillStyle = colors.foreground;
              ctx.fillText(count.toString(), emojiX + 60, y + 20);

              emojiX += emojiWidth + 12;
            }
            y += 80;
          }
        }

        // Stats at bottom of card
        y = cardY + cardHeight - 200;
        ctx.font = '600 36px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = colors.foreground;

        // Reviews count
        const reviewText = `💬 ${ratings.length} reviews`;
        ctx.fillText(reviewText, contentX, y);

        // Average rating
        if (ratings.length > 0) {
          const avgRating =
            ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length;
          const ratingText = `⭐ ${avgRating.toFixed(1)} rating`;
          ctx.fillText(ratingText, contentX + 300, y);
        }

        // Date
        y += 60;
        ctx.font = '28px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = colors.mutedForeground;
        const dateText = `📅 ${format(new Date(vibe.createdAt), 'MMM d, yyyy')}`;
        ctx.fillText(dateText, contentX, y);

        // Footer
        y = 1700;
        ctx.font = '500 36px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = colors.foreground;
        ctx.fillText('scan to view full vibe', 80, y);

        ctx.font = '28px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = colors.mutedForeground;
        ctx.fillText('vibechecc.app', 80, y + 45);

        // Generate and draw QR code
        try {
          const qrDataUrl = await QRCode.toDataURL(shareUrl, {
            width: 128,
            margin: 0,
            color: {
              dark: colors.foreground,
              light: colors.background,
            },
          });

          const img = new Image();
          img.src = qrDataUrl;
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          // QR code background
          ctx.fillStyle = colors.background;
          ctx.beginPath();
          ctx.roundRect(850, y - 20, 160, 160, 16);
          ctx.fill();

          // QR code border
          ctx.strokeStyle = colors.border;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw QR code
          ctx.drawImage(img, 866, y - 4, 128, 128);
        } catch (error) {
          console.error('Failed to generate QR code:', error);
        }

        // Convert canvas to blob
        return new Promise((resolve) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                setGeneratedBlob(blob);
                canvasRef.current = canvas;
                resolve(blob);
              } else {
                toast.error('failed to generate image');
                resolve(null);
              }
            },
            'image/png',
            0.95
          );
        });
      } catch (error) {
        console.error('Error generating canvas image:', error);
        toast.error('failed to generate image');
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const downloadImage = useCallback(
    (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast('image downloaded');
    },
    [filename]
  );

  const shareImage = useCallback(
    async (blob: Blob, shareData?: ShareData) => {
      if (!navigator.share) {
        toast.error('sharing not supported on this device');
        return false;
      }

      if (
        !navigator.canShare ||
        !navigator.canShare({ files: [new File([blob], filename)] })
      ) {
        toast.error('image sharing not supported');
        return false;
      }

      try {
        const file = new File([blob], filename, { type: 'image/png' });
        await navigator.share({
          ...shareData,
          files: [file],
        });
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          toast.error('failed to share image');
        }
        return false;
      }
    },
    [filename]
  );

  return {
    isGenerating,
    generatedBlob,
    generateCanvasImage,
    downloadImage,
    shareImage,
  };
}
