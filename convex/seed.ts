import { action } from './_generated/server';
import { api } from './_generated/api';

export const clear = action({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx: any): Promise<any> => {
    try {
      // Get all data
      const users = await ctx.runQuery(api.users.getAll);
      const vibes = await ctx.runQuery(api.vibes.getAll);
      
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
      return {
        success: false,
        message: `Error clearing database: ${error}`,
        error,
      };
    }
  },
});

export const seed = action({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx: any): Promise<any> => {
    // Check if we already have ratings/reactions
    console.log('Checking existing data...');
    // We can't directly query from actions, so let's just proceed and let the mutations handle duplicates
    console.log('Proceeding with seeding...');

    try {
      // Get existing vibes and users to work with them
      console.log('Getting existing data...');
      const existingUsers = await ctx.runQuery(api.users.getAll);
      const existingVibes = await ctx.runQuery(api.vibes.getAll);
      
      if (existingUsers.length === 0 || existingVibes.length === 0) {
        return {
          success: false,
          message: 'No existing users or vibes found. Please run the base seeding first.',
        };
      }
      
      console.log(`Found ${existingUsers.length} users and ${existingVibes.length} vibes`);

      // Map existing vibes to our sample data structure
      console.log('Mapping existing vibes...');
      const vibeMap: Record<string, string> = {};
      
      // Try to match existing vibes by title to our sample data
      const titleMap: Record<string, string> = {
        'Losing virginity but lying about not being your first time': 'vibe-1',
        'Being in a public restroom when the lights go out': 'vibe-2', 
        "Finding $20 in old jeans you haven't worn in months": 'vibe-3',
        'Awkward elevator small talk with your boss': 'vibe-4'
      };
      
      for (const existingVibe of existingVibes) {
        const sampleVibeId = titleMap[existingVibe.title];
        if (sampleVibeId) {
          vibeMap[sampleVibeId] = existingVibe.id;
          console.log(`Mapped: ${sampleVibeId} -> ${existingVibe.id} (${existingVibe.title})`);
        }
      }

      // Sample ratings data
      const ratings = [
        // Ratings for vibe-1
        { vibeId: 'vibe-1', userId: 'user-1', rating: 4, review: "Too real. The anxiety of trying to seem experienced while having no clue what you're doing is a universal experience.", date: '2023-05-13T09:15:00Z' },
        { vibeId: 'vibe-1', userId: 'user-3', rating: 5, review: 'The perfect mix of excitement and absolute terror. Been there, regretted that.', date: '2023-05-14T16:42:00Z' },
        { vibeId: 'vibe-1', userId: 'user-4', rating: 3, date: '2023-05-15T11:30:00Z' },
        { vibeId: 'vibe-1', userId: 'user-5', rating: 5, review: 'The mental gymnastics required for this situation deserve an Olympic medal.', date: '2023-05-16T20:18:00Z' },
        
        // Ratings for vibe-2
        { vibeId: 'vibe-2', userId: 'user-1', rating: 2, review: 'Absolutely terrifying. Had this happen at an airport once and I still have nightmares.', date: '2023-06-04T10:22:00Z' },
        { vibeId: 'vibe-2', userId: 'user-2', rating: 1, review: 'Pure horror movie material. -10/10 would not recommend.', date: '2023-06-05T14:37:00Z' },
        { vibeId: 'vibe-2', userId: 'user-4', rating: 2, date: '2023-06-06T09:15:00Z' },
        
        // Ratings for vibe-3
        { vibeId: 'vibe-3', userId: 'user-1', rating: 5, review: "One of life's purest joys. Better than finding money on the street because it's technically already yours.", date: '2023-04-23T15:42:00Z' },
        { vibeId: 'vibe-3', userId: 'user-2', rating: 5, review: "The universe's way of saying 'here's a little treat for making it through another day'.", date: '2023-04-24T09:18:00Z' },
        { vibeId: 'vibe-3', userId: 'user-3', rating: 4, date: '2023-04-25T12:33:00Z' },
        { vibeId: 'vibe-3', userId: 'user-5', rating: 5, review: 'Better than any lottery win. The perfect surprise.', date: '2023-04-26T17:55:00Z' },
        
        // Ratings for vibe-4
        { vibeId: 'vibe-4', userId: 'user-1', rating: 2, review: 'The longest 30 seconds of your life. Every. Single. Time.', date: '2023-07-15T14:22:00Z' },
        { vibeId: 'vibe-4', userId: 'user-2', rating: 3, date: '2023-07-16T10:37:00Z' },
        { vibeId: 'vibe-4', userId: 'user-3', rating: 1, review: "I've started taking the stairs up 8 flights just to avoid this exact situation.", date: '2023-07-17T16:15:00Z' },
        { vibeId: 'vibe-4', userId: 'user-4', rating: 2, review: 'The way time slows down should be studied by physicists.', date: '2023-07-18T11:48:00Z' },
      ];

      // Create ratings using the mapped vibe IDs
      console.log('Creating ratings...');
      for (const rating of ratings) {
        const actualVibeId = vibeMap[rating.vibeId];
        if (actualVibeId) {
          await ctx.runMutation(api.vibes.addRating, {
            vibeId: actualVibeId,
            userId: rating.userId,
            rating: rating.rating,
            review: rating.review,
          });
        } else {
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
      console.log('Creating reactions...');
      for (const reaction of reactions) {
        const actualVibeId = vibeMap[reaction.vibeId];
        if (actualVibeId) {
          await ctx.runMutation(api.vibes.reactToVibe, {
            vibeId: actualVibeId,
            emoji: reaction.emoji,
            userId: reaction.userId,
          });
        } else {
          console.warn(`Could not find vibe ID for: ${reaction.vibeId}`);
        }
      }

      return {
        success: true,
        message: `Successfully seeded ratings and reactions for ${Object.keys(vibeMap).length} vibes with ${ratings.length} ratings and ${reactions.length} emoji reactions.`,
        data: {
          vibesMapped: Object.keys(vibeMap).length,
          ratingsCreated: ratings.length,
          reactionsCreated: reactions.length,
          details: {
            ratingsWithReviews: ratings.filter(r => r.review).length,
            ratingsWithoutReviews: ratings.filter(r => !r.review).length,
            uniqueEmojisUsed: [...new Set(reactions.map(r => r.emoji))].length,
          }
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Error seeding database: ${error}`,
        error,
      };
    }
  },
});
