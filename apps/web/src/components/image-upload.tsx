import * as React from 'react';
import { useFileUpload } from '@/hooks/use-file-upload';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/tailwind-utils';
import { X, Image as ImageIcon } from '@/components/ui/icons';
import type { Id } from '@vibechecc/convex/dataModel';

interface ImageUploadProps {
  onImageUpload?: (storageId: Id<'_storage'>, url: string) => void;
  onImageRemove?: () => void;
  className?: string;
  disabled?: boolean;
  initialImageUrl?: string;
}

export function ImageUpload({
  onImageUpload,
  onImageRemove,
  className,
  disabled = false,
  initialImageUrl,
}: ImageUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string>(
    initialImageUrl || ''
  );
  const uploadMutation = useFileUpload();

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Show preview immediately
    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);

    try {
      // Upload to Convex
      const result = await uploadMutation.mutateAsync(file);

      // Update preview with actual URL
      if (result.url) {
        URL.revokeObjectURL(localPreviewUrl);
        setPreviewUrl(result.url);
      }

      // Notify parent component
      if (onImageUpload && result.url) {
        onImageUpload(result.storageId, result.url);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
      setPreviewUrl('');
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemove?.();
  };

  return (
    <div className={cn('space-y-3', className)}>
      <Label className="text-base font-medium">
        add an image
        <span className="text-muted-foreground ml-1 font-normal">
          (optional)
        </span>
      </Label>

      {previewUrl ? (
        <div className="relative">
          <div className="bg-muted/50 relative overflow-hidden rounded-xl border-2 border-dashed p-2">
            <img
              src={previewUrl}
              alt="Upload preview"
              className="h-48 w-full rounded-lg object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-3 right-3"
              onClick={handleRemoveImage}
              disabled={disabled || uploadMutation.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {uploadMutation.isPending && (
            <div className="bg-background/80 absolute inset-0 flex items-center justify-center rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span className="text-sm">uploading...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'bg-muted/20 relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all',
            'hover:bg-muted/30 hover:border-primary/50',
            'focus-within:border-primary focus-within:ring-primary/20 focus-within:ring-2',
            disabled && 'pointer-events-none opacity-50'
          )}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Upload image file"
        >
          <div className="flex h-32 flex-col items-center justify-center gap-2 p-6">
            <ImageIcon className="text-muted-foreground h-8 w-8" />
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                click to upload an image
              </p>
              <p className="text-muted-foreground text-xs">
                png, jpg, gif up to 10mb
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="sr-only"
            disabled={disabled || uploadMutation.isPending}
          />
        </div>
      )}

      {uploadMutation.isError && (
        <p className="text-destructive text-sm">
          failed to upload image. please try again.
        </p>
      )}
    </div>
  );
}
