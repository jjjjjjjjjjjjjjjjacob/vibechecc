/**
 * @jest-environment jsdom
 */
/// <reference lib="dom" />

import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from '@tanstack/react-router';
import { HeroSection } from '@/components/hero-section';
import { useHeroTaglineExperiment } from '@/hooks/use-hero-tagline-experiment';

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  MemoryRouter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Link: ({ children, ...props }: any) =>
    React.createElement('a', props, children),
}));

// Mock the hero tagline experiment hook
vi.mock('@/hooks/use-hero-tagline-experiment');
vi.mock('@/hooks/use-performance-tracking');

// Mock APP_NAME
vi.mock('@/utils/bindings', () => ({
  APP_NAME: 'TestApp',
}));

const mockUseHeroTaglineExperiment = useHeroTaglineExperiment as any;

const mockPerformanceHooks = {
  trackFirstInteraction: vi.fn(),
};

vi.mock('@/hooks/use-performance-tracking', () => ({
  useTimeToInteractive: vi.fn(() => mockPerformanceHooks),
  usePlaceholderTracking: vi.fn(() => ({
    visibilityRef: vi.fn(),
    trackInteraction: vi.fn(),
    isVisible: false,
    hasInteracted: false,
  })),
}));

const defaultMockExperiment = {
  variant: {
    id: 'control',
    headline: "we're vibing here",
    description:
      "welcome to vibechecc, where you can discover, share, and rate vibes because that's a thing you can do",
    cta: {
      primary: 'create vibe',
      secondary: 'discover vibes',
    },
  },
  variantId: 'control',
  trackTaglineView: vi.fn(),
  trackCtaClick: vi.fn(),
  trackSignupConversion: vi.fn(),
  trackVibeCreationConversion: vi.fn(),
  trackDiscoveryConversion: vi.fn(),
  experimentKey: 'hero_tagline_experiment',
};

function renderWithRouter(component: React.ReactElement) {
  return render(<MemoryRouter>{component}</MemoryRouter>);
}

describe('HeroSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseHeroTaglineExperiment.mockReturnValue(defaultMockExperiment);
  });

  it('renders with control variant by default', () => {
    renderWithRouter(
      <HeroSection
        isAuthenticated={false}
        isClerkLoaded={true}
        clerkTimedOut={false}
        hasMounted={true}
      />
    );

    expect(screen.getByText("we're vibing here")).toBeInTheDocument();
    expect(screen.getByText(/welcome to TestApp/)).toBeInTheDocument();
  });

  it('renders different variant when experiment returns different variant', () => {
    mockUseHeroTaglineExperiment.mockReturnValue({
      ...defaultMockExperiment,
      variant: {
        id: 'emotional',
        headline: 'share your energy',
        description:
          'connect with others through authentic experiences and discover what moves you',
        cta: {
          primary: 'share your vibe',
          secondary: 'explore vibes',
        },
      },
      variantId: 'emotional',
    });

    renderWithRouter(
      <HeroSection
        isAuthenticated={false}
        isClerkLoaded={true}
        clerkTimedOut={false}
        hasMounted={true}
      />
    );

    expect(screen.getByText('share your energy')).toBeInTheDocument();
    expect(
      screen.getByText(/connect with others through authentic experiences/)
    ).toBeInTheDocument();
  });

  it('shows skeleton when Clerk is not loaded', () => {
    renderWithRouter(
      <HeroSection
        isAuthenticated={false}
        isClerkLoaded={false}
        clerkTimedOut={false}
        hasMounted={true}
      />
    );

    // Should show skeleton (tested by checking for specific skeleton structure)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows authenticated user CTAs when user is signed in', () => {
    renderWithRouter(
      <HeroSection
        isAuthenticated={true}
        isClerkLoaded={true}
        clerkTimedOut={false}
        hasMounted={true}
      />
    );

    expect(screen.getByText('create vibe')).toBeInTheDocument();
    expect(screen.getByText('discover vibes')).toBeInTheDocument();
  });

  it('shows sign-up CTA when user is not authenticated', () => {
    renderWithRouter(
      <HeroSection
        isAuthenticated={false}
        isClerkLoaded={true}
        clerkTimedOut={false}
        hasMounted={true}
      />
    );

    expect(screen.getByText('sign up')).toBeInTheDocument();
    expect(screen.getByText('discover vibes')).toBeInTheDocument();
  });

  it('tracks tagline view when component mounts', () => {
    renderWithRouter(
      <HeroSection
        isAuthenticated={false}
        isClerkLoaded={true}
        clerkTimedOut={false}
        hasMounted={true}
      />
    );

    expect(defaultMockExperiment.trackTaglineView).toHaveBeenCalled();
  });

  it('tracks CTA clicks with proper parameters', () => {
    renderWithRouter(
      <HeroSection
        isAuthenticated={true}
        isClerkLoaded={true}
        clerkTimedOut={false}
        hasMounted={true}
      />
    );

    const createButton = screen.getByText('create vibe');
    fireEvent.click(createButton);

    expect(defaultMockExperiment.trackCtaClick).toHaveBeenCalledWith(
      'primary',
      'create vibe'
    );
    expect(
      defaultMockExperiment.trackVibeCreationConversion
    ).toHaveBeenCalled();
    expect(mockPerformanceHooks.trackFirstInteraction).toHaveBeenCalledWith(
      'cta_click',
      'create'
    );
  });

  it('shows fallback UI when Clerk times out', () => {
    renderWithRouter(
      <HeroSection
        isAuthenticated={false}
        isClerkLoaded={false}
        clerkTimedOut={true}
        hasMounted={true}
      />
    );

    expect(
      screen.getByText('authentication service is currently unavailable')
    ).toBeInTheDocument();
    expect(screen.getByText('browse vibes anyway')).toBeInTheDocument();
  });

  it('applies correct data attributes for tracking', () => {
    const { container } = renderWithRouter(
      <HeroSection
        isAuthenticated={false}
        isClerkLoaded={true}
        clerkTimedOut={false}
        hasMounted={true}
      />
    );

    const heroElement = container.querySelector('[data-has-mounted="true"]');
    expect(heroElement).toBeInTheDocument();
    expect(heroElement).toHaveAttribute('data-variant', 'control');
  });
});
