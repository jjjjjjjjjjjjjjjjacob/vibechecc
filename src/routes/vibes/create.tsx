import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { useCreateVibeMutation } from '@/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@clerk/tanstack-react-start';
import { usePostHog } from '@/hooks/usePostHog';
import { createServerFn } from '@tanstack/react-start';
import { getAuth } from '@clerk/tanstack-react-start/server';
import { getWebRequest } from '@tanstack/react-start/server';
import { redirect } from '@tanstack/react-router';

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
  const [image, setImage] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const createVibeMutation = useCreateVibeMutation();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim() && !tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

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
        image: image || undefined,
        tags: tags.length > 0 ? tags : undefined,
        createdById: user.id, // Use actual user ID from Clerk
      });

      // Track vibe creation
      trackEvents.vibeCreated(result.id || 'unknown', tags);

      // Redirect to home page after successful creation
      navigate({ to: '/' });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while creating your vibe');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold lowercase">create a new vibe</h1>

        {error && (
          <div className="bg-destructive/10 border-destructive/20 text-destructive mb-4 rounded-lg border px-4 py-3">
            <p>{error}</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="lowercase">vibe details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="give your vibe a catchy title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="describe your vibe in detail"
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">image</Label>
                <div className="flex items-center space-x-4">
                  <label className="border-input hover:border-primary flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors">
                    <div className="space-y-1 text-center">
                      <svg
                        className="text-muted-foreground mx-auto h-12 w-12"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="text-muted-foreground text-sm">
                        <span className="font-medium">click to upload</span> or
                        drag and drop
                      </div>
                    </div>
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {image && (
                    <div className="relative h-32 w-32 overflow-hidden rounded-lg">
                      <img
                        src={image}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => setImage('')}
                        className="absolute top-1 right-1 h-6 w-6"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">tags</Label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="bg-primary/10 text-primary flex items-center rounded-full px-2 py-1 text-sm"
                    >
                      #{tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTag(tag)}
                        className="hover:bg-destructive/20 ml-1 h-4 w-4 p-0"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="add tags (press enter to add)"
                />
                <p className="text-muted-foreground text-sm">
                  press enter to add a tag. tags help others discover your vibe.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'creating vibe...' : 'create vibe'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: '/' })}
                  disabled={isSubmitting}
                >
                  cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
