import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

export default function OnboardingScreen() {
  const { isSignedIn } = useAuth();

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <SafeAreaView className="bg-background flex-1">
      <StatusBar style="auto" />
      <OnboardingFlow />
    </SafeAreaView>
  );
}
