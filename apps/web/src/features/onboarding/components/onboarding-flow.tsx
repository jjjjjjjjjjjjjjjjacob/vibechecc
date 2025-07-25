import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { OnboardingLayout } from './onboarding-layout';
import { OnboardingWelcomeStep } from './onboarding-welcome-step';
import { OnboardingProfileStep } from './onboarding-profile-step';
import { OnboardingInterestsStep } from './onboarding-interests-step';
import { OnboardingDiscoverStep } from './onboarding-discover-step';
import { OnboardingCompleteStep } from './onboarding-complete-step';
import {
  useUpdateOnboardingDataMutation,
  useCompleteOnboardingMutation,
} from '@/queries';
import { useUser } from '@clerk/tanstack-react-start';
import toast from '@/utils/toast';

export function OnboardingFlow() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [onboardingData, setOnboardingData] = React.useState({
    username: '',
    first_name: '',
    last_name: '',
    image_url: '',
    interests: [] as string[],
  });
  const [uploadedImageFile, setUploadedImageFile] = React.useState<File | null>(
    null
  );

  const updateOnboardingMutation = useUpdateOnboardingDataMutation();
  const completeOnboardingMutation = useCompleteOnboardingMutation();

  const totalSteps = 5;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = async () => {
    try {
      await completeOnboardingMutation.mutateAsync({});
      toast.success('Welcome to vibechecc!');
      navigate({ to: '/' });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error skipping onboarding:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleUpdateProfile = async (profileData: {
    username?: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
  }) => {
    try {
      setOnboardingData((prev) => ({ ...prev, ...profileData }));
      // console.log('profileData', profileData);
      await updateOnboardingMutation.mutateAsync(profileData);
      toast.success('Profile updated!');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('(Onboarding Flow) Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
      // Don't prevent user from continuing on profile update errors
    }
  };

  const handleUpdateInterests = async (interests: string[]) => {
    try {
      setOnboardingData((prev) => ({ ...prev, interests }));
      await updateOnboardingMutation.mutateAsync({ interests });
      toast.success('Interests saved!');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating interests:', error);
      toast.error('Failed to save interests. Please try again.');
      // Don't prevent user from continuing on interests errors
    }
  };

  const handleComplete = async () => {
    if (!user) {
      toast.error('User not found');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const promises: Promise<any>[] = [];

      // Prepare Convex completion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const convexData: any = {};
      if (onboardingData.username)
        convexData.username = onboardingData.username;
      if (onboardingData.interests.length > 0)
        convexData.interests = onboardingData.interests;
      if (onboardingData.image_url)
        convexData.image_url = onboardingData.image_url;

      // Add Convex completion to promises
      promises.push(completeOnboardingMutation.mutateAsync(convexData));

      // Prepare Clerk updates if needed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clerkUpdates: any = {};
      if (onboardingData.username)
        clerkUpdates.username = onboardingData.username;
      if (onboardingData.first_name)
        clerkUpdates.firstName = onboardingData.first_name;
      if (onboardingData.last_name)
        clerkUpdates.lastName = onboardingData.last_name;

      // Add Clerk user update to promises if there are field updates
      if (Object.keys(clerkUpdates).length > 0) {
        promises.push(user.update(clerkUpdates));
      }

      // Add Clerk avatar update to promises if there's an uploaded image
      if (uploadedImageFile) {
        promises.push(user.setProfileImage({ file: uploadedImageFile }));
      }

      // Execute all updates in parallel
      await Promise.all(promises);

      toast.success('Welcome to vibechecc! 🎉');
      navigate({ to: '/' });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error completing onboarding:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return <OnboardingWelcomeStep onNext={handleNext} />;
      case 2:
        return (
          <OnboardingProfileStep
            onNext={handleNext}
            onUpdateProfile={handleUpdateProfile}
            onImageFileChange={setUploadedImageFile}
            isLoading={updateOnboardingMutation.isPending}
          />
        );
      case 3:
        return (
          <OnboardingInterestsStep
            onNext={handleNext}
            onUpdateInterests={handleUpdateInterests}
            isLoading={updateOnboardingMutation.isPending}
          />
        );
      case 4:
        return <OnboardingDiscoverStep onNext={handleNext} />;
      case 5:
        return (
          <OnboardingCompleteStep
            onComplete={handleComplete}
            isLoading={completeOnboardingMutation.isPending}
          />
        );
      default:
        return <OnboardingWelcomeStep onNext={handleNext} />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return undefined; // Welcome step has its own title
      case 2:
        return 'Set Up Your Profile';
      case 3:
        return 'Choose Your Interests';
      case 4:
        return 'Learn to Discover';
      case 5:
        return undefined; // Complete step has its own title
      default:
        return undefined;
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 2:
        return 'Tell us about yourself';
      case 3:
        return 'Help us personalize your experience';
      case 4:
        return 'See how to interact with vibes';
      default:
        return undefined;
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={handleBack}
      onSkip={handleSkip}
      showBack={currentStep > 1 && currentStep < 5}
      showSkip={currentStep < 5}
      title={getStepTitle()}
      subtitle={getStepSubtitle()}
    >
      {getStepContent()}
    </OnboardingLayout>
  );
}
