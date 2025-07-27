import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvatarPicker } from '@/features/onboarding/components/avatar-picker';
import { useUser } from '@clerk/tanstack-react-start';
import toast from '@/utils/toast';

interface OnboardingProfileStepProps {
  onNext: () => void;
  onUpdateProfile: (data: {
    username?: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
  }) => void;
  onImageFileChange?: (file: File | null) => void;
  isLoading?: boolean;
}

export function OnboardingProfileStep({
  onNext,
  onUpdateProfile,
  onImageFileChange,
  isLoading = false,
}: OnboardingProfileStepProps) {
  const { user } = useUser();
  const [formData, setFormData] = React.useState({
    username: user?.username || '',
    first_name: user?.firstName || '',
    last_name: user?.lastName || '',
    image_url: user?.imageUrl || '',
  });
  const [uploadedImageFile, setUploadedImageFile] = React.useState<File | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('User not found');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const promises: Promise<any>[] = [];

      // Prepare Convex updates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const convexUpdates: any = {};
      if (formData.username.trim())
        convexUpdates.username = formData.username.trim();
      if (formData.first_name.trim())
        convexUpdates.first_name = formData.first_name.trim();
      if (formData.last_name.trim())
        convexUpdates.last_name = formData.last_name.trim();
      if (formData.image_url.trim())
        convexUpdates.image_url = formData.image_url.trim();

      // Add Convex update to promises
      if (Object.keys(convexUpdates).length > 0) {
        promises.push(
          new Promise((resolve) => {
            onUpdateProfile(convexUpdates);
            resolve(true);
          })
        );
      }

      // Prepare Clerk updates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clerkUpdates: any = {};
      if (formData.username.trim())
        clerkUpdates.username = formData.username.trim();
      if (formData.first_name.trim())
        clerkUpdates.firstName = formData.first_name.trim();
      if (formData.last_name.trim())
        clerkUpdates.lastName = formData.last_name.trim();

      // Add Clerk user update to promises if there are field updates
      if (Object.keys(clerkUpdates).length > 0) {
        promises.push(user.update(clerkUpdates));
      }

      // Add Clerk avatar update to promises if there's an uploaded image
      if (uploadedImageFile) {
        promises.push(user.setProfileImage({ file: uploadedImageFile }));
      }

      // Execute all updates in parallel
      if (promises.length > 0) {
        await Promise.all(promises);
        toast.success('Profile updated successfully!');
      }

      onNext();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('(Profile Step) Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleImageChange = (imageUrl: string, file?: File) => {
    setFormData((prev) => ({
      ...prev,
      image_url: imageUrl,
    }));

    // Store the file for Clerk upload if it's a file upload (not URL)
    if (file) {
      setUploadedImageFile(file);
      onImageFileChange?.(file);
    } else {
      setUploadedImageFile(null);
      onImageFileChange?.(null);
    }
  };

  const displayName =
    `${formData.first_name} ${formData.last_name}`.trim() ||
    formData.username ||
    user?.firstName ||
    'User';

  return (
    <div className="mx-auto max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-border/50 border-2">
          <CardHeader className="space-y-4 text-center">
            <div>
              <CardTitle className="text-2xl">Set Up Your Profile</CardTitle>
              <p className="text-muted-foreground mt-2">
                Tell us a bit about yourself so others can discover your vibes!
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Avatar Picker */}
            <AvatarPicker
              currentImageUrl={formData.image_url}
              onImageChange={handleImageChange}
              userName={displayName}
              size="lg"
            />

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a unique username"
                    value={formData.username}
                    onChange={handleChange('username')}
                    className="border-2 focus:border-pink-400"
                  />
                  <p className="text-muted-foreground text-xs">
                    This is how others will find and identify you on viberater
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-sm font-medium">
                      First Name
                    </Label>
                    <Input
                      id="first_name"
                      type="text"
                      placeholder="Your first name"
                      value={formData.first_name}
                      onChange={handleChange('first_name')}
                      className="border-2 focus:border-pink-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-sm font-medium">
                      Last Name
                    </Label>
                    <Input
                      id="last_name"
                      type="text"
                      placeholder="Your last name"
                      value={formData.last_name}
                      onChange={handleChange('last_name')}
                      className="border-2 focus:border-pink-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onNext}
                  className="flex-1"
                >
                  Skip for Now
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:from-pink-600 hover:to-orange-600"
                >
                  {isLoading ? 'Saving...' : 'Continue'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
