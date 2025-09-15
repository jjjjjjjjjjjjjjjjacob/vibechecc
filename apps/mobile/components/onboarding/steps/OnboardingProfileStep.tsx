import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '@clerk/clerk-expo';
import { Button } from '@/components/ui/Button';

interface OnboardingProfileStepProps {
  onNext: () => void;
  onUpdateProfile: (data: {
    username?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  }) => Promise<void>;
  onImageFileChange: (file: any) => void;
  isLoading: boolean;
}

export function OnboardingProfileStep({
  onNext,
  onUpdateProfile,
  onImageFileChange,
  isLoading,
}: OnboardingProfileStepProps) {
  const { user } = useUser();
  const [username, setUsername] = React.useState('');
  const [firstName, setFirstName] = React.useState(user?.firstName || '');
  const [lastName, setLastName] = React.useState(user?.lastName || '');
  const [imageUri, setImageUri] = React.useState(user?.imageUrl || '');

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Sorry, we need camera roll permissions to upload photos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      onImageFileChange(result.assets[0]);
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Sorry, we need camera permissions to take photos.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      onImageFileChange(result.assets[0]);
    }
  };

  const handleContinue = async () => {
    await onUpdateProfile({
      username: username.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      imageUrl: imageUri,
    });
    onNext();
  };

  const isValid = firstName.trim().length > 0;

  return (
    <View className="flex-1 px-6">
      {/* Profile Image */}
      <View className="mb-8 items-center">
        <View className="relative">
          <View className="bg-muted h-24 w-24 items-center justify-center overflow-hidden rounded-full">
            {imageUri ? (
              <Image source={{ uri: imageUri }} className="h-full w-full" />
            ) : (
              <Ionicons name="person" size={40} color="#666" />
            )}
          </View>

          <TouchableOpacity
            onPress={handleImagePicker}
            className="bg-theme-primary border-background absolute -bottom-2 -right-2 h-8 w-8 items-center justify-center rounded-full border-2"
          >
            <Ionicons name="camera" size={16} color="white" />
          </TouchableOpacity>
        </View>

        <View className="mt-4 flex-row space-x-2">
          <TouchableOpacity
            onPress={handleImagePicker}
            className="bg-muted rounded-lg px-4 py-2"
          >
            <Text className="text-foreground text-sm">Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCamera}
            className="bg-muted rounded-lg px-4 py-2"
          >
            <Text className="text-foreground text-sm">Camera</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Form Fields */}
      <View className="mb-8 space-y-4">
        {/* First Name */}
        <View>
          <Text className="text-foreground mb-2 text-sm font-medium">
            First Name *
          </Text>
          <TextInput
            className="bg-muted text-foreground rounded-lg p-4"
            placeholder="Enter your first name"
            placeholderTextColor="#666"
            value={firstName}
            onChangeText={setFirstName}
            autoComplete="given-name"
          />
        </View>

        {/* Last Name */}
        <View>
          <Text className="text-foreground mb-2 text-sm font-medium">
            Last Name
          </Text>
          <TextInput
            className="bg-muted text-foreground rounded-lg p-4"
            placeholder="Enter your last name"
            placeholderTextColor="#666"
            value={lastName}
            onChangeText={setLastName}
            autoComplete="family-name"
          />
        </View>

        {/* Username */}
        <View>
          <Text className="text-foreground mb-2 text-sm font-medium">
            Username
          </Text>
          <View className="relative">
            <TextInput
              className="bg-muted text-foreground rounded-lg p-4 pl-8"
              placeholder="Choose a unique username"
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username"
            />
            <Text className="text-muted-foreground absolute left-4 top-4">
              @
            </Text>
          </View>
          <Text className="text-muted-foreground mt-1 text-xs">
            This will be your unique identifier on vibechecc
          </Text>
        </View>
      </View>

      {/* Continue Button */}
      <View className="mt-auto pb-6">
        <Button
          title={isLoading ? 'Updating...' : 'Continue'}
          onPress={handleContinue}
          disabled={!isValid || isLoading}
          loading={isLoading}
          className="w-full"
        />
      </View>
    </View>
  );
}
