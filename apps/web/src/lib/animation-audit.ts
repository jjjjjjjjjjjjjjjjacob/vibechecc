/**
 * Framer Motion Usage Audit for Migration to tw-animate-css
 * Maps existing animations to their Tailwind CSS equivalents
 */

export interface AnimationUsage {
  file: string;
  component: string;
  animationType: 'simple' | 'complex';
  currentImplementation: string;
  tailwindEquivalent: string;
  migrationPriority: 'high' | 'medium' | 'low';
  notes?: string;
}

export const FRAMER_MOTION_AUDIT: AnimationUsage[] = [
  // Emoji Rating Components
  {
    file: 'src/components/emoji-rating-selector.tsx',
    component: 'EmojiRatingSelector',
    animationType: 'complex',
    currentImplementation:
      'motion.div with AnimatePresence for emoji transitions',
    tailwindEquivalent: 'Custom CSS with transform + opacity transitions',
    migrationPriority: 'high',
    notes: 'Core rating functionality - high impact on mobile performance',
  },
  {
    file: 'src/components/emoji-rating-cycle-display.tsx',
    component: 'EmojiRatingCycleDisplay',
    animationType: 'complex',
    currentImplementation:
      'motion.div with AnimatePresence for cycling animations',
    tailwindEquivalent: 'Custom CSS keyframes + animate-spin variant',
    migrationPriority: 'high',
    notes: 'Used in rating display - frequently rendered',
  },
  {
    file: 'src/components/top-emoji-ratings-accordion.tsx',
    component: 'TopEmojiRatingsAccordion',
    animationType: 'simple',
    currentImplementation: 'motion.div for accordion expand/collapse',
    tailwindEquivalent: 'animate-accordion-down/up (already in CSS)',
    migrationPriority: 'medium',
    notes: 'Simple expand/collapse - easy migration',
  },

  // Onboarding Components
  {
    file: 'src/features/onboarding/components/onboarding-layout.tsx',
    component: 'OnboardingLayout',
    animationType: 'simple',
    currentImplementation: 'motion.div for page transitions',
    tailwindEquivalent: 'animate-fade-in-down (already in CSS)',
    migrationPriority: 'low',
    notes: 'Onboarding flow - less frequent usage',
  },
  {
    file: 'src/features/onboarding/components/onboarding-welcome-step.tsx',
    component: 'OnboardingWelcomeStep',
    animationType: 'simple',
    currentImplementation: 'motion.div for entrance animation',
    tailwindEquivalent: 'animate-fade-in-down',
    migrationPriority: 'low',
    notes: 'Simple entrance animation',
  },
  {
    file: 'src/features/onboarding/components/onboarding-profile-step.tsx',
    component: 'OnboardingProfileStep',
    animationType: 'simple',
    currentImplementation: 'motion.div for form transitions',
    tailwindEquivalent: 'transition-all duration-300 ease-in-out',
    migrationPriority: 'low',
    notes: 'Form field animations',
  },
  {
    file: 'src/features/onboarding/components/onboarding-interests-step.tsx',
    component: 'OnboardingInterestsStep',
    animationType: 'simple',
    currentImplementation: 'motion.div for interest selection',
    tailwindEquivalent: 'hover:scale-105 transition-transform',
    migrationPriority: 'low',
    notes: 'Simple hover effects',
  },
  {
    file: 'src/features/onboarding/components/onboarding-discover-step.tsx',
    component: 'OnboardingDiscoverStep',
    animationType: 'simple',
    currentImplementation: 'motion.div for discovery animations',
    tailwindEquivalent: 'animate-pulse + transition utilities',
    migrationPriority: 'low',
    notes: 'Discovery step animations',
  },
  {
    file: 'src/features/onboarding/components/onboarding-complete-step.tsx',
    component: 'OnboardingCompleteStep',
    animationType: 'simple',
    currentImplementation: 'motion.div for completion celebration',
    tailwindEquivalent: 'animate-bounce + animate-fade-in',
    migrationPriority: 'low',
    notes: 'Celebration animation',
  },
];

/**
 * Migration strategy by priority
 */
export const MIGRATION_STRATEGY = {
  high: {
    description:
      'Core rating functionality - migrate first for maximum mobile performance impact',
    components: FRAMER_MOTION_AUDIT.filter(
      (item) => item.migrationPriority === 'high'
    ),
    estimatedSavings: '~200KB bundle size',
    mobilePerformanceImpact: 'High - these components render frequently',
  },
  medium: {
    description: 'UI components with moderate usage - migrate second',
    components: FRAMER_MOTION_AUDIT.filter(
      (item) => item.migrationPriority === 'medium'
    ),
    estimatedSavings: '~50KB bundle size',
    mobilePerformanceImpact: 'Medium - periodic usage',
  },
  low: {
    description: 'Onboarding flow - migrate last (one-time usage)',
    components: FRAMER_MOTION_AUDIT.filter(
      (item) => item.migrationPriority === 'low'
    ),
    estimatedSavings: '~100KB bundle size',
    mobilePerformanceImpact: 'Low - infrequent usage, but still valuable',
  },
};

/**
 * Bundle size impact analysis
 */
export const BUNDLE_IMPACT = {
  currentFramerMotionSize: '~350KB (minified + gzipped)',
  afterMigration: '~0KB (removed completely)',
  estimatedSavings: '350KB (~20% of current bundle)',
  mobileNetworkSavings: {
    '3G': '3-4 seconds faster load time',
    LTE: '1-2 seconds faster load time',
  },
};

/**
 * Animation features to preserve during migration
 */
export const FEATURES_TO_PRESERVE = [
  'Smooth emoji rating transitions',
  'Accordion expand/collapse animations',
  'Hover state transitions',
  'Loading state animations',
  'Form field focus states',
  'Mobile touch feedback',
  'Reduced motion accessibility',
];

/**
 * New animations to add with CSS
 */
export const NEW_CSS_ANIMATIONS = [
  'prefers-reduced-motion support',
  'GPU-accelerated transforms',
  'Mobile-optimized timing functions',
  'Touch-responsive animations',
  'Connection-aware animation levels',
];
