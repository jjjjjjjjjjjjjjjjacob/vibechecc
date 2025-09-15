import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CreateScreen() {
  const router = useRouter();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  const handleImagePicker = () => {
    // TODO: Implement image picker
    console.log('Open image picker');
  };

  const handleCamera = () => {
    // TODO: Implement camera
    console.log('Open camera');
  };

  const handleSubmit = () => {
    // TODO: Implement vibe creation
    console.log('Create vibe:', { title, description, selectedImage });
  };

  return (
    <SafeAreaView className="bg-background flex-1">
      <StatusBar style="auto" />

      {/* Header */}
      <View className="border-border flex-row items-center justify-between border-b px-4 py-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text className="text-foreground text-lg font-semibold">
          Create Vibe
        </Text>
        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-primary rounded-lg px-4 py-2"
          disabled={!title.trim()}
        >
          <Text className="text-primary-foreground font-medium">Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        <View className="space-y-4 p-4">
          {/* Title Input */}
          <View>
            <Text className="text-foreground mb-2 text-base font-medium">
              What's your vibe?
            </Text>
            <TextInput
              className="bg-muted text-foreground rounded-lg p-3 text-lg"
              placeholder="Give your vibe a catchy title..."
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
              multiline
              maxLength={100}
            />
            <Text className="text-muted-foreground mt-1 text-right text-sm">
              {title.length}/100
            </Text>
          </View>

          {/* Description Input */}
          <View>
            <Text className="text-foreground mb-2 text-base font-medium">
              Describe your vibe
            </Text>
            <TextInput
              className="bg-muted text-foreground min-h-[120px] rounded-lg p-3"
              placeholder="Share more details about your experience..."
              placeholderTextColor="#666"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
            <Text className="text-muted-foreground mt-1 text-right text-sm">
              {description.length}/500
            </Text>
          </View>

          {/* Image Section */}
          <View>
            <Text className="text-foreground mb-2 text-base font-medium">
              Add a photo (optional)
            </Text>
            {selectedImage ? (
              <View className="relative">
                <Image
                  source={{ uri: selectedImage }}
                  className="h-48 w-full rounded-lg"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setSelectedImage(null)}
                  className="bg-destructive absolute right-2 top-2 rounded-full p-1"
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  onPress={handleImagePicker}
                  className="bg-muted flex-1 items-center rounded-lg p-4"
                >
                  <Ionicons name="image" size={32} color="#666" />
                  <Text className="text-muted-foreground mt-2">
                    Choose Photo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCamera}
                  className="bg-muted flex-1 items-center rounded-lg p-4"
                >
                  <Ionicons name="camera" size={32} color="#666" />
                  <Text className="text-muted-foreground mt-2">Take Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Tags Section */}
          <View>
            <Text className="text-foreground mb-2 text-base font-medium">
              Add tags
            </Text>
            <View className="bg-muted rounded-lg p-3">
              <Text className="text-muted-foreground">
                Coming soon: Add tags to help others discover your vibe
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
