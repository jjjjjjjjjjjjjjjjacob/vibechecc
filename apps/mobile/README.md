# @vibechecc/mobile

React Native mobile app for vibechecc built with Expo SDK 54 + React Native 0.81, featuring complete feature parity with the web application.

## Features

- **🔐 Authentication**: Clerk integration with social login support
- **📱 Native Navigation**: Expo Router with tab and stack navigation
- **🎨 Consistent UI**: NativeWind v5 with Tailwind v4 and shared design system
- **🔄 Real-time Data**: Convex integration with React Query
- **🎯 Onboarding**: 6-step guided setup flow
- **💫 Animations**: Smooth transitions and micro-interactions
- **📦 Shared Logic**: 95% code reuse via @vibechecc/app-core
- **🌙 Theme Support**: Dynamic theming with user preferences

## Prerequisites

- Node.js 18+ and Bun
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (macOS) or Android Studio (for Android development)
- Physical device for testing (recommended)

## Setup

1. **Install dependencies**
   ```bash
   cd apps/mobile
   bun install
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env.local

   # Add your keys
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key_here
   EXPO_PUBLIC_CONVEX_URL=your_convex_url_here
   ```

3. **Start Development Server**
   ```bash
   # Start Expo dev server
   bun run dev

   # Or use Nx
   bun nx dev @vibechecc/mobile
   ```

4. **Run on Device/Simulator**
   ```bash
   # iOS Simulator
   bun run dev:ios

   # Android Emulator
   bun run dev:android

   # Scan QR code with Expo Go app on physical device
   ```

## Development Commands

```bash
# Development
bun run dev              # Start Expo dev server
bun run dev:ios         # Start with iOS simulator
bun run dev:android     # Start with Android emulator

# Building
bun run build:ios       # Build iOS app
bun run build:android   # Build Android app
bun run build:preview   # Build preview (no publish)

# Quality
bun run typecheck       # TypeScript check
bun run lint            # ESLint
bun run lint:fix        # ESLint with fixes

# Cleanup
bun run clean           # Remove .expo and node_modules
```

## Architecture

### Project Structure
```
apps/mobile/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   ├── (auth)/            # Authentication screens
│   ├── onboarding.tsx     # Onboarding flow
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   └── onboarding/       # Onboarding flow components
├── utils/                # Mobile-specific utilities
├── styles/               # NativeWind global styles
└── assets/              # Images, fonts, etc.
```

### Navigation Structure
- **Root Stack**: Authentication flow and main app
- **Tab Navigation**: Home, Discover, Create, Community, Profile
- **Auth Stack**: Sign In, Sign Up, verification flows
- **Modal Stack**: Overlays and popups

### Shared Packages Integration
- `@vibechecc/app-core`: Hooks, stores, and business logic
- `@vibechecc/ui-primitives`: Cross-platform UI components
- `@vibechecc/types`: Shared TypeScript interfaces
- `@vibechecc/utils`: Utility functions and constants
- `@vibechecc/convex`: Backend API functions

## Key Features

### Authentication Flow
- **Clerk Integration**: Email/password + social providers
- **Token Caching**: Secure storage with Expo SecureStore
- **Auto-redirect**: Context-aware navigation
- **Error Handling**: User-friendly error states

### Onboarding Experience
1. **Welcome**: App introduction with feature highlights
2. **Profile Setup**: Username, name, avatar with camera/gallery
3. **Theme Selection**: Color preferences with live preview
4. **Interests**: Tag selection for content personalization
5. **Discovery Tutorial**: How to interact with vibes
6. **Completion**: Welcome celebration with next steps

### Design System
- **NativeWind v5**: Latest version with Tailwind v4 for React Native
- **Semantic Colors**: Consistent with web app theme
- **Responsive Design**: Optimized for all screen sizes
- **Dark Mode**: Automatic system preference detection
- **Animations**: Hardware-accelerated transitions

## Testing

```bash
# Type checking
bun run typecheck

# Linting
bun run lint

# Manual testing on simulators
bun run dev:ios    # iOS Simulator
bun run dev:android # Android Emulator

# Physical device testing
bun run dev        # Scan QR with Expo Go
```

## Platform-Specific Notes

### iOS
- Requires Xcode for iOS Simulator
- Physical device testing requires Apple Developer account
- Push notifications require iOS-specific setup

### Android
- Requires Android Studio and SDK
- USB debugging for physical devices
- Google Play services for some features

## Performance Optimization

- **Image Optimization**: Expo Image with caching
- **Bundle Splitting**: Lazy loading for large components
- **Memory Management**: Proper cleanup of subscriptions
- **Network Efficiency**: React Query with smart caching
- **Animation Performance**: Hardware acceleration where possible

## Troubleshooting

### Common Issues

1. **Metro bundler errors**
   ```bash
   bun run clean
   bun install
   bun run dev
   ```

2. **iOS Simulator issues**
   ```bash
   # Reset iOS Simulator
   xcrun simctl erase all
   ```

3. **Android emulator problems**
   ```bash
   # Cold boot emulator
   # Wipe data in Android Studio AVD Manager
   ```

4. **Authentication issues**
   - Verify Clerk publishable key in .env.local
   - Check network connectivity
   - Clear app data/reinstall

### Development Tips

- Use physical devices for testing camera/sensors
- Enable Fast Refresh for better DX
- Use Flipper for debugging (React Native apps)
- Test on multiple screen sizes
- Monitor performance with React DevTools

## Contributing

1. Follow existing code patterns and conventions
2. Use semantic commit messages
3. Test on both iOS and Android before PR
4. Update documentation for new features
5. Ensure type safety with TypeScript

## Related Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Clerk React Native SDK](https://clerk.com/docs/references/react-native/overview)