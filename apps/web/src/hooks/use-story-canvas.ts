import { useState, useCallback } from 'react';
import toast from '@/utils/toast';
import type { Vibe, User, EmojiRating, Rating } from '@vibechecc/types';
import { computeUserDisplayName } from '@/utils/user-utils';
import { format } from 'date-fns';
import QRCode from 'qrcode';
import { extractThemeColors, hexToRgba } from '@/utils/theme-color-extractor';
import { APP_NAME, APP_DOMAIN } from '@/config/app';

interface UseStoryCanvasOptions {
  filename?: string;
}

export interface LayoutOption {
  value: 'expanded' | 'minimal';
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
      shareUrl: string,
      imageUrl?: string | null,
      layoutOption?: LayoutOption
    ): Promise<Blob | null> => {
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

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
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
        ctx.fillRect(0, 0, 1080, 1920);

        // Draw header
        ctx.textBaseline = 'top';
        ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';

        // Create gradient for app name text
        const headerGradient = ctx.createLinearGradient(80, 80, 400, 80);
        headerGradient.addColorStop(0, storyColors.primary);
        headerGradient.addColorStop(1, storyColors.secondary);
        ctx.fillStyle = headerGradient;
        ctx.fillText(APP_NAME, 80, 80);

        ctx.font = '36px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = storyColors.mutedForeground;
        ctx.fillText('share your vibe', 580, 100);

        // Draw main card with nice shadow and rounded corners
        const cardY = 200;
        const cardHeight = 1400;
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

        // Avatar circle with border
        ctx.strokeStyle = storyColors.primary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(contentX + 48, authorY + 48, 48, 0, Math.PI * 2);
        ctx.stroke();

        // Avatar background
        ctx.fillStyle = storyColors.muted;
        ctx.beginPath();
        ctx.arc(contentX + 48, authorY + 48, 45, 0, Math.PI * 2);
        ctx.fill();

        // Draw initials for author
        const displayName = computeUserDisplayName(author);
        const initials = displayName.slice(0, 2).toUpperCase();
        ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = storyColors.foreground;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, contentX + 48, authorY + 48);

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
              await new Promise((resolve, reject) => {
                vibeImg.onload = resolve;
                vibeImg.onerror = reject;
                vibeImg.src = vibeImageUrl!;
              });

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

        // Stats section at bottom - ensure minimum spacing
        const statsY = Math.max(y + 30, cardY + cardHeight - 180);
        y = statsY;

        // Draw stat icons and text
        ctx.font = '600 32px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = storyColors.foreground;

        // Reviews count
        ctx.font = '28px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = storyColors.foreground;
        if (ratings.length > 0) {
          ctx.fillText(`💬 ${ratings.length} reviews`, contentX, y);
          y += 45;
        }

        // Date
        ctx.font = '26px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = storyColors.mutedForeground;
        ctx.fillText(
          `📅 ${format(new Date(vibe.createdAt), 'MMM d, yyyy')}`,
          contentX,
          y
        );

        // Footer section
        y = 1680;
        ctx.font = '500 32px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isDarkMode ? '#f1f5f9' : storyColors.foreground;
        ctx.fillText('scan to view full vibe', 80, y);

        ctx.font = '26px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isDarkMode ? '#94a3b8' : storyColors.mutedForeground;
        ctx.fillText(APP_DOMAIN, 80, y + 40);

        // QR code with rounded corners
        try {
          const qrDataUrl = await QRCode.toDataURL(shareUrl, {
            width: 140,
            margin: 1,
            color: {
              dark: isDarkMode ? '#000000' : '#000000',
              light: isDarkMode ? '#ffffff' : '#ffffff',
            },
          });

          const img = new Image();
          img.src = qrDataUrl;
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          // QR background (always white for better scanning)
          const qrX = 850;
          const qrY = y - 25;

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(qrX, qrY, 170, 170, 16);
          ctx.fill();

          ctx.strokeStyle = hexToRgba(storyColors.primary, 0.3);
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw QR code
          ctx.drawImage(img, qrX + 15, qrY + 15, 140, 140);
        } catch {
          // QR code generation failed, continue without it
        }

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
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
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
