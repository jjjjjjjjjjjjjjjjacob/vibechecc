/// <reference lib="dom" />
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VibeCard } from './index';
import type { Vibe } from '@vibechecc/types';

// Mock dependencies
vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(() => vi.fn()),
  useLocation: vi.fn(() => ({ pathname: '/test' })),
  useRouter: vi.fn(() => ({ navigate: vi.fn() })),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock('@clerk/tanstack-react-start', () => ({
  useUser: vi.fn(() => ({ user: null })),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

vi.mock('@/hooks/use-vibe-image-url', () => ({
  useVibeImageUrl: vi.fn(() => ({ data: null, isLoading: false })),
}));

vi.mock('@/lib/track-events', () => ({
  trackEvents: {
    vibeViewed: vi.fn(),
    vibeCardExpanded: vi.fn(),
  },
}));

vi.mock('@/queries', () => ({
  useTopEmojiRatings: vi.fn(() => ({ data: [], isLoading: false })),
  useMostInteractedEmoji: vi.fn(() => ({ data: null, isLoading: false })),
  useCreateEmojiRatingMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useEmojiMetadata: vi.fn(() => ({ data: [] })),
}));

vi.mock('./layouts/default-layout', () => ({
  DefaultLayout: ({ vibe }: any) => (
    <div data-testid="default-layout">{vibe.title}</div>
  ),
}));

vi.mock('./layouts/search-result-layout', () => ({
  SearchResultLayout: ({ vibe }: any) => (
    <div data-testid="search-result-layout">{vibe.title}</div>
  ),
}));

vi.mock('./layouts/list-layout', () => ({
  ListLayout: ({ vibe }: any) => (
    <div data-testid="list-layout">{vibe.title}</div>
  ),
}));

vi.mock('./layouts/mobile-story-layout', () => ({
  MobileStoryLayout: ({ vibe }: any) => (
    <div data-testid="mobile-story-layout">{vibe.title}</div>
  ),
}));

vi.mock('./layouts/mobile-square-layout', () => ({
  MobileSquareLayout: ({ vibe }: any) => (
    <div data-testid="mobile-square-layout">{vibe.title}</div>
  ),
}));

const mockVibe: Vibe = {
  id: '123',
  title: 'Test Vibe',
  description: 'Test description',
  image: null,
  imageStorageId: null,
  category: 'test',
  tags: ['test'],
  createdBy: {
    id: 'user1',
    username: 'testuser',
    full_name: 'Test User',
    first_name: 'Test',
    last_name: 'User',
    image_url: null,
    profile_image_url: null,
    externalId: 'ext1',
  },
  _id: '123' as any,
  _creationTime: Date.now(),
  userId: 'user1',
  isPublic: true,
  totalBoosts: 0,
  totalDampens: 0,
  boostScore: 0,
  shareCount: 0,
};

describe('VibeCard', () => {
  it('renders default layout by default', () => {
    render(<VibeCard vibe={mockVibe} />);
    expect(screen.getByTestId('default-layout')).toBeInTheDocument();
    expect(screen.getByText('Test Vibe')).toBeInTheDocument();
  });

  it('renders search result layout when variant is search-result', () => {
    render(<VibeCard vibe={mockVibe} variant="search-result" />);
    expect(screen.getByTestId('search-result-layout')).toBeInTheDocument();
  });

  it('renders list layout when variant is list', () => {
    render(<VibeCard vibe={mockVibe} variant="list" />);
    expect(screen.getByTestId('list-layout')).toBeInTheDocument();
  });

  it('renders mobile story layout when variant is mobile-story', () => {
    render(<VibeCard vibe={mockVibe} variant="mobile-story" />);
    expect(screen.getByTestId('mobile-story-layout')).toBeInTheDocument();
  });

  it('renders mobile square layout when variant is mobile-square', () => {
    render(<VibeCard vibe={mockVibe} variant="mobile-square" />);
    expect(screen.getByTestId('mobile-square-layout')).toBeInTheDocument();
  });

  it('handles legacy compact prop', () => {
    render(<VibeCard vibe={mockVibe} compact />);
    // Should render default layout with compact variant
    expect(screen.getByTestId('default-layout')).toBeInTheDocument();
  });

  it('handles legacy layout prop', () => {
    render(<VibeCard vibe={mockVibe} layout="masonry" />);
    // Should render default layout with masonry variant
    expect(screen.getByTestId('default-layout')).toBeInTheDocument();
  });

  it('returns null when no vibe is provided', () => {
    const { container } = render(<VibeCard />);
    expect(container.firstChild).toBeNull();
  });

  it('renders loading state', () => {
    render(<VibeCard vibe={mockVibe} loading />);
    // Should still render the layout but in loading mode
    expect(screen.getByTestId('default-layout')).toBeInTheDocument();
  });
});
