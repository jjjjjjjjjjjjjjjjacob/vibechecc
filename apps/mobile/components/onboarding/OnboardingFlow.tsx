import React from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';

import { OnboardingWelcomeStep } from './steps/OnboardingWelcomeStep';
import { OnboardingProfileStep } from './steps/OnboardingProfileStep';
import { OnboardingThemeStep } from './steps/OnboardingThemeStep';
import { OnboardingInterestsStep } from './steps/OnboardingInterestsStep';
import { OnboardingDiscoverStep } from './steps/OnboardingDiscoverStep';
import { OnboardingCompleteStep } from './steps/OnboardingCompleteStep';
import { OnboardingLayout } from './OnboardingLayout';

export function OnboardingFlow() {
  const router = useRouter();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [onboardingData, setOnboardingData] = React.useState({
    username: '',
    firstName: '',
    lastName: '',
    imageUrl: '',
    interests: [] as string[],
    primaryColor: 'pink',
    secondaryColor: 'orange',
  });
  const [uploadedImageFile, setUploadedImageFile] = React.useState<any>(null);

  const totalSteps = 6;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsTransitioning(false);
      }, 300);
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
      // TODO: Complete onboarding mutation
      router.replace('/');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  const handleUpdateProfile = async (profileData: {
    username?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  }) => {
    try {
      setOnboardingData((prev) => ({ ...prev, ...profileData }));
      // TODO: Update profile mutation
      console.log('Profile updated:', profileData);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleUpdateInterests = async (interests: string[]) => {
    try {
      setOnboardingData((prev) => ({ ...prev, interests }));
      // TODO: Update interests mutation
      console.log('Interests updated:', interests);
    } catch (error) {
      console.error('Error updating interests:', error);
    }
  };

  const handleUpdateTheme = async (theme: {
    primaryColor: string;
    secondaryColor: string;
  }) => {
    try {
      setOnboardingData((prev) => ({ ...prev, ...theme }));
      // TODO: Update theme mutation
      console.log('Theme updated:', theme);
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const handleComplete = async () => {
    if (!user) {
      console.error('User not found');
      return;
    }

    try {
      // TODO: Complete onboarding with all data
      console.log('Completing onboarding:', onboardingData);
      router.replace('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
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
            isLoading={false}
          />
        );
      case 3:
        return (
          <OnboardingThemeStep
            onNext={handleNext}
            onUpdateTheme={handleUpdateTheme}
            isLoading={false}
          />
        );
      case 4:
        return (
          <OnboardingInterestsStep
            onNext={handleNext}
            onUpdateInterests={handleUpdateInterests}
            isLoading={false}
          />
        );
      case 5:
        return <OnboardingDiscoverStep onNext={handleNext} />;
      case 6:
        return (
          <OnboardingCompleteStep
            onComplete={handleComplete}
            isLoading={false}
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
        return 'Set up your profile';
      case 3:
        return 'Choose your theme';
      case 4:
        return 'Choose your interests';
      case 5:
        return 'Learn to vibe';
      case 6:
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
        return 'Pick colors that represent you';
      case 4:
        return 'Help us personalize your experience';
      case 5:
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
