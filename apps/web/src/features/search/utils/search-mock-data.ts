import type {
  SearchResponse,
  VibeSearchResult,
  UserSearchResult,
  TagSearchResult,
  ActionSearchResult,
  SearchSuggestion,
} from '@viberatr/types';

export const mockVibeResults: VibeSearchResult[] = [
  {
    id: '1',
    type: 'vibe',
    title: 'Just got promoted at work!',
    subtitle: 'Career milestone',
    description:
      'After 3 years of hard work, finally got that senior position. Feeling amazing!',
    image:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop',
    rating: 4.8,
    ratingCount: 234,
    tags: ['career', 'success', 'work'],
    createdBy: {
      id: 'user1',
      name: 'Alex Johnson',
      avatar: 'https://i.pravatar.cc/150?u=user1',
    },
    score: 0.95,
  },
  {
    id: '2',
    type: 'vibe',
    title: 'Perfect Sunday morning coffee',
    subtitle: 'Weekend vibes',
    description:
      'Found this amazing local coffee shop with the best espresso in town',
    image:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
    rating: 4.5,
    ratingCount: 189,
    tags: ['coffee', 'weekend', 'relaxing'],
    createdBy: {
      id: 'user2',
      name: 'Sarah Chen',
      avatar: 'https://i.pravatar.cc/150?u=user2',
    },
    score: 0.88,
  },
  {
    id: '3',
    type: 'vibe',
    title: 'Sunset hike was breathtaking',
    subtitle: 'Adventure time',
    description:
      'Climbed to the peak just in time for golden hour. The view was absolutely worth it!',
    image:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    rating: 4.9,
    ratingCount: 312,
    tags: ['nature', 'hiking', 'adventure'],
    createdBy: {
      id: 'user3',
      name: 'Mike Thompson',
      avatar: 'https://i.pravatar.cc/150?u=user3',
    },
    score: 0.82,
  },
  {
    id: '4',
    type: 'vibe',
    title: 'Learning piano is harder than expected',
    subtitle: 'Music journey',
    description:
      'Week 3 of piano lessons and my fingers still feel like sausages',
    image:
      'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop',
    rating: 4.2,
    ratingCount: 145,
    tags: ['music', 'learning', 'challenge'],
    createdBy: {
      id: 'user4',
      name: 'Emma Davis',
      avatar: 'https://i.pravatar.cc/150?u=user4',
    },
    score: 0.75,
  },
  {
    id: '5',
    type: 'vibe',
    title: "Best pizza I've ever had!",
    subtitle: 'Foodie discovery',
    description:
      'This little Italian place downtown makes magic happen with dough and cheese',
    image:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
    rating: 4.7,
    ratingCount: 267,
    tags: ['food', 'pizza', 'restaurant'],
    createdBy: {
      id: 'user5',
      name: 'Jake Wilson',
      avatar: 'https://i.pravatar.cc/150?u=user5',
    },
    score: 0.7,
  },
];

export const mockUserResults: UserSearchResult[] = [
  {
    id: 'user1',
    type: 'user',
    title: 'Alex Johnson',
    subtitle: '@alexj',
    username: 'alexj',
    image: 'https://i.pravatar.cc/150?u=user1',
    vibeCount: 42,
    followerCount: 156,
    score: 0.9,
  },
  {
    id: 'user2',
    type: 'user',
    title: 'Sarah Chen',
    subtitle: '@sarahc',
    username: 'sarahc',
    image: 'https://i.pravatar.cc/150?u=user2',
    vibeCount: 28,
    followerCount: 89,
    score: 0.85,
  },
  {
    id: 'user3',
    type: 'user',
    title: 'Mike Thompson',
    subtitle: '@miket',
    username: 'miket',
    image: 'https://i.pravatar.cc/150?u=user3',
    vibeCount: 67,
    followerCount: 234,
    score: 0.8,
  },
];

export const mockTagResults: TagSearchResult[] = [
  {
    id: 'tag1',
    type: 'tag',
    title: '#coffee',
    subtitle: '234 vibes',
    count: 234,
    score: 0.95,
  },
  {
    id: 'tag2',
    type: 'tag',
    title: '#work',
    subtitle: '189 vibes',
    count: 189,
    score: 0.88,
  },
  {
    id: 'tag3',
    type: 'tag',
    title: '#adventure',
    subtitle: '156 vibes',
    count: 156,
    score: 0.82,
  },
  {
    id: 'tag4',
    type: 'tag',
    title: '#food',
    subtitle: '312 vibes',
    count: 312,
    score: 0.78,
  },
  {
    id: 'tag5',
    type: 'tag',
    title: '#music',
    subtitle: '98 vibes',
    count: 98,
    score: 0.72,
  },
];

export const mockActionResults: ActionSearchResult[] = [
  {
    id: 'action1',
    type: 'action',
    title: 'Create new vibe',
    subtitle: 'Share your experience',
    action: 'create-vibe',
    icon: 'plus',
  },
  {
    id: 'action2',
    type: 'action',
    title: 'View your profile',
    subtitle: 'Manage your vibes',
    action: 'view-profile',
    icon: 'user',
  },
];

export const mockRecentSearches: SearchSuggestion[] = [
  {
    term: 'coffee shops near me',
    type: 'recent',
    metadata: {
      lastUsed: new Date(Date.now() - 3600000).toISOString(),
      useCount: 3,
    },
  },
  {
    term: 'weekend vibes',
    type: 'recent',
    metadata: {
      lastUsed: new Date(Date.now() - 7200000).toISOString(),
      useCount: 2,
    },
  },
  {
    term: 'hiking trails',
    type: 'recent',
    metadata: {
      lastUsed: new Date(Date.now() - 86400000).toISOString(),
      useCount: 1,
    },
  },
];

export const mockTrendingSearches: SearchSuggestion[] = [
  {
    term: 'summer vibes',
    type: 'trending',
    metadata: {
      trendingRank: 1,
    },
  },
  {
    term: 'coffee aesthetic',
    type: 'trending',
    metadata: {
      trendingRank: 2,
    },
  },
  {
    term: 'work from home',
    type: 'trending',
    metadata: {
      trendingRank: 3,
    },
  },
];

export function getMockSearchResults(query: string): SearchResponse {
  const lowercaseQuery = query.toLowerCase();

  const filteredVibes = query
    ? mockVibeResults
        .filter(
          (vibe) =>
            vibe.title.toLowerCase().includes(lowercaseQuery) ||
            vibe.description.toLowerCase().includes(lowercaseQuery) ||
            vibe.tags?.some((tag: string) =>
              tag.toLowerCase().includes(lowercaseQuery)
            )
        )
        .slice(0, 5)
    : Array(0);

  const filteredUsers = query
    ? mockUserResults
        .filter(
          (user) =>
            user.username.toLowerCase().includes(lowercaseQuery) ||
            user.title.toLowerCase().includes(lowercaseQuery)
        )
        .slice(0, 3)
    : [];

  const filteredTags = query
    ? mockTagResults
        .filter((tag) => tag.title.toLowerCase().includes(lowercaseQuery))
        .slice(0, 5)
    : [];

  const filteredActions =
    query.length > 2
      ? mockActionResults.filter(
          (action) =>
            action.title.toLowerCase().includes(lowercaseQuery) ||
            action.action.toLowerCase().includes(lowercaseQuery)
        )
      : [];

  return {
    vibes: filteredVibes,
    users: filteredUsers,
    tags: filteredTags,
    actions: filteredActions,
    reviews: [], // Add empty reviews array for now
    totalCount:
      filteredVibes.length +
      filteredUsers.length +
      filteredTags.length +
      filteredActions.length,
  };
}

export function getMockSearchSuggestions(query: string): {
  vibes: VibeSearchResult[];
  users: UserSearchResult[];
  tags: TagSearchResult[];
  actions: ActionSearchResult[];
} {
  const results = getMockSearchResults(query);

  const vibes = results.vibes.slice(0, 5);
  const users = results.users.slice(0, 3);
  const tags = results.tags.slice(0, 5);
  const actions = results.actions;

  return { vibes, users, tags, actions };
}
