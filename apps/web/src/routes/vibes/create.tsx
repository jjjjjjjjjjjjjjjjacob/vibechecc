import {
  createFileRoute,
  useNavigate,
  redirect,
  useRouteContext,
} from '@tanstack/react-router';
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
import { Circle, Sparkles, Image, BookText } from 'lucide-react';
import type { Id } from '@vibechecc/convex/dataModel';
import { showPointsToast } from '@/utils/points-toast';
import {
  generateRandomGradient,
  generateGradientStyle,
  gradientPresets,
} from '@/utils/gradient-utils';
import { SimpleVibePlaceholder } from '@/features/vibes/components/simple-vibe-placeholder';
import {
  TabsDraggable,
  TabsDraggableList,
  TabsDraggableTrigger,
  TabsDraggableContent,
  TabsDraggableContentContainer,
} from '@/components/ui/tabs-draggable';

const getServerSideAuth = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getWebRequest();
    if (!request) return { authenticated: false };

    try {
      const { userId } = await getAuth(request);
      return { authenticated: !!userId, userId };
    } catch (error) {
      return { authenticated: false };
    }
  }
);

export const Route = createFileRoute('/vibes/create')({
  component: CreateVibe,
  beforeLoad: async ({ location }) => {
    const authData = await getServerSideAuth();
    if (!authData.authenticated) {
      // Instead of using redirect(), we'll handle this in the component
      return { ...authData, redirectTo: '/sign-in' };
    }
    return authData;
  },
});

function CreateVibe() {
  const navigate = useNavigate();
  const { user } = useUser();
  const routeContext = useRouteContext({ from: '/vibes/create' });

  // Handle server-side redirect
  React.useEffect(() => {
    if (routeContext.redirectTo) {
      navigate({ to: routeContext.redirectTo });
    }
  }, [routeContext.redirectTo, navigate]);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);
  const [imageStorageId, setImageStorageId] =
    React.useState<Id<'_storage'> | null>(null);
  const [gradient, setGradient] = React.useState<{
    from: string;
    to: string;
    direction: string;
  }>(() => generateRandomGradient());
  const [textColor, setTextColor] = React.useState<'auto' | 'white' | 'black'>(
    'auto'
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('details');
  const [recentGradients, setRecentGradients] = React.useState<
    Array<{ from: string; to: string; direction: string }>
  >([]);
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
        gradientFrom: gradient.from,
        gradientTo: gradient.to,
        gradientDirection: gradient.direction,
      });

      // Track vibe creation (result is the document ID)
      trackEvents.vibeCreated((result as string) || 'unknown', tags);

      // Add gradient to recent gradients after successful creation
      const currentGradient = {
        from: gradient.from,
        to: gradient.to,
        direction: gradient.direction,
      };
      const isAlreadyRecent = recentGradients.some(
        (recent) =>
          recent.from === currentGradient.from &&
          recent.to === currentGradient.to &&
          recent.direction === currentGradient.direction
      );
      if (!isAlreadyRecent) {
        setRecentGradients([currentGradient, ...recentGradients.slice(0, 5)]);
      }

      // Show points earned toast
      const pointsEarned = isFirstVibe ? 200 : 100; // More points for first vibe
      showPointsToast('earned', pointsEarned, 'vibe created!', {
        showAction: true,
        actionLabel: 'view vibe',
        onAction: () => {
          navigate({ to: `/vibes/${result}` });
        },
      });

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
          <div className="mx-auto max-w-3xl">
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

            {/* Main form card - Reddit-like style */}
            <div className="bg-background animate-in fade-in-0 slide-in-from-bottom-4 rounded-lg border p-4 shadow-sm duration-500">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tabbed Content for Details and Visuals */}
                <TabsDraggable value={activeTab} onValueChange={setActiveTab}>
                  <TabsDraggableList className="mb-4">
                    <TabsDraggableTrigger
                      icon={<BookText className="h-4 w-4" />}
                      value="details"
                    >
                      details
                    </TabsDraggableTrigger>
                    <TabsDraggableTrigger
                      icon={<Image className="h-4 w-4" />}
                      value="visuals"
                    >
                      visuals
                    </TabsDraggableTrigger>
                  </TabsDraggableList>

                  <TabsDraggableContentContainer>
                    <TabsDraggableContent value="details">
                      <div className="w-full space-y-6">
                        {/* Title Section */}
                        <div className="space-y-3">
                          <Label
                            htmlFor="title"
                            className="text-sm font-medium"
                          >
                            title
                          </Label>
                          <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="give your vibe a catchy title"
                            className={cn(
                              'h-9 border bg-transparent text-sm transition-all',
                              'focus:border-theme-primary focus:ring-theme-primary/20 focus:ring-1',
                              title && 'border-theme-primary/50'
                            )}
                            required
                          />
                        </div>

                        {/* Description Section */}
                        <div className="space-y-3">
                          <Label
                            htmlFor="description"
                            className="text-sm font-medium"
                          >
                            description
                          </Label>
                          <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="describe your vibe in detail..."
                            rows={4}
                            className={cn(
                              'resize-none border bg-transparent text-sm transition-all',
                              'focus:border-theme-primary focus:ring-theme-primary/20 focus:ring-1',
                              description && 'border-theme-primary/50'
                            )}
                            required
                          />
                          <div className="text-muted-foreground flex items-center justify-between text-xs">
                            <span>{description.length} characters</span>
                          </div>
                        </div>

                        {/* Tags Section */}
                        <div className="space-y-3">
                          <Label htmlFor="tags" className="text-sm font-medium">
                            tags
                          </Label>
                          <TagInput
                            tags={tags}
                            onTagsChange={setTags}
                            placeholder="add tags to help others discover your vibe..."
                          />
                        </div>
                      </div>
                    </TabsDraggableContent>

                    <TabsDraggableContent value="visuals">
                      <div className="w-full space-y-6">
                        {/* Image Upload Section */}
                        <ImageUpload
                          onImageUpload={handleImageUpload}
                          onImageRemove={handleImageRemove}
                          disabled={isSubmitting}
                        />

                        {/* Gradient Section - Only show if no image */}
                        {!imageStorageId && (
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">
                              gradient
                            </Label>

                            {/* Preview with Advanced Controls Accordion */}
                            <div className="relative h-48 w-full overflow-hidden rounded-2xl border-2 sm:h-56">
                              <SimpleVibePlaceholder
                                title={title || 'your vibe'}
                                gradientFrom={gradient.from}
                                gradientTo={gradient.to}
                                gradientDirection={gradient.direction}
                                textColorOverride={textColor}
                                className="h-full w-full"
                              />

                              {/* Advanced Controls - Accordion opening upward */}
                              <div className="absolute right-2 bottom-2">
                                <div className="relative flex flex-col items-end">
                                  {/* Accordion Content - Shows above the trigger */}
                                  {isAdvancedOpen && (
                                    <div className="animate-in slide-in-from-bottom-2 mb-2 duration-200">
                                      <div className="flex items-center gap-3 rounded-full bg-black/80 px-3 py-2 backdrop-blur-sm">
                                        {/* Direction Wheel - Inside accordion */}
                                        <div
                                          className="relative h-8 w-8 cursor-pointer"
                                          onWheel={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();

                                            const rect =
                                              e.currentTarget.getBoundingClientRect();
                                            const centerX =
                                              rect.left + rect.width / 2;
                                            const centerY =
                                              rect.top + rect.height / 2;

                                            const clickX = e.clientX - centerX;
                                            const clickY = e.clientY - centerY;
                                            const angle =
                                              Math.atan2(clickY, clickX) *
                                              (180 / Math.PI);
                                            const normalizedAngle =
                                              (angle + 360) % 360;

                                            let newDirection = 'to-br';
                                            if (
                                              normalizedAngle >= 337.5 ||
                                              normalizedAngle < 22.5
                                            )
                                              newDirection = 'to-r';
                                            else if (
                                              normalizedAngle >= 22.5 &&
                                              normalizedAngle < 67.5
                                            )
                                              newDirection = 'to-br';
                                            else if (
                                              normalizedAngle >= 67.5 &&
                                              normalizedAngle < 112.5
                                            )
                                              newDirection = 'to-b';
                                            else if (
                                              normalizedAngle >= 112.5 &&
                                              normalizedAngle < 157.5
                                            )
                                              newDirection = 'to-bl';
                                            else if (
                                              normalizedAngle >= 157.5 &&
                                              normalizedAngle < 202.5
                                            )
                                              newDirection = 'to-l';
                                            else if (
                                              normalizedAngle >= 202.5 &&
                                              normalizedAngle < 247.5
                                            )
                                              newDirection = 'to-tl';
                                            else if (
                                              normalizedAngle >= 247.5 &&
                                              normalizedAngle < 292.5
                                            )
                                              newDirection = 'to-t';
                                            else if (
                                              normalizedAngle >= 292.5 &&
                                              normalizedAngle < 337.5
                                            )
                                              newDirection = 'to-tr';

                                            setGradient((prev) => ({
                                              ...prev,
                                              direction: newDirection,
                                            }));
                                          }}
                                          onMouseDown={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();

                                            const rect =
                                              e.currentTarget.getBoundingClientRect();
                                            const centerX =
                                              rect.left + rect.width / 2;
                                            const centerY =
                                              rect.top + rect.height / 2;

                                            const handleMouseMove = (
                                              moveEvent: MouseEvent
                                            ) => {
                                              const deltaX =
                                                moveEvent.clientX - centerX;
                                              const deltaY =
                                                moveEvent.clientY - centerY;
                                              const angle =
                                                Math.atan2(deltaY, deltaX) *
                                                (180 / Math.PI);
                                              const normalizedAngle =
                                                (angle + 360) % 360;

                                              let newDirection = 'to-br';
                                              if (
                                                normalizedAngle >= 337.5 ||
                                                normalizedAngle < 22.5
                                              )
                                                newDirection = 'to-r';
                                              else if (
                                                normalizedAngle >= 22.5 &&
                                                normalizedAngle < 67.5
                                              )
                                                newDirection = 'to-br';
                                              else if (
                                                normalizedAngle >= 67.5 &&
                                                normalizedAngle < 112.5
                                              )
                                                newDirection = 'to-b';
                                              else if (
                                                normalizedAngle >= 112.5 &&
                                                normalizedAngle < 157.5
                                              )
                                                newDirection = 'to-bl';
                                              else if (
                                                normalizedAngle >= 157.5 &&
                                                normalizedAngle < 202.5
                                              )
                                                newDirection = 'to-l';
                                              else if (
                                                normalizedAngle >= 202.5 &&
                                                normalizedAngle < 247.5
                                              )
                                                newDirection = 'to-tl';
                                              else if (
                                                normalizedAngle >= 247.5 &&
                                                normalizedAngle < 292.5
                                              )
                                                newDirection = 'to-t';
                                              else if (
                                                normalizedAngle >= 292.5 &&
                                                normalizedAngle < 337.5
                                              )
                                                newDirection = 'to-tr';

                                              setGradient((prev) => ({
                                                ...prev,
                                                direction: newDirection,
                                              }));
                                            };

                                            const handleMouseUp = () => {
                                              document.removeEventListener(
                                                'mousemove',
                                                handleMouseMove
                                              );
                                              document.removeEventListener(
                                                'mouseup',
                                                handleMouseUp
                                              );
                                            };

                                            document.addEventListener(
                                              'mousemove',
                                              handleMouseMove
                                            );
                                            document.addEventListener(
                                              'mouseup',
                                              handleMouseUp
                                            );
                                          }}
                                        >
                                          {/* Track - Muted donut style */}
                                          <div
                                            className="absolute inset-0 rounded-full bg-gray-500/50"
                                            style={{
                                              mask: 'radial-gradient(circle at center, transparent 18%, black 18%, black 100%)',
                                              WebkitMask:
                                                'radial-gradient(circle at center, transparent 18%, black 18%, black 100%)',
                                            }}
                                          />

                                          {/* Thumb */}
                                          <div
                                            className="absolute h-3 w-3 rounded-full bg-white/90 shadow transition-all duration-75"
                                            style={{
                                              left: '50%',
                                              top: '50%',
                                              transform: (() => {
                                                const angles = {
                                                  'to-r': 0,
                                                  'to-br': 45,
                                                  'to-b': 90,
                                                  'to-bl': 135,
                                                  'to-l': 180,
                                                  'to-tl': 225,
                                                  'to-t': 270,
                                                  'to-tr': 315,
                                                };
                                                const angle =
                                                  angles[
                                                    gradient.direction as keyof typeof angles
                                                  ] || 0;
                                                const radians =
                                                  (angle * Math.PI) / 180;
                                                const radius = 10;
                                                const x =
                                                  Math.cos(radians) * radius;
                                                const y =
                                                  Math.sin(radians) * radius;
                                                return `translate(${x - 6}px, ${y - 6}px)`;
                                              })(),
                                            }}
                                          />
                                        </div>

                                        {/* Color Inputs */}
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="color"
                                            value={gradient.from}
                                            onChange={(e) =>
                                              setGradient((prev) => ({
                                                ...prev,
                                                from: e.target.value,
                                              }))
                                            }
                                            className="h-6 w-6 cursor-pointer rounded-full border-0"
                                            title="from color"
                                          />
                                          <input
                                            type="color"
                                            value={gradient.to}
                                            onChange={(e) =>
                                              setGradient((prev) => ({
                                                ...prev,
                                                to: e.target.value,
                                              }))
                                            }
                                            className="h-6 w-6 cursor-pointer rounded-full border-0"
                                            title="to color"
                                          />
                                        </div>

                                        {/* Text Color Override */}
                                        <div className="flex items-center gap-1">
                                          {/* Auto Button */}
                                          <button
                                            type="button"
                                            onClick={() => setTextColor('auto')}
                                            className={cn(
                                              'relative h-5 w-5 overflow-hidden rounded-full border transition-all hover:scale-110',
                                              textColor === 'auto'
                                                ? 'border-white ring-1 ring-white/30'
                                                : 'border-white/50 hover:border-white/80'
                                            )}
                                            title="auto (based on gradient)"
                                          >
                                            <div className="absolute inset-0">
                                              <div className="absolute top-0 left-0 h-full w-1/2 bg-white" />
                                              <div className="absolute top-0 right-0 h-full w-1/2 bg-black" />
                                            </div>
                                          </button>

                                          {/* White Button */}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setTextColor('white')
                                            }
                                            className={cn(
                                              'h-5 w-5 rounded-full border bg-white transition-all hover:scale-110',
                                              textColor === 'white'
                                                ? 'border-white ring-1 ring-white/30'
                                                : 'border-white/50 hover:border-white/80'
                                            )}
                                            title="white text"
                                          />

                                          {/* Black Button */}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setTextColor('black')
                                            }
                                            className={cn(
                                              'h-5 w-5 rounded-full border bg-black transition-all hover:scale-110',
                                              textColor === 'black'
                                                ? 'border-white ring-1 ring-white/30'
                                                : 'border-white/50 hover:border-white/80'
                                            )}
                                            title="black text"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Toggle Button - Chevron */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setIsAdvancedOpen(!isAdvancedOpen)
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/80 backdrop-blur-sm transition-all duration-200 hover:scale-110"
                                    title="advanced gradient settings"
                                  >
                                    <svg
                                      className={cn(
                                        'h-4 w-4 text-white/70 transition-transform duration-200',
                                        isAdvancedOpen ? 'rotate-180' : ''
                                      )}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Gradient Presets - Compact View */}
                            <div className="space-y-3">
                              {/* Recently Used - Show if there are any */}
                              {recentGradients.length > 0 && (
                                <div>
                                  <Label className="text-muted-foreground mb-2 block text-xs font-medium">
                                    recently used
                                  </Label>
                                  <div className="flex gap-1 overflow-x-auto pb-2">
                                    {recentGradients
                                      .slice(0, 6)
                                      .map((recent, index) => (
                                        <button
                                          key={`recent-${index}`}
                                          type="button"
                                          onClick={() => {
                                            setGradient(recent);
                                            // Move to front of recent list
                                            const newRecents = [
                                              recent,
                                              ...recentGradients.filter(
                                                (_, i) => i !== index
                                              ),
                                            ];
                                            setRecentGradients(newRecents);
                                          }}
                                          className={cn(
                                            'h-8 w-12 flex-shrink-0 overflow-hidden rounded border transition-all hover:scale-105',
                                            gradient.from === recent.from &&
                                              gradient.to === recent.to &&
                                              gradient.direction ===
                                                recent.direction
                                              ? 'border-theme-primary ring-theme-primary/30 ring-1'
                                              : 'border-border hover:border-theme-primary/50'
                                          )}
                                          style={{
                                            background: generateGradientStyle(
                                              recent.from,
                                              recent.to,
                                              recent.direction
                                            ),
                                          }}
                                        />
                                      ))}
                                  </div>
                                </div>
                              )}

                              {/* Gradient Presets */}
                              <div>
                                <Label className="text-muted-foreground mb-2 block text-xs font-medium">
                                  presets
                                </Label>
                                <div className="grid grid-cols-8 gap-1">
                                  {gradientPresets
                                    .slice(0, 16)
                                    .map((preset) => {
                                      const handlePresetClick = () => {
                                        const newGradient = {
                                          from: preset.from,
                                          to: preset.to,
                                          direction: preset.direction,
                                        };
                                        setGradient(newGradient);
                                      };

                                      return (
                                        <button
                                          key={preset.name}
                                          type="button"
                                          onClick={handlePresetClick}
                                          className={cn(
                                            'h-8 w-full overflow-hidden rounded border transition-all hover:scale-105',
                                            gradient.from === preset.from &&
                                              gradient.to === preset.to &&
                                              gradient.direction ===
                                                preset.direction
                                              ? 'border-theme-primary ring-theme-primary/30 ring-1'
                                              : 'border-border hover:border-theme-primary/50'
                                          )}
                                          style={{
                                            background: generateGradientStyle(
                                              preset.from,
                                              preset.to,
                                              preset.direction
                                            ),
                                          }}
                                          title={preset.name}
                                        />
                                      );
                                    })}

                                  {/* Random Gradient Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const random = generateRandomGradient();
                                      setGradient(random);
                                    }}
                                    className="border-border hover:border-theme-primary/50 h-8 w-full overflow-hidden rounded border border-dashed transition-all hover:scale-105"
                                    title="random gradient"
                                  >
                                    <div className="bg-muted/30 flex h-full w-full items-center justify-center">
                                      <Sparkles className="text-muted-foreground h-3 w-3" />
                                    </div>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsDraggableContent>
                  </TabsDraggableContentContainer>
                </TabsDraggable>

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
