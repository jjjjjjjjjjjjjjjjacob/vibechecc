import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
// import { useCurrentUser, useVibes } from '@vibechecc/app-core';
// import { Button } from '@/components/ui/Button';
// import { Card, CardContent, CardHeader } from '@/components/ui/Card';
// import { VibeCard } from '@/components/ui/VibeCard';
// import { Skeleton } from '@/components/ui/Skeleton';
// import { cn } from '@/utils/cn';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, isSignedIn } = useUser();
  // const currentUser = useCurrentUser();
  // const { data: vibes, isLoading: vibesLoading, refetch } = useVibes();
  const vibesLoading = false;
  const refetch = async () => {};
  const [refreshing, setRefreshing] = React.useState(false);
  const router = useRouter();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  if (!isSignedIn) {
    return (
      <LinearGradient
        colors={['#e11d48', '#f97316']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1">
          <StatusBar style="light" />

          {/* Main Content */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 justify-between p-6">
              {/* Header Section */}
              <View className="flex-1 items-center justify-center">
                {/* Logo/Brand */}
                <View className="mb-8 items-center">
                  <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-white/20">
                    <Text className="text-3xl font-bold text-white">V</Text>
                  </View>
                  <Text className="mb-2 text-center text-4xl font-bold text-white">
                    vibechecc
                  </Text>
                  <Text className="text-sm font-medium uppercase tracking-wider text-white/60">
                    Share Your Vibes
                  </Text>
                </View>

                {/* Value Proposition */}
                <View className="max-w-sm" style={{ gap: 24 }}>
                  <View className="items-center">
                    <Text className="mb-2 text-center text-xl font-semibold text-white">
                      Express Yourself
                    </Text>
                    <Text className="text-center leading-relaxed text-white/80">
                      Share moments, feelings, and experiences with an authentic
                      community
                    </Text>
                  </View>

                  <View className="items-center">
                    <Text className="mb-2 text-center text-xl font-semibold text-white">
                      Discover Amazing Content
                    </Text>
                    <Text className="text-center leading-relaxed text-white/80">
                      Find vibes that resonate with you from creators around the
                      world
                    </Text>
                  </View>

                  <View className="items-center">
                    <Text className="mb-2 text-center text-xl font-semibold text-white">
                      Rate & React
                    </Text>
                    <Text className="text-center leading-relaxed text-white/80">
                      Use emojis and ratings to show appreciation for content
                      you love
                    </Text>
                  </View>
                </View>
              </View>

              {/* CTA Buttons */}
              <View style={{ gap: 16 }}>
                {/* Primary CTA - Get Started */}
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/sign-up')}
                  className="w-full items-center rounded-2xl bg-white p-4 shadow-lg"
                  activeOpacity={0.9}
                >
                  <Text className="text-lg font-bold text-purple-600">
                    Get Started
                  </Text>
                  <Text className="mt-1 text-sm text-purple-500">
                    Join the community
                  </Text>
                </TouchableOpacity>

                {/* Secondary CTA - Sign In */}
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/sign-in')}
                  className="w-full items-center rounded-2xl border border-white/30 bg-white/20 p-4"
                  activeOpacity={0.9}
                >
                  <Text className="text-lg font-semibold text-white">
                    Already have an account?
                  </Text>
                  <Text className="mt-1 text-sm text-white/80">
                    Sign in to continue
                  </Text>
                </TouchableOpacity>

                {/* Footer */}
                <View className="items-center pt-4">
                  <Text className="text-center text-xs text-white/50">
                    By continuing, you agree to our Terms of Service and Privacy
                    Policy
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Mock data for demonstration
  const mockVibes = [
    {
      id: '1',
      title: 'Morning coffee vibes ☕',
      description:
        'Starting the day right with a perfect cup of coffee and some good music',
      imageUrl:
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
      tags: ['coffee', 'morning', 'cozy'],
      createdBy: {
        id: 'user1',
        username: 'coffeeaddict',
        full_name: 'Alex Johnson',
        avatar_url:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      },
      rating: {
        emoji: '☕',
        value: 4.8,
        count: 23,
      },
      shareCount: 5,
    },
    {
      id: '2',
      title: 'Beach sunset magic',
      description:
        'Nothing beats a beautiful sunset by the ocean. Pure peace and tranquility.',
      imageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      tags: ['sunset', 'beach', 'nature'],
      createdBy: {
        id: 'user2',
        username: 'beachvibes',
        full_name: 'Sam Rivera',
        avatar_url:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      },
      rating: {
        emoji: '🌅',
        value: 4.9,
        count: 41,
      },
      shareCount: 12,
    },
    {
      id: '3',
      title: 'Late night coding session',
      description: 'Building something amazing under the city lights',
      imageUrl:
        'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400',
      tags: ['coding', 'nightowl', 'productivity'],
      createdBy: {
        id: 'user3',
        username: 'devlife',
        full_name: 'Jordan Chen',
        avatar_url:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      },
    },
  ];

  return (
    <LinearGradient
      colors={['#ffffff', '#fef2f2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style="auto" />

        {/* Header with gradient text */}
        <View className="px-4 pb-2 pt-4">
          <Text className="mb-2 text-3xl font-bold text-gray-900">
            Hey {user?.firstName || 'there'}! 👋
          </Text>
          <Text className="mb-4 text-base text-gray-500">
            What's your vibe today?
          </Text>
        </View>

        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#e11d48"
            />
          }
          className="flex-1"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-4">
            {/* Feed Section */}
            <View className="mb-6 rounded-xl bg-rose-600 p-4 shadow-lg">
              <Text className="mb-2 text-xl font-bold text-white">
                Your Feed
              </Text>
              <Text className="text-base leading-relaxed text-white/80">
                Discover amazing vibes from your community
              </Text>
            </View>

            {/* Vibe Cards Grid */}
            <View className="mb-6" style={{ gap: 16 }}>
              {vibesLoading
                ? // Loading skeletons
                  Array.from({ length: 3 }).map((_, index) => (
                    <View
                      key={`skeleton-${index}`}
                      className="h-48 rounded-xl bg-gray-100 p-4"
                    >
                      <Text className="text-gray-400">Loading...</Text>
                    </View>
                  ))
                : // Actual vibe cards
                  mockVibes.map((vibe, index) => (
                    <TouchableOpacity
                      key={vibe.id}
                      className="rounded-xl bg-white p-4 shadow-sm"
                      onPress={() => console.log('Vibe pressed:', vibe.id)}
                    >
                      <Text className="mb-2 text-lg font-bold text-gray-900">
                        {vibe.title}
                      </Text>
                      {vibe.description && (
                        <Text className="text-sm leading-5 text-gray-600">
                          {vibe.description}
                        </Text>
                      )}
                      {vibe.rating && (
                        <View className="mt-2 flex-row items-center">
                          <Text className="mr-2 text-base">
                            {vibe.rating.emoji}
                          </Text>
                          <Text className="text-sm text-gray-700">
                            {vibe.rating.value.toFixed(1)} ({vibe.rating.count}{' '}
                            ratings)
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
            </View>

            {/* Trending Section */}
            <View className="mb-6 rounded-xl bg-violet-500 p-4 shadow-lg">
              <Text className="mb-2 text-xl font-bold text-white">
                Trending Vibes 🔥
              </Text>
              <Text className="text-base leading-relaxed text-white/80">
                See what's popular in the community right now
              </Text>
            </View>

            {/* Bottom spacing for safe area */}
            <View className="h-4" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
