import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';

interface OnboardingDiscoverStepProps {
  onNext: () => void;
}

export function OnboardingDiscoverStep({
  onNext,
}: OnboardingDiscoverStepProps) {
  return (
    <ScrollView className="flex-1 px-6">
      <View className="mb-8 items-center">
        <View className="bg-theme-primary/20 mb-4 h-20 w-20 items-center justify-center rounded-full">
          <MaterialCommunityIcons name="compass" size={40} color="#e11d48" />
        </View>
        <Text className="text-foreground mb-2 text-center text-xl font-bold">
          Discover Amazing Vibes
        </Text>
        <Text className="text-muted-foreground text-center">
          Learn how to interact with content on vibechecc
        </Text>
      </View>

      {/* Tutorial Cards */}
      <View className="mb-8 space-y-6">
        {/* Rating System */}
        <View className="bg-card border-border rounded-xl border p-6">
          <View className="mb-3 flex-row items-center">
            <View className="bg-rating/20 mr-3 h-10 w-10 items-center justify-center rounded-full">
              <MaterialCommunityIcons name="star" size={20} color="#eab308" />
            </View>
            <Text className="text-card-foreground font-semibold">
              Rate with Emojis
            </Text>
          </View>
          <Text className="text-muted-foreground mb-4">
            Express how content makes you feel with emoji ratings from 1-5 and
            written reviews.
          </Text>
          <View className="flex-row space-x-2">
            {['😢', '😕', '😐', '😊', '🤩'].map((emoji, index) => (
              <View
                key={index}
                className="bg-muted h-10 w-10 items-center justify-center rounded-full"
              >
                <Text className="text-lg">{emoji}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sharing */}
        <View className="bg-card border-border rounded-xl border p-6">
          <View className="mb-3 flex-row items-center">
            <View className="bg-theme-secondary/20 mr-3 h-10 w-10 items-center justify-center rounded-full">
              <Ionicons name="share" size={20} color="#f97316" />
            </View>
            <Text className="text-card-foreground font-semibold">
              Share Your Moments
            </Text>
          </View>
          <Text className="text-muted-foreground mb-4">
            Create vibes by sharing photos, thoughts, and experiences with the
            community.
          </Text>
          <View className="bg-muted flex-row items-center rounded-lg p-3">
            <View className="bg-theme-primary/20 mr-3 h-8 w-8 rounded">
              <Text className="text-xs">📸</Text>
            </View>
            <Text className="text-muted-foreground flex-1 text-sm">
              "Just had the most amazing coffee! ☕✨"
            </Text>
          </View>
        </View>

        {/* Discovery */}
        <View className="bg-card border-border rounded-xl border p-6">
          <View className="mb-3 flex-row items-center">
            <View className="bg-theme-accent/20 mr-3 h-10 w-10 items-center justify-center rounded-full">
              <MaterialCommunityIcons
                name="trending-up"
                size={20}
                color="#0891b2"
              />
            </View>
            <Text className="text-card-foreground font-semibold">
              Explore & Connect
            </Text>
          </View>
          <Text className="text-muted-foreground mb-4">
            Discover trending content, follow interesting people, and build your
            community.
          </Text>
          <View className="flex-row space-x-2">
            <View className="bg-theme-primary/10 rounded-full px-3 py-1">
              <Text className="text-theme-primary text-sm">#trending</Text>
            </View>
            <View className="bg-theme-secondary/10 rounded-full px-3 py-1">
              <Text className="text-theme-secondary text-sm">#music</Text>
            </View>
            <View className="bg-theme-accent/10 rounded-full px-3 py-1">
              <Text className="text-theme-accent text-sm">#lifestyle</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Interaction Examples */}
      <View className="from-theme-primary/5 to-theme-secondary/5 mb-8 rounded-xl bg-gradient-to-r p-6">
        <Text className="text-foreground mb-3 font-semibold">Quick Tips</Text>
        <View className="space-y-2">
          <View className="flex-row">
            <Text className="text-theme-primary mr-2">•</Text>
            <Text className="text-foreground flex-1">
              Tap to like, hold to rate with emojis
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-theme-secondary mr-2">•</Text>
            <Text className="text-foreground flex-1">
              Swipe right on vibes you love
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-theme-accent mr-2">•</Text>
            <Text className="text-foreground flex-1">
              Follow users to see more of their content
            </Text>
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <View className="pb-6">
        <Button title="Got it!" onPress={onNext} className="w-full" />
      </View>
    </ScrollView>
  );
}
