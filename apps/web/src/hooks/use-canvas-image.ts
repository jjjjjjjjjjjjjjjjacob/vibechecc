import { useState, useCallback, useRef } from 'react';
import toast from '@/utils/toast';
import type { Vibe, User, EmojiRating } from '@vibechecc/types';
import { computeUserDisplayName } from '@/utils/user-utils';
import { format } from 'date-fns';
import QRCode from 'qrcode';

interface UseCanvasImageOptions {
  filename?: string;
}

export function useCanvasImage(options: UseCanvasImageOptions = {}) {
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
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Fill background
        const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
        gradient.addColorStop(0, '#f0f4f8');
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, '#e6f2ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1920);

        // Set up text styles
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#1f2937';

        // Draw header
        ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#3b82f6';
        ctx.fillText('vibechecc', 80, 80);

        ctx.font = '36px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('share your vibe', 580, 100);

        // Draw card background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.lineWidth = 4;
        const cardY = 200;
        const cardHeight = 1400;
        ctx.beginPath();
        ctx.roundRect(80, cardY, 920, cardHeight, 16);
        ctx.fill();
        ctx.stroke();

        // Author section
        const authorY = cardY + 60;

        // Avatar placeholder (circle)
        ctx.fillStyle = '#e5e7eb';
        ctx.beginPath();
        ctx.arc(140, authorY + 48, 48, 0, Math.PI * 2);
        ctx.fill();

        // Avatar initials
        const displayName = computeUserDisplayName(author);
        const initials = displayName.slice(0, 2).toUpperCase();
        ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#1f2937';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, 140, authorY + 48);

        // Author name
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '600 36px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#1f2937';
        ctx.fillText(displayName, 220, authorY + 20);

        if (author.username) {
          ctx.font = '28px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#64748b';
          ctx.fillText(`@${author.username}`, 220, authorY + 65);
        }

        // Vibe title
        const contentY = authorY + 140;
        ctx.font = 'bold 60px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#1f2937';

        // Word wrap title
        const words = vibe.title.split(' ');
        let line = '';
        let y = contentY;
        const maxWidth = 840;

        for (const word of words) {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, 100, y);
            line = word + ' ';
            y += 75;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 100, y);

        // Vibe description
        const descY = y + 100;
        ctx.font = '36px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(31, 41, 55, 0.9)';

        // Word wrap description (limit to ~6 lines)
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
            ctx.fillText(line, 100, y);
            line = word + ' ';
            y += 50;
            lineCount++;
          } else {
            line = testLine;
          }
        }
        if (lineCount < maxLines && line) {
          ctx.fillText(line, 100, y);
          y += 50;
        }

        // Tags
        if (vibe.tags && vibe.tags.length > 0) {
          y += 40;
          ctx.font = '500 28px system-ui, -apple-system, sans-serif';
          let tagX = 100;

          for (const tag of vibe.tags.slice(0, 5)) {
            const tagText = `#${tag}`;
            const metrics = ctx.measureText(tagText);
            const tagWidth = metrics.width + 48;

            if (tagX + tagWidth > 980) {
              tagX = 100;
              y += 60;
            }

            // Tag background
            ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            ctx.beginPath();
            ctx.roundRect(tagX, y, tagWidth, 48, 24);
            ctx.fill();

            // Tag text
            ctx.fillStyle = '#3b82f6';
            ctx.fillText(tagText, tagX + 24, y + 12);

            tagX += tagWidth + 12;
          }
          y += 60;
        }

        // Stats
        y = cardY + cardHeight - 200;
        ctx.font = '600 36px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#1f2937';

        const reviewText = `${ratings.length} reviews`;
        ctx.fillText(reviewText, 100, y);

        if (ratings.length > 0) {
          const avgRating =
            ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length;
          const ratingText = `${avgRating.toFixed(1)} rating`;
          ctx.fillText(ratingText, 400, y);
        }

        // Date
        y += 60;
        ctx.font = '28px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#64748b';
        const dateText = format(new Date(vibe.createdAt), 'MMM d, yyyy');
        ctx.fillText(dateText, 100, y);

        // Footer
        y = 1700;
        ctx.font = '500 36px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#1f2937';
        ctx.fillText('scan to view full vibe', 80, y);

        ctx.font = '28px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('vibechecc.app', 80, y + 45);

        // Generate and draw QR code
        try {
          const qrDataUrl = await QRCode.toDataURL(shareUrl, {
            width: 128,
            margin: 0,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });

          const img = new Image();
          img.src = qrDataUrl;
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          // Draw QR code with white background
          ctx.fillStyle = 'white';
          ctx.fillRect(850, y - 20, 160, 160);
          ctx.drawImage(img, 866, y - 4, 128, 128);
        } catch {
          // QR code generation failed, continue without it
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
      } catch (_error) {
        if ((_error as Error).name !== 'AbortError') {
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
