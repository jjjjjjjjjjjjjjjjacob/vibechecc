import * as React from 'react';
import { useFileUpload } from '@/hooks/use-file-upload';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/tailwind-utils';
import { X, Image as ImageIcon } from 'lucide-react';
import type { Id } from '@viberatr/convex/dataModel';

/**
 * Configuration options for the image uploader component.
 * @property onImageUpload Callback fired when a file upload succeeds.
 * @property onImageRemove Callback fired when a file is removed.
 * @property className Optional CSS classes for the root container.
 * @property disabled Disable all interactions when true.
 * @property initialImageUrl URL of an already uploaded image to display.
 */
interface ImageUploadProps {
  // Fired after a successful upload with the storage ID and resulting URL
  onImageUpload?: (storageId: Id<'_storage'>, url: string) => void;
  // Fired when the user removes the selected image
  onImageRemove?: () => void;
  // Additional CSS classes to apply to the component wrapper
  className?: string;
  // Controls whether the uploader should be interactive
  disabled?: boolean;
  // Provide a starting image when editing existing content
  initialImageUrl?: string;
}

/**
 * Image uploader component that provides client-side validation and
 * previews before uploading files to Convex storage.
 */
export function ImageUpload({
  onImageUpload,
  onImageRemove,
  className,
  disabled = false,
  initialImageUrl,
}: ImageUploadProps) {
  // Reference to the hidden file input element
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // Track the preview URL that should be displayed in the UI
  const [previewUrl, setPreviewUrl] = React.useState<string>(
    initialImageUrl || ''
  );
  // Store the storage ID returned after successful upload
  const [_uploadedStorageId, setUploadedStorageId] =
    React.useState<Id<'_storage'> | null>(null);
  // Convex mutation hook responsible for performing the upload
  const uploadMutation = useFileUpload();

  /**
   * Handle user selection of an image file.
   * Performs validation, uploads to Convex, and updates parent state.
   */
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    // Grab the first file from the file input
    const file = event.target.files?.[0];
    if (!file) return; // Exit early if no file was chosen

    // Validate file type to ensure it is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Enforce a maximum file size of 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Show a temporary preview using a blob URL
    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);

    try {
      // Upload the file to Convex using the mutation
      const result = await uploadMutation.mutateAsync(file);
      // Track the storage ID returned by the upload
      setUploadedStorageId(result.storageId);

      // Replace the temporary preview with the persistent URL
      if (result.url) {
        URL.revokeObjectURL(localPreviewUrl);
        setPreviewUrl(result.url);
      }

      // Notify parent components of a successful upload
      if (onImageUpload && result.url) {
        onImageUpload(result.storageId, result.url);
      }
    } catch (error) {
      // Surface upload errors to developers and users
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
      // Reset preview and storage state to initial values
      setPreviewUrl('');
      setUploadedStorageId(null);
    }
  };

  /**
   * Remove the currently selected image and reset component state.
   */
  const handleRemoveImage = () => {
    // Revoke any temporary blob URLs to free memory
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    // Clear preview and storage ID state
    setPreviewUrl('');
    setUploadedStorageId(null);
    // Reset the file input so the same file can be reselected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Invoke the optional removal callback
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
