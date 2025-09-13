import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router';
import * as React from 'react';
import { useVibe, useUpdateVibeMutation } from '@/queries';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUser } from '@clerk/tanstack-react-start';
import { createServerFn } from '@tanstack/react-start';
import { getAuth } from '@clerk/tanstack-react-start/server';
import { getWebRequest } from '@tanstack/react-start/server';
import { TagInput } from '@/components/tag-input';
import { ImageUpload } from '@/components/image-upload';
import { VibeCard } from '@/features/vibes/components/vibe-card';
import { cn } from '@/utils/tailwind-utils';
import {
  Circle,
  Save,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from '@/components/ui/icons';
import type { Id } from '@vibechecc/convex/dataModel';
import toast from '@/utils/toast';

// Server function to check authentication
const requireAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getWebRequest();
  if (!request) throw new Error('No request found');
  const { userId } = await getAuth(request);

  if (!userId) {
    throw redirect({
      to: '/sign-in',
    });
  }

  return { userId };
});

export const Route = createFileRoute('/vibes/$vibeId/edit')({
  component: EditVibe,
  beforeLoad: async () => await requireAuth(),
});

function EditVibe() {
  const navigate = useNavigate();
  const { vibeId } = Route.useParams();
  const { user } = useUser();
  const {
    data: vibe,
    isLoading: vibeLoading,
    error: vibeError,
  } = useVibe(vibeId);
  const [description, setDescription] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);
  const [imageStorageId, setImageStorageId] =
    React.useState<Id<'_storage'> | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [validationErrors, setValidationErrors] = React.useState<
    Record<string, string>
  >({});
  const [isPreviewMode, setIsPreviewMode] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const updateVibeMutation = useUpdateVibeMutation();

  // Preview vibe data
  const previewVibe = React.useMemo(() => {
    if (!vibe) return null;
    return {
      ...vibe,
      description: description || vibe.description,
      image: currentImageUrl || vibe.image,
      tags: tags.length > 0 ? tags : vibe.tags,
    };
  }, [vibe, description, currentImageUrl, tags]);

  // Track original values to detect changes (excluding title which is read-only)
  const [originalValues, setOriginalValues] = React.useState({
    description: '',
    tags: [] as string[],
    imageUrl: '',
  });

  // Initialize form with vibe data
  React.useEffect(() => {
    if (vibe && !vibe.isDeleted) {
      const initialValues = {
        description: vibe.description || '',
        tags: vibe.tags || [],
        imageUrl: vibe.image || '',
      };

      setDescription(initialValues.description);
      setTags(initialValues.tags);
      setCurrentImageUrl(initialValues.imageUrl);
      setOriginalValues(initialValues);
    }
  }, [vibe]);

  // Check for unsaved changes
  React.useEffect(() => {
    const hasChanges =
      description !== originalValues.description ||
      JSON.stringify(tags) !== JSON.stringify(originalValues.tags) ||
      currentImageUrl !== originalValues.imageUrl;

    setHasUnsavedChanges(hasChanges);
  }, [description, tags, currentImageUrl, originalValues]);

  // Real-time validation
  React.useEffect(() => {
    const errors: Record<string, string> = {};

    if (description.trim().length === 0) {
      errors.description = 'Description is required';
    } else if (description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    } else if (description.trim().length > 2000) {
      errors.description = 'Description must be less than 2000 characters';
    }

    if (tags.length > 10) {
      errors.tags = 'Maximum 10 tags allowed';
    }

    setValidationErrors(errors);
  }, [description, tags]);

  // Warn about unsaved changes when leaving
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Check if user owns this vibe
  const isOwner = user?.id && vibe && vibe.createdById === user.id;

  if (vibeLoading) {
    return (
      <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl">
            <div className="bg-background/90 rounded-2xl border-none p-8 shadow-2xl backdrop-blur">
              <div className="animate-pulse space-y-6">
                <div className="bg-muted h-8 rounded"></div>
                <div className="bg-muted h-4 w-3/4 rounded"></div>
                <div className="bg-muted h-32 rounded"></div>
                <div className="bg-muted h-4 w-1/2 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (vibeError || !vibe || vibe.isDeleted) {
    return (
      <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl">
            <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-xl border px-4 py-3 backdrop-blur">
              <p className="text-sm">
                {vibe?.isDeleted
                  ? 'Cannot edit a deleted vibe.'
                  : 'Vibe not found or you do not have permission to edit it.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl">
            <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-xl border px-4 py-3 backdrop-blur">
              <p className="text-sm">You can only edit your own vibes.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    if (!user?.id) {
      setError('You must be signed in to edit a vibe');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await updateVibeMutation.mutateAsync({
        vibeId,
        description: description.trim(),
        image: imageStorageId || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });

      toast.success('vibe updated successfully!');
      setHasUnsavedChanges(false); // Reset unsaved changes flag
      navigate({ to: '/vibes/$vibeId', params: { vibeId } });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while updating your vibe');
      }
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave without saving?'
      );
      if (!confirmLeave) return;
    }
    navigate({ to: '/vibes/$vibeId', params: { vibeId } });
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const isFormValid =
    Object.keys(validationErrors).length === 0 && description.trim();

  const handleImageUpload = (storageId: Id<'_storage'>, url: string) => {
    setImageStorageId(storageId);
    setCurrentImageUrl(url);
  };

  const handleImageRemove = () => {
    setImageStorageId(null);
    setCurrentImageUrl('');
  };

  if (isPreviewMode && previewVibe) {
    return (
      <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-foreground text-2xl font-bold">
                  preview mode
                </h1>
                <p className="text-muted-foreground text-sm">
                  see how your vibe will look
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={togglePreview}>
                  <EyeOff className="mr-2 h-4 w-4" />
                  exit preview
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {isSubmitting ? (
                    <>
                      <Circle className="mr-2 h-4 w-4 animate-spin" />
                      updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      save changes
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <VibeCard vibe={previewVibe} variant="default" />
              </div>
              <div className="space-y-4">
                <div className="bg-background/90 rounded-lg border p-4">
                  <h3 className="mb-2 font-medium">changes summary</h3>
                  <div className="space-y-2 text-sm">
                    {description !== originalValues.description && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-success h-4 w-4" />
                        <span>Description updated</span>
                      </div>
                    )}
                    {currentImageUrl !== originalValues.imageUrl && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-success h-4 w-4" />
                        <span>Image updated</span>
                      </div>
                    )}
                    {JSON.stringify(tags) !==
                      JSON.stringify(originalValues.tags) && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-success h-4 w-4" />
                        <span>Tags updated</span>
                      </div>
                    )}
                    {!hasUnsavedChanges && (
                      <div className="text-muted-foreground text-xs">
                        no changes made
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mx-auto max-w-2xl">
          {/* Header with gradient text */}
          <div className="my-6 text-center">
            <div className="flex items-center justify-center gap-4">
              <h1 className="animate-gradient-text drop-shadow-theme-primary/50 themed-gradient-text text-3xl font-bold lowercase drop-shadow-md sm:text-4xl">
                edit your vibe
              </h1>
              {hasUnsavedChanges && (
                <div className="text-warning flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">unsaved changes</span>
                </div>
              )}
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              make changes to your vibe
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border-destructive/20 text-destructive mb-6 rounded-xl border px-4 py-3 backdrop-blur">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Main form card with backdrop blur */}
          <div className="bg-background/90 animate-in fade-in-0 slide-in-from-bottom-4 rounded-2xl border-none p-3 shadow-2xl backdrop-blur duration-500 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Section - Read Only */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  vibe title
                  <span className="text-muted-foreground ml-1 font-normal">
                    (cannot be changed)
                  </span>
                </Label>
                <div className="bg-muted/50 border-muted text-muted-foreground flex h-11 items-center rounded-md border px-3 py-2 text-base sm:h-12">
                  {vibe?.title}
                </div>
                <div className="text-muted-foreground text-xs">
                  vibe titles cannot be edited, similar to reddit posts
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-3">
                <Label htmlFor="description" className="text-base font-medium">
                  tell the story
                  <span className="text-muted-foreground ml-1 font-normal">
                    (required)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="describe your vibe in detail..."
                  rows={5}
                  className={cn(
                    'textarea-glow resize-none border-2 bg-transparent text-base transition-all',
                    'focus:border-theme-primary focus:ring-theme-primary/20',
                    validationErrors.description
                      ? 'border-destructive focus:border-destructive'
                      : description && !validationErrors.description
                        ? 'border-success/50'
                        : 'border-theme-primary/50'
                  )}
                  required
                />
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={
                      validationErrors.description
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    }
                  >
                    {validationErrors.description || 'be authentic, be you'}
                  </span>
                  <span
                    className={
                      description.length > 1800
                        ? 'text-warning'
                        : 'text-muted-foreground'
                    }
                  >
                    {description.length}/2000
                  </span>
                </div>
              </div>

              {/* Image Upload Section */}
              <ImageUpload
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
                disabled={isSubmitting}
                initialImageUrl={currentImageUrl}
              />

              {/* Tags Section */}
              <div className="space-y-3">
                <Label htmlFor="tags" className="text-base font-medium">
                  tag your vibe
                  <span className="text-muted-foreground ml-1 font-normal">
                    (optional)
                  </span>
                </Label>
                <TagInput
                  tags={tags}
                  onTagsChange={setTags}
                  placeholder="add tags to help others discover your vibe..."
                />
                <div className="flex justify-between text-xs">
                  <span
                    className={
                      validationErrors.tags
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    }
                  >
                    {validationErrors.tags ||
                      'use tags to categorize your vibe'}
                  </span>
                  <span
                    className={
                      tags.length > 8 ? 'text-warning' : 'text-muted-foreground'
                    }
                  >
                    {tags.length}/10 tags
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 border-t pt-6">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="h-11 flex-1 transition-all hover:scale-105 sm:h-12"
                  >
                    <X className="mr-2 h-4 w-4" />
                    cancel
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={togglePreview}
                    disabled={isSubmitting || !isFormValid}
                    className="h-11 flex-1 transition-all hover:scale-105 sm:h-12"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    preview
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className={cn(
                      'h-11 flex-1 transition-all sm:h-12',
                      'bg-gradient-to-r from-purple-600 to-pink-600',
                      'hover:from-purple-700 hover:to-pink-700',
                      'disabled:from-gray-600 disabled:to-gray-600',
                      !isSubmitting && 'hover:scale-105'
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Circle className="mr-2 h-4 w-4 animate-spin" />
                        updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        update vibe
                      </>
                    )}
                  </Button>
                </div>

                {hasUnsavedChanges && (
                  <div className="border-warning/20 bg-warning/10 text-warning rounded-lg border p-3 text-center text-sm">
                    <AlertCircle className="mr-1 inline h-4 w-4" />
                    you have unsaved changes
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Bottom hint */}
          <p className="text-muted-foreground mt-6 text-center text-xs">
            your updated vibe will be visible to everyone on vibechecc
          </p>
        </div>
      </div>
    </div>
  );
}

export default EditVibe;
