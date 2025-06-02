import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useUserVibes, useUpdateUserMutation } from '@/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { redirect } from '@tanstack/react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { VibeGridSkeleton } from '@/components/ui/vibe-grid-skeleton';

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
  beforeLoad: async () => await requireAuth(),
});

function Profile() {
  const { user, isLoaded } = useUser();
  const { data: vibes, isLoading: vibesLoading } = useUserVibes(user?.id || '');
  const updateUserMutation = useUpdateUserMutation();

  const [name, setName] = React.useState('');
  const [avatar, setAvatar] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Initialize form with user data when loaded
  React.useEffect(() => {
    if (user) {
      setName(user.fullName || user.firstName || '');
      setAvatar(user.imageUrl || '');
    }
  }, [user]);

  if (!isLoaded) {
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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-4 py-3">
          <p>failed to load user profile. please try again later.</p>
        </div>
      </div>
    );
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setAvatar(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Note: Clerk handles user profile updates differently
      // You might want to use Clerk's user.update() method or
      // store additional profile data in your own database
      await user.update({
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const userDisplayName =
    user.fullName ||
    user.firstName ||
    user.emailAddresses[0]?.emailAddress ||
    'User';
  const userJoinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
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
                    <AvatarImage src={user.imageUrl} alt={userDisplayName} />
                    <AvatarFallback className="text-2xl">
                      {userDisplayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <label
                      htmlFor="avatar-upload"
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
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="flex-1 space-y-4">
                  <div>
                    <Label htmlFor="name">name</Label>
                    <Input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
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
                        setName(userDisplayName);
                        setAvatar(user.imageUrl || '');
                      }}
                    >
                      cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex-1">
                  <h1 className="mb-2 text-2xl font-bold lowercase">
                    {userDisplayName}
                  </h1>
                  <p className="text-muted-foreground mb-2">
                    {user.emailAddresses[0]?.emailAddress}
                  </p>
                  <p className="text-muted-foreground mb-4">
                    member since {userJoinDate}
                  </p>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    edit profile
                  </Button>
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
