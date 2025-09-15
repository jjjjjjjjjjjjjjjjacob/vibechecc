import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/utils/cn';

const { width } = Dimensions.get('window');

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onSkip?: () => void;
  showBack?: boolean;
  showSkip?: boolean;
  title?: string;
  subtitle?: string;
  isTransitioning?: boolean;
}

export function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  onBack,
  onSkip,
  showBack = true,
  showSkip = true,
  title,
  subtitle,
  isTransitioning = false,
}: OnboardingLayoutProps) {
  const progressWidth = (currentStep / totalSteps) * 100;

  return (
    <LinearGradient
      colors={['#8b5cf6', '#e11d48']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <StatusBar style="light" />

        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          {showBack ? (
            <TouchableOpacity
              onPress={onBack}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <View className="w-10" />
          )}

          {/* Step indicator */}
          <View className="mx-4 flex-1">
            <View className="h-2 overflow-hidden rounded-full bg-white/20">
              <View
                className="h-full rounded-full bg-white transition-all duration-500 ease-out"
                style={{ width: `${progressWidth}%` }}
              />
            </View>
            <Text className="mt-2 text-center text-xs font-medium text-white/80">
              {currentStep} of {totalSteps}
            </Text>
          </View>

          {showSkip ? (
            <TouchableOpacity
              onPress={onSkip}
              className="px-3 py-2"
              activeOpacity={0.7}
            >
              <Text className="font-medium text-white/90">Skip</Text>
            </TouchableOpacity>
          ) : (
            <View className="w-10" />
          )}
        </View>

        {/* Title section */}
        {(title || subtitle) && (
          <View className="mb-6 px-6">
            {title && (
              <Text className="mb-2 text-center text-3xl font-bold text-white">
                {title}
              </Text>
            )}
            {subtitle && (
              <Text className="text-center text-lg text-white/80">
                {subtitle}
              </Text>
            )}
          </View>
        )}

        {/* Content */}
        <View className={cn('flex-1', isTransitioning && 'opacity-50')}>
          {children}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
