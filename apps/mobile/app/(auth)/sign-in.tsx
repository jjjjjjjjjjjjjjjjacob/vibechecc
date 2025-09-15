import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: 'oauth_google',
  });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({
    strategy: 'oauth_apple',
  });
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const onSignInPress = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');
    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (completeSignIn.status === 'complete') {
        await setActive({ session: completeSignIn.createdSessionId });
        router.replace('/');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(
        err?.errors?.[0]?.message || 'Failed to sign in. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startGoogleOAuth();

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace('/');
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  const onAppleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startAppleOAuth();

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace('/');
      }
    } catch (err: any) {
      console.error('Apple sign in error:', err);
      setError('Failed to sign in with Apple. Please try again.');
    }
  };

  return (
    <LinearGradient
      colors={['#e11d48', '#f97316']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <StatusBar style="light" />

        {/* Back Button */}
        <View className="px-6 pt-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View className="flex-1 px-6 pb-6">
              {/* Header */}
              <View className="mb-8 mt-6 items-center">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <Text className="text-2xl font-bold text-white">👋</Text>
                </View>
                <Text className="mb-2 text-3xl font-bold text-white">
                  Welcome back
                </Text>
                <Text className="text-center text-white/80">
                  Sign in to continue sharing your vibes
                </Text>
              </View>

              {/* Social Sign In First */}
              <View className="mb-6" style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={onGoogleSignIn}
                  className="mobile-touch-target flex-row items-center justify-center rounded-2xl bg-white p-4 shadow-lg"
                  activeOpacity={0.9}
                >
                  <Ionicons name="logo-google" size={20} color="#4285F4" />
                  <Text className="ml-3 text-lg font-semibold text-gray-800">
                    Continue with Google
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onAppleSignIn}
                  className="mobile-touch-target flex-row items-center justify-center rounded-2xl bg-black p-4 shadow-lg"
                  activeOpacity={0.9}
                >
                  <Ionicons name="logo-apple" size={20} color="white" />
                  <Text className="ml-3 text-lg font-semibold text-white">
                    Continue with Apple
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View className="mb-6 flex-row items-center">
                <View className="h-px flex-1 bg-white/30" />
                <Text className="px-4 text-sm font-medium text-white/80">
                  or continue with email
                </Text>
                <View className="h-px flex-1 bg-white/30" />
              </View>

              {/* Error Message */}
              {error ? (
                <View className="mb-4 rounded-lg border border-red-500/30 bg-red-500/20 p-3">
                  <Text className="text-center text-sm text-red-100">
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Form Card */}
              <Card className="border-white/20 bg-white/10">
                <CardContent className="p-6" style={{ gap: 16 }}>
                  {/* Email Input */}
                  <View>
                    <Text className="mb-2 text-sm font-medium text-white">
                      Email
                    </Text>
                    <View className="rounded-xl border border-white/30 bg-white/20">
                      <TextInput
                        className="p-4 text-base text-white"
                        placeholder="Enter your email"
                        placeholderTextColor="rgba(255, 255, 255, 0.6)"
                        value={emailAddress}
                        onChangeText={(text) => {
                          setEmailAddress(text);
                          setError('');
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View>
                    <Text className="mb-2 text-sm font-medium text-white">
                      Password
                    </Text>
                    <View className="flex-row items-center rounded-xl border border-white/30 bg-white/20">
                      <TextInput
                        className="flex-1 p-4 text-base text-white"
                        placeholder="Enter your password"
                        placeholderTextColor="rgba(255, 255, 255, 0.6)"
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          setError('');
                        }}
                        secureTextEntry={!showPassword}
                        autoComplete="password"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="p-4"
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color="rgba(255, 255, 255, 0.8)"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Forgot Password */}
                  <TouchableOpacity className="self-end" activeOpacity={0.7}>
                    <Text className="font-medium text-white/90">
                      Forgot password?
                    </Text>
                  </TouchableOpacity>

                  {/* Sign In Button */}
                  <TouchableOpacity
                    onPress={onSignInPress}
                    disabled={isLoading || !emailAddress || !password}
                    className={cn(
                      'mobile-touch-target mt-6 items-center rounded-xl p-4',
                      isLoading || !emailAddress || !password
                        ? 'bg-white/20'
                        : 'bg-white shadow-lg'
                    )}
                    activeOpacity={0.9}
                  >
                    <Text
                      className={cn(
                        'text-lg font-bold',
                        isLoading || !emailAddress || !password
                          ? 'text-white/50'
                          : 'text-purple-600'
                      )}
                    >
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>
                </CardContent>
              </Card>

              {/* Sign Up Link */}
              <View className="mt-6 flex-row items-center justify-center">
                <Text className="text-white/80">Don't have an account?</Text>
                <Link href="/(auth)/sign-up" asChild>
                  <TouchableOpacity className="ml-1" activeOpacity={0.7}>
                    <Text className="font-bold text-white">Sign up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
