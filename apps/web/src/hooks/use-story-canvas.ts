import { useState, useCallback } from 'react';
import toast from '@/utils/toast';
import type { Vibe, User, EmojiRating, Rating } from '@vibechecc/types';
import { computeUserDisplayName, getUserAvatarUrl } from '@/utils/user-utils';
import { format } from '@/utils/date-utils';
// QRCode removed - not compatible with Cloudflare Workers
import { extractThemeColors, hexToRgba } from '@/utils/theme-color-extractor';
import { APP_NAME, APP_DOMAIN } from '@/utils/bindings';

interface UseStoryCanvasOptions {
  filename?: string;
}

export interface LayoutOption {
  value: 'expanded' | 'minimal' | 'square';
  label: string;
  description: string;
  includeImage: boolean;
  includeRatings: boolean;
  includeReview: boolean;
  includeTags: boolean;
}

export function useStoryCanvas(options: UseStoryCanvasOptions = {}) {
  const { filename = 'vibe-share.png' } = options;
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  const generateCanvasImage = useCallback(
    async (
      vibe: Vibe,
      author: User,
      ratings: (EmojiRating | Rating)[] = [],
      _shareUrl: string,
      imageUrl?: string | null,
      layoutOption?: LayoutOption,
      showResponses?: boolean
    ): Promise<Blob | null> => {
      // start generation
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
            // Remove # if present
            const hex = hexColor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            // Calculate luminance
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance < 0.5;
          };

          isDarkMode = isColorDark(colors.background);
        }

        // Theme detection complete

        // Create canvas with dimensions based on layout
        const canvas = document.createElement('canvas');
        if (layoutOption?.value === 'square') {
          canvas.width = 1080;
          canvas.height = 1080;
        } else {
          canvas.width = 1080;
          canvas.height = 1920;
        }
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Adapt colors based on theme mode
        const storyColors = isDarkMode
          ? {
              // Dark mode colors
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
              // Light mode colors
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

        // Solid background color - no gradient
        ctx.fillStyle = storyColors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw header with proper top padding to prevent cutoff
        ctx.textBaseline = 'top';
        ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';

        // Increased top margin to prevent cutoff
        const headerY = 100;

        // Create gradient for app name text
        const headerGradient = ctx.createLinearGradient(
          80,
          headerY,
          400,
          headerY
        );
        headerGradient.addColorStop(0, storyColors.primary);
        headerGradient.addColorStop(1, storyColors.secondary);
        ctx.fillStyle = headerGradient;
        ctx.fillText(APP_NAME, 80, headerY);

        ctx.font = '36px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = storyColors.mutedForeground;
        ctx.fillText('share your vibe', 580, headerY + 20);

        // Draw main card with nice shadow and rounded corners
        // Adjusted card positioning to account for new header spacing
        const cardY = 220;
        const cardHeight = 1380;
        const cardX = 60;
        const cardWidth = 960;
        const borderRadius = 32;

        // Multiple shadows for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 60;
        ctx.shadowOffsetY = 20;

        // Card background (adapts to theme)
        ctx.fillStyle = storyColors.card;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, borderRadius);
        ctx.fill();

        // Subtle border
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = hexToRgba(storyColors.primary, 0.2);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner content with better spacing
        const contentX = cardX + 60;
        const contentWidth = cardWidth - 120;

        // Author section with avatar
        const authorY = cardY + 60;

        // Get user display name (needed for both avatar and text)
        const displayName = computeUserDisplayName(author);

        // Get user avatar URL
        const userAvatarUrl = getUserAvatarUrl(author);
        let avatarDrawn = false;

        // Try to load and draw user avatar if available
        if (userAvatarUrl) {
          try {
            // loading user avatar
            const avatarImg = new Image();
            avatarImg.crossOrigin = 'anonymous';

            // Add timeout to prevent hanging
            const loadPromise = new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                // avatar load timeout
                reject(new Error('Image load timeout'));
              }, 3000); // 3 second timeout

              avatarImg.onload = () => {
                clearTimeout(timeout);
                // avatar loaded
                resolve(avatarImg);
              };

              avatarImg.onerror = () => {
                clearTimeout(timeout);
                // avatar load failed
                reject(new Error('Image load failed'));
              };

              avatarImg.src = userAvatarUrl;
            });

            await loadPromise;

            // Draw avatar circle with clipping
            ctx.save();
            ctx.beginPath();
            ctx.arc(contentX + 48, authorY + 48, 45, 0, Math.PI * 2);
            ctx.clip();

            // Draw the avatar image (centered and cropped to circle)
            const imgSize = Math.min(avatarImg.width, avatarImg.height);
            const sx = (avatarImg.width - imgSize) / 2;
            const sy = (avatarImg.height - imgSize) / 2;

            ctx.drawImage(
              avatarImg,
              sx,
              sy,
              imgSize,
              imgSize,
              contentX + 48 - 45,
              authorY + 48 - 45,
              90,
              90
            );
            ctx.restore();

            // No border for avatar

            avatarDrawn = true;
          } catch {
            // Fall back to initials if image fails to load
            avatarDrawn = false;
          }
        }

        // Draw initials as fallback if no avatar or loading failed
        if (!avatarDrawn) {
          // Avatar background
          ctx.fillStyle = storyColors.muted;
          ctx.beginPath();
          ctx.arc(contentX + 48, authorY + 48, 45, 0, Math.PI * 2);
          ctx.fill();

          // Draw initials for author
          const initials = displayName.slice(0, 2).toUpperCase();
          ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = storyColors.foreground;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(initials, contentX + 48, authorY + 48);
        }

        // Author name and username
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '600 36px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = storyColors.cardForeground || storyColors.foreground;
        ctx.fillText(displayName, contentX + 120, authorY + 20);

        if (author.username) {
          ctx.font = '28px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = storyColors.mutedForeground;
          ctx.fillText(`@${author.username}`, contentX + 120, authorY + 65);
        }

        // Default layout options if not provided
        const layout = layoutOption || {
          value: 'expanded',
          label: 'expanded',
          description: 'with image',
          includeImage: true,
          includeRatings: true,
          includeReview: false,
          includeTags: true,
        };

        // Handle square layout differently
        if (layout.value === 'square') {
          // For square layout, use the dedicated square canvas component approach
          // with more compact dimensions and proper padding to prevent cutoff

          // Header with proper top padding to prevent cutoff
          const headerY = 100; // Increased padding from top to prevent cutoff
          ctx.font = 'bold 60px system-ui, -apple-system, sans-serif';

          // Create gradient for app name text
          const headerGradient = ctx.createLinearGradient(
            80,
            headerY,
            400,
            headerY
          );
          headerGradient.addColorStop(0, storyColors.primary);
          headerGradient.addColorStop(1, storyColors.secondary);
          ctx.fillStyle = headerGradient;
          ctx.fillText(APP_NAME, 80, headerY);

          ctx.font = '30px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = storyColors.mutedForeground;
          ctx.fillText('share your vibe', 580, headerY + 20);

          // Main content card for square format
          // Adjusted for new header positioning
          const cardY = 190;
          const cardHeight = 720; // More compact for square
          const cardX = 60;
          const cardWidth = 960;
          const borderRadius = 32;

          // Card background
          ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
          ctx.shadowBlur = 40;
          ctx.shadowOffsetY = 15;

          ctx.fillStyle = storyColors.card;
          ctx.beginPath();
          ctx.roundRect(cardX, cardY, cardWidth, cardHeight, borderRadius);
          ctx.fill();

          // Border
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = hexToRgba(storyColors.primary, 0.2);
          ctx.lineWidth = 2;
          ctx.stroke();

          // Content area
          const contentX = cardX + 50;
          const contentWidth = cardWidth - 100;
          let currentY = cardY + 50;

          // Author section (more compact)
          const displayName = computeUserDisplayName(author);
          const userAvatarUrl = getUserAvatarUrl(author);
          let avatarDrawn = false;

          // Try to load and draw user avatar
          if (userAvatarUrl) {
            try {
              const avatarImg = new Image();
              avatarImg.crossOrigin = 'anonymous';

              const loadPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(
                  () => reject(new Error('Timeout')),
                  3000
                );
                avatarImg.onload = () => {
                  clearTimeout(timeout);
                  resolve(avatarImg);
                };
                avatarImg.onerror = () => {
                  clearTimeout(timeout);
                  reject(new Error('Failed'));
                };
                avatarImg.src = userAvatarUrl;
              });

              await loadPromise;

              // Draw avatar circle
              ctx.save();
              ctx.beginPath();
              ctx.arc(contentX + 35, currentY + 35, 32, 0, Math.PI * 2);
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
                contentX + 35 - 32,
                currentY + 35 - 32,
                64,
                64
              );
              ctx.restore();
              avatarDrawn = true;
            } catch {
              avatarDrawn = false;
            }
          }

          // Fallback to initials
          if (!avatarDrawn) {
            ctx.fillStyle = storyColors.muted;
            ctx.beginPath();
            ctx.arc(contentX + 35, currentY + 35, 32, 0, Math.PI * 2);
            ctx.fill();

            const initials = displayName.slice(0, 2).toUpperCase();
            ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = storyColors.foreground;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(initials, contentX + 35, currentY + 35);
          }

          // Author name
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.font = '500 28px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = storyColors.cardForeground;
          ctx.fillText(displayName, contentX + 90, currentY + 10);

          if (author.username) {
            ctx.font = '22px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = storyColors.mutedForeground;
            ctx.fillText(`@${author.username}`, contentX + 90, currentY + 45);
          }

          currentY += 100;

          // Title (more compact)
          ctx.font = 'bold 40px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = storyColors.cardForeground;

          const titleWords = vibe.title.split(' ');
          let titleLine = '';
          let titleY = currentY;
          const maxTitleLines = 2;
          let titleLineCount = 0;

          for (const word of titleWords) {
            if (titleLineCount >= maxTitleLines) break;
            const testLine = titleLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > contentWidth && titleLine !== '') {
              ctx.fillText(titleLine, contentX, titleY);
              titleLine = word + ' ';
              titleY += 50;
              titleLineCount++;
            } else {
              titleLine = testLine;
            }
          }
          if (titleLineCount < maxTitleLines && titleLine) {
            ctx.fillText(titleLine, contentX, titleY);
            titleY += 50;
          }

          currentY = titleY + 20;

          // Conditionally show description OR responses based on showResponses parameter
          const shouldShowResponses = showResponses && ratings.length > 0;

          if (!shouldShowResponses) {
            // Show description
            ctx.font = '24px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = hexToRgba(storyColors.cardForeground, 0.8);

            const descWords = vibe.description.split(' ');
            let descLine = '';
            let descY = currentY;
            const maxDescLines = 3;
            let descLineCount = 0;

            for (const word of descWords) {
              if (descLineCount >= maxDescLines) break;
              const testLine = descLine + word + ' ';
              const metrics = ctx.measureText(testLine);
              if (metrics.width > contentWidth && descLine !== '') {
                ctx.fillText(descLine, contentX, descY);
                descLine = word + ' ';
                descY += 32;
                descLineCount++;
              } else {
                descLine = testLine;
              }
            }
            if (descLineCount < maxDescLines && descLine) {
              ctx.fillText(descLine, contentX, descY);
              descY += 32;
            }
            currentY = descY + 20;
          } else {
            // Show responses (emoji ratings summary)
            if (ratings.length > 0) {
              // Top emoji ratings
              const emojiAverages = ratings
                .reduce(
                  (acc, rating) => {
                    const existing = acc.find((e) => e.emoji === rating.emoji);
                    if (existing) {
                      existing.totalValue += rating.value;
                      existing.count++;
                    } else {
                      acc.push({
                        emoji: rating.emoji,
                        count: 1,
                        totalValue: rating.value,
                        avgRating: rating.value,
                      });
                    }
                    return acc;
                  },
                  [] as {
                    emoji: string;
                    count: number;
                    totalValue: number;
                    avgRating: number;
                  }[]
                )
                .map((item) => ({
                  ...item,
                  avgRating: item.totalValue / item.count,
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);

              ctx.font = '500 20px system-ui, -apple-system, sans-serif';
              ctx.fillStyle = storyColors.mutedForeground;
              ctx.fillText('top reactions', contentX, currentY);
              currentY += 35;

              // Draw emoji reactions horizontally
              let emojiX = contentX;
              for (const emoji of emojiAverages) {
                // Emoji
                ctx.font = '28px system-ui, -apple-system, sans-serif';
                ctx.fillText(emoji.emoji, emojiX, currentY);

                // Rating
                ctx.font = '500 18px system-ui, -apple-system, sans-serif';
                ctx.fillStyle = storyColors.foreground;
                ctx.fillText(emoji.avgRating.toFixed(1), emojiX, currentY + 40);

                // Count
                ctx.font = '14px system-ui, -apple-system, sans-serif';
                ctx.fillStyle = storyColors.mutedForeground;
                ctx.fillText(`${emoji.count}`, emojiX, currentY + 60);

                emojiX += 80;
              }
              currentY += 85;
            }
          }

          // Tags (compact)
          if (layout.includeTags && vibe.tags && vibe.tags.length > 0) {
            ctx.font = '500 20px system-ui, -apple-system, sans-serif';
            let tagX = contentX;

            for (const tag of vibe.tags.slice(0, 4)) {
              const tagText = `#${tag}`;
              const metrics = ctx.measureText(tagText);
              const tagWidth = metrics.width + 30;

              if (tagX + tagWidth > contentX + contentWidth) break;

              // Tag background
              ctx.fillStyle = hexToRgba(storyColors.primary, 0.1);
              ctx.beginPath();
              ctx.roundRect(tagX, currentY, tagWidth, 32, 16);
              ctx.fill();

              // Tag text
              ctx.fillStyle = storyColors.primary;
              ctx.fillText(tagText, tagX + 15, currentY + 8);

              tagX += tagWidth + 8;
            }
            currentY += 50;
          }

          // Stats at bottom with inline positioning
          currentY = Math.max(currentY, cardY + cardHeight - 90);

          // Inline metadata for better space utilization
          let statsX = contentX;

          if (ratings.length > 0) {
            ctx.font = '20px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = storyColors.foreground;
            const reviewsText = `💬 ${ratings.length} review${ratings.length !== 1 ? 's' : ''}`;
            ctx.fillText(reviewsText, statsX, currentY);

            // Position date inline with reviews
            const reviewsMetrics = ctx.measureText(reviewsText);
            statsX = contentX + reviewsMetrics.width + 30;
          }

          ctx.font = '18px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = storyColors.mutedForeground;
          ctx.fillText(
            `📅 ${format(new Date(vibe.createdAt), 'MMM d, yyyy')}`,
            statsX,
            currentY + 2
          );

          // Footer with proper bottom margin to prevent cutoff
          const footerY = 970; // Adjusted for better spacing from bottom
          ctx.font = '500 28px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = storyColors.foreground;
          ctx.fillText('view full vibe at', 80, footerY);

          ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = storyColors.primary;
          ctx.fillText(APP_DOMAIN, 80, footerY + 35);

          // Convert to blob
          return new Promise((resolve) => {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  setGeneratedBlob(blob);
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
        }

        // Vibe image or placeholder
        let contentY = authorY + 140;

        // Draw image if included in layout
        if (layout.includeImage) {
          // Use passed imageUrl if available, otherwise try to use vibe.image
          let vibeImageUrl: string | null = null;
          if (imageUrl) {
            vibeImageUrl = imageUrl;
          } else if (vibe.image) {
            // Helper to check if a string looks like a Convex storage ID
            const isStorageId = (str: string) =>
              str && /^[a-z0-9]{32}$/.test(str);

            // If image looks like a storage ID, skip it (would need API call to resolve)
            // Otherwise use it as a direct URL
            if (!isStorageId(vibe.image)) {
              vibeImageUrl = vibe.image;
            }
          }

          if (vibeImageUrl) {
            try {
              const vibeImg = new Image();
              vibeImg.crossOrigin = 'anonymous';

              // Add timeout to prevent hanging
              const loadPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(new Error('Vibe image load timeout'));
                }, 3000); // 3 second timeout

                vibeImg.onload = () => {
                  clearTimeout(timeout);
                  resolve(vibeImg);
                };

                vibeImg.onerror = () => {
                  clearTimeout(timeout);
                  reject(new Error('Vibe image load failed'));
                };

                vibeImg.src = vibeImageUrl!;
              });

              await loadPromise;

              // Fixed dimensions for the image container (object-cover behavior)
              const imageContainerWidth = contentWidth;
              const imageContainerHeight = 400;

              // Calculate scale to cover the container (like object-fit: cover)
              const imageAspectRatio = vibeImg.width / vibeImg.height;
              const containerAspectRatio =
                imageContainerWidth / imageContainerHeight;

              let sourceX = 0;
              let sourceY = 0;
              let sourceWidth = vibeImg.width;
              let sourceHeight = vibeImg.height;

              if (imageAspectRatio > containerAspectRatio) {
                // Image is wider than container - crop sides
                const newWidth = vibeImg.height * containerAspectRatio;
                sourceX = (vibeImg.width - newWidth) / 2;
                sourceWidth = newWidth;
              } else {
                // Image is taller than container - crop top/bottom
                const newHeight = vibeImg.width / containerAspectRatio;
                sourceY = (vibeImg.height - newHeight) / 2;
                sourceHeight = newHeight;
              }

              // Draw image with rounded corners (object-cover style)
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(
                contentX,
                contentY,
                imageContainerWidth,
                imageContainerHeight,
                16
              );
              ctx.clip();
              ctx.drawImage(
                vibeImg,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                contentX,
                contentY,
                imageContainerWidth,
                imageContainerHeight
              );
              ctx.restore();

              // Add subtle border
              ctx.strokeStyle = hexToRgba(
                storyColors.border || storyColors.muted,
                0.3
              );
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(
                contentX,
                contentY,
                imageContainerWidth,
                imageContainerHeight,
                16
              );
              ctx.stroke();

              contentY += imageContainerHeight + 40;
            } catch {
              // Fall back to placeholder
              vibeImageUrl = null;
            }
          }

          // Draw placeholder if no image
          if (!vibeImageUrl) {
            const imageContainerWidth = contentWidth;
            const imageContainerHeight = 400;

            // Generate color index from title (like SimpleVibePlaceholder)
            let colorIndex = 0;
            if (vibe.title) {
              let hash = 0;
              for (let i = 0; i < vibe.title.length; i++) {
                hash = vibe.title.charCodeAt(i) + ((hash << 5) - hash);
              }
              colorIndex = Math.abs(hash % 6);
            }

            // Create gradient based on color index
            const placeholderGradient = ctx.createLinearGradient(
              contentX,
              contentY,
              contentX + imageContainerWidth,
              contentY + imageContainerHeight
            );

            // Define gradient colors based on index (similar to SimpleVibePlaceholder)
            const gradientColors = isDarkMode
              ? [
                  ['#ec4899', '#f43f5e'], // pink to rose
                  ['#3b82f6', '#0ea5e9'], // blue to sky
                  ['#10b981', '#34d399'], // green to emerald
                  ['#eab308', '#f59e0b'], // yellow to amber
                  ['#a855f7', '#8b5cf6'], // purple to violet
                  ['#f97316', '#ef4444'], // orange to red
                ]
              : [
                  ['#f9a8d4', '#fda4af'], // light pink to rose
                  ['#93c5fd', '#7dd3fc'], // light blue to sky
                  ['#86efac', '#6ee7b7'], // light green to emerald
                  ['#fde047', '#fbbf24'], // light yellow to amber
                  ['#d8b4fe', '#c084fc'], // light purple to violet
                  ['#fdba74', '#fca5a5'], // light orange to red
                ];

            const [fromColor, toColor] = gradientColors[colorIndex];
            placeholderGradient.addColorStop(0, fromColor);
            placeholderGradient.addColorStop(1, toColor);

            // Draw gradient background with rounded corners
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(
              contentX,
              contentY,
              imageContainerWidth,
              imageContainerHeight,
              16
            );
            ctx.clip();
            ctx.fillStyle = placeholderGradient;
            ctx.fillRect(
              contentX,
              contentY,
              imageContainerWidth,
              imageContainerHeight
            );

            // Add title text in center (white with shadow)
            ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 2;

            // Word wrap title for placeholder
            const placeholderWords = vibe.title.split(' ');
            const lines: string[] = [];
            let currentLine = '';
            const maxPlaceholderWidth = imageContainerWidth - 80;

            for (const word of placeholderWords) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const metrics = ctx.measureText(testLine);
              if (metrics.width > maxPlaceholderWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) {
              lines.push(currentLine);
            }

            // Draw up to 3 lines
            const lineHeight = 45;
            const startY =
              contentY +
              imageContainerHeight / 2 -
              (Math.min(lines.length, 3) * lineHeight) / 2;
            for (let i = 0; i < Math.min(lines.length, 3); i++) {
              ctx.fillText(
                lines[i],
                contentX + imageContainerWidth / 2,
                startY + i * lineHeight + lineHeight / 2
              );
            }

            ctx.restore();
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // Add subtle border
            ctx.strokeStyle = hexToRgba(
              storyColors.border || storyColors.muted,
              0.3
            );
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(
              contentX,
              contentY,
              imageContainerWidth,
              imageContainerHeight,
              16
            );
            ctx.stroke();

            contentY += imageContainerHeight + 40;
          }
        }

        // Vibe title with better typography
        ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = storyColors.cardForeground || storyColors.foreground;

        // Word wrap title
        const words = vibe.title.split(' ');
        let line = '';
        let y = contentY;
        const maxWidth = contentWidth;
        const maxTitleLines = layout.value === 'minimal' ? 3 : 2; // More lines for minimal layout
        let titleLineCount = 0;

        for (const word of words) {
          if (titleLineCount >= maxTitleLines) break;
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, contentX, y);
            line = word + ' ';
            y += 70;
            titleLineCount++;
          } else {
            line = testLine;
          }
        }
        if (titleLineCount < maxTitleLines && line) {
          ctx.fillText(line, contentX, y);
          y += 70;
        }

        // Vibe description with better readability
        const descY = y + 20; // Reduced gap
        ctx.font = '32px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = hexToRgba(
          storyColors.cardForeground || storyColors.foreground,
          0.8
        );

        // Word wrap description
        const descWords = vibe.description.split(' ');
        line = '';
        y = descY;
        let lineCount = 0;
        const maxLines = layout.value === 'minimal' ? 5 : 3; // 5 lines for minimal, 3 for expanded

        for (const word of descWords) {
          if (lineCount >= maxLines) break;
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, contentX, y);
            line = word + ' ';
            y += 45;
            lineCount++;
          } else {
            line = testLine;
          }
        }
        if (lineCount < maxLines && line) {
          ctx.fillText(line, contentX, y);
          y += 45;
        }

        // Tags with gradient backgrounds (if included in layout)
        if (layout.includeTags && vibe.tags && vibe.tags.length > 0) {
          y += 40;
          ctx.font = '500 26px system-ui, -apple-system, sans-serif';
          let tagX = contentX;
          let tagRowCount = 0;
          const maxTagRows = 2; // Max 2 lines of tags

          for (const tag of vibe.tags.slice(0, 8)) {
            // Allow more tags but limit to 2 rows
            const tagText = `#${tag}`;
            const metrics = ctx.measureText(tagText);
            const tagWidth = metrics.width + 40;

            if (tagX + tagWidth > contentX + contentWidth) {
              tagRowCount++;
              if (tagRowCount >= maxTagRows) break; // Stop if we've reached max rows
              tagX = contentX;
              y += 55;
            }

            // Tag background
            ctx.fillStyle = hexToRgba(storyColors.primary, 0.1);
            ctx.beginPath();
            ctx.roundRect(tagX, y, tagWidth, 44, 22);
            ctx.fill();

            // Tag text
            ctx.fillStyle = storyColors.primary;
            ctx.fillText(tagText, tagX + 20, y + 10);

            tagX += tagWidth + 12;
          }
          y += 55;
        }

        // Emoji reactions section (if included in layout)
        if (layout.includeRatings && ratings.length > 0) {
          // Calculate average rating for each emoji
          const emojiAverages = ratings
            .reduce(
              (acc, rating) => {
                const existing = acc.find((e) => e.emoji === rating.emoji);
                if (existing) {
                  existing.totalValue += rating.value;
                  existing.count++;
                } else {
                  acc.push({
                    emoji: rating.emoji,
                    count: 1,
                    totalValue: rating.value,
                    avgRating: rating.value,
                  });
                }
                return acc;
              },
              [] as {
                emoji: string;
                count: number;
                totalValue: number;
                avgRating: number;
              }[]
            )
            .map((item) => ({
              ...item,
              avgRating: item.totalValue / item.count,
            }));

          if (layout.value === 'minimal') {
            // For minimal layout, show only the most rated emoji
            const mostRated = emojiAverages.sort(
              (a, b) => b.count - a.count
            )[0]; // Sort by count for most rated

            if (mostRated) {
              y += 40; // More space before most rated section

              // Draw "most rated" label first
              ctx.font = '500 20px system-ui, -apple-system, sans-serif';
              ctx.fillStyle = storyColors.mutedForeground;
              ctx.fillText('most rated', contentX, y);
              y += 40; // More space between label and emoji row

              // Draw single emoji rating scale
              ctx.font = '500 24px system-ui, -apple-system, sans-serif';
              ctx.fillStyle = storyColors.foreground;
              ctx.textBaseline = 'middle';
              const ratingText = mostRated.avgRating.toFixed(1);
              ctx.fillText(ratingText, contentX, y);

              // Draw 5-emoji scale
              const scaleStartX = contentX + 55;
              const emojiSize = 32;
              const emojiSpacing = 30;

              // Draw unfilled emojis (grayscale background)
              ctx.save();
              ctx.globalAlpha = 0.2;
              ctx.font = `${emojiSize}px system-ui, -apple-system, sans-serif`;
              ctx.textBaseline = 'middle';
              for (let i = 0; i < 5; i++) {
                ctx.fillText(
                  mostRated.emoji,
                  scaleStartX + i * emojiSpacing,
                  y
                );
              }
              ctx.restore();

              // Draw filled emojis based on rating value
              const fillWidth = (mostRated.avgRating / 5) * (5 * emojiSpacing);

              ctx.save();
              // Create clipping region for partial fill
              ctx.beginPath();
              ctx.rect(
                scaleStartX,
                y - emojiSize / 2 - 5,
                fillWidth,
                emojiSize + 10
              );
              ctx.clip();

              // Draw filled emojis
              ctx.font = `${emojiSize}px system-ui, -apple-system, sans-serif`;
              ctx.textBaseline = 'middle';
              for (let i = 0; i < 5; i++) {
                ctx.fillText(
                  mostRated.emoji,
                  scaleStartX + i * emojiSpacing,
                  y
                );
              }
              ctx.restore();

              // Add count
              ctx.font = '20px system-ui, -apple-system, sans-serif';
              ctx.fillStyle = storyColors.mutedForeground;
              ctx.textBaseline = 'middle';
              const countText = `${mostRated.count} rating${mostRated.count !== 1 ? 's' : ''}`;
              ctx.fillText(countText, scaleStartX + 5 * emojiSpacing + 10, y);

              ctx.textBaseline = 'top'; // Reset for next elements
              y += 50;
            }
          } else {
            // For expanded layout, show the most rated emoji (same as minimal)
            const mostRated = emojiAverages.sort(
              (a, b) => b.count - a.count
            )[0]; // Sort by count for most rated

            if (mostRated) {
              y += 40; // More space before most rated section

              // Draw "most rated" label first
              ctx.font = '500 20px system-ui, -apple-system, sans-serif';
              ctx.fillStyle = storyColors.mutedForeground;
              ctx.fillText('most rated', contentX, y);
              y += 40; // More space between label and emoji row

              // Draw single emoji rating scale
              ctx.font = '500 24px system-ui, -apple-system, sans-serif';
              ctx.fillStyle = storyColors.foreground;
              ctx.textBaseline = 'middle';
              const ratingText = mostRated.avgRating.toFixed(1);
              ctx.fillText(ratingText, contentX, y);

              // Draw 5-emoji scale
              const scaleStartX = contentX + 55;
              const emojiSize = 32;
              const emojiSpacing = 30;

              // Draw unfilled emojis (grayscale background)
              ctx.save();
              ctx.globalAlpha = 0.2;
              ctx.font = `${emojiSize}px system-ui, -apple-system, sans-serif`;
              ctx.textBaseline = 'middle';
              for (let i = 0; i < 5; i++) {
                ctx.fillText(
                  mostRated.emoji,
                  scaleStartX + i * emojiSpacing,
                  y
                );
              }
              ctx.restore();

              // Draw filled emojis based on rating value
              const fillWidth = (mostRated.avgRating / 5) * (5 * emojiSpacing);

              ctx.save();
              // Create clipping region for partial fill
              ctx.beginPath();
              ctx.rect(
                scaleStartX,
                y - emojiSize / 2 - 5,
                fillWidth,
                emojiSize + 10
              );
              ctx.clip();

              // Draw filled emojis
              ctx.font = `${emojiSize}px system-ui, -apple-system, sans-serif`;
              ctx.textBaseline = 'middle';
              for (let i = 0; i < 5; i++) {
                ctx.fillText(
                  mostRated.emoji,
                  scaleStartX + i * emojiSpacing,
                  y
                );
              }
              ctx.restore();

              // Add count
              ctx.font = '20px system-ui, -apple-system, sans-serif';
              ctx.fillStyle = storyColors.mutedForeground;
              ctx.textBaseline = 'middle';
              const countText = `${mostRated.count} rating${mostRated.count !== 1 ? 's' : ''}`;
              ctx.fillText(countText, scaleStartX + 5 * emojiSpacing + 10, y);

              ctx.textBaseline = 'top'; // Reset for next elements
              y += 50;
            }
          }

          // Add review text if we have actual Rating objects with reviews (if included in layout)
          const reviewRatings = ratings.filter(
            (r) => 'review' in r && r.review && r.review.trim().length > 0
          ) as Rating[];
          if (layout.includeReview && reviewRatings.length > 0) {
            // Sort reviews by rating value
            const maxReviews = layout.value === 'minimal' ? 5 : 1; // Up to 5 reviews for minimal
            const topReviews = reviewRatings
              .sort((a, b) => b.value - a.value)
              .slice(0, maxReviews);

            // Check if we have enough space for reviews
            const remainingSpace = cardY + cardHeight - 200 - y;
            if (remainingSpace > 80) {
              // Only show reviews if we have enough space
              y += 25;

              // Add "reviews" header for minimal layout
              if (layout.value === 'minimal') {
                ctx.font = '500 26px system-ui, -apple-system, sans-serif';
                ctx.fillStyle = storyColors.mutedForeground;
                ctx.fillText('reviews', contentX, y);
                y += 30;
              }

              for (const topReview of topReviews) {
                if (topReview && topReview.review) {
                  // Check remaining space for each review
                  const spaceNeeded = layout.value === 'minimal' ? 50 : 100; // Less space needed for minimal
                  if (cardY + cardHeight - 180 - y < spaceNeeded) break;

                  // Draw quote mark
                  ctx.font = 'italic 30px Georgia, serif';
                  ctx.fillStyle = hexToRgba(storyColors.primary, 0.15);
                  ctx.fillText('"', contentX - 5, y);

                  // Draw review text
                  ctx.font =
                    layout.value === 'minimal'
                      ? 'italic 20px system-ui, -apple-system, sans-serif'
                      : 'italic 24px system-ui, -apple-system, sans-serif';
                  ctx.fillStyle =
                    storyColors.cardForeground || storyColors.foreground;

                  // Get first line or limited characters
                  let reviewText = topReview.review.trim();
                  const firstLineEnd = reviewText.indexOf('\n');
                  if (firstLineEnd > 0) {
                    reviewText = reviewText.substring(0, firstLineEnd);
                  }
                  const maxChars = layout.value === 'minimal' ? 70 : 60;
                  if (reviewText.length > maxChars) {
                    reviewText = reviewText.substring(0, maxChars - 3) + '...';
                  }

                  // Word wrap the review
                  const reviewWords = reviewText.split(' ');
                  let reviewLine = '';
                  let reviewY = y + 3;
                  const maxReviewWidth = contentWidth - 35;
                  let reviewLineCount = 0;
                  const maxReviewLines = 1; // Always clamp to 1 line for both layouts

                  for (const word of reviewWords) {
                    if (reviewLineCount >= maxReviewLines) {
                      // Add ellipsis if we're cutting off
                      if (reviewLine.length > 0) {
                        reviewLine = reviewLine.trim() + '...';
                      }
                      break;
                    }
                    const testLine = reviewLine + word + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxReviewWidth && reviewLine !== '') {
                      // Cut off and add ellipsis
                      reviewLine = reviewLine.trim() + '...';
                      ctx.fillText(reviewLine, contentX + 18, reviewY);
                      reviewLineCount++;
                      break; // Stop processing more words
                    } else {
                      reviewLine = testLine;
                    }
                  }
                  if (reviewLineCount < maxReviewLines && reviewLine) {
                    ctx.fillText(reviewLine.trim(), contentX + 18, reviewY);
                    reviewY += 24;
                  }

                  // Attribution with emoji, rating, and username
                  ctx.font = '18px system-ui, -apple-system, sans-serif';
                  ctx.fillStyle = storyColors.mutedForeground;

                  // Get username from the user object if available
                  let attribution = `— ${topReview.emoji} ${topReview.value.toFixed(1)}`;
                  if (topReview.user) {
                    const username =
                      topReview.user.username ||
                      topReview.user.first_name ||
                      'anonymous';
                    attribution += ` @${username}`;
                  } else if (topReview.rater) {
                    const username =
                      topReview.rater.username ||
                      topReview.rater.first_name ||
                      'anonymous';
                    attribution += ` @${username}`;
                  }

                  ctx.fillText(attribution, contentX + 18, reviewY + 4);

                  y = reviewY + 28; // Smaller space between reviews for minimal
                  // reviewCount++;
                }
              }

              y += 5; // Small extra space after reviews section
            }
          }
        }

        // Stats section at bottom - ensure minimum spacing and better positioning
        const statsY = Math.max(y + 40, cardY + cardHeight - 200);
        y = statsY;

        // Create inline metadata section with proper spacing
        ctx.font = '24px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = storyColors.foreground;

        // Combine stats on single line for better space usage
        let statsText = '';
        let statsX = contentX;

        if (ratings.length > 0) {
          statsText = `💬 ${ratings.length} review${ratings.length !== 1 ? 's' : ''}`;
          ctx.fillText(statsText, statsX, y);

          // Measure text width to position date next to it
          const statsMetrics = ctx.measureText(statsText);
          statsX = contentX + statsMetrics.width + 40; // Add spacing
        }

        // Date positioned inline with better spacing
        ctx.font = '22px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = storyColors.mutedForeground;
        const dateText = `📅 ${format(new Date(vibe.createdAt), 'MMM d, yyyy')}`;
        ctx.fillText(dateText, statsX, y + 2); // Slight vertical adjustment for better alignment

        // Footer section
        y = 1680;
        ctx.font = '500 32px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isDarkMode ? '#f1f5f9' : storyColors.foreground;
        ctx.fillText('view full vibe at', 80, y);

        ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = storyColors.primary;
        ctx.fillText(APP_DOMAIN, 80, y + 45);

        // Convert to blob
        return new Promise((resolve) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                setGeneratedBlob(blob);
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
      } catch {
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
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
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
