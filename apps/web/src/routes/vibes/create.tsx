import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router';
import * as React from 'react';
import { useCreateVibeMutation, useUserVibes } from '@/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUser } from '@clerk/tanstack-react-start';
import { trackEvents } from '@/lib/track-events';
import { createServerFn } from '@tanstack/react-start';
import { getAuth } from '@clerk/tanstack-react-start/server';
import { getWebRequest } from '@tanstack/react-start/server';
import { TagInput } from '@/components/tag-input';
import { ImageUpload } from '@/components/image-upload';
import { cn } from '@/utils/tailwind-utils';
import { Circle, Sparkles } from '@/components/ui/icons';
import type { Id } from '@vibechecc/convex/dataModel';

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
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);
  const [imageStorageId, setImageStorageId] =
    React.useState<Id<'_storage'> | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const createVibeMutation = useCreateVibeMutation();

  // Check if this is user's first vibe
  const { data: userVibes } = useUserVibes(user?.id || '');
  const isFirstVibe = !userVibes || userVibes.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }

    if (!user?.id) {
      setError('You must be signed in to create a vibe');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await createVibeMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        image: imageStorageId || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });

      // Track vibe creation (result is the document ID)
      trackEvents.vibeCreated((result as string) || 'unknown', tags);

      setIsSubmitting(false);

      // Reset form
      setTitle('');
      setDescription('');
      setTags([]);
      setImageStorageId(null);

      // Navigate to discover page with celebration parameters
      navigate({
        to: '/discover',
        search: {
          celebrate: 'true',
          vibeId: result as string,
          vibeTitle: title.trim(),
          isFirstVibe: isFirstVibe ? 'true' : 'false',
        },
        replace: true,
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while creating your vibe');
      }
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (storageId: Id<'_storage'>, _url: string) => {
    setImageStorageId(storageId);
  };

  const handleImageRemove = () => {
    setImageStorageId(null);
  };

  return (
    <>
      <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <div className="mx-auto max-w-2xl">
            {/* Header with gradient text */}
            <div className="my-6 text-center">
              <h1 className="animate-gradient-text drop-shadow-theme-secondary/10 from-theme-primary to-theme-secondary bg-gradient-to-br bg-clip-text text-3xl font-bold text-transparent lowercase drop-shadow-lg sm:text-4xl">
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
                    onChange={(e) => setTitle(e.target.value)}
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
                  <Label
                    htmlFor="description"
                    className="text-base font-medium"
                  >
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
                    onTagsChange={setTags}
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
              your vibe will be visible to everyone on vibechecc
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateVibe;
