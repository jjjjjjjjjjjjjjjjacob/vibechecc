import { useQuery } from '@tanstack/react-query';
import type { SearchRequest, SearchResponse } from '@vibechecc/types';

// Mock data for development
const mockSearchResults: SearchResponse = {
  results: [
    {
      id: '1',
      type: 'vibe',
      title: 'Tour Mount Bromo',
      imageUrl: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=800&h=600&fit=crop',
      averageRating: 4.7,
      ratingCount: 475,
      tags: ['adventure', 'nature', 'indonesia'],
      location: 'Surabaya, Indonesia',
      createdBy: {
        id: 'user1',
        name: 'John Doe',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      },
    },
    {
      id: '2',
      type: 'vibe',
      title: 'Getaway Tours',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      averageRating: 4.6,
      ratingCount: 36,
      tags: ['travel', 'tours'],
      location: 'Surabaya, Indonesia',
      createdBy: {
        id: 'user2',
        name: 'Jane Smith',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
      },
    },
    {
      id: '3',
      type: 'vibe',
      title: 'Bromoijen Tour Transport',
      imageUrl: 'https://images.unsplash.com/photo-1527004760323-768fcf9894be?w=800&h=600&fit=crop',
      averageRating: 4.9,
      ratingCount: 467,
      tags: ['transport', 'tours'],
      location: 'East Java, Indonesia',
      createdBy: {
        id: 'user3',
        name: 'Mike Johnson',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      },
    },
    {
      id: 'user1',
      type: 'user',
      name: 'Adventure Seeker',
      username: 'adventureseeker',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=adventureseeker',
      vibeCount: 42,
      followersCount: 1234,
    },
    {
      id: 'tag1',
      type: 'tag',
      name: 'adventure',
      usageCount: 156,
    },
    {
      id: '4',
      type: 'vibe',
      title: 'Sunset at the Beach',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      averageRating: 4.8,
      ratingCount: 234,
      tags: ['beach', 'sunset', 'relaxation'],
      location: 'Bali, Indonesia',
      createdBy: {
        id: 'user4',
        name: 'Sarah Lee',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      },
    },
  ],
  totalCount: 42,
  hasMore: true,
};

interface UseSearchResultsParams {
  query: string;
  filters?: SearchRequest['filters'];
  page?: number;
}

export function useSearchResults({ query, filters, page = 1 }: UseSearchResultsParams) {
  return useQuery({
    queryKey: ['search', query, filters, page],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock data for now
      // When backend is ready, replace with:
      // const response = await api.search.searchAll({ query, filters, page });
      // return response;
      
      return mockSearchResults;
    },
    enabled: true, // Always enabled, even for empty query
  });
}