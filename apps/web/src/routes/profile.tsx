import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import * as React from 'react';
import {
  useUserVibes,
  useUserReactedVibes,
  useUpdateProfileMutation,
  useCurrentUser,
  useEnsureUserExistsMutation,
} from '@/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VibeGrid } from '@/components/vibe-grid';
import { CreateVibeButton } from '@/components/create-vibe-button';
import { useUser } from '@clerk/tanstack-react-start';
import { createServerFn } from '@tanstack/react-start';
import { getAuth } from '@clerk/tanstack-react-start/server';
import { getWebRequest } from '@tanstack/react-start/server';
import { Skeleton } from '@/components/ui/skeleton';
import { VibeGridSkeleton } from '@/components/ui/vibe-grid-skeleton';
import { Sparkles } from 'lucide-react';
import toast from '@/utils/toast';
import { DebugAuth } from '@/features/auth/components/debug-auth';

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
  const [isSaving, setIsSaving] = React.useState(false);
  const [uploadedImageFile, setUploadedImageFile] = React.useState<File | null>(
    null
  );

  // Initialize form with user data when loaded
  React.useEffect(() => {
    if (convexUser) {
      setUsername(convexUser.username || '');
      setFirstName(convexUser.first_name || '');
      setLastName(convexUser.last_name || '');
      setImageUrl(convexUser.image_url || '');
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
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card className="mb-8">
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
            <VibeGridSkeleton count={6} />
          </div>
        </div>
      </div>
    );
  }
  // console.log('convexUser', convexUser);

  if (!clerkUser || !convexUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DebugAuth />
        <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-4 py-3">
          <p>failed to load user profile. please try again later.</p>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Card className="mb-8">
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
                <form onSubmit={handleSaveProfile} className="flex-1 space-y-4">
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
                    <Label htmlFor="imageUrl">image url</Label>
                    <Input
                      type="url"
                      id="imageUrl"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Enter image URL"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'saving...' : 'save profile'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setUsername(convexUser.username || '');
                        setFirstName(convexUser.first_name || '');
                        setLastName(convexUser.last_name || '');
                        setImageUrl(convexUser.image_url || '');
                      }}
                    >
                      cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex-1">
                  <h1 className="mb-2 text-2xl font-bold lowercase">
                    {displayName}
                  </h1>
                  {username && (
                    <p className="text-muted-foreground mb-2">@{username}</p>
                  )}
                  <p className="text-muted-foreground mb-2">{userEmail}</p>
                  <p className="text-muted-foreground mb-4">
                    member since {userJoinDate}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      edit profile
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
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
          <h2 className="mb-4 text-2xl font-bold lowercase">your vibes</h2>

          {vibesLoading ? (
            <VibeGridSkeleton count={6} />
          ) : vibes && vibes.length > 0 ? (
            <div className="space-y-6">
              <VibeGrid vibes={vibes.slice(0, 6)} />

              {vibes.length > 6 && (
                <div className="text-center">
                  <Button variant="outline" asChild>
                    <a href="/vibes/my-vibes">
                      view all vibes ({vibes.length} total)
                    </a>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  you haven't created any vibes yet.
                </p>
                <CreateVibeButton />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
