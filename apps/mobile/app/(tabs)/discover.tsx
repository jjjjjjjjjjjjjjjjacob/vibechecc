import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <SafeAreaView className="bg-background flex-1">
      <StatusBar style="auto" />

      {/* Header */}
      <View className="border-border border-b px-4 py-2">
        <Text className="text-foreground mb-4 text-2xl font-bold">
          Discover
        </Text>

        {/* Search Bar */}
        <View className="bg-muted flex-row items-center rounded-lg px-3 py-2">
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            className="text-foreground ml-2 flex-1"
            placeholder="Search vibes, users, tags..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Featured Collections */}
          <View className="mb-6">
            <Text className="text-foreground mb-3 text-lg font-semibold">
              Featured Collections
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-3">
                {[
                  '🔥 Hot',
                  '💯 Perfect',
                  '😍 Love',
                  '🌟 Amazing',
                  '💪 Motivating',
                ].map((category) => (
                  <TouchableOpacity
                    key={category}
                    className="bg-card border-border min-w-[120px] items-center rounded-lg border p-4"
                  >
                    <Text className="text-card-foreground font-medium">
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Trending Tags */}
          <View className="mb-6">
            <Text className="text-foreground mb-3 text-lg font-semibold">
              Trending Tags
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                '#lifestyle',
                '#motivation',
                '#food',
                '#travel',
                '#music',
                '#art',
              ].map((tag) => (
                <TouchableOpacity
                  key={tag}
                  className="bg-muted rounded-full px-3 py-1"
                >
                  <Text className="text-muted-foreground text-sm">{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Top Creators */}
          <View className="mb-6">
            <Text className="text-foreground mb-3 text-lg font-semibold">
              Top Creators
            </Text>
            <View className="bg-card border-border rounded-lg border p-4">
              <Text className="text-muted-foreground text-center">
                Coming soon: Discover amazing creators in the community
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
