import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Button } from '@/components/ui/Button';

interface OnboardingInterestsStepProps {
  onNext: () => void;
  onUpdateInterests: (interests: string[]) => Promise<void>;
  isLoading: boolean;
}

const INTERESTS = [
  { id: 'lifestyle', name: 'Lifestyle', emoji: '🌟' },
  { id: 'food', name: 'Food & Drinks', emoji: '🍕' },
  { id: 'travel', name: 'Travel', emoji: '✈️' },
  { id: 'music', name: 'Music', emoji: '🎵' },
  { id: 'fitness', name: 'Fitness', emoji: '💪' },
  { id: 'art', name: 'Art & Design', emoji: '🎨' },
  { id: 'tech', name: 'Technology', emoji: '💻' },
  { id: 'fashion', name: 'Fashion', emoji: '👗' },
  { id: 'gaming', name: 'Gaming', emoji: '🎮' },
  { id: 'books', name: 'Books', emoji: '📚' },
  { id: 'movies', name: 'Movies & TV', emoji: '🎬' },
  { id: 'nature', name: 'Nature', emoji: '🌿' },
  { id: 'pets', name: 'Pets', emoji: '🐕' },
  { id: 'sports', name: 'Sports', emoji: '⚽' },
  { id: 'photography', name: 'Photography', emoji: '📸' },
  { id: 'cooking', name: 'Cooking', emoji: '🍳' },
];

export function OnboardingInterestsStep({
  onNext,
  onUpdateInterests,
  isLoading,
}: OnboardingInterestsStepProps) {
  const [selectedInterests, setSelectedInterests] = React.useState<string[]>(
    []
  );

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleContinue = async () => {
    await onUpdateInterests(selectedInterests);
    onNext();
  };

  return (
    <View className="flex-1 px-6">
      <ScrollView className="flex-1">
        <Text className="text-foreground mb-2 text-center text-lg font-medium">
          What are you interested in?
        </Text>
        <Text className="text-muted-foreground mb-6 text-center">
          Choose at least 3 topics to personalize your feed
        </Text>

        <View className="mb-8 flex-row flex-wrap justify-between">
          {INTERESTS.map((interest) => (
            <TouchableOpacity
              key={interest.id}
              onPress={() => toggleInterest(interest.id)}
              className={`mb-3 w-[48%] rounded-xl border-2 p-4 ${
                selectedInterests.includes(interest.id)
                  ? 'border-theme-primary bg-theme-primary/10'
                  : 'border-border bg-card'
              }`}
            >
              <Text className="mb-2 text-2xl">{interest.emoji}</Text>
              <Text
                className={`font-medium ${
                  selectedInterests.includes(interest.id)
                    ? 'text-theme-primary'
                    : 'text-card-foreground'
                }`}
              >
                {interest.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected count */}
        <View className="bg-card border-border mb-8 rounded-lg border p-4">
          <Text className="text-card-foreground text-center">
            {selectedInterests.length} interests selected
            {selectedInterests.length < 3 && (
              <Text className="text-muted-foreground">
                {' '}
                (choose at least 3)
              </Text>
            )}
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View className="pb-6">
        <Button
          title={isLoading ? 'Saving...' : 'Continue'}
          onPress={handleContinue}
          disabled={selectedInterests.length < 3 || isLoading}
          loading={isLoading}
          className="w-full"
        />
      </View>
    </View>
  );
}
