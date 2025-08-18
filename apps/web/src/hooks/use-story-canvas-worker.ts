import { useState, useCallback, useRef, useEffect } from 'react';
import type { Vibe, User, EmojiRating, Rating } from '@vibechecc/types';
import type { LayoutOption } from './use-story-canvas';
import { extractThemeColors } from '@/utils/theme-color-extractor';

interface UseStoryCanvasWorkerOptions {
  filename?: string;
}

interface CanvasGenerationTask {
  id: string;
  resolve: (blob: Blob | null) => void;
  reject: (error: Error) => void;
}

export function useStoryCanvasWorker(
  options: UseStoryCanvasWorkerOptions = {}
) {
  const { filename = 'vibe-share.png' } = options;
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlobs, setGeneratedBlobs] = useState<Map<string, Blob>>(
    new Map()
  );
  const workerRef = useRef<Worker | null>(null);
  const tasksRef = useRef<Map<string, CanvasGenerationTask>>(new Map());

  // Initialize worker
  useEffect(() => {
    if (typeof Worker === 'undefined') return;

    // Create worker
    workerRef.current = new Worker(
      new URL('../workers/story-canvas.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Handle messages from worker
    workerRef.current.addEventListener('message', (event) => {
      const { type, id, blob, error } = event.data;

      if (type !== 'result') return;

      const task = tasksRef.current.get(id);
      if (!task) return;

      if (error) {
        task.reject(new Error(error));
      } else if (blob) {
        // Store blob for reuse
        setGeneratedBlobs((prev) => new Map(prev).set(id, blob));
        task.resolve(blob);
      } else {
        task.reject(new Error('Failed to generate image'));
      }

      // Clean up task
      tasksRef.current.delete(id);

      // Update generating state
      if (tasksRef.current.size === 0) {
        setIsGenerating(false);
      }
    });

    // Handle worker errors
    workerRef.current.addEventListener('error', (_error) => {
      // Reject all pending tasks
      tasksRef.current.forEach((task) => {
        task.reject(new Error('Worker error'));
      });
      tasksRef.current.clear();
      setIsGenerating(false);
    });

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const generateCanvasImage = useCallback(
    async (
      vibe: Vibe,
      author: User,
      ratings: (EmojiRating | Rating)[] = [],
      shareUrl: string,
      imageUrl?: string | null,
      layoutOption?: LayoutOption
    ): Promise<Blob | null> => {
      // Create unique ID for this generation
      const taskId = `${vibe.id}-${layoutOption?.value || 'default'}-${Date.now()}`;

      // Check if we already have this blob
      const existingBlob = generatedBlobs.get(taskId);
      if (existingBlob) {
        return existingBlob;
      }

      // If no worker, fall back to main thread (shouldn't happen)
      if (!workerRef.current) {
        return null;
      }

      setIsGenerating(true);

      // Get theme colors
      const colors = extractThemeColors();

      // Detect dark mode
      const htmlElement = document.documentElement;
      const isDarkMode =
        htmlElement.classList.contains('dark') ||
        (!htmlElement.classList.contains('light') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      // Create promise for this task
      return new Promise<Blob | null>((resolve, reject) => {
        // Store task
        tasksRef.current.set(taskId, { id: taskId, resolve, reject });

        // Send message to worker
        workerRef.current!.postMessage({
          type: 'generate',
          id: taskId,
          vibe,
          author,
          ratings,
          shareUrl,
          imageUrl,
          layoutOption: layoutOption || {
            value: 'compact',
            label: 'compact',
            description: 'image + ratings',
            includeImage: true,
            includeRatings: true,
            includeReview: false,
            includeTags: true,
          },
          colors,
          isDarkMode,
        });
      });
    },
    [generatedBlobs]
  );

  const generateAllLayouts = useCallback(
    async (
      vibe: Vibe,
      author: User,
      ratings: (EmojiRating | Rating)[] = [],
      shareUrl: string,
      layouts: LayoutOption[],
      imageUrl?: string | null
    ): Promise<Map<string, Blob | null>> => {
      // Generate all layouts in parallel
      const promises = layouts.map((layout) =>
        generateCanvasImage(
          vibe,
          author,
          ratings,
          shareUrl,
          imageUrl,
          layout
        ).then((blob) => ({ layout: layout.value, blob }))
      );

      const results = await Promise.allSettled(promises);
      const blobMap = new Map<string, Blob | null>();

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          blobMap.set(result.value.layout, result.value.blob);
        }
      });

      return blobMap;
    },
    [generateCanvasImage]
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
    },
    [filename]
  );

  const shareImage = useCallback(
    async (blob: Blob, shareData?: ShareData) => {
      if (!navigator.share) {
        return false;
      }

      if (
        !navigator.canShare ||
        !navigator.canShare({ files: [new File([blob], filename)] })
      ) {
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
          // Sharing was cancelled or failed
        }
        return false;
      }
    },
    [filename]
  );

  return {
    isGenerating,
    generatedBlobs,
    generateCanvasImage,
    generateAllLayouts,
    downloadImage,
    shareImage,
  };
}
