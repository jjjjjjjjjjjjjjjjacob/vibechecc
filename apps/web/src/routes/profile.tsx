import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import * as React from 'react';
import {
  useUserVibes,
  useUserReactedVibes,
  useUpdateProfileMutation,
  useCurrentUser,
  useEnsureUserExistsMutation,
} from '@/queries';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MasonryFeed } from '@/components/masonry-feed';
import { CreateVibeButton } from '@/components/create-vibe-button';
import { useUser } from '@clerk/tanstack-react-start';
import { createServerFn } from '@tanstack/react-start';
import { getAuth } from '@clerk/tanstack-react-start/server';
import { getWebRequest } from '@tanstack/react-start/server';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarDays,
  Twitter,
  Instagram,
  Globe,
  Star,
  Heart,
  Sparkles,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react';
import toast from '@/utils/toast';
import { DebugAuth } from '@/features/auth/components/debug-auth';
import { DualThemeColorPicker } from '@/components/dual-theme-color-picker';
import {
  DEFAULT_THEME,
  DEFAULT_USER_THEME,
  getThemeById,
  getThemeGradientClasses,
  injectUserThemeCSS,
  type UserTheme,
} from '@/utils/theme-colors';

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

export const Route = createFileRoute('/profile')({
  component: Profile,
  beforeLoad: async () => {
    const { userId } = await requireAuth();
    return { userId };
  },
});

function Profile() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  // console.log('clerkUser', clerkUser);
  const {
    data: convexUser,
    isLoading: convexUserLoading,
    refetch: refetchUser,
  } = useCurrentUser();
  // console.log('convexUser', convexUser);
  const { mutate: ensureUserExists, isPending: isCreatingUser } =
    useEnsureUserExistsMutation();
  const { data: vibes, isLoading: vibesLoading } = useUserVibes(
    convexUser?._id || ''
  );
  const { data: _reactedVibes, isLoading: _reactedVibesLoading } =
    useUserReactedVibes(convexUser?.externalId || '');
  const updateProfileMutation = useUpdateProfileMutation();

  const [username, setUsername] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [_bio, _setBio] = React.useState('');
  const [_socials, _setSocials] = React.useState({
    twitter: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    website: '',
  });
  const [isEditing, setIsEditing] = React.useState(false);
  const [isPreviewMode, setIsPreviewMode] = React.useState(false);
  const [isFullPreview, setIsFullPreview] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [uploadedImageFile, setUploadedImageFile] = React.useState<File | null>(
    null
  );
  const [userTheme, setUserTheme] =
    React.useState<UserTheme>(DEFAULT_USER_THEME);

  // Initialize form with user data when loaded
  React.useEffect(() => {
    if (convexUser) {
      setUsername(convexUser.username || '');
      setFirstName(convexUser.first_name || '');
      setLastName(convexUser.last_name || '');
      setImageUrl(convexUser.image_url || '');

      // Initialize dual-color theme (with backward compatibility)
      const primaryColor =
        convexUser.primaryColor ||
        convexUser.themeColor ||
        DEFAULT_USER_THEME.primaryColor;
      const secondaryColor =
        convexUser.secondaryColor || DEFAULT_USER_THEME.secondaryColor;
      setUserTheme({ primaryColor, secondaryColor });

      _setBio(convexUser.bio || '');
      _setSocials({
        twitter: convexUser.socials?.twitter || '',
        instagram: convexUser.socials?.instagram || '',
        tiktok: convexUser.socials?.tiktok || '',
        youtube: convexUser.socials?.youtube || '',
        website: convexUser.socials?.website || '',
      });
    }
  }, [convexUser]);

  // Handle case where user is authenticated but doesn't exist in Convex
  React.useEffect(() => {
    if (
      clerkLoaded &&
      clerkUser &&
      !convexUserLoading &&
      !convexUser &&
      !isCreatingUser
    ) {
      // console.log(
      //   'User authenticated but not found in Convex, creating user...'
      // );
      ensureUserExists(undefined, {
        onSuccess: () => {
          // console.log('User created successfully, refetching...');
          refetchUser();
        },
        onError: (error) => {
          // eslint-disable-next-line no-console
          console.error('Failed to create user:', error);
          toast.error(
            'Failed to initialize user profile. Please refresh the page.'
          );
        },
      });
    }
  }, [
    clerkLoaded,
    clerkUser,
    convexUserLoading,
    convexUser,
    isCreatingUser,
    ensureUserExists,
    refetchUser,
  ]);

  const isLoading = !clerkLoaded || convexUserLoading || isCreatingUser;

  if (isLoading) {
    return (
      <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-4xl">
            <Card className="bg-background/90 mb-8 border-none shadow-lg backdrop-blur">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="flex-shrink-0">
                    <Skeleton className="h-24 w-24 rounded-full" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mb-8">
              <Skeleton className="mb-4 h-8 w-24" />
              <MasonryFeed
                vibes={[]}
                isLoading={true}
                variant="category"
                showLoadMoreTarget={false}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
  // console.log('convexUser', convexUser);

  if (!clerkUser || !convexUser) {
    return (
      <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
        <div className="container mx-auto px-4 py-8">
          <DebugAuth />
          <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-4 py-3">
            <p>failed to load user profile. please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setImageUrl(url);
        setUploadedImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (!clerkUser) {
      toast.error('User not found');
      setIsSaving(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const promises: Promise<any>[] = [];

      // Prepare Convex updates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const convexUpdates: any = {};
      if (username) convexUpdates.username = username;
      if (firstName) convexUpdates.first_name = firstName;
      if (lastName) convexUpdates.last_name = lastName;
      if (imageUrl) convexUpdates.image_url = imageUrl;
      // Save dual-color theme
      convexUpdates.primaryColor = userTheme.primaryColor;
      convexUpdates.secondaryColor = userTheme.secondaryColor;

      // Add Convex update to promises
      if (Object.keys(convexUpdates).length > 0) {
        promises.push(updateProfileMutation.mutateAsync(convexUpdates));
      }

      // Prepare Clerk updates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clerkUpdates: any = {};
      if (username) clerkUpdates.username = username;
      if (firstName) clerkUpdates.firstName = firstName;
      if (lastName) clerkUpdates.lastName = lastName;

      // Add Clerk user update to promises if there are field updates
      if (Object.keys(clerkUpdates).length > 0) {
        promises.push(clerkUser.update(clerkUpdates));
      }

      // Add Clerk avatar update to promises if there's an uploaded image
      if (uploadedImageFile) {
        promises.push(clerkUser.setProfileImage({ file: uploadedImageFile }));
      }

      // Execute all updates in parallel
      if (promises.length > 0) {
        await Promise.all(promises);
        toast.success('Profile updated successfully!');
      }

      setIsEditing(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('(Profile Page) Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayName =
    `${firstName || ''} ${lastName || ''}`.trim() ||
    username ||
    clerkUser.fullName ||
    clerkUser.firstName ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    'User';

  const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
  const userJoinDate = convexUser.created_at
    ? new Date(convexUser.created_at).toLocaleDateString()
    : clerkUser.createdAt
      ? new Date(clerkUser.createdAt).toLocaleDateString()
      : 'Unknown';

  // Get the current theme for styling
  const currentUserTheme =
    isPreviewMode || isEditing || isFullPreview
      ? userTheme
      : {
          primaryColor:
            convexUser?.primaryColor ||
            convexUser?.themeColor ||
            DEFAULT_USER_THEME.primaryColor,
          secondaryColor:
            convexUser?.secondaryColor || DEFAULT_USER_THEME.secondaryColor,
        };

  React.useEffect(() => {
    injectUserThemeCSS(currentUserTheme);
  }, [currentUserTheme]);
  const themeClasses = getThemeGradientClasses();

  // Full preview mode - render like the user profile page
  if (isFullPreview) {
    const vibeCount = vibes?.length || 0;

    return (
      <div className={`min-h-screen ${themeClasses.hero}`}>
        <div className="container mx-auto space-y-6 px-4 py-6">
          <div className="mx-auto max-w-5xl">
            {/* Back to edit button */}
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => setIsFullPreview(false)}
                className="text-foreground border-border/50 bg-/10 transition-all hover:scale-105 hover:bg-white/20"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                back to profile
              </Button>
            </div>

            {/* Hero Profile Section */}
            <div
              className={`relative overflow-hidden rounded-2xl ${themeClasses.card} p-6 shadow-xl backdrop-blur-md sm:p-8`}
            >
              <div
                className={`absolute inset-0 ${themeClasses.background} opacity-20`}
              />
              <div className="relative z-10">
                <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:gap-8 sm:text-left">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`absolute -inset-3 rounded-full opacity-60 blur-xl`}
                    />
                    <div className={`relative rounded-full p-1.5`}>
                      <Avatar
                        className={`h-28 w-28 sm:h-32 sm:w-32 ${themeClasses.avatar}`}
                      >
                        <AvatarImage
                          src={
                            imageUrl ||
                            convexUser.image_url ||
                            clerkUser.imageUrl
                          }
                          alt={displayName}
                          className="object-cover"
                        />
                        <AvatarFallback
                          className={`${themeClasses.background} text-foreground text-2xl font-bold sm:text-3xl`}
                        >
                          {displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <h1 className="text-foreground text-3xl font-bold lowercase drop-shadow-lg sm:text-4xl">
                        {displayName}
                      </h1>
                      <p className="text-foreground/70 text-lg font-medium drop-shadow-md sm:text-xl">
                        @{username || 'username'}
                      </p>
                    </div>

                    {/* Stats Pills */}
                    <div className="flex flex-wrap gap-3">
                      <div className="border-border rounded-full border bg-white/15 px-3 py-1.5 backdrop-blur">
                        <div className="text-foreground flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">
                            joined {userJoinDate}
                          </span>
                        </div>
                      </div>
                      <div className="border-border rounded-full border bg-white/15 px-3 py-1.5 backdrop-blur">
                        <div className="text-foreground flex items-center gap-2">
                          <Heart className="h-3.5 w-3.5" />
                          <span className="text-xs font-bold">{vibeCount}</span>
                          <span className="text-xs font-medium">vibes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Navigation */}
            <Tabs defaultValue="vibes" className="w-full">
              <div className="mt-12 mb-8 flex justify-center">
                <TabsList className="bg-background/60 rounded-2xl border-0 p-1.5 shadow-2xl backdrop-blur-md">
                  <TabsTrigger
                    value="vibes"
                    className={`rounded-xl px-6 py-3 font-medium lowercase transition-all duration-200 data-[state=active]:${themeClasses.button} data-[state=active]:text-foreground hover:bg-white/10 data-[state=active]:shadow-lg`}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    vibes
                  </TabsTrigger>
                  <TabsTrigger
                    value="about"
                    className={`rounded-xl px-6 py-3 font-medium lowercase transition-all duration-200 data-[state=active]:${themeClasses.button} data-[state=active]:text-foreground hover:bg-white/10 data-[state=active]:shadow-lg`}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    about
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Vibes Tab */}
              <TabsContent value="vibes" className="mt-8 space-y-0">
                <div className="space-y-8">
                  <div className="text-center">
                    <h2
                      className={`mb-3 text-2xl font-bold ${themeClasses.text} lowercase`}
                    >
                      created vibes
                    </h2>
                    <p className="text-muted-foreground/80 text-base">
                      {vibeCount}{' '}
                      {vibeCount === 1 ? 'unique vibe' : 'unique vibes'} shared
                      with the community
                    </p>
                  </div>

                  <div>
                    <MasonryFeed
                      vibes={vibes || []}
                      isLoading={vibesLoading}
                      variant="category"
                      ratingDisplayMode="most-rated"
                      showLoadMoreTarget={false}
                      emptyStateTitle="no vibes yet"
                      emptyStateDescription="you haven't created any vibes yet. check back later for amazing content ✨"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="mt-8 space-y-0">
                <div className="space-y-8">
                  <div className="text-center">
                    <h2
                      className={`mb-3 text-2xl font-bold ${themeClasses.text} lowercase`}
                    >
                      about {displayName.toLowerCase()}
                    </h2>
                    <p className="text-muted-foreground/80 text-base">
                      community presence and personality insights
                    </p>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Profile Details */}
                    <Card
                      className={`${themeClasses.card} shadow-xl backdrop-blur-md`}
                    >
                      <CardContent className="space-y-6 p-6">
                        <div>
                          <h3
                            className={`mb-3 text-base font-semibold ${themeClasses.text} lowercase`}
                          >
                            member since
                          </h3>
                          <p className="text-muted-foreground">
                            {userJoinDate}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Community Stats */}
                    <Card
                      className={`${themeClasses.card} shadow-xl backdrop-blur-md`}
                    >
                      <CardContent className="p-6">
                        <h3
                          className={`mb-4 text-base font-semibold ${themeClasses.text} lowercase`}
                        >
                          community impact
                        </h3>
                        <div className="grid grid-cols-1 gap-6">
                          <div className="text-center">
                            <div
                              className={`rounded-xl border border-white/10 p-3`}
                            >
                              <p
                                className={`text-2xl font-bold ${themeClasses.text}`}
                              >
                                {vibeCount}
                              </p>
                              <p className="text-muted-foreground mt-1 text-sm lowercase">
                                vibes created
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card className="bg-background/90 mb-8 border-none shadow-lg backdrop-blur transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={
                          imageUrl || convexUser.image_url || clerkUser.imageUrl
                        }
                        alt={displayName}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-2xl">
                        {displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <label
                        htmlFor="image-upload"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 absolute right-0 bottom-0 cursor-pointer rounded-full p-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <form
                    onSubmit={handleSaveProfile}
                    className="flex-1 space-y-4"
                  >
                    <div>
                      <Label htmlFor="username">username</Label>
                      <Input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                      />
                    </div>

                    <div>
                      <Label htmlFor="firstName">first name</Label>
                      <Input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter first name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastName">last name</Label>
                      <Input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter last name"
                      />
                    </div>

                    <div>
                      <DualThemeColorPicker
                        selectedTheme={userTheme}
                        onThemeChange={(theme) => {
                          setUserTheme(theme);
                          setIsPreviewMode(true);
                        }}
                        className="mt-4"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="transition-transform hover:scale-[1.02]"
                      >
                        {isSaving ? 'saving...' : 'save profile'}
                      </Button>
                      {isPreviewMode && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setIsPreviewMode(false)}
                          className="transition-transform hover:scale-[1.02]"
                        >
                          exit preview
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setIsPreviewMode(false);
                          setIsFullPreview(false);
                          setUsername(convexUser.username || '');
                          setFirstName(convexUser.first_name || '');
                          setLastName(convexUser.last_name || '');
                          setImageUrl(convexUser.image_url || '');
                          // Reset dual-color theme
                          const primaryColor =
                            convexUser.primaryColor ||
                            convexUser.themeColor ||
                            DEFAULT_USER_THEME.primaryColor;
                          const secondaryColor =
                            convexUser.secondaryColor ||
                            DEFAULT_USER_THEME.secondaryColor;
                          setUserTheme({ primaryColor, secondaryColor });
                        }}
                        className="transition-transform hover:scale-[1.02]"
                      >
                        cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex-1">
                    <h1
                      className={`mb-2 text-2xl font-bold lowercase drop-shadow-md ${themeClasses.text}`}
                    >
                      {displayName}
                    </h1>
                    {username && (
                      <p className="text-muted-foreground mb-2 drop-shadow-sm drop-shadow-yellow-500/20">
                        @{username}
                      </p>
                    )}
                    <p className="text-muted-foreground mb-2 drop-shadow-sm drop-shadow-yellow-500/20">
                      {userEmail}
                    </p>
                    <p className="text-muted-foreground mb-4 drop-shadow-sm drop-shadow-yellow-500/20">
                      member since {userJoinDate}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="transition-transform hover:scale-[1.02]"
                      >
                        edit profile
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setIsFullPreview(true)}
                        className="transition-transform hover:scale-[1.02]"
                      >
                        preview profile
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="transition-transform hover:scale-[1.02]"
                      >
                        <Link to="/onboarding">
                          <Sparkles className="mr-2 h-4 w-4" />
                          take tour
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mb-8">
            <h2
              className={`mb-4 text-2xl font-bold lowercase ${themeClasses.text}`}
            >
              your vibes
            </h2>

            <MasonryFeed
              vibes={vibes?.slice(0, 6) || []}
              isLoading={vibesLoading}
              variant="category"
              ratingDisplayMode="most-rated"
              showLoadMoreTarget={false}
              emptyStateTitle="no vibes created yet"
              emptyStateDescription="share your first vibe with the community!"
              emptyStateAction={
                <CreateVibeButton
                  variant="default"
                  className={`${themeClasses.button} text-foreground shadow-lg`}
                />
              }
            />

            {!vibesLoading && vibes && vibes.length > 6 && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  asChild
                  className={`bg-background/90 ${themeClasses.border} ${themeClasses.accent} transition-transform hover:scale-[1.02] hover:bg-current/10`}
                >
                  <a href="/vibes/my-vibes">
                    view all vibes ({vibes.length} total)
                  </a>
                </Button>
              </div>
            )}

            {/* Empty state is now handled by MasonryFeed component */}
          </div>
        </div>
      </div>
    </div>
  );
}
