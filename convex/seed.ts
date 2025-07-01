import { action } from './_generated/server';
import { api, internal } from './_generated/api';

export const clear = action({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx: any): Promise<any> => {
    try {
      // Get all data
      const users = await ctx.runQuery(api.users.getAll);
      const vibes = await ctx.runQuery(api.vibes.getAllSimple);

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
      for (const vibe of vibes) {
        await ctx.db.delete(vibe._id);
      }

      // Delete all users
      for (const user of users) {
        await ctx.db.delete(user._id);
      }

      return {
        success: true,
        message: 'Database cleared successfully',
      };
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

export const seed = action({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx: any): Promise<any> => {
    // console.log('Starting complete seeding process...');

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
      // console.log('Creating users...');
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
      // console.log('Creating vibes...');
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
      // console.log('Mapping vibe IDs...');
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
          // console.log(
          //   `Mapped: ${sampleVibeId} -> ${createdVibe.id} (${createdVibe.title})`
          // );
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
      // console.log('Creating ratings...');
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
      // console.log('Creating reactions...');
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
            uniqueEmojisUsed: [...new Set(reactions.map((r) => r.emoji))]
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
