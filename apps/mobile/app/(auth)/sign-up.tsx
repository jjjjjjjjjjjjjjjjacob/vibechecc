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
import { useSignUp, useOAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: 'oauth_google',
  });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({
    strategy: 'oauth_apple',
  });
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');
    try {
      await signUp.create({
        emailAddress,
        password,
        firstName,
        lastName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(
        err?.errors?.[0]?.message ||
          'Failed to create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleSignUp = async () => {
    try {
      const { createdSessionId, setActive } = await startGoogleOAuth();

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace('/onboarding');
      }
    } catch (err: any) {
      console.error('Google sign up error:', err);
      setError('Failed to sign up with Google. Please try again.');
    }
  };

  const onAppleSignUp = async () => {
    try {
      const { createdSessionId, setActive } = await startAppleOAuth();

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace('/onboarding');
      }
    } catch (err: any) {
      console.error('Apple sign up error:', err);
      setError('Failed to sign up with Apple. Please try again.');
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace('/onboarding');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(
        err?.errors?.[0]?.message ||
          'Invalid verification code. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <LinearGradient
        colors={['#f97316', '#e11d48']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          <StatusBar style="light" />

          {/* Back Button */}
          <View className="px-6 pt-2">
            <TouchableOpacity
              onPress={() => setPendingVerification(false)}
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
              <View className="flex-1 justify-center px-6 pb-6">
                {/* Header */}
                <View className="mb-8 items-center">
                  <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-white/20">
                    <Ionicons name="mail" size={32} color="white" />
                  </View>
                  <Text className="mb-2 text-center text-3xl font-bold text-white">
                    Check your email
                  </Text>
                  <Text className="text-center text-white/80">
                    We sent a verification code to {emailAddress}
                  </Text>
                </View>

                {/* Error Message */}
                {error ? (
                  <View className="mb-4 rounded-lg border border-red-500/30 bg-red-500/20 p-3">
                    <Text className="text-center text-sm text-red-100">
                      {error}
                    </Text>
                  </View>
                ) : null}

                {/* Verification Form */}
                <Card
                  className="mb-6 border-white/20 bg-white/10"
                >
                  <CardContent className="space-y-4 p-6">
                    <View>
                      <Text className="mb-2 text-sm font-medium text-white">
                        Verification Code
                      </Text>
                      <View className="rounded-xl border border-white/30 bg-white/20">
                        <TextInput
                          className="p-4 text-center text-lg tracking-widest text-white"
                          placeholder="Enter 6-digit code"
                          placeholderTextColor="rgba(255, 255, 255, 0.6)"
                          value={code}
                          onChangeText={(text) => {
                            setCode(text);
                            setError('');
                          }}
                          keyboardType="number-pad"
                          maxLength={6}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={onPressVerify}
                      disabled={isLoading || code.length !== 6}
                      className={cn(
                        'mobile-touch-target mt-6 items-center rounded-xl p-4',
                        isLoading || code.length !== 6
                          ? 'bg-white/20'
                          : 'bg-white shadow-lg'
                      )}
                      activeOpacity={0.9}
                    >
                      <Text
                        className={cn(
                          'text-lg font-bold',
                          isLoading || code.length !== 6
                            ? 'text-white/50'
                            : 'text-orange-600'
                        )}
                      >
                        {isLoading ? 'Verifying...' : 'Verify Email'}
                      </Text>
                    </TouchableOpacity>
                  </CardContent>
                </Card>

                <TouchableOpacity className="items-center" activeOpacity={0.7}>
                  <Text className="font-medium text-white/90">
                    Didn't receive the code? Resend
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#f97316', '#e11d48']}
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
                  <Text className="text-2xl font-bold text-white">✨</Text>
                </View>
                <Text className="mb-2 text-3xl font-bold text-white">
                  Join vibechecc
                </Text>
                <Text className="text-center text-white/80">
                  Create an account to start sharing your vibes
                </Text>
              </View>

              {/* Social Sign Up First */}
              <View
                className="mb-6 space-y-3"
              >
                <TouchableOpacity
                  onPress={onGoogleSignUp}
                  className="mobile-touch-target flex-row items-center justify-center rounded-2xl bg-white p-4 shadow-lg"
                  activeOpacity={0.9}
                >
                  <Ionicons name="logo-google" size={20} color="#4285F4" />
                  <Text className="ml-3 text-lg font-semibold text-gray-800">
                    Continue with Google
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onAppleSignUp}
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
              <View
                className="mb-6 flex-row items-center"
              >
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
              <Card
                className="border-white/20 bg-white/10"
              >
                <CardContent className="space-y-4 p-6">
                  {/* Name Inputs */}
                  <View className="flex-row space-x-3">
                    <View className="flex-1">
                      <Text className="mb-2 text-sm font-medium text-white">
                        First Name
                      </Text>
                      <View className="rounded-xl border border-white/30 bg-white/20">
                        <TextInput
                          className="p-4 text-base text-white"
                          placeholder="First name"
                          placeholderTextColor="rgba(255, 255, 255, 0.6)"
                          value={firstName}
                          onChangeText={(text) => {
                            setFirstName(text);
                            setError('');
                          }}
                          autoComplete="given-name"
                        />
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="mb-2 text-sm font-medium text-white">
                        Last Name
                      </Text>
                      <View className="rounded-xl border border-white/30 bg-white/20">
                        <TextInput
                          className="p-4 text-base text-white"
                          placeholder="Last name"
                          placeholderTextColor="rgba(255, 255, 255, 0.6)"
                          value={lastName}
                          onChangeText={(text) => {
                            setLastName(text);
                            setError('');
                          }}
                          autoComplete="family-name"
                        />
                      </View>
                    </View>
                  </View>

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
                        placeholder="Create a password"
                        placeholderTextColor="rgba(255, 255, 255, 0.6)"
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          setError('');
                        }}
                        secureTextEntry={!showPassword}
                        autoComplete="new-password"
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
                    <Text className="mt-1 text-xs text-white/60">
                      Must be at least 8 characters long
                    </Text>
                  </View>

                  {/* Sign Up Button */}
                  <TouchableOpacity
                    onPress={onSignUpPress}
                    disabled={
                      isLoading || !emailAddress || !password || !firstName
                    }
                    className={cn(
                      'mobile-touch-target mt-6 items-center rounded-xl p-4',
                      isLoading || !emailAddress || !password || !firstName
                        ? 'bg-white/20'
                        : 'bg-white shadow-lg'
                    )}
                    activeOpacity={0.9}
                  >
                    <Text
                      className={cn(
                        'text-lg font-bold',
                        isLoading || !emailAddress || !password || !firstName
                          ? 'text-white/50'
                          : 'text-orange-600'
                      )}
                    >
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Text>
                  </TouchableOpacity>
                </CardContent>
              </Card>

              {/* Terms */}
              <Text
                className="mb-6 text-center text-xs text-white/60"
              >
                By creating an account, you agree to our{' '}
                <Text className="font-medium text-white">Terms of Service</Text>{' '}
                and{' '}
                <Text className="font-medium text-white">Privacy Policy</Text>
              </Text>

              {/* Sign In Link */}
              <View
                className="flex-row items-center justify-center"
              >
                <Text className="text-white/80">Already have an account?</Text>
                <Link href="/(auth)/sign-in" asChild>
                  <TouchableOpacity className="ml-1" activeOpacity={0.7}>
                    <Text className="font-bold text-white">Sign in</Text>
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
