import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import * as React from 'react';
import {
  useUpdateProfileMutation,
  useCurrentUser,
  useEnsureUserExistsMutation,
  useUserVibes,
  useUserRatings,
  useUserReceivedRatings,
  useUserEmojiStats,
} from '@/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useClerk } from '@clerk/tanstack-react-start';
import { createServerFn } from '@tanstack/react-start';
import { getAuth } from '@clerk/tanstack-react-start/server';
import { getWebRequest } from '@tanstack/react-start/server';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';
import toast from '@/utils/toast';
import { DebugAuth } from '@/features/auth/components/debug-auth';
import { DualThemeColorPicker } from '@/features/theming/components/dual-theme-color-picker';
import {
  UserProfileView,
  UserVibesSection,
  UserReviewsSection,
  UserInterestsSection,
} from '@/features/profiles/components';
import {
  FollowStats,
  FollowersModal,
  FollowingModal,
} from '@/features/follows/components';
import {
  useTheme,
  type PrimaryColorTheme,
  type SecondaryColorTheme,
} from '@/features/theming/components/theme-provider';

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
  const { openUserProfile } = useClerk();
  // console.log('clerkUser', clerkUser);
  const {
    data: convexUser,
    isLoading: convexUserLoading,
    refetch: refetchUser,
  } = useCurrentUser();
  // console.log('convexUser', convexUser);
  const { mutate: ensureUserExists, isPending: isCreatingUser } =
    useEnsureUserExistsMutation();
  const updateProfileMutation = useUpdateProfileMutation();

  // Fetch user data for the profile view
  const { data: userVibes, isLoading: vibesLoading } = useUserVibes(
    convexUser?.externalId || ''
  );
  const { data: userRatings, isLoading: ratingsLoading } = useUserRatings(
    convexUser?.externalId || ''
  );
  const { data: receivedRatings, isLoading: receivedRatingsLoading } =
    useUserReceivedRatings(convexUser?.externalId || '') as any;
  const { data: emojiStats, isLoading: _emojiStatsLoading } = useUserEmojiStats(
    convexUser?.externalId || ''
  );

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
  const [userTheme, setUserTheme] = React.useState<{
    primaryColor: string;
    secondaryColor: string;
  }>({ primaryColor: 'pink', secondaryColor: 'orange' });

  // Follow modal states
  const [isFollowersModalOpen, setIsFollowersModalOpen] = React.useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = React.useState(false);

  // User interests state
  const [userInterests, setUserInterests] = React.useState<string[]>([]);

  // Initialize form with user data when loaded
  React.useEffect(() => {
    if (convexUser) {
      setUsername(convexUser.username || '');
      setFirstName(convexUser.first_name || '');
      setLastName(convexUser.last_name || '');
      setImageUrl(convexUser.image_url || '');

      // Initialize dual-color theme (with backward compatibility)
      const primaryColor =
        convexUser.primaryColor || convexUser.themeColor || 'pink';
      const secondaryColor = convexUser.secondaryColor || 'orange';
      setUserTheme({ primaryColor, secondaryColor });

      _setBio(convexUser.bio || '');
      _setSocials({
        twitter: convexUser.socials?.twitter || '',
        instagram: convexUser.socials?.instagram || '',
        tiktok: convexUser.socials?.tiktok || '',
        youtube: convexUser.socials?.youtube || '',
        website: convexUser.socials?.website || '',
      });
      setUserInterests(convexUser.interests || []);
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

  const { setColorTheme, setSecondaryColorTheme } = useTheme();

  // Apply theme when in preview mode
  React.useEffect(() => {
    if (isPreviewMode || isEditing || isFullPreview) {
      setColorTheme(`${userTheme.primaryColor}-primary` as PrimaryColorTheme);
      setSecondaryColorTheme(
        `${userTheme.secondaryColor}-secondary` as SecondaryColorTheme
      );
    }
  }, [
    userTheme,
    isPreviewMode,
    isEditing,
    isFullPreview,
    setColorTheme,
    setSecondaryColorTheme,
  ]);

  const isLoading = !clerkLoaded || convexUserLoading || isCreatingUser;

  if (isLoading) {
    return (
      <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
        <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
          <div className="mx-auto max-w-4xl">
            <Card className="bg-background/90 mb-6 border-none shadow-lg backdrop-blur sm:mb-8">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
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

            <div className="mb-6 sm:mb-8">
              <Skeleton className="mb-3 h-6 w-24 sm:mb-4 sm:h-8" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="aspect-video rounded-lg" />
                  ))}
                </div>
              </div>
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
        <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
          <DebugAuth />
          <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base">
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

  const handleInterestsUpdate = (newInterests: string[]) => {
    setUserInterests(newInterests);
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

  // Full preview mode - render like the user profile page
  if (isFullPreview && convexUser) {
    // Create a compatible user object for the shared component
    const previewUser = {
      ...convexUser,
      first_name: firstName || convexUser.first_name,
      last_name: lastName || convexUser.last_name,
      username: username || convexUser.username,
      image_url: imageUrl || convexUser.image_url,
      primaryColor: userTheme.primaryColor,
      secondaryColor: userTheme.secondaryColor,
    };

    return (
      <UserProfileView
        user={previewUser}
        userVibes={userVibes}
        vibesLoading={vibesLoading}
        userRatings={userRatings as any}
        ratingsLoading={ratingsLoading}
        receivedRatings={receivedRatings as any}
        receivedRatingsLoading={receivedRatingsLoading}
        emojiStats={emojiStats}
        showBackButton={true}
        onBackClick={() => setIsFullPreview(false)}
        backButtonText="back to profile"
        scopedTheme={false} // Use global theme for preview since we're already injecting theme above
        currentUserId={clerkUser?.id}
      />
    );
  }

  return (
    <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
        <div className="mx-auto max-w-4xl">
          {/* A) USER SNAPSHOT & PROFILE MANAGEMENT */}
          <Card className="bg-background/90 mb-6 border-none shadow-lg backdrop-blur transition-all duration-300 hover:shadow-xl sm:mb-8">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                      <AvatarImage
                        src={
                          imageUrl || convexUser.image_url || clerkUser.imageUrl
                        }
                        alt={displayName}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-lg sm:text-2xl">
                        {displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <label
                        htmlFor="image-upload"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 absolute -right-1 -bottom-1 cursor-pointer rounded-full p-1.5 shadow-md transition-all hover:scale-105"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5 sm:h-4 sm:w-4"
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
                    className="w-full flex-1 space-y-3 sm:space-y-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                      <div>
                        <Label
                          htmlFor="username"
                          className="text-sm font-medium"
                        >
                          username
                        </Label>
                        <Input
                          type="text"
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="enter username"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="firstName"
                          className="text-sm font-medium"
                        >
                          first name
                        </Label>
                        <Input
                          type="text"
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="enter first name"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium">
                        last name
                      </Label>
                      <Input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="enter last name"
                        className="mt-1"
                      />
                    </div>

                    <div className="pt-2">
                      <DualThemeColorPicker
                        selectedTheme={userTheme}
                        onThemeChange={(theme) => {
                          setUserTheme(theme);
                          setIsPreviewMode(true);
                        }}
                        className="w-full"
                      />
                    </div>

                    <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 transition-transform hover:scale-[1.02] sm:flex-none"
                      >
                        {isSaving ? 'saving...' : 'save profile'}
                      </Button>
                      {isPreviewMode && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setIsPreviewMode(false)}
                          className="flex-1 transition-transform hover:scale-[1.02] sm:flex-none"
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
                            'pink';
                          const secondaryColor =
                            convexUser.secondaryColor || 'orange';
                          setUserTheme({ primaryColor, secondaryColor });
                          setUserInterests(convexUser.interests || []);
                        }}
                        className="flex-1 transition-transform hover:scale-[1.02] sm:flex-none"
                      >
                        cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="w-full flex-1 text-center sm:text-left">
                    <div className="mb-4">
                      <h1 className="from-theme-primary to-theme-secondary mb-1.5 bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent lowercase drop-shadow-md sm:text-2xl">
                        {displayName}
                      </h1>
                      {username && (
                        <p className="text-muted-foreground drop-theme-secondary/20 mb-1 text-sm drop-shadow-sm sm:text-base">
                          @{username}
                        </p>
                      )}
                      <p className="text-muted-foreground drop-theme-secondary/20 mb-1 text-sm drop-shadow-sm sm:text-base">
                        {userEmail}
                      </p>
                      <p className="text-muted-foreground drop-theme-secondary/20 mb-3 text-xs drop-shadow-sm sm:text-sm">
                        member since {userJoinDate}
                      </p>
                    </div>

                    {/* Follow Stats Pills */}
                    <div className="mb-4 flex justify-center sm:justify-start">
                      <FollowStats
                        userId={convexUser.externalId}
                        onFollowersClick={() => setIsFollowersModalOpen(true)}
                        onFollowingClick={() => setIsFollowingModalOpen(true)}
                        variant="default"
                      />
                    </div>

                    {/* Action buttons - mobile-first stacked layout */}
                    <div className="space-y-2">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                          className="flex-1 transition-transform hover:scale-[1.02] sm:flex-none"
                        >
                          edit profile
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setIsFullPreview(true)}
                          className="flex-1 transition-transform hover:scale-[1.02] sm:flex-none"
                        >
                          preview profile
                        </Button>
                      </div>
                      <div className="flex justify-center sm:justify-start">
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
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* B) CONTENT MANAGEMENT SECTION */}
          <div className="space-y-6 sm:space-y-8">
            {/* 1. Your Vibes */}
            <UserVibesSection user={convexUser} className="mb-6 sm:mb-8" />

            {/* 2. Your Reviews */}
            <UserReviewsSection user={convexUser} className="mb-6 sm:mb-8" />

            {/* 3. Your Interests */}
            <UserInterestsSection
              user={convexUser}
              userInterests={userInterests}
              onInterestsUpdate={handleInterestsUpdate}
              updateProfileMutation={updateProfileMutation}
              className="mb-6 sm:mb-8"
            />
          </div>

          {/* C) ACCOUNT MANAGEMENT SECTION */}
          <div className="border-muted/20 border-t pt-6">
            <h2 className="from-theme-primary to-theme-secondary mb-4 bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent lowercase sm:text-2xl">
              account management
            </h2>
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => openUserProfile()}
                className="border-theme-primary/30 text-theme-primary hover:bg-theme-primary/10"
              >
                manage account settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Follow Modals */}
      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        userId={convexUser.externalId}
        username={convexUser.username}
      />
      <FollowingModal
        isOpen={isFollowingModalOpen}
        onClose={() => setIsFollowingModalOpen(false)}
        userId={convexUser.externalId}
        username={convexUser.username}
      />
    </div>
  );
}

export default Profile;
