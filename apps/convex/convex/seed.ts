import { action, internalMutation } from './_generated/server';
import { api, internal } from './_generated/api';

export const clear = action({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx: any): Promise<any> => {
    try {
      return await ctx.runMutation(internal.seed.clearAll);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error clearing database:', error);
      return {
        success: false,
        message: `Error clearing database: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

export const clearAll = internalMutation({
  handler: async (ctx) => {
    // Delete all ratings
    const allRatings = await ctx.db.query('ratings').collect();
    for (const rating of allRatings) {
      await ctx.db.delete(rating._id);
    }

    // Delete all reactions
    const allReactions = await ctx.db.query('reactions').collect();
    for (const reaction of allReactions) {
      await ctx.db.delete(reaction._id);
    }

    // Delete all vibes
    const allVibes = await ctx.db.query('vibes').collect();
    for (const vibe of allVibes) {
      await ctx.db.delete(vibe._id);
    }

    // Delete all users
    const allUsers = await ctx.db.query('users').collect();
    for (const user of allUsers) {
      await ctx.db.delete(user._id);
    }

    return {
      success: true,
      message: 'Database cleared successfully',
    };
  },
});

export const seed = action({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx: any): Promise<any> => {
    // eslint-disable-next-line no-console
    console.log('Starting complete seeding process...');

    try {
      // Sample users updated for new schema
      const users = [
        {
          externalId: 'user-1',
          username: 'Alex Johnson',
          image_url: '/placeholder.svg?height=100&width=100',
          created_at: new Date('2023-01-15T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-2',
          username: 'Sofia Davis',
          image_url: '/placeholder.svg?height=100&width=100&text=SD',
          created_at: new Date('2022-11-03T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-3',
          username: 'Marcus Lee',
          image_url: '/placeholder.svg?height=100&width=100&text=ML',
          created_at: new Date('2023-02-22T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-4',
          username: 'Olivia Smith',
          image_url: '/placeholder.svg?height=100&width=100&text=OS',
          created_at: new Date('2022-09-14T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-5',
          username: 'Ethan Brown',
          image_url: '/placeholder.svg?height=100&width=100&text=EB',
          created_at: new Date('2023-03-30T00:00:00Z').getTime(),
        },
      ];

      // Create users
      // eslint-disable-next-line no-console
      console.log('Creating users...');
      for (const user of users) {
        await ctx.runMutation(api.users.create, {
          externalId: user.externalId,
          username: user.username,
          image_url: user.image_url,
        });
      }

      // Sample vibes from sample-data.ts
      const vibes = [
        {
          id: 'vibe-1',
          title: 'Losing virginity but lying about not being your first time',
          description:
            "That awkward moment when you're trying to act experienced but have no idea what you're doing. A mix of nervousness, fake confidence, and the constant fear of being found out.",
          image: undefined,
          createdById: 'user-2',
          createdAt: '2023-05-12T14:23:00Z',
          tags: ['Awkward', 'Embarrassing', 'Life Milestone'],
        },
        {
          id: 'vibe-2',
          title: 'Being in a public restroom when the lights go out',
          description:
            "That moment of pure panic when you're in a public bathroom stall and suddenly everything goes dark. Time stops, your heart races, and you wonder if this is how your life ends.",
          image: undefined,
          createdById: 'user-3',
          createdAt: '2023-06-03T18:45:00Z',
          tags: ['Terrifying', 'Bathroom Horror', 'Public Spaces'],
        },
        {
          id: 'vibe-3',
          title: "Finding $20 in old jeans you haven't worn in months",
          description:
            "That unexpected joy when you put on an old pair of jeans and discover money you forgot about. It's like a gift from your past self to your present self.",
          image: undefined,
          createdById: 'user-4',
          createdAt: '2023-04-22T11:30:00Z',
          tags: ['Satisfying', 'Unexpected Joy', 'Money'],
        },
        {
          id: 'vibe-4',
          title: 'Awkward elevator small talk with your boss',
          description:
            "That painfully long elevator ride where you're trapped with your boss and forced to make conversation about the weather, weekend plans, or worse - work.",
          image: undefined,
          createdById: 'user-5',
          createdAt: '2023-07-14T09:15:00Z',
          tags: ['Awkward', 'Work Life', 'Social Anxiety'],
        },
      ];

      // Create vibes
      // eslint-disable-next-line no-console
      console.log('Creating vibes...');
      for (const vibe of vibes) {
        await ctx.runMutation(internal.vibes.createForSeed, {
          title: vibe.title,
          description: vibe.description,
          image: vibe.image,
          createdById: vibe.createdById,
          tags: vibe.tags,
        });
      }

      // Get the created vibes to map their actual IDs
      // eslint-disable-next-line no-console
      console.log('Mapping vibe IDs...');
      const createdVibes = await ctx.runQuery(api.vibes.getAllSimple);
      const vibeMap: Record<string, string> = {};

      const titleMap: Record<string, string> = {
        'Losing virginity but lying about not being your first time': 'vibe-1',
        'Being in a public restroom when the lights go out': 'vibe-2',
        "Finding $20 in old jeans you haven't worn in months": 'vibe-3',
        'Awkward elevator small talk with your boss': 'vibe-4',
      };

      for (const createdVibe of createdVibes) {
        const sampleVibeId = titleMap[createdVibe.title];
        if (sampleVibeId) {
          vibeMap[sampleVibeId] = createdVibe.id;
          // eslint-disable-next-line no-console
          console.log(
            `Mapped: ${sampleVibeId} -> ${createdVibe.id} (${createdVibe.title})`
          );
        }
      }

      // Sample ratings data
      const ratings = [
        // Ratings for vibe-1
        {
          vibeId: 'vibe-1',
          userId: 'user-1',
          rating: 4,
          review:
            "Too real. The anxiety of trying to seem experienced while having no clue what you're doing is a universal experience.",
          date: '2023-05-13T09:15:00Z',
        },
        {
          vibeId: 'vibe-1',
          userId: 'user-3',
          rating: 5,
          review:
            'The perfect mix of excitement and absolute terror. Been there, regretted that.',
          date: '2023-05-14T16:42:00Z',
        },
        {
          vibeId: 'vibe-1',
          userId: 'user-4',
          rating: 3,
          date: '2023-05-15T11:30:00Z',
        },
        {
          vibeId: 'vibe-1',
          userId: 'user-5',
          rating: 5,
          review:
            'The mental gymnastics required for this situation deserve an Olympic medal.',
          date: '2023-05-16T20:18:00Z',
        },

        // Ratings for vibe-2
        {
          vibeId: 'vibe-2',
          userId: 'user-1',
          rating: 2,
          review:
            'Absolutely terrifying. Had this happen at an airport once and I still have nightmares.',
          date: '2023-06-04T10:22:00Z',
        },
        {
          vibeId: 'vibe-2',
          userId: 'user-2',
          rating: 1,
          review: 'Pure horror movie material. -10/10 would not recommend.',
          date: '2023-06-05T14:37:00Z',
        },
        {
          vibeId: 'vibe-2',
          userId: 'user-4',
          rating: 2,
          date: '2023-06-06T09:15:00Z',
        },

        // Ratings for vibe-3
        {
          vibeId: 'vibe-3',
          userId: 'user-1',
          rating: 5,
          review:
            "One of life's purest joys. Better than finding money on the street because it's technically already yours.",
          date: '2023-04-23T15:42:00Z',
        },
        {
          vibeId: 'vibe-3',
          userId: 'user-2',
          rating: 5,
          review:
            "The universe's way of saying 'here's a little treat for making it through another day'.",
          date: '2023-04-24T09:18:00Z',
        },
        {
          vibeId: 'vibe-3',
          userId: 'user-3',
          rating: 4,
          date: '2023-04-25T12:33:00Z',
        },
        {
          vibeId: 'vibe-3',
          userId: 'user-5',
          rating: 5,
          review: 'Better than any lottery win. The perfect surprise.',
          date: '2023-04-26T17:55:00Z',
        },

        // Ratings for vibe-4
        {
          vibeId: 'vibe-4',
          userId: 'user-1',
          rating: 2,
          review: 'The longest 30 seconds of your life. Every. Single. Time.',
          date: '2023-07-15T14:22:00Z',
        },
        {
          vibeId: 'vibe-4',
          userId: 'user-2',
          rating: 3,
          date: '2023-07-16T10:37:00Z',
        },
        {
          vibeId: 'vibe-4',
          userId: 'user-3',
          rating: 1,
          review:
            "I've started taking the stairs up 8 flights just to avoid this exact situation.",
          date: '2023-07-17T16:15:00Z',
        },
        {
          vibeId: 'vibe-4',
          userId: 'user-4',
          rating: 2,
          review: 'The way time slows down should be studied by physicists.',
          date: '2023-07-18T11:48:00Z',
        },
      ];

      // Create ratings using the mapped vibe IDs
      // eslint-disable-next-line no-console
      console.log('Creating ratings...');
      for (const rating of ratings) {
        const actualVibeId = vibeMap[rating.vibeId];
        if (actualVibeId) {
          await ctx.runMutation(internal.vibes.addRatingForSeed, {
            vibeId: actualVibeId,
            userId: rating.userId,
            rating: rating.rating,
            review: rating.review,
          });
        } else {
          // eslint-disable-next-line no-console
          console.warn(`Could not find vibe ID for: ${rating.vibeId}`);
        }
      }

      // Sample reactions data - matching the counts from sample-data.ts
      const reactions = [
        // Reactions for vibe-1 (😂: 24, 😭: 12, 💯: 8, 👀: 5)
        // 😂 reactions (24 total - we'll simulate with multiple users)
        { vibeId: 'vibe-1', emoji: '😂', userId: 'user-1' },
        { vibeId: 'vibe-1', emoji: '😂', userId: 'user-3' },
        { vibeId: 'vibe-1', emoji: '😂', userId: 'user-5' },
        // 😭 reactions (12 total)
        { vibeId: 'vibe-1', emoji: '😭', userId: 'user-2' },
        { vibeId: 'vibe-1', emoji: '😭', userId: 'user-4' },
        // 💯 reactions (8 total)
        { vibeId: 'vibe-1', emoji: '💯', userId: 'user-1' },
        // 👀 reactions (5 total)
        { vibeId: 'vibe-1', emoji: '👀', userId: 'user-3' },

        // Reactions for vibe-2 (😱: 32, 🚽: 18, 🔦: 7)
        // 😱 reactions (32 total)
        { vibeId: 'vibe-2', emoji: '😱', userId: 'user-1' },
        { vibeId: 'vibe-2', emoji: '😱', userId: 'user-2' },
        { vibeId: 'vibe-2', emoji: '😱', userId: 'user-4' },
        { vibeId: 'vibe-2', emoji: '😱', userId: 'user-5' },
        // 🚽 reactions (18 total)
        { vibeId: 'vibe-2', emoji: '🚽', userId: 'user-3' },
        { vibeId: 'vibe-2', emoji: '🚽', userId: 'user-1' },
        // 🔦 reactions (7 total)
        { vibeId: 'vibe-2', emoji: '🔦', userId: 'user-4' },

        // Reactions for vibe-3 (🤑: 42, 💰: 28, 🎉: 15, 👖: 9)
        // 🤑 reactions (42 total)
        { vibeId: 'vibe-3', emoji: '🤑', userId: 'user-1' },
        { vibeId: 'vibe-3', emoji: '🤑', userId: 'user-2' },
        { vibeId: 'vibe-3', emoji: '🤑', userId: 'user-3' },
        { vibeId: 'vibe-3', emoji: '🤑', userId: 'user-4' },
        { vibeId: 'vibe-3', emoji: '🤑', userId: 'user-5' },
        // 💰 reactions (28 total)
        { vibeId: 'vibe-3', emoji: '💰', userId: 'user-4' },
        { vibeId: 'vibe-3', emoji: '💰', userId: 'user-2' },
        { vibeId: 'vibe-3', emoji: '💰', userId: 'user-3' },
        // 🎉 reactions (15 total)
        { vibeId: 'vibe-3', emoji: '🎉', userId: 'user-5' },
        { vibeId: 'vibe-3', emoji: '🎉', userId: 'user-1' },
        // 👖 reactions (9 total)
        { vibeId: 'vibe-3', emoji: '👖', userId: 'user-1' },

        // Reactions for vibe-4 (😬: 38, 🙈: 22, ⏱️: 15)
        // 😬 reactions (38 total)
        { vibeId: 'vibe-4', emoji: '😬', userId: 'user-1' },
        { vibeId: 'vibe-4', emoji: '😬', userId: 'user-2' },
        { vibeId: 'vibe-4', emoji: '😬', userId: 'user-5' },
        // 🙈 reactions (22 total)
        { vibeId: 'vibe-4', emoji: '🙈', userId: 'user-3' },
        { vibeId: 'vibe-4', emoji: '🙈', userId: 'user-4' },
        // ⏱️ reactions (15 total)
        { vibeId: 'vibe-4', emoji: '⏱️', userId: 'user-5' },
        { vibeId: 'vibe-4', emoji: '⏱️', userId: 'user-1' },
      ];

      // Create reactions using the mapped vibe IDs
      // eslint-disable-next-line no-console
      console.log('Creating reactions...');
      for (const reaction of reactions) {
        const actualVibeId = vibeMap[reaction.vibeId];
        if (actualVibeId) {
          await ctx.runMutation(internal.vibes.reactToVibeForSeed, {
            vibeId: actualVibeId,
            emoji: reaction.emoji,
            userId: reaction.userId,
          });
        } else {
          // eslint-disable-next-line no-console
          console.warn(`Could not find vibe ID for: ${reaction.vibeId}`);
        }
      }

      return {
        success: true,
        message: `Successfully seeded complete database with ${users.length} users, ${vibes.length} vibes, ${ratings.length} ratings, and ${reactions.length} reactions.`,
        data: {
          usersCreated: users.length,
          vibesCreated: vibes.length,
          ratingsCreated: ratings.length,
          reactionsCreated: reactions.length,
          details: {
            ratingsWithReviews: ratings.filter((r) => r.review).length,
            ratingsWithoutReviews: ratings.filter((r) => !r.review).length,
            uniqueEmojisUsed: Array.from(new Set(reactions.map((r) => r.emoji)))
              .length,
          },
        },
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error seeding database:', error);
      return {
        success: false,
        message: `Error seeding database: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

// Enhanced seed with 30+ users and comprehensive data
export const seedEnhanced = action({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx: any): Promise<any> => {
    try {
      // eslint-disable-next-line no-console
      console.log('Starting enhanced seeding process with 30+ users...');

      // 30 diverse users with varied profiles
      const users = [
        // Tech professionals
        {
          externalId: 'user-001',
          username: 'Alex Chen',
          image_url: '/placeholder.svg?height=100&width=100&text=AC',
          bio: 'Full-stack developer who loves coffee and clean code',
          interests: ['Programming', 'Coffee', 'Gaming'],
          created_at: new Date('2023-01-15T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-002',
          username: 'Sarah Johnson',
          image_url: '/placeholder.svg?height=100&width=100&text=SJ',
          bio: 'Product manager by day, plant parent by night',
          interests: ['Product Management', 'Plants', 'Yoga'],
          created_at: new Date('2023-01-20T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-003',
          username: 'Marcus Williams',
          image_url: '/placeholder.svg?height=100&width=100&text=MW',
          bio: 'UX designer passionate about accessible design',
          interests: ['Design', 'Accessibility', 'Art'],
          created_at: new Date('2023-01-25T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-004',
          username: 'Emma Davis',
          image_url: '/placeholder.svg?height=100&width=100&text=ED',
          bio: 'Data scientist who sees patterns everywhere',
          interests: ['Data Science', 'Statistics', 'Books'],
          created_at: new Date('2023-02-01T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-005',
          username: 'Jordan Lee',
          image_url: '/placeholder.svg?height=100&width=100&text=JL',
          bio: 'DevOps engineer who automates everything',
          interests: ['DevOps', 'Automation', 'Music'],
          created_at: new Date('2023-02-05T00:00:00Z').getTime(),
        },

        // Creative professionals
        {
          externalId: 'user-006',
          username: 'Maya Patel',
          image_url: '/placeholder.svg?height=100&width=100&text=MP',
          bio: 'Graphic designer and weekend photographer',
          interests: ['Photography', 'Design', 'Travel'],
          created_at: new Date('2023-02-10T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-007',
          username: 'Carlos Rodriguez',
          image_url: '/placeholder.svg?height=100&width=100&text=CR',
          bio: 'Writer who finds stories in everyday moments',
          interests: ['Writing', 'Literature', 'Film'],
          created_at: new Date('2023-02-15T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-008',
          username: 'Zoe Thompson',
          image_url: '/placeholder.svg?height=100&width=100&text=ZT',
          bio: 'Freelance illustrator and dog mom',
          interests: ['Illustration', 'Dogs', 'Animation'],
          created_at: new Date('2023-02-20T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-009',
          username: 'Riley Kim',
          image_url: '/placeholder.svg?height=100&width=100&text=RK',
          bio: 'Video editor who makes magic happen',
          interests: ['Video Editing', 'Filmmaking', 'Gaming'],
          created_at: new Date('2023-02-25T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-010',
          username: 'Sam Parker',
          image_url: '/placeholder.svg?height=100&width=100&text=SP',
          bio: 'Musician who codes for fun',
          interests: ['Music', 'Programming', 'Synthesizers'],
          created_at: new Date('2023-03-01T00:00:00Z').getTime(),
        },

        // Students and young professionals
        {
          externalId: 'user-011',
          username: 'Lily Zhang',
          image_url: '/placeholder.svg?height=100&width=100&text=LZ',
          bio: 'CS student who loves hackathons',
          interests: ['Computer Science', 'Hackathons', 'Bubble Tea'],
          created_at: new Date('2023-03-05T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-012',
          username: 'Tyler Brown',
          image_url: '/placeholder.svg?height=100&width=100&text=TB',
          bio: 'Business student and aspiring entrepreneur',
          interests: ['Business', 'Entrepreneurship', 'Basketball'],
          created_at: new Date('2023-03-10T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-013',
          username: 'Ava Wilson',
          image_url: '/placeholder.svg?height=100&width=100&text=AW',
          bio: 'Psychology major who loves understanding people',
          interests: ['Psychology', 'Human Behavior', 'Podcasts'],
          created_at: new Date('2023-03-15T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-014',
          username: 'Noah Martinez',
          image_url: '/placeholder.svg?height=100&width=100&text=NM',
          bio: 'Engineering student and weekend chef',
          interests: ['Engineering', 'Cooking', 'Hiking'],
          created_at: new Date('2023-03-20T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-015',
          username: 'Grace Taylor',
          image_url: '/placeholder.svg?height=100&width=100&text=GT',
          bio: 'English lit student who writes poetry',
          interests: ['Literature', 'Poetry', 'Coffee Shops'],
          created_at: new Date('2023-03-25T00:00:00Z').getTime(),
        },

        // Health and wellness
        {
          externalId: 'user-016',
          username: 'Dr. James Miller',
          image_url: '/placeholder.svg?height=100&width=100&text=JM',
          bio: 'Pediatrician who loves dad jokes',
          interests: ['Medicine', 'Kids', 'Dad Jokes'],
          created_at: new Date('2023-04-01T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-017',
          username: 'Jessica Anderson',
          image_url: '/placeholder.svg?height=100&width=100&text=JA',
          bio: 'Yoga instructor finding balance',
          interests: ['Yoga', 'Meditation', 'Wellness'],
          created_at: new Date('2023-04-05T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-018',
          username: 'Michael Chen',
          image_url: '/placeholder.svg?height=100&width=100&text=MC',
          bio: 'Personal trainer who loves motivating others',
          interests: ['Fitness', 'Motivation', 'Nutrition'],
          created_at: new Date('2023-04-10T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-019',
          username: 'Rachel Green',
          image_url: '/placeholder.svg?height=100&width=100&text=RG',
          bio: 'Nutritionist on a mission to help others',
          interests: ['Nutrition', 'Health', 'Cooking'],
          created_at: new Date('2023-04-15T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-020',
          username: 'Daniel White',
          image_url: '/placeholder.svg?height=100&width=100&text=DW',
          bio: 'Therapist who believes in the power of conversation',
          interests: ['Therapy', 'Mental Health', 'Reading'],
          created_at: new Date('2023-04-20T00:00:00Z').getTime(),
        },

        // Service industry and entrepreneurs
        {
          externalId: 'user-021',
          username: 'Sofia Gonzalez',
          image_url: '/placeholder.svg?height=100&width=100&text=SG',
          bio: 'Barista who makes the perfect latte art',
          interests: ['Coffee', 'Latte Art', 'Customer Service'],
          created_at: new Date('2023-04-25T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-022',
          username: 'Ethan Clark',
          image_url: '/placeholder.svg?height=100&width=100&text=EC',
          bio: 'Restaurant owner who loves feeding people',
          interests: ['Food', 'Hospitality', 'Local Business'],
          created_at: new Date('2023-05-01T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-023',
          username: 'Isabella Torres',
          image_url: '/placeholder.svg?height=100&width=100&text=IT',
          bio: 'Event planner who creates magical moments',
          interests: ['Event Planning', 'Weddings', 'Creativity'],
          created_at: new Date('2023-05-05T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-024',
          username: 'Mason Davis',
          image_url: '/placeholder.svg?height=100&width=100&text=MD',
          bio: 'Startup founder building the future',
          interests: ['Startups', 'Innovation', 'Technology'],
          created_at: new Date('2023-05-10T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-025',
          username: 'Chloe Wilson',
          image_url: '/placeholder.svg?height=100&width=100&text=CW',
          bio: 'Marketing consultant who loves brands',
          interests: ['Marketing', 'Branding', 'Social Media'],
          created_at: new Date('2023-05-15T00:00:00Z').getTime(),
        },

        // Additional diverse users
        {
          externalId: 'user-026',
          username: 'Kai Nakamura',
          image_url: '/placeholder.svg?height=100&width=100&text=KN',
          bio: 'Street artist painting the city beautiful',
          interests: ['Street Art', 'Painting', 'Urban Culture'],
          created_at: new Date('2023-05-20T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-027',
          username: 'Luna Rodriguez',
          image_url: '/placeholder.svg?height=100&width=100&text=LR',
          bio: 'Dancer who expresses emotions through movement',
          interests: ['Dance', 'Movement', 'Expression'],
          created_at: new Date('2023-05-25T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-028',
          username: 'Felix Johnson',
          image_url: '/placeholder.svg?height=100&width=100&text=FJ',
          bio: 'Stand-up comedian finding humor in everything',
          interests: ['Comedy', 'Stand-up', 'Storytelling'],
          created_at: new Date('2023-06-01T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-029',
          username: 'Aria Williams',
          image_url: '/placeholder.svg?height=100&width=100&text=AW',
          bio: 'Singer-songwriter with stories to tell',
          interests: ['Music', 'Songwriting', 'Guitar'],
          created_at: new Date('2023-06-05T00:00:00Z').getTime(),
        },
        {
          externalId: 'user-030',
          username: 'Phoenix Lee',
          image_url: '/placeholder.svg?height=100&width=100&text=PL',
          bio: 'Theater actor who lives for the spotlight',
          interests: ['Theater', 'Acting', 'Shakespeare'],
          created_at: new Date('2023-06-10T00:00:00Z').getTime(),
        },
      ];

      // Create all users
      // eslint-disable-next-line no-console
      console.log('Creating 30 diverse users...');
      for (const user of users) {
        await ctx.runMutation(internal.users.createForSeed, {
          externalId: user.externalId,
          username: user.username,
          image_url: user.image_url,
          bio: user.bio,
          interests: user.interests,
          created_at: user.created_at,
        });
      }

      // Comprehensive collection of realistic vibes
      const vibes = [
        // Everyday awkward moments
        {
          title:
            'Waving back at someone who was waving at the person behind you',
          description:
            'That mortifying moment when you enthusiastically wave back, only to realize they were greeting someone else entirely. The awkward pause that follows is soul-crushing.',
          createdById: 'user-001',
          tags: ['Awkward', 'Embarrassing', 'Social Anxiety'],
        },
        {
          title: 'Saying "you too" when the waiter says "enjoy your meal"',
          description:
            'Your brain short-circuits and you respond with "you too" when clearly the waiter is not about to eat your food. The immediate regret is palpable.',
          createdById: 'user-002',
          tags: ['Awkward', 'Restaurant', 'Social Blunder'],
        },
        {
          title: 'Pulling a push door and then pushing a pull door',
          description:
            'The classic door struggle that makes you question your basic understanding of physics and human engineering. Bonus points if people are watching.',
          createdById: 'user-003',
          tags: ['Embarrassing', 'Daily Life', 'Awkward'],
        },
        {
          title:
            'Accidentally making eye contact with someone through a window',
          description:
            'That uncomfortable moment when you look up from your phone and lock eyes with a stranger through glass. Do you wave? Look away? Pretend it never happened?',
          createdById: 'user-004',
          tags: ['Awkward', 'Eye Contact', 'Social Anxiety'],
        },
        {
          title: "Forgetting someone's name immediately after being introduced",
          description:
            "They just said their name 2 seconds ago, but your brain decided that information wasn't important enough to store. Now you have to pretend you remember for the rest of the conversation.",
          createdById: 'user-005',
          tags: ['Awkward', 'Memory', 'Social Situations'],
        },

        // Work and professional life
        {
          title:
            'Unmuting yourself mid-rant about your coworkers on a video call',
          description:
            'You thought you were on mute while venting about Dave from accounting, but surprise! Everyone just heard your uncensored thoughts about the team structure.',
          createdById: 'user-006',
          tags: ['Work', 'Video Calls', 'Professional Embarrassment'],
        },
        {
          title: 'Accidentally calling your boss "mom" during a meeting',
          description:
            'Your brain glitches and you address your boss as "mom" in front of the entire team. The silence that follows is deafening.',
          createdById: 'user-007',
          tags: ['Work', 'Embarrassing', 'Professional Life'],
        },
        {
          title:
            "Sending a screenshot of someone's message to that exact person",
          description:
            'You meant to send it to your friend to get their opinion, but your fingers betrayed you and sent it to the person who wrote it. Time to find a new job.',
          createdById: 'user-008',
          tags: ['Technology', 'Texting', 'Social Media Fail'],
        },
        {
          title: 'Pretending to work when your boss walks by',
          description:
            'That sudden burst of fake productivity when you hear footsteps approaching your desk. You quickly minimize Reddit and open a spreadsheet with intense focus.',
          createdById: 'user-009',
          tags: ['Work', 'Procrastination', 'Office Life'],
        },
        {
          title: 'Eating lunch alone in your car to avoid small talk',
          description:
            'Sometimes the 30 minutes of solitude in your car eating a sandwich is better than facing the office kitchen conversation about weekend plans.',
          createdById: 'user-010',
          tags: ['Work', 'Introvert', 'Lunch Break'],
        },

        // Technology and modern life
        {
          title: 'Typing and deleting the same text message 5 times',
          description:
            "Crafting the perfect response that strikes the right tone, conveys your message clearly, and doesn't sound too eager or too distant. Delete. Start over.",
          createdById: 'user-011',
          tags: ['Texting', 'Overthinking', 'Communication'],
        },
        {
          title:
            "Accidentally liking someone's photo from 3 years ago while stalking",
          description:
            "You're deep in their Instagram history investigating their past, and your thumb slips. Now they know you were creeping, and there's no going back.",
          createdById: 'user-012',
          tags: ['Social Media', 'Stalking', 'Technology Fail'],
        },
        {
          title: 'Your phone dying right before showing someone a meme',
          description:
            "You've been building up to this perfect meme that will make them laugh, and your phone dies at the crucial moment. The comedic timing is ruined forever.",
          createdById: 'user-013',
          tags: ['Technology', 'Memes', 'Bad Timing'],
        },
        {
          title: 'Accidentally sending a private message to a group chat',
          description:
            'That personal comment about someone IN the group chat that you meant to send privately. The group chat goes silent, and you contemplate deleting the app.',
          createdById: 'user-014',
          tags: ['Group Chat', 'Texting', 'Social Media Fail'],
        },
        {
          title:
            'Forgetting to turn off your camera during a video call bathroom break',
          description:
            'You thought you turned off your camera, but everyone just watched you get up and walk away. The fear of what they might have seen haunts you.',
          createdById: 'user-015',
          tags: ['Video Calls', 'Technology', 'Bathroom Break'],
        },

        // Food and positive moments
        {
          title: 'Finding money in your pocket that you forgot about',
          description:
            "You reach into an old jacket and discover a $20 bill. It's like getting a gift from your past self.",
          createdById: 'user-016',
          tags: ['Money', 'Surprise', 'Positive'],
        },
        {
          title: 'When your favorite song comes on right when you need it',
          description:
            "You're having a rough day, and then the perfect song starts playing. The universe has perfect timing sometimes.",
          createdById: 'user-017',
          tags: ['Music', 'Perfect Timing', 'Mood Boost'],
        },
        {
          title: 'Successfully assembling IKEA furniture on the first try',
          description:
            'No leftover parts, no nervous breakdowns, no throwing the manual across the room. You are officially an adult.',
          createdById: 'user-018',
          tags: ['IKEA', 'Furniture', 'Success'],
        },
        {
          title: 'Getting a genuine compliment from a stranger',
          description:
            "Someone you don't know tells you they like your shirt, and it brightens your entire day. Random kindness hits different.",
          createdById: 'user-019',
          tags: ['Compliments', 'Strangers', 'Kindness'],
        },
        {
          title:
            'Perfectly timing the microwave to beep right as you walk into the kitchen',
          description:
            "You didn't set a timer, but somehow your internal clock was perfectly synchronized with your leftovers. This is what peak performance looks like.",
          createdById: 'user-020',
          tags: ['Microwave', 'Perfect Timing', 'Satisfaction'],
        },
      ];

      // Create all vibes
      // eslint-disable-next-line no-console
      console.log('Creating 20 diverse vibes...');
      for (const vibe of vibes) {
        await ctx.runMutation(internal.vibes.createForSeed, {
          title: vibe.title,
          description: vibe.description,
          createdById: vibe.createdById,
          tags: vibe.tags,
        });
      }

      // Get created vibes to generate ratings and reactions
      const createdVibes = await ctx.runQuery(api.vibes.getAllSimple);

      // Generate extensive ratings and reviews
      // eslint-disable-next-line no-console
      console.log('Creating ratings and reviews...');
      const userIds = users.map((u) => u.externalId);

      for (const vibe of createdVibes) {
        // Each vibe gets 3-8 ratings from random users
        const numRatings = Math.floor(Math.random() * 6) + 3; // 3-8 ratings
        const ratingUsers = userIds
          .sort(() => 0.5 - Math.random())
          .slice(0, numRatings);

        for (const userId of ratingUsers) {
          // Skip if user created this vibe
          if (userId === vibe.createdById) continue;

          const rating = Math.floor(Math.random() * 5) + 1; // 1-5 stars
          let review = undefined;

          // 50% chance of including a review
          if (Math.random() < 0.5) {
            const reviewOptions = [
              'So relatable it hurts',
              'This happened to me last week!',
              'I feel personally attacked',
              'Why is this so accurate?',
              'The secondhand embarrassment is real',
              "I'm literally dying at this",
              'Too real, too real',
              "I've never related to anything more",
              'This is my entire personality',
              'I feel seen',
              'This is art',
              "I can't even",
              'This is peak comedy',
              'Not me doing this yesterday',
              'Why did you call me out like this?',
              'This is sending me',
              'The accuracy is uncanny',
              "I'm crying laughing",
              'This is exactly what I needed today',
              'This is comedy gold',
            ];
            review =
              reviewOptions[Math.floor(Math.random() * reviewOptions.length)];
          }

          await ctx.runMutation(internal.vibes.addRatingForSeed, {
            vibeId: vibe.id,
            userId: userId,
            rating: rating,
            review: review,
          });
        }
      }

      // Generate emoji reactions
      // eslint-disable-next-line no-console
      console.log('Creating emoji reactions...');
      const emojis = [
        '😂',
        '😭',
        '💯',
        '👀',
        '😱',
        '🤣',
        '😬',
        '🙈',
        '🔥',
        '💀',
        '🤡',
        '🎯',
        '👏',
        '🤦',
        '😳',
      ];

      for (const vibe of createdVibes) {
        // Each vibe gets 2-5 different emoji reactions
        const numEmojis = Math.floor(Math.random() * 4) + 2; // 2-5 different emojis
        const selectedEmojis = emojis
          .sort(() => 0.5 - Math.random())
          .slice(0, numEmojis);

        for (const emoji of selectedEmojis) {
          // Each emoji gets 1-8 reactions from different users
          const numReactions = Math.floor(Math.random() * 8) + 1; // 1-8 reactions
          const reactionUsers = userIds
            .sort(() => 0.5 - Math.random())
            .slice(0, numReactions);

          for (const userId of reactionUsers) {
            // Skip if user created this vibe
            if (userId === vibe.createdById) continue;

            await ctx.runMutation(internal.vibes.reactToVibeForSeed, {
              vibeId: vibe.id,
              emoji: emoji,
              userId: userId,
            });
          }
        }
      }

      const finalVibes = await ctx.runQuery(api.vibes.getAllSimple);
      const finalUsers = await ctx.runQuery(api.users.getAll);

      return {
        success: true,
        message: `Successfully created enhanced seed database with ${finalUsers.length} users, ${finalVibes.length} vibes, extensive ratings, and emoji reactions.`,
        data: {
          usersCreated: finalUsers.length,
          vibesCreated: finalVibes.length,
          features: [
            'Diverse user profiles from different backgrounds',
            'Realistic vibes covering everyday situations',
            'Extensive rating system with reviews',
            'Comprehensive emoji reaction system',
            'Simulated active community engagement',
          ],
        },
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in enhanced seeding:', error);
      return {
        success: false,
        message: `Error creating enhanced seed database: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
