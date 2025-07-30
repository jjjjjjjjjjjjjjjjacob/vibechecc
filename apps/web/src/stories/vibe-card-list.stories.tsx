import type { Meta, StoryObj } from '@storybook/react';
import { VibeCard } from '@/features/vibes/components/vibe-card';
import { VibeList } from '@/components/vibe-list';

const mockVibe = {
  id: '1',
  title: 'when you finally understand recursion by understanding recursion',
  description: 'that moment when the concept clicks and you realize you\'ve been overthinking it',
  image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
  createdById: 'user123',
  createdAt: new Date().toISOString(),
  tags: ['programming', 'learning', 'aha-moment'],
  createdBy: {
    externalId: 'user123',
    username: 'codecrafter',
    first_name: 'Alex',
    last_name: 'Chen',
    image_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
  },
};

const mockVibes = [
  mockVibe,
  {
    ...mockVibe,
    id: '2',
    title: 'debugging for 3 hours only to find a missing semicolon',
    description: 'the eternal struggle of every developer',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
  },
  {
    ...mockVibe,
    id: '3',
    title: 'when your code works on the first try',
    description: 'suspicious but grateful',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
  },
  {
    ...mockVibe,
    id: '4',
    title: 'explaining your job to non-tech relatives',
    description: 'no, I don\'t fix printers',
    image: null, // Test placeholder
  },
];

const meta = {
  title: 'Components/VibeCard/List',
  component: VibeCard,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof VibeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleListItem: Story = {
  args: {
    vibe: mockVibe,
    variant: 'list',
  },
};

export const ListWithPlaceholder: Story = {
  args: {
    vibe: { ...mockVibe, image: null },
    variant: 'list',
  },
};

export const FullList: Story = {
  render: () => <VibeList vibes={mockVibes} />,
};

export const ListWithDifferentRatings: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-lg font-semibold">Most Rated Display</h3>
        <VibeList vibes={mockVibes} ratingDisplayMode="most-rated" />
      </div>
      <div>
        <h3 className="mb-3 text-lg font-semibold">Top Rated Display</h3>
        <VibeList vibes={mockVibes} ratingDisplayMode="top-rated" />
      </div>
    </div>
  ),
};

export const ResponsiveList: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="max-w-xl">
        <h3 className="mb-3 text-lg font-semibold">Mobile Width</h3>
        <VibeList vibes={mockVibes} />
      </div>
      <div>
        <h3 className="mb-3 text-lg font-semibold">Desktop Width</h3>
        <VibeList vibes={mockVibes} />
      </div>
    </div>
  ),
};

export const ListInDarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
  render: () => <VibeList vibes={mockVibes} />,
};