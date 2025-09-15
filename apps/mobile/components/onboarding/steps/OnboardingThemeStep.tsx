import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Button } from '@/components/ui/Button';

interface OnboardingThemeStepProps {
  onNext: () => void;
  onUpdateTheme: (theme: {
    primaryColor: string;
    secondaryColor: string;
  }) => Promise<void>;
  isLoading: boolean;
}

const THEME_COLORS = [
  {
    name: 'Pink',
    primary: 'pink',
    secondary: 'orange',
    colors: ['#e11d48', '#f97316'],
  },
  {
    name: 'Blue',
    primary: 'blue',
    secondary: 'cyan',
    colors: ['#2563eb', '#0891b2'],
  },
  {
    name: 'Purple',
    primary: 'purple',
    secondary: 'violet',
    colors: ['#7c3aed', '#8b5cf6'],
  },
  {
    name: 'Green',
    primary: 'emerald',
    secondary: 'teal',
    colors: ['#059669', '#0d9488'],
  },
  {
    name: 'Orange',
    primary: 'orange',
    secondary: 'amber',
    colors: ['#ea580c', '#d97706'],
  },
  {
    name: 'Red',
    primary: 'red',
    secondary: 'pink',
    colors: ['#dc2626', '#e11d48'],
  },
];

export function OnboardingThemeStep({
  onNext,
  onUpdateTheme,
  isLoading,
}: OnboardingThemeStepProps) {
  const [selectedTheme, setSelectedTheme] = React.useState(THEME_COLORS[0]);

  const handleContinue = async () => {
    await onUpdateTheme({
      primaryColor: selectedTheme.primary,
      secondaryColor: selectedTheme.secondary,
    });
    onNext();
  };

  return (
    <View className="flex-1 px-6">
      <ScrollView className="flex-1">
        <Text className="text-foreground mb-6 text-center text-lg font-medium">
          Choose colors that represent your personality
        </Text>

        <View className="mb-8 space-y-4">
          {THEME_COLORS.map((theme) => (
            <TouchableOpacity
              key={theme.name}
              onPress={() => setSelectedTheme(theme)}
              className={`rounded-xl border-2 p-4 ${
                selectedTheme.name === theme.name
                  ? 'border-theme-primary bg-theme-primary/10'
                  : 'border-border bg-card'
              }`}
            >
              <View className="flex-row items-center">
                <View className="mr-4 flex-row">
                  <View
                    className="mr-2 h-8 w-8 rounded-full"
                    style={{ backgroundColor: theme.colors[0] }}
                  />
                  <View
                    className="h-8 w-8 rounded-full"
                    style={{ backgroundColor: theme.colors[1] }}
                  />
                </View>
                <Text className="text-card-foreground flex-1 font-medium">
                  {theme.name}
                </Text>
                {selectedTheme.name === theme.name && (
                  <View className="bg-theme-primary h-5 w-5 items-center justify-center rounded-full">
                    <Text className="text-xs text-white">✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview */}
        <View className="bg-card border-border mb-8 rounded-xl border p-6">
          <Text className="text-card-foreground mb-4 font-medium">Preview</Text>
          <View className="flex-row items-center space-x-3">
            <View
              className="h-12 w-12 rounded-lg"
              style={{
                backgroundColor: selectedTheme.colors[0],
              }}
            />
            <View className="flex-1">
              <Text className="text-card-foreground font-semibold">
                Your personalized theme
              </Text>
              <Text className="text-muted-foreground text-sm">
                This will be applied throughout the app
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View className="pb-6">
        <Button
          title={isLoading ? 'Saving...' : 'Continue'}
          onPress={handleContinue}
          loading={isLoading}
          className="w-full"
        />
      </View>
    </View>
  );
}
