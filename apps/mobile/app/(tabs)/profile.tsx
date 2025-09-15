import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  if (!isSignedIn) {
    return (
      <SafeAreaView className="bg-background flex-1">
        <StatusBar style="auto" />
        <View className="flex-1 items-center justify-center p-4">
          <MaterialIcons name="person" size={80} color="#666" />
          <Text className="text-foreground mb-4 mt-4 text-xl font-semibold">
            Sign in to view your profile
          </Text>
          <TouchableOpacity
            className="bg-primary rounded-lg px-6 py-3"
            onPress={() => router.push('/sign-in')}
          >
            <Text className="text-primary-foreground font-medium">Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSignOut = () => {
    signOut();
  };

  return (
    <SafeAreaView className="bg-background flex-1">
      <StatusBar style="auto" />

      {/* Header */}
      <View className="border-border flex-row items-center justify-between border-b px-4 py-3">
        <Text className="text-foreground text-2xl font-bold">Profile</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Ionicons name="settings" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        <View className="space-y-6 p-4">
          {/* Profile Header */}
          <View className="bg-card border-border items-center rounded-lg border p-6">
            <View className="relative mb-4">
              <Image
                source={{
                  uri:
                    user?.imageUrl ||
                    'https://via.placeholder.com/100x100?text=👤',
                }}
                className="h-24 w-24 rounded-full"
              />
              <TouchableOpacity className="bg-primary absolute -bottom-1 -right-1 rounded-full p-2">
                <Ionicons name="camera" size={16} color="white" />
              </TouchableOpacity>
            </View>

            <Text className="text-card-foreground mb-1 text-xl font-bold">
              {user?.fullName || 'Anonymous User'}
            </Text>
            <Text className="text-muted-foreground mb-4">
              @{user?.username || 'username'}
            </Text>

            <View className="flex-row space-x-8">
              <View className="items-center">
                <Text className="text-card-foreground text-lg font-bold">
                  0
                </Text>
                <Text className="text-muted-foreground text-sm">Vibes</Text>
              </View>
              <View className="items-center">
                <Text className="text-card-foreground text-lg font-bold">
                  0
                </Text>
                <Text className="text-muted-foreground text-sm">Reviews</Text>
              </View>
              <View className="items-center">
                <Text className="text-card-foreground text-lg font-bold">
                  0
                </Text>
                <Text className="text-muted-foreground text-sm">Following</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="bg-card border-border rounded-lg border p-4">
            <Text className="text-card-foreground mb-3 text-lg font-semibold">
              Quick Actions
            </Text>
            <View className="space-y-3">
              <TouchableOpacity className="bg-muted flex-row items-center rounded-lg p-3">
                <Ionicons name="add-circle" size={20} color="#666" />
                <Text className="text-foreground ml-3 font-medium">
                  Create New Vibe
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#666"
                  className="ml-auto"
                />
              </TouchableOpacity>

              <TouchableOpacity className="bg-muted flex-row items-center rounded-lg p-3">
                <Ionicons name="bookmark" size={20} color="#666" />
                <Text className="text-foreground ml-3 font-medium">
                  Saved Vibes
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#666"
                  className="ml-auto"
                />
              </TouchableOpacity>

              <TouchableOpacity className="bg-muted flex-row items-center rounded-lg p-3">
                <Ionicons name="analytics" size={20} color="#666" />
                <Text className="text-foreground ml-3 font-medium">
                  Your Analytics
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#666"
                  className="ml-auto"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Achievement Progress */}
          <View className="bg-card border-border rounded-lg border p-4">
            <Text className="text-card-foreground mb-3 text-lg font-semibold">
              Your Progress
            </Text>
            <View className="space-y-3">
              <View>
                <View className="mb-1 flex-row justify-between">
                  <Text className="text-foreground text-sm">
                    Level Progress
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    0/100 XP
                  </Text>
                </View>
                <View className="bg-muted h-2 rounded-full">
                  <View
                    className="bg-theme-primary h-2 rounded-full"
                    style={{ width: '0%' }}
                  />
                </View>
              </View>

              <View className="border-border flex-row justify-between border-t py-2">
                <Text className="text-muted-foreground">Current Level</Text>
                <Text className="text-foreground font-medium">Beginner</Text>
              </View>

              <View className="flex-row justify-between py-2">
                <Text className="text-muted-foreground">Total Points</Text>
                <Text className="text-foreground font-medium">0</Text>
              </View>
            </View>
          </View>

          {/* My Vibes */}
          <View className="bg-card border-border rounded-lg border p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-card-foreground text-lg font-semibold">
                My Vibes
              </Text>
              <TouchableOpacity>
                <Text className="text-theme-primary font-medium">View All</Text>
              </TouchableOpacity>
            </View>

            <View className="items-center py-8">
              <MaterialIcons name="photo-library" size={48} color="#666" />
              <Text className="text-muted-foreground mt-2">No vibes yet</Text>
              <TouchableOpacity className="mt-3">
                <Text className="text-theme-primary font-medium">
                  Create your first vibe
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Actions */}
          <View className="bg-card border-border rounded-lg border p-4">
            <Text className="text-card-foreground mb-3 text-lg font-semibold">
              Account
            </Text>
            <View className="space-y-3">
              <TouchableOpacity className="bg-muted flex-row items-center rounded-lg p-3">
                <Ionicons name="person" size={20} color="#666" />
                <Text className="text-foreground ml-3 font-medium">
                  Edit Profile
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#666"
                  className="ml-auto"
                />
              </TouchableOpacity>

              <TouchableOpacity className="bg-muted flex-row items-center rounded-lg p-3">
                <Ionicons name="notifications" size={20} color="#666" />
                <Text className="text-foreground ml-3 font-medium">
                  Notifications
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#666"
                  className="ml-auto"
                />
              </TouchableOpacity>

              <TouchableOpacity className="bg-muted flex-row items-center rounded-lg p-3">
                <Ionicons name="shield-checkmark" size={20} color="#666" />
                <Text className="text-foreground ml-3 font-medium">
                  Privacy & Safety
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#666"
                  className="ml-auto"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSignOut}
                className="bg-destructive/10 flex-row items-center rounded-lg p-3"
              >
                <Ionicons name="log-out" size={20} color="#ef4444" />
                <Text className="text-destructive ml-3 font-medium">
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
