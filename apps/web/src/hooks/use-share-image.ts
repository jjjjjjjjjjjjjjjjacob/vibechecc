import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import toast from '@/utils/toast';

interface UseShareImageOptions {
  filename?: string;
  quality?: number;
}

export function useShareImage(options: UseShareImageOptions = {}) {
  const { filename = 'vibe-share.png', quality = 0.95 } = options;
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  const generateImage = useCallback(
    async (element: HTMLElement): Promise<Blob | null> => {
      setIsGenerating(true);
      try {
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
        });

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
            quality
          );
        });
      } catch {
        toast.error('failed to generate image');
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [quality]
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

  const copyImageToClipboard = useCallback(async (blob: Blob) => {
    if (!navigator.clipboard || !window.ClipboardItem) {
      toast.error('clipboard not supported');
      return false;
    }

    try {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      toast('image copied to clipboard');
      return true;
    } catch {
      toast.error('failed to copy image');
      return false;
    }
  }, []);

  return {
    isGenerating,
    generatedBlob,
    generateImage,
    downloadImage,
    shareImage,
    copyImageToClipboard,
  };
}
