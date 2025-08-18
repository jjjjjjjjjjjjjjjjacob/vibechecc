import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Minimize2, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

interface StoryImagePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title?: string;
}

export function StoryImagePreview({
  open,
  onOpenChange,
  imageUrl,
  title = 'Story Preview',
}: StoryImagePreviewProps) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = useCallback(() => {
    if (!containerRef.current) {
      setScale((prev) => Math.min(prev + 0.25, 2));
      return;
    }

    // Get current scroll position and container dimensions
    const container = containerRef.current;
    const scrollCenterX = container.scrollLeft + container.clientWidth / 2;
    const scrollCenterY = container.scrollTop + container.clientHeight / 2;

    // Calculate relative position (0-1)
    const relativeX = scrollCenterX / container.scrollWidth;
    const relativeY = scrollCenterY / container.scrollHeight;

    // Update scale
    const newScale = Math.min(scale + 0.25, 2);
    setScale(newScale);

    // After state update, adjust scroll to maintain center
    requestAnimationFrame(() => {
      const newScrollWidth = container.scrollWidth;
      const newScrollHeight = container.scrollHeight;

      container.scrollLeft =
        relativeX * newScrollWidth - container.clientWidth / 2;
      container.scrollTop =
        relativeY * newScrollHeight - container.clientHeight / 2;
    });
  }, [scale]);

  const handleZoomOut = useCallback(() => {
    if (!containerRef.current) {
      setScale((prev) => Math.max(prev - 0.25, 0.5));
      return;
    }

    // Get current scroll position and container dimensions
    const container = containerRef.current;
    const scrollCenterX = container.scrollLeft + container.clientWidth / 2;
    const scrollCenterY = container.scrollTop + container.clientHeight / 2;

    // Calculate relative position (0-1)
    const relativeX = scrollCenterX / container.scrollWidth;
    const relativeY = scrollCenterY / container.scrollHeight;

    // Update scale
    const newScale = Math.max(scale - 0.25, 0.5);
    setScale(newScale);

    // After state update, adjust scroll to maintain center
    requestAnimationFrame(() => {
      const newScrollWidth = container.scrollWidth;
      const newScrollHeight = container.scrollHeight;

      container.scrollLeft =
        relativeX * newScrollWidth - container.clientWidth / 2;
      container.scrollTop =
        relativeY * newScrollHeight - container.clientHeight / 2;
    });
  }, [scale]);

  const handleReset = () => {
    setScale(1);
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
      containerRef.current.scrollTop = 0;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleZoomIn, handleZoomOut, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[95vh] max-w-[95vw] overflow-hidden p-0 sm:max-w-3xl"
        showCloseButton={false}
      >
        <div className="relative flex h-full flex-col">
          {/* Header */}
          <div className="bg-background/95 flex items-center justify-between border-b px-4 py-2 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="from-theme-primary/20 to-theme-secondary/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br">
                <Sparkles className="text-theme-primary h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <h3 className="line-clamp-1 text-sm leading-tight font-semibold">
                  {title}
                </h3>
                <p className="text-muted-foreground text-xs leading-tight">
                  story preview
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                className="h-7 w-7 p-0"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReset}
                className="h-7 px-2 text-xs font-medium"
              >
                {Math.round(scale * 100)}%
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleZoomIn}
                disabled={scale >= 2}
                className="h-7 w-7 p-0"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <div className="bg-border mx-1 h-4 w-px" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-7 w-7 p-0"
                title="Minimize"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Image Container */}
          <div
            ref={containerRef}
            className="relative flex-1 overflow-auto"
            style={{
              background:
                'radial-gradient(circle, var(--muted) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              backgroundColor: 'hsl(var(--muted) / 0.3)',
            }}
          >
            <div
              className="flex items-center justify-center p-8"
              style={{
                minWidth: scale > 1 ? `${100 * scale}%` : '100%',
                minHeight: scale > 1 ? `${100 * scale}%` : '100%',
              }}
            >
              <img
                src={imageUrl}
                alt={title}
                className="h-auto max-h-[80vh] w-auto transition-transform duration-200"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'center center',
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
