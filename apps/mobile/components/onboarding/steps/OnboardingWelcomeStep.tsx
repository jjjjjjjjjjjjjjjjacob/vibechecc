import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

interface OnboardingWelcomeStepProps {
  onNext: () => void;
}

export function OnboardingWelcomeStep({ onNext }: OnboardingWelcomeStepProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View className="flex-1 justify-center px-6">
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
        className="items-center"
      >
        {/* Logo/Icon */}
        <View className="mb-8 h-24 w-24 items-center justify-center rounded-full bg-white/20">
          <Text className="text-4xl font-bold text-white">V</Text>
        </View>

        {/* Welcome Text */}
        <Text className="mb-4 text-center text-4xl font-bold text-white">
          Welcome to{'\n'}
          <Text className="text-white">vibechecc</Text>
        </Text>

        <Text className="mb-8 text-center text-lg leading-6 text-white/80">
          Share your vibes, discover amazing content, and connect with a
          community that gets you.
        </Text>

        {/* Features Card */}
        <Card className="mb-8 w-full border-white/20 bg-white/10">
          <CardContent className="space-y-4 p-6">
            <View className="flex-row items-center">
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <MaterialCommunityIcons
                  name="emoticon-happy"
                  size={20}
                  color="white"
                />
              </View>
              <Text className="flex-1 font-medium text-white">
                Share your moments with emoji ratings
              </Text>
            </View>

            <View className="flex-row items-center">
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <MaterialCommunityIcons
                  name="compass"
                  size={20}
                  color="white"
                />
              </View>
              <Text className="flex-1 font-medium text-white">
                Discover trending vibes from the community
              </Text>
            </View>

            <View className="flex-row items-center">
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <MaterialCommunityIcons
                  name="account-group"
                  size={20}
                  color="white"
                />
              </View>
              <Text className="flex-1 font-medium text-white">
                Connect with like-minded people
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Get Started Button */}
        <TouchableOpacity
          onPress={onNext}
          className="mobile-touch-target w-full items-center rounded-xl bg-white px-8 py-4 shadow-lg"
          activeOpacity={0.9}
        >
          <Text className="text-lg font-bold text-purple-600">Get Started</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
