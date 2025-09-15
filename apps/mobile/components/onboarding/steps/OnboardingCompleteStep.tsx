import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';

interface OnboardingCompleteStepProps {
  onComplete: () => void;
  isLoading: boolean;
}

export function OnboardingCompleteStep({
  onComplete,
  isLoading,
}: OnboardingCompleteStepProps) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View className="flex-1 justify-center px-6">
      <Animated.View
        style={{ transform: [{ scale: scaleAnim }] }}
        className="mb-8 items-center"
      >
        {/* Success Icon */}
        <View className="bg-success/20 mb-6 h-32 w-32 items-center justify-center rounded-full">
          <MaterialCommunityIcons
            name="check-circle"
            size={64}
            color="#059669"
          />
        </View>

        <Text className="text-foreground mb-4 text-center text-3xl font-bold">
          You're All Set! 🎉
        </Text>

        <Text className="text-muted-foreground mb-8 text-center text-lg leading-6">
          Welcome to the vibechecc community! You're ready to start sharing your
          vibes and discovering amazing content.
        </Text>
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Feature Highlights */}
        <View className="mb-8 space-y-4">
          <View className="bg-card border-border rounded-xl border p-4">
            <View className="flex-row items-center">
              <View className="bg-theme-primary/20 mr-4 h-12 w-12 items-center justify-center rounded-full">
                <MaterialCommunityIcons name="plus" size={24} color="#e11d48" />
              </View>
              <View className="flex-1">
                <Text className="text-card-foreground font-semibold">
                  Create Your First Vibe
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Share what's on your mind
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-card border-border rounded-xl border p-4">
            <View className="flex-row items-center">
              <View className="bg-theme-secondary/20 mr-4 h-12 w-12 items-center justify-center rounded-full">
                <MaterialCommunityIcons
                  name="compass"
                  size={24}
                  color="#f97316"
                />
              </View>
              <View className="flex-1">
                <Text className="text-card-foreground font-semibold">
                  Explore Trending
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Discover what's popular
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-card border-border rounded-xl border p-4">
            <View className="flex-row items-center">
              <View className="bg-theme-accent/20 mr-4 h-12 w-12 items-center justify-center rounded-full">
                <MaterialCommunityIcons
                  name="account-group"
                  size={24}
                  color="#0891b2"
                />
              </View>
              <View className="flex-1">
                <Text className="text-card-foreground font-semibold">
                  Join the Community
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Connect with like-minded people
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Start Button */}
        <Button
          title={isLoading ? 'Setting up...' : 'Start Exploring'}
          onPress={onComplete}
          loading={isLoading}
          className="mb-4 w-full"
        />

        <Text className="text-muted-foreground text-center text-sm">
          You can always update your preferences in Settings
        </Text>
      </Animated.View>
    </View>
  );
}
