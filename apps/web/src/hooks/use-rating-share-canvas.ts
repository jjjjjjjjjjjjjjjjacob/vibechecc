import { useState, useCallback } from 'react';
import toast from '@/utils/toast';
import type { Rating, User, Vibe } from '@vibechecc/types';
import { computeUserDisplayName, getUserAvatarUrl } from '@/utils/user-utils';
import { format } from '@/utils/date-utils';
import { extractThemeColors, hexToRgba } from '@/utils/theme-color-extractor';
import { APP_NAME, APP_DOMAIN } from '@/utils/bindings';

interface UseRatingShareCanvasOptions {
  filename?: string;
}

export interface RatingShareLayoutOption {
  value: 'detailed' | 'compact' | 'story';
  label: string;
  description: string;
  includeVibePreview: boolean;
  includeReviewText: boolean;
  includeVibeAuthor: boolean;
  aspectRatio: '1:1' | '9:16' | '16:9';
}

export function useRatingShareCanvas(
  options: UseRatingShareCanvasOptions = {}
) {
  const { filename = 'rating-share.png' } = options;
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  const generateRatingShareImage = useCallback(
    async (
      rating: Rating,
      vibe: Vibe,
      shareUrl: string,
      layoutOption?: RatingShareLayoutOption
    ): Promise<Blob | null> => {
      // console.log(
      //   '[useRatingShareCanvas] Starting generation with layout:',
      //   layoutOption?.value
      // );
      setIsGenerating(true);

      try {
        // Get current theme colors
        const colors = extractThemeColors();

        // Check for explicit theme classes first
        const htmlElement = document.documentElement;
        const hasLightClass = htmlElement.classList.contains('light');
        const hasDarkClass = htmlElement.classList.contains('dark');

        let isDarkMode = false;

        if (hasLightClass) {
          isDarkMode = false;
        } else if (hasDarkClass) {
          isDarkMode = true;
        } else {
          // Fallback: detect based on background color brightness
          const isColorDark = (hexColor: string): boolean => {
            const hex = hexColor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance < 0.5;
          };

          isDarkMode = isColorDark(colors.background);
        }

        // Default layout options if not provided
        const layout = layoutOption || {
          value: 'detailed',
          label: 'detailed',
          description: 'full review with vibe context',
          includeVibePreview: true,
          includeReviewText: true,
          includeVibeAuthor: true,
          aspectRatio: '1:1' as const,
        };

        // Create canvas with aspect ratio
        const canvas = document.createElement('canvas');
        if (layout.aspectRatio === '1:1') {
          canvas.width = 1080;
          canvas.height = 1080;
        } else if (layout.aspectRatio === '9:16') {
          canvas.width = 1080;
          canvas.height = 1920;
        } else if (layout.aspectRatio === '16:9') {
          canvas.width = 1920;
          canvas.height = 1080;
        }

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
              border: colors.border || '#27272a',
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
              border: colors.border || '#e4e4e7',
            };

        // Solid background color
        ctx.fillStyle = storyColors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw header
        ctx.textBaseline = 'top';
        ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';

        // Create gradient for app name text
        const headerGradient = ctx.createLinearGradient(60, 60, 300, 60);
        headerGradient.addColorStop(0, storyColors.primary);
        headerGradient.addColorStop(1, storyColors.secondary);
        ctx.fillStyle = headerGradient;
        ctx.fillText(APP_NAME, 60, 60);

        ctx.font = '24px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = storyColors.mutedForeground;
        ctx.fillText('rating shared', 380, 75);

        // Draw main card
        const cardY = 150;
        const cardHeight = layout.aspectRatio === '9:16' ? 1500 : 750;
        const cardX = 60;
        const cardWidth = canvas.width - 120;
        const borderRadius = 24;

        // Card background with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 10;

        ctx.fillStyle = storyColors.card;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, borderRadius);
        ctx.fill();

        // Subtle border
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = hexToRgba(storyColors.primary, 0.2);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner content
        const contentX = cardX + 40;
        const contentWidth = cardWidth - 80;
        let contentY = cardY + 40;

        // Rating author section
        const raterUser = rating.rater || rating.user;
        const raterDisplayName = computeUserDisplayName(raterUser as User);
        const raterAvatarUrl = getUserAvatarUrl(raterUser as User);
        let avatarDrawn = false;

        // Try to load and draw rater avatar
        if (raterAvatarUrl) {
          try {
            const avatarImg = new Image();
            avatarImg.crossOrigin = 'anonymous';

            const loadPromise = new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Avatar load timeout'));
              }, 3000);

              avatarImg.onload = () => {
                clearTimeout(timeout);
                resolve(avatarImg);
              };

              avatarImg.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Avatar load failed'));
              };

              avatarImg.src = raterAvatarUrl;
            });

            await loadPromise;

            // Draw avatar circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(contentX + 30, contentY + 30, 28, 0, Math.PI * 2);
            ctx.clip();

            const imgSize = Math.min(avatarImg.width, avatarImg.height);
            const sx = (avatarImg.width - imgSize) / 2;
            const sy = (avatarImg.height - imgSize) / 2;

            ctx.drawImage(
              avatarImg,
              sx,
              sy,
              imgSize,
              imgSize,
              contentX + 30 - 28,
              contentY + 30 - 28,
              56,
              56
            );
            ctx.restore();

            avatarDrawn = true;
          } catch {
            avatarDrawn = false;
          }
        }

        // Draw initials as fallback
        if (!avatarDrawn) {
          ctx.fillStyle = storyColors.muted;
          ctx.beginPath();
          ctx.arc(contentX + 30, contentY + 30, 28, 0, Math.PI * 2);
          ctx.fill();

          const initials = raterDisplayName.slice(0, 2).toUpperCase();
          ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = storyColors.foreground;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(initials, contentX + 30, contentY + 30);
        }

        // Rater name and rating info
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '600 24px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = storyColors.cardForeground || storyColors.foreground;
        ctx.fillText(raterDisplayName, contentX + 80, contentY + 10);

        const raterUsername = rating.rater?.username || rating.user?.username;
        if (raterUsername) {
          ctx.font = '18px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = storyColors.mutedForeground;
          ctx.fillText(`@${raterUsername}`, contentX + 80, contentY + 35);
        }

        contentY += 80;

        // Large emoji and rating display
        ctx.font = '64px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const emojiCenterX = contentX + contentWidth / 2;
        ctx.fillText(rating.emoji, emojiCenterX, contentY + 40);

        // Rating scale below emoji
        const scaleY = contentY + 90;
        const scaleStartX = emojiCenterX - 100;
        const emojiSize = 24;
        const emojiSpacing = 25;

        // Draw 5-emoji scale background
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.font = `${emojiSize}px system-ui, -apple-system, sans-serif`;
        for (let i = 0; i < 5; i++) {
          ctx.fillText(rating.emoji, scaleStartX + i * emojiSpacing, scaleY);
        }
        ctx.restore();

        // Draw filled emojis based on rating value
        const fillWidth = (rating.value / 5) * (5 * emojiSpacing);
        ctx.save();
        ctx.beginPath();
        ctx.rect(scaleStartX - 15, scaleY - 15, fillWidth, 30);
        ctx.clip();

        ctx.font = `${emojiSize}px system-ui, -apple-system, sans-serif`;
        for (let i = 0; i < 5; i++) {
          ctx.fillText(rating.emoji, scaleStartX + i * emojiSpacing, scaleY);
        }
        ctx.restore();

        // Rating value text
        ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = storyColors.primary;
        ctx.fillText(`${rating.value.toFixed(1)}/5`, emojiCenterX, scaleY + 50);

        contentY += 170;

        // Review text (if included in layout)
        if (layout.includeReviewText && rating.review && rating.review.trim()) {
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';

          // Quote mark
          ctx.font = 'italic 36px Georgia, serif';
          ctx.fillStyle = hexToRgba(storyColors.primary, 0.3);
          ctx.fillText('"', contentX, contentY);

          // Review text with word wrapping
          ctx.font = 'italic 28px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = storyColors.cardForeground || storyColors.foreground;

          const reviewWords = rating.review.trim().split(' ');
          let line = '';
          let y = contentY + 10;
          const maxWidth = contentWidth - 60;
          const maxLines = layout.aspectRatio === '9:16' ? 8 : 4;
          let lineCount = 0;

          for (const word of reviewWords) {
            if (lineCount >= maxLines) break;
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line !== '') {
              ctx.fillText(line.trim(), contentX + 30, y);
              line = word + ' ';
              y += 40;
              lineCount++;
            } else {
              line = testLine;
            }
          }
          if (lineCount < maxLines && line) {
            ctx.fillText(line.trim(), contentX + 30, y);
            y += 40;
          }

          contentY = y + 30;
        }

        // Vibe context section (if included in layout)
        if (layout.includeVibePreview) {
          // Separator line
          ctx.strokeStyle = hexToRgba(storyColors.border, 0.5);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(contentX, contentY);
          ctx.lineTo(contentX + contentWidth, contentY);
          ctx.stroke();

          contentY += 30;

          // "About this vibe" header
          ctx.font = '500 18px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = storyColors.mutedForeground;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText('about this vibe', contentX, contentY);

          contentY += 35;

          // Vibe title
          ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = storyColors.cardForeground || storyColors.foreground;

          // Word wrap vibe title
          const titleWords = vibe.title.split(' ');
          let titleLine = '';
          let titleY = contentY;
          const maxTitleWidth = contentWidth;
          const maxTitleLines = 2;
          let titleLineCount = 0;

          for (const word of titleWords) {
            if (titleLineCount >= maxTitleLines) break;
            const testLine = titleLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxTitleWidth && titleLine !== '') {
              ctx.fillText(titleLine.trim(), contentX, titleY);
              titleLine = word + ' ';
              titleY += 32;
              titleLineCount++;
            } else {
              titleLine = testLine;
            }
          }
          if (titleLineCount < maxTitleLines && titleLine) {
            ctx.fillText(titleLine.trim(), contentX, titleY);
            titleY += 32;
          }

          contentY = titleY + 10;

          // Vibe author (if included)
          if (layout.includeVibeAuthor && vibe.createdBy) {
            ctx.font = '18px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = storyColors.mutedForeground;
            const authorName = computeUserDisplayName(vibe.createdBy);
            const authorUsername = vibe.createdBy.username;
            const authorText = authorUsername
              ? `by ${authorName} (@${authorUsername})`
              : `by ${authorName}`;
            ctx.fillText(authorText, contentX, contentY);
            contentY += 30;
          }

          // Vibe description (truncated)
          if (vibe.description) {
            ctx.font = '20px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = hexToRgba(
              storyColors.cardForeground || storyColors.foreground,
              0.8
            );

            const descWords = vibe.description.split(' ');
            let descLine = '';
            let descY = contentY;
            const maxDescWidth = contentWidth;
            const maxDescLines = layout.aspectRatio === '9:16' ? 4 : 2;
            let descLineCount = 0;

            for (const word of descWords) {
              if (descLineCount >= maxDescLines) break;
              const testLine = descLine + word + ' ';
              const metrics = ctx.measureText(testLine);
              if (metrics.width > maxDescWidth && descLine !== '') {
                ctx.fillText(descLine.trim(), contentX, descY);
                descLine = word + ' ';
                descY += 28;
                descLineCount++;
              } else {
                descLine = testLine;
              }
            }
            if (descLineCount < maxDescLines && descLine) {
              // Add ellipsis if we're at max lines
              const finalLine =
                descLineCount === maxDescLines - 1 &&
                descWords.length >
                  descWords.indexOf(descLine.trim().split(' ').pop() || '') + 1
                  ? descLine.trim() + '...'
                  : descLine.trim();
              ctx.fillText(finalLine, contentX, descY);
              descY += 28;
            }

            contentY = descY + 20;
          }
        }

        // Footer with date and app info
        const footerY = cardY + cardHeight - 80;

        // Date
        ctx.font = '16px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = storyColors.mutedForeground;
        ctx.textAlign = 'left';
        ctx.fillText(
          `${format(new Date(rating.createdAt), 'MMM d, yyyy')}`,
          contentX,
          footerY
        );

        // App domain
        ctx.textAlign = 'right';
        ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = storyColors.primary;
        ctx.fillText(APP_DOMAIN, contentX + contentWidth, footerY);

        // Convert to blob
        return new Promise((resolve) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                setGeneratedBlob(blob);
                resolve(blob);
              } else {
                toast.error('failed to generate rating share image');
                resolve(null);
              }
            },
            'image/png',
            0.95
          );
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(
        //   '[useRatingShareCanvas] Failed to generate image:',
        //   error
        // );
        toast.error('failed to generate rating share image');
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
      toast('rating share image downloaded');
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
          toast.error('failed to share rating image');
        }
        return false;
      }
    },
    [filename]
  );

  return {
    isGenerating,
    generatedBlob,
    generateRatingShareImage,
    downloadImage,
    shareImage,
  };
}
