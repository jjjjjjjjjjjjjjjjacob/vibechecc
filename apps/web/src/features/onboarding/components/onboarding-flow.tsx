import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { OnboardingLayout } from './onboarding-layout';
import { OnboardingWelcomeStep } from './onboarding-welcome-step';
import { OnboardingProfileStep } from './onboarding-profile-step';
import { OnboardingThemeStep } from './onboarding-theme-step';
import { OnboardingInterestsStep } from './onboarding-interests-step';
import { OnboardingDiscoverStep } from './onboarding-discover-step';
import { OnboardingCompleteStep } from './onboarding-complete-step';
import {
  useUpdateOnboardingDataMutation,
  useCompleteOnboardingMutation,
  useUpdateThemeMutation,
} from '@/queries';
import { useUser } from '@clerk/tanstack-react-start';
import toast from '@/utils/toast';

export function OnboardingFlow() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [onboardingData, setOnboardingData] = React.useState({
    username: '',
    first_name: '',
    last_name: '',
    image_url: '',
    interests: [] as string[],
    primaryColor: 'pink',
    secondaryColor: 'orange',
  });
  const [uploadedImageFile, setUploadedImageFile] = React.useState<File | null>(
    null
  );

  const updateOnboardingMutation = useUpdateOnboardingDataMutation();
  const completeOnboardingMutation = useCompleteOnboardingMutation();
  const updateThemeMutation = useUpdateThemeMutation();

  const totalSteps = 6;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      if (currentStep === 1) {
        // Special handling for welcome step with fade-out animation
        // Animation is handled in OnboardingWelcomeStep
        setCurrentStep((prev) => prev + 1);
      } else {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentStep((prev) => prev + 1);
          setIsTransitioning(false);
        }, 300);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleSkip = async () => {
    try {
      await completeOnboardingMutation.mutateAsync({});
      toast.success('welcome to vibechecc!');
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
      toast.success('profile updated!');
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
      toast.success('interests saved!');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating interests:', error);
      toast.error('Failed to save interests. Please try again.');
      // Don't prevent user from continuing on interests errors
    }
  };

  const handleUpdateTheme = async (theme: {
    primaryColor: string;
    secondaryColor: string;
  }) => {
    try {
      setOnboardingData((prev) => ({ ...prev, ...theme }));
      await updateThemeMutation.mutateAsync(theme);
      toast.success('theme saved!');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating theme:', error);
      toast.error('Failed to save theme. Please try again.');
      // Don't prevent user from continuing on theme errors
    }
  };

  const handleComplete = async () => {
    if (!user) {
      toast.error('User not found');
      return;
    }

    try {
      const promises: Promise<unknown>[] = [];

      // Prepare Convex completion
      const convexData: Record<string, string | string[]> = {};
      if (onboardingData.username)
        convexData.username = onboardingData.username;
      if (onboardingData.interests.length > 0)
        convexData.interests = onboardingData.interests;
      if (onboardingData.image_url)
        convexData.image_url = onboardingData.image_url;

      // Add Convex completion to promises
      promises.push(completeOnboardingMutation.mutateAsync(convexData));

      // Prepare Clerk updates if needed
      const clerkUpdates: Record<string, string> = {};
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

      toast.success('welcome to vibechecc! 🎉');
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
          <OnboardingThemeStep
            onNext={handleNext}
            onUpdateTheme={handleUpdateTheme}
            isLoading={updateThemeMutation.isPending}
          />
        );
      case 4:
        return (
          <OnboardingInterestsStep
            onNext={handleNext}
            onUpdateInterests={handleUpdateInterests}
            isLoading={updateOnboardingMutation.isPending}
          />
        );
      case 5:
        return <OnboardingDiscoverStep onNext={handleNext} />;
      case 6:
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
        return 'set up your profile';
      case 3:
        return 'choose your theme';
      case 4:
        return 'choose your interests';
      case 5:
        return 'learn to vibe';
      case 6:
        return undefined; // Complete step has its own title
      default:
        return undefined;
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 2:
        return 'tell us about yourself';
      case 3:
        return 'pick colors that represent you';
      case 4:
        return 'help us personalize your experience';
      case 5:
        return 'see how to interact with vibes';
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
      showBack={currentStep > 1 && currentStep < 6}
      showSkip={currentStep < 6}
      title={getStepTitle()}
      subtitle={getStepSubtitle()}
      isTransitioning={isTransitioning}
    >
      {getStepContent()}
    </OnboardingLayout>
  );
}
