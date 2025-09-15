import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export default function CommunityScreen() {
  return (
    <SafeAreaView className="bg-background flex-1">
      <StatusBar style="auto" />

      {/* Header */}
      <View className="border-border border-b px-4 py-3">
        <Text className="text-foreground text-2xl font-bold">Community</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="space-y-6 p-4">
          {/* Community Stats */}
          <View className="bg-card border-border rounded-lg border p-4">
            <Text className="text-card-foreground mb-3 text-lg font-semibold">
              Community Stats
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-theme-primary text-2xl font-bold">
                  2.1K
                </Text>
                <Text className="text-muted-foreground text-sm">Members</Text>
              </View>
              <View className="items-center">
                <Text className="text-theme-secondary text-2xl font-bold">
                  847
                </Text>
                <Text className="text-muted-foreground text-sm">Vibes</Text>
              </View>
              <View className="items-center">
                <Text className="text-theme-accent text-2xl font-bold">
                  5.2K
                </Text>
                <Text className="text-muted-foreground text-sm">Reviews</Text>
              </View>
            </View>
          </View>

          {/* Leaderboard */}
          <View className="bg-card border-border rounded-lg border p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-card-foreground text-lg font-semibold">
                Top Contributors
              </Text>
              <TouchableOpacity>
                <Text className="text-theme-primary font-medium">View All</Text>
              </TouchableOpacity>
            </View>

            {[
              { rank: 1, name: 'Alex Chen', points: '2,847', icon: '🏆' },
              { rank: 2, name: 'Sarah Kim', points: '2,156', icon: '🥈' },
              { rank: 3, name: 'Mike Johnson', points: '1,923', icon: '🥉' },
            ].map((user) => (
              <View key={user.rank} className="flex-row items-center py-2">
                <Text className="mr-3 text-xl">{user.icon}</Text>
                <View className="flex-1">
                  <Text className="text-card-foreground font-medium">
                    {user.name}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    {user.points} points
                  </Text>
                </View>
                <Text className="text-muted-foreground">#{user.rank}</Text>
              </View>
            ))}
          </View>

          {/* Recent Activity */}
          <View className="bg-card border-border rounded-lg border p-4">
            <Text className="text-card-foreground mb-3 text-lg font-semibold">
              Recent Activity
            </Text>

            {[
              {
                user: 'Emma Davis',
                action: 'shared a new vibe',
                time: '2m ago',
                icon: 'add-circle',
              },
              {
                user: 'Tom Wilson',
                action: 'gave a 5⭐ review',
                time: '5m ago',
                icon: 'star',
              },
              {
                user: 'Lisa Park',
                action: 'joined the community',
                time: '12m ago',
                icon: 'person-add',
              },
              {
                user: 'Jake Miller',
                action: 'shared a new vibe',
                time: '18m ago',
                icon: 'add-circle',
              },
            ].map((activity, index) => (
              <View key={index} className="flex-row items-center py-2">
                <View className="bg-muted mr-3 rounded-full p-2">
                  <Ionicons
                    name={activity.icon as any}
                    size={16}
                    color="#666"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-card-foreground">
                    <Text className="font-medium">{activity.user}</Text>{' '}
                    {activity.action}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    {activity.time}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Featured Challenges */}
          <View className="bg-card border-border rounded-lg border p-4">
            <Text className="text-card-foreground mb-3 text-lg font-semibold">
              Community Challenges
            </Text>
            <View className="from-theme-primary/10 to-theme-secondary/10 rounded-lg bg-gradient-to-r p-3">
              <View className="mb-2 flex-row items-center">
                <MaterialCommunityIcons
                  name="trophy"
                  size={20}
                  color="#f59e0b"
                />
                <Text className="text-card-foreground ml-2 font-medium">
                  Weekend Vibes Challenge
                </Text>
              </View>
              <Text className="text-muted-foreground mb-2 text-sm">
                Share your perfect weekend moment and win awesome prizes!
              </Text>
              <Text className="text-theme-primary text-sm font-medium">
                Ends in 3 days • 47 participants
              </Text>
            </View>
          </View>

          {/* Join Community Actions */}
          <View className="bg-card border-border rounded-lg border p-4">
            <Text className="text-card-foreground mb-3 text-lg font-semibold">
              Get Involved
            </Text>
            <View className="space-y-3">
              <TouchableOpacity className="bg-theme-primary items-center rounded-lg p-3">
                <Text className="font-medium text-white">
                  Share Your First Vibe
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-muted items-center rounded-lg p-3">
                <Text className="text-foreground font-medium">
                  Explore Trending Vibes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
