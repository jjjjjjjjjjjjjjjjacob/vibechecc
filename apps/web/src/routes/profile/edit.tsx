import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import * as React from 'react';
import {
  useUpdateProfileMutation,
  useCurrentUser,
  useEnsureUserExistsMutation,
} from '@/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@clerk/tanstack-react-start';
import { createServerFn } from '@tanstack/react-start';
import { getAuth } from '@clerk/tanstack-react-start/server';
import { getWebRequest } from '@tanstack/react-start/server';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from '@/components/ui/icons';
import toast from '@/utils/toast';
import { DualThemeColorPicker } from '@/features/theming/components/dual-theme-color-picker';
import {
  useThemeStore,
  type PrimaryColorTheme,
  type SecondaryColorTheme,
} from '@/stores/theme-store';
import { SocialConnectionsList } from '@/components/social/connections/social-connections-list';
import { ConnectSocialButton } from '@/components/social/connections/connect-social-button';
import { AppleIdStatus } from '@/features/auth/components/apple-id-error-handler';

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

export const Route = createFileRoute('/profile/edit')({
  component: ProfileEdit,
  beforeLoad: async () => await requireAuth(),
});

function ProfileEdit() {
  const navigate = useNavigate();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const {
    data: convexUser,
    isLoading: convexUserLoading,
    refetch: refetchUser,
  } = useCurrentUser();
  const { mutate: ensureUserExists, isPending: isCreatingUser } =
    useEnsureUserExistsMutation();
  const updateProfileMutation = useUpdateProfileMutation();

  const [username, setUsername] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [uploadedImageFile, setUploadedImageFile] = React.useState<File | null>(
    null
  );
  const [userTheme, setUserTheme] = React.useState<{
    primaryColor: string;
    secondaryColor: string;
  }>({ primaryColor: 'pink', secondaryColor: 'orange' });

  React.useEffect(() => {
    if (convexUser) {
      setUsername(convexUser.username || '');
      setFirstName(convexUser.first_name || '');
      setLastName(convexUser.last_name || '');
      setImageUrl(convexUser.image_url || '');

      const primaryColor =
        convexUser.primaryColor || convexUser.themeColor || 'pink';
      const secondaryColor = convexUser.secondaryColor || 'orange';
      setUserTheme({ primaryColor, secondaryColor });
    }
  }, [convexUser]);

  React.useEffect(() => {
    if (
      clerkLoaded &&
      clerkUser &&
      !convexUserLoading &&
      !convexUser &&
      !isCreatingUser
    ) {
      ensureUserExists(undefined, {
        onSuccess: () => {
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

  const { setColorTheme, setSecondaryColorTheme } = useThemeStore();

  React.useEffect(() => {
    setColorTheme(`${userTheme.primaryColor}-primary` as PrimaryColorTheme);
    setSecondaryColorTheme(
      `${userTheme.secondaryColor}-secondary` as SecondaryColorTheme
    );
  }, [userTheme, setColorTheme, setSecondaryColorTheme]);

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
          </div>
        </div>
      </div>
    );
  }

  if (!clerkUser || !convexUser) {
    return (
      <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
        <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
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
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

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
      const promises: Promise<unknown>[] = [];

      const convexUpdates: {
        username?: string;
        first_name?: string;
        last_name?: string;
        image_url?: string;
        primaryColor?: string;
        secondaryColor?: string;
      } = {};
      if (username) convexUpdates.username = username;
      if (firstName) convexUpdates.first_name = firstName;
      if (lastName) convexUpdates.last_name = lastName;
      if (imageUrl) convexUpdates.image_url = imageUrl;
      convexUpdates.primaryColor = userTheme.primaryColor;
      convexUpdates.secondaryColor = userTheme.secondaryColor;

      if (Object.keys(convexUpdates).length > 0) {
        promises.push(updateProfileMutation.mutateAsync(convexUpdates));
      }

      const clerkUpdates: {
        username?: string;
        firstName?: string;
        lastName?: string;
      } = {};
      if (username) clerkUpdates.username = username;
      if (firstName) clerkUpdates.firstName = firstName;
      if (lastName) clerkUpdates.lastName = lastName;

      if (Object.keys(clerkUpdates).length > 0) {
        promises.push(clerkUser.update(clerkUpdates));
      }

      if (uploadedImageFile) {
        promises.push(clerkUser.setProfileImage({ file: uploadedImageFile }));
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        toast.success('Profile updated successfully!');
        navigate({ to: '/profile' });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('(Profile Edit) Failed to update profile:', error);
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

  return (
    <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
        <div className="mx-auto max-w-4xl">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/profile">
              <ArrowLeft className="mr-2 h-4 w-4" />
              back to profile
            </Link>
          </Button>

          <Card className="bg-background/90 mb-6 border-none shadow-lg backdrop-blur transition-all duration-300 hover:shadow-xl sm:mb-8">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <h1 className="from-theme-primary to-theme-secondary mb-6 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent lowercase">
                edit profile
              </h1>

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
                  </div>
                </div>

                <form
                  onSubmit={handleSaveProfile}
                  className="w-full flex-1 space-y-3 sm:space-y-4"
                >
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <div>
                      <Label htmlFor="username" className="text-sm font-medium">
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
                      }}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-4 pt-4">
                    <div>
                      <h3 className="mb-3 text-sm font-medium">
                        authentication & connections
                      </h3>
                      <div className="space-y-3">
                        <AppleIdStatus />
                        <div>
                          <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                            social connections
                          </h4>
                          <SocialConnectionsList className="mb-4" />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <ConnectSocialButton
                          platform="twitter"
                          size="sm"
                          variant="outline"
                        />
                        <ConnectSocialButton
                          platform="instagram"
                          size="sm"
                          variant="outline"
                        />
                        <ConnectSocialButton
                          platform="tiktok"
                          size="sm"
                          variant="outline"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 transition-transform hover:scale-[1.02] sm:flex-none"
                    >
                      {isSaving ? 'saving...' : 'save changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate({ to: '/profile' })}
                      className="flex-1 transition-transform hover:scale-[1.02] sm:flex-none"
                    >
                      cancel
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProfileEdit;
