import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router';
import * as React from 'react';
import { useCreateVibeMutation } from '@/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUser } from '@clerk/tanstack-react-start';
import { usePostHog } from '@/hooks/usePostHog';
import { enhancedTrackEvents, enhancedAnalytics } from '@/lib/enhanced-posthog';
import {
  useFormTracking,
  usePageTracking,
} from '@/hooks/use-enhanced-analytics';
import { createServerFn } from '@tanstack/react-start';
import { getAuth } from '@clerk/tanstack-react-start/server';
import { getWebRequest } from '@tanstack/react-start/server';
import { TagInput } from '@/components/tag-input';
import { ImageUpload } from '@/components/image-upload';
import { cn } from '@/utils/tailwind-utils';
import { Circle, Sparkles } from 'lucide-react';
import type { Id } from '@viberater/convex/dataModel';
import toast from '@/utils/toast';
import '@/styles/create-vibe.css';

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

export const Route = createFileRoute('/vibes/create')({
  component: CreateVibe,
  beforeLoad: async () => await requireAuth(),
});

function CreateVibe() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { trackEvents } = usePostHog();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);
  const [imageStorageId, setImageStorageId] =
    React.useState<Id<'_storage'> | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const createVibeMutation = useCreateVibeMutation();
  const [formStartTime] = React.useState(Date.now());

  // Enhanced analytics tracking
  const { trackFieldInteraction, trackFormSubmit: _trackFormSubmit } =
    useFormTracking('create_vibe');
  usePageTracking('create_vibe', { form_type: 'vibe_creation' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      // Track form submission failure with validation errors
      enhancedAnalytics.captureWithContext('form_submitted', {
        form_name: 'create_vibe',
        success: false,
        validation_error: 'Title and description are required',
        field_errors: {
          title: !title.trim() ? 'required' : undefined,
          description: !description.trim() ? 'required' : undefined,
        },
        user_id: user?.id,
      });
      return;
    }

    if (!user?.id) {
      setError('You must be signed in to create a vibe');
      // Track auth error
      enhancedAnalytics.captureWithContext('form_submitted', {
        form_name: 'create_vibe',
        success: false,
        auth_error: 'User not authenticated',
        user_id: user?.id,
      });
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const creationStartTime = Date.now();
      const result = await createVibeMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        image: imageStorageId || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      const creationDuration = Date.now() - creationStartTime;

      // Track enhanced vibe creation with comprehensive metadata
      enhancedTrackEvents.content_vibe_created(
        (result as string) || 'unknown',
        user.id,
        tags,
        !!imageStorageId,
        description.trim().length
      );

      // Track form completion analytics
      enhancedAnalytics.captureWithContext('form_submitted', {
        form_name: 'create_vibe',
        success: true,
        creation_duration: creationDuration,
        form_completion_time: Date.now() - formStartTime,
        content_quality_score:
          description.trim().length +
          tags.length * 10 +
          (imageStorageId ? 20 : 0),
        user_id: user.id,
      });

      // Track legacy event for backward compatibility
      trackEvents.vibeCreated((result as string) || 'unknown', tags);

      // Show success toast with action to go to vibe
      toast.success('vibe created successfully!', {
        duration: 5000,
        action: {
          label: 'Go to Vibe',
          onClick: () =>
            navigate({
              to: '/vibes/$vibeId',
              params: { vibeId: result as string },
            }),
        },
      });

      // Redirect to home page after successful creation
      navigate({ to: '/' });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An error occurred while creating your vibe';
      setError(errorMessage);

      // Track form submission failure
      enhancedAnalytics.captureWithContext('form_submitted', {
        form_name: 'create_vibe',
        success: false,
        api_error: errorMessage,
        creation_attempt_duration: Date.now() - formStartTime,
        user_id: user?.id,
      });

      // Track enhanced error
      enhancedTrackEvents.error_api_failed(
        'vibes/create',
        'CREATION_FAILED',
        errorMessage,
        {
          title_length: title.trim().length,
          description_length: description.trim().length,
          tag_count: tags.length,
          has_image: !!imageStorageId,
        }
      );

      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (storageId: Id<'_storage'>, _url: string) => {
    setImageStorageId(storageId);

    // Track image upload completion
    enhancedTrackEvents.content_image_uploaded(
      'file_upload', // Using file upload method
      0, // File size not available in this callback
      undefined, // Dimensions not available
      undefined // Upload time not available without component modification
    );

    // Track field interaction
    trackFieldInteraction('image', 'change');
  };

  const handleImageRemove = () => {
    setImageStorageId(null);
    trackFieldInteraction('image', 'change');
  };

  return (
    <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mx-auto max-w-2xl">
          {/* Header with gradient text */}
          <div className="my-6 text-center">
            <h1 className="animate-gradient-text drop-shadow-theme-secondary/50 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-3xl font-bold text-transparent lowercase drop-shadow-md sm:text-4xl">
              create a new vibe
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              share your moment bc why not
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
              {/* Title Section */}
              <div className="space-y-3">
                <Label htmlFor="title" className="text-base font-medium">
                  vibe title
                  <span className="text-muted-foreground ml-1 font-normal">
                    (required)
                  </span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    trackFieldInteraction('title', 'change');
                  }}
                  onFocus={() => trackFieldInteraction('title', 'focus')}
                  onBlur={() => trackFieldInteraction('title', 'blur')}
                  placeholder="give your vibe a catchy title"
                  className={cn(
                    'input-glow h-11 border-2 bg-transparent text-base transition-all sm:h-12',
                    'focus:border-purple-500 focus:ring-purple-500/20',
                    title && 'border-purple-500/50'
                  )}
                  required
                />
                <p className="text-muted-foreground text-xs">
                  make it memorable and lowercase
                </p>
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
                  onChange={(e) => {
                    setDescription(e.target.value);
                    trackFieldInteraction('description', 'change');
                  }}
                  onFocus={() => trackFieldInteraction('description', 'focus')}
                  onBlur={() => trackFieldInteraction('description', 'blur')}
                  placeholder="describe your vibe in detail..."
                  rows={5}
                  className={cn(
                    'textarea-glow resize-none border-2 bg-transparent text-base transition-all',
                    'focus:border-pink-500 focus:ring-pink-500/20',
                    description && 'border-pink-500/50'
                  )}
                  required
                />
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span>be authentic, be you</span>
                  <span>{description.length} characters</span>
                </div>
              </div>

              {/* Image Upload Section */}
              <ImageUpload
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
                disabled={isSubmitting}
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
                  onTagsChange={(newTags) => {
                    setTags(newTags);
                    trackFieldInteraction('tags', 'change');
                  }}
                  placeholder="add tags to help others discover your vibe..."
                />
                <p className="text-muted-foreground text-xs">
                  use tags to categorize your vibe
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: '/' })}
                  disabled={isSubmitting}
                  className="h-11 flex-1 transition-all hover:scale-105 sm:h-12"
                >
                  cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || !title.trim() || !description.trim()
                  }
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
                      creating vibe...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      create vibe
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Bottom hint */}
          <p className="text-muted-foreground mt-6 text-center text-xs">
            your vibe will be visible to everyone on viberater
          </p>
        </div>
      </div>
    </div>
  );
}

export default CreateVibe;
