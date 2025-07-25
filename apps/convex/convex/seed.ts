import { action, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { nanoid } from 'nanoid';

// Import emojis from organized files
import { smileyEmojis } from './seed/emojis/smileys';
import { peopleEmojis } from './seed/emojis/people';
import { animalEmojis } from './seed/emojis/animals';
import { foodEmojis } from './seed/emojis/food';
import { activityEmojis } from './seed/emojis/activities';
import { travelEmojis } from './seed/emojis/travel';
import { objectEmojis } from './seed/emojis/objects';
import { symbolEmojis } from './seed/emojis/symbols';
import type { Emoji } from './schema';

// Combine all emoji arrays
const allEmojis = [
  ...smileyEmojis,
  ...peopleEmojis,
  ...animalEmojis,
  ...foodEmojis,
  ...activityEmojis,
  ...travelEmojis,
  ...objectEmojis,
  ...symbolEmojis,
];

// Helper function to determine sentiment based on emoji characteristics
function getSentiment(emoji: Omit<Emoji, 'sentiment'>): Emoji['sentiment'] {
  const { name, keywords, tags } = emoji;
  const text =
    `${name} ${keywords.join(' ')} ${(tags || []).join(' ')}`.toLowerCase();

  // Positive indicators
  if (
    text.includes('smile') ||
    text.includes('happy') ||
    text.includes('joy') ||
    text.includes('love') ||
    text.includes('heart') ||
    text.includes('star') ||
    text.includes('celebrate') ||
    text.includes('party') ||
    text.includes('win') ||
    text.includes('success') ||
    text.includes('thumbs up') ||
    text.includes('good')
  ) {
    return 'positive';
  }

  // Negative indicators
  if (
    text.includes('sad') ||
    text.includes('cry') ||
    text.includes('angry') ||
    text.includes('fear') ||
    text.includes('sick') ||
    text.includes('dead') ||
    text.includes('thumbs down') ||
    text.includes('bad') ||
    text.includes('hate')
  ) {
    return 'negative';
  }

  // Default to neutral
  return 'neutral';
}

// Main seed action - comprehensive development data
export const seed = action({
  handler: async (ctx): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log('Starting seed process...');

    try {
      // Step 1: Clear all existing data
      // eslint-disable-next-line no-console
      console.log('Step 1: Clearing existing data...');
      await ctx.runMutation(internal.seed.clearAllData);

      // Step 2: Seed emoji database
      // eslint-disable-next-line no-console
      console.log('Step 2: Seeding emoji database...');
      const emojiResult = (await ctx.runMutation(internal.seed.seedEmojis)) as {
        count: number;
      };
      // eslint-disable-next-line no-console
      console.log(`Seeded ${emojiResult.count} emojis`);

      // Step 3: Create users (20 for good development data)
      // eslint-disable-next-line no-console
      console.log('Step 3: Creating users...');
      const userResult = (await ctx.runMutation(internal.seed.seedUsers, {
        count: 20,
      })) as { count: number };
      // eslint-disable-next-line no-console
      console.log(`Created ${userResult.count} users`);

      // Step 4: Create vibes (25 for variety)
      // eslint-disable-next-line no-console
      console.log('Step 4: Creating vibes...');
      const vibeResult = (await ctx.runMutation(internal.seed.seedVibes, {
        count: 25,
      })) as { count: number };
      // eslint-disable-next-line no-console
      console.log(`Created ${vibeResult.count} vibes`);

      // Step 5: Create ratings
      // eslint-disable-next-line no-console
      console.log('Step 5: Creating ratings...');
      const ratingResult = (await ctx.runMutation(
        internal.seed.seedRatings
      )) as { count: number };
      // eslint-disable-next-line no-console
      console.log(`Created ${ratingResult.count} ratings`);

      // Step 6: Create tags from vibes
      // eslint-disable-next-line no-console
      console.log('Step 6: Creating tags...');
      const tagResult = (await ctx.runMutation(internal.seed.seedTags)) as {
        count: number;
      };
      // eslint-disable-next-line no-console
      console.log(`Created ${tagResult.count} tags`);

      // Step 7: Create search data
      // eslint-disable-next-line no-console
      console.log('Step 7: Creating search data...');
      const searchResult = (await ctx.runMutation(
        internal.seed.seedSearchData
      )) as { searchHistory: number; trending: number };
      // eslint-disable-next-line no-console
      console.log(
        `Created ${searchResult.searchHistory} search history items and ${searchResult.trending} trending searches`
      );

      // Step 8: Create search metrics
      // eslint-disable-next-line no-console
      console.log('Step 8: Creating search metrics...');
      const metricsResult = (await ctx.runMutation(
        internal.seed.seedSearchMetrics
      )) as { count: number };
      // eslint-disable-next-line no-console
      console.log(`Created ${metricsResult.count} search metrics`);

      // eslint-disable-next-line no-console
      console.log('\n=== Seed Summary ===');
      // eslint-disable-next-line no-console
      console.log(`✅ Emojis: ${emojiResult.count}`);
      // eslint-disable-next-line no-console
      console.log(`✅ Users: ${userResult.count}`);
      // eslint-disable-next-line no-console
      console.log(`✅ Vibes: ${vibeResult.count}`);
      // eslint-disable-next-line no-console
      console.log(`✅ Ratings: ${ratingResult.count}`);
      // eslint-disable-next-line no-console
      console.log(`✅ Tags: ${tagResult.count}`);
      // eslint-disable-next-line no-console
      console.log(`✅ Search History: ${searchResult.searchHistory}`);
      // eslint-disable-next-line no-console
      console.log(`✅ Trending Searches: ${searchResult.trending}`);
      // eslint-disable-next-line no-console
      console.log(`✅ Search Metrics: ${metricsResult.count}`);
      // eslint-disable-next-line no-console
      console.log('\nSeed completed successfully! 🎉');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Seed failed:', error);
      throw error;
    }
  },
});

// Clear all data from all tables
export const clearAllData = internalMutation({
  handler: async (ctx) => {
    const tables = [
      'users',
      'vibes',
      'ratings',
      'emojis',
      'searchHistory',
      'trendingSearches',
      'searchMetrics',
      'tags',
      'migrations',
    ] as const;

    for (const table of tables) {
      const items = await ctx.db.query(table).collect();
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
      // eslint-disable-next-line no-console
      console.log(`Cleared ${items.length} items from ${table}`);
    }
  },
});

// Seed emojis mutation
export const seedEmojis = internalMutation({
  handler: async (ctx) => {
    let count = 0;

    for (const emojiData of allEmojis) {
      // Add sentiment to the emoji data
      const completeEmoji: Emoji = {
        ...emojiData,
        sentiment: getSentiment(emojiData),
      };

      await ctx.db.insert('emojis', completeEmoji);
      count++;
    }

    return { count };
  },
});

// User profiles data
const userProfiles = [
  {
    username: 'alex_chen',
    first_name: 'Alex',
    last_name: 'Chen',
    bio: 'software engineer who loves hiking and photography',
    interests: ['technology', 'outdoors', 'photography', 'travel'],
  },
  {
    username: 'maria_garcia',
    first_name: 'Maria',
    last_name: 'Garcia',
    bio: 'chef and food blogger exploring world cuisines',
    interests: ['food', 'cooking', 'travel', 'culture'],
  },
  {
    username: 'james_wilson',
    first_name: 'James',
    last_name: 'Wilson',
    bio: 'freelance designer and coffee enthusiast',
    interests: ['design', 'coffee', 'art', 'minimalism'],
  },
  {
    username: 'sarah_johnson',
    first_name: 'Sarah',
    last_name: 'Johnson',
    bio: 'yoga instructor and wellness advocate',
    interests: ['fitness', 'wellness', 'meditation', 'nature'],
  },
  {
    username: 'david_kim',
    first_name: 'David',
    last_name: 'Kim',
    bio: 'startup founder and tech enthusiast',
    interests: ['startups', 'technology', 'entrepreneurship', 'innovation'],
  },
  {
    username: 'emma_thompson',
    first_name: 'Emma',
    last_name: 'Thompson',
    bio: 'teacher and lifelong learner',
    interests: ['education', 'books', 'history', 'languages'],
  },
  {
    username: 'michael_brown',
    first_name: 'Michael',
    last_name: 'Brown',
    bio: 'musician and audio engineer',
    interests: ['music', 'production', 'technology', 'concerts'],
  },
  {
    username: 'lisa_anderson',
    first_name: 'Lisa',
    last_name: 'Anderson',
    bio: 'environmental scientist and activist',
    interests: ['environment', 'science', 'sustainability', 'activism'],
  },
  {
    username: 'ryan_patel',
    first_name: 'Ryan',
    last_name: 'Patel',
    bio: 'game developer and esports fan',
    interests: ['gaming', 'development', 'esports', 'technology'],
  },
  {
    username: 'jennifer_davis',
    first_name: 'Jennifer',
    last_name: 'Davis',
    bio: 'nurse and community volunteer',
    interests: ['healthcare', 'community', 'volunteering', 'wellness'],
  },
  {
    username: 'carlos_rodriguez',
    first_name: 'Carlos',
    last_name: 'Rodriguez',
    bio: 'architect with a passion for sustainable design',
    interests: ['architecture', 'sustainability', 'design', 'urban planning'],
  },
  {
    username: 'amanda_lewis',
    first_name: 'Amanda',
    last_name: 'Lewis',
    bio: 'fashion designer and vintage collector',
    interests: ['fashion', 'vintage', 'design', 'sustainability'],
  },
  {
    username: 'kevin_ng',
    first_name: 'Kevin',
    last_name: 'Ng',
    bio: 'data scientist and machine learning enthusiast',
    interests: ['data science', 'AI', 'technology', 'research'],
  },
  {
    username: 'rachel_white',
    first_name: 'Rachel',
    last_name: 'White',
    bio: 'travel blogger and digital nomad',
    interests: ['travel', 'culture', 'photography', 'writing'],
  },
  {
    username: 'daniel_martinez',
    first_name: 'Daniel',
    last_name: 'Martinez',
    bio: 'personal trainer and nutrition coach',
    interests: ['fitness', 'nutrition', 'sports', 'wellness'],
  },
  {
    username: 'sophia_taylor',
    first_name: 'Sophia',
    last_name: 'Taylor',
    bio: 'artist and gallery curator',
    interests: ['art', 'galleries', 'culture', 'creativity'],
  },
  {
    username: 'nathan_harris',
    first_name: 'Nathan',
    last_name: 'Harris',
    bio: 'filmmaker and storyteller',
    interests: ['film', 'storytelling', 'creativity', 'technology'],
  },
  {
    username: 'olivia_clark',
    first_name: 'Olivia',
    last_name: 'Clark',
    bio: 'psychologist and mental health advocate',
    interests: ['psychology', 'mental health', 'wellness', 'research'],
  },
  {
    username: 'ethan_walker',
    first_name: 'Ethan',
    last_name: 'Walker',
    bio: 'chef specializing in farm-to-table cuisine',
    interests: ['cooking', 'sustainability', 'food', 'farming'],
  },
  {
    username: 'mia_robinson',
    first_name: 'Mia',
    last_name: 'Robinson',
    bio: 'marine biologist and ocean conservation advocate',
    interests: ['ocean', 'marine biology', 'conservation', 'science'],
  },
];

// Seed users mutation
export const seedUsers = internalMutation({
  args: { count: v.number() },
  handler: async (ctx, { count }) => {
    const usersToCreate = userProfiles.slice(0, count);
    const createdUsers = [];

    for (const profile of usersToCreate) {
      const userId = await ctx.db.insert('users', {
        externalId: `seed_${profile.username}`,
        username: profile.username,
        first_name: profile.first_name,
        last_name: profile.last_name,
        bio: profile.bio,
        interests: profile.interests,
        onboardingCompleted: true,
        created_at: Date.now(),
        updated_at: Date.now(),
        last_sign_in_at:
          Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
        last_active_at:
          Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000),
      });

      createdUsers.push({ id: userId, ...profile });
    }

    return { count: createdUsers.length, users: createdUsers };
  },
});

// Vibe templates
const vibeTemplates = [
  {
    title: 'just discovered the perfect coffee shop',
    description:
      'hidden gem downtown with amazing espresso and the coziest reading nook. they have plants everywhere and play lo-fi hip hop. already planning my next visit',
    tags: ['coffee', 'cozy', 'discovery', 'relaxation'],
  },
  {
    title: 'finally finished that project',
    description:
      'after weeks of late nights and countless revisions, its done. feeling that mix of exhaustion and pure satisfaction. time to celebrate',
    tags: ['achievement', 'work', 'relief', 'success'],
  },
  {
    title: 'unexpected rain during my run',
    description:
      'started as a disaster but ended up being the most refreshing experience. sometimes the best moments are unplanned',
    tags: ['running', 'rain', 'spontaneous', 'exercise'],
  },
  {
    title: 'cooking dinner for friends',
    description:
      'trying a new recipe and hoping it turns out edible. kitchen smells amazing though. fingers crossed',
    tags: ['cooking', 'friends', 'food', 'social'],
  },
  {
    title: 'sunday morning farmers market',
    description:
      'fresh flowers, local honey, and the best strawberries ive ever tasted. love supporting local vendors',
    tags: ['farmers market', 'local', 'food', 'weekend'],
  },
  {
    title: 'learning a new skill is humbling',
    description:
      'started pottery classes and everything i make looks like abstract art. but hey, its therapeutic',
    tags: ['learning', 'pottery', 'creative', 'growth'],
  },
  {
    title: 'apartment hunting adventures',
    description:
      'saw 5 places today. one had a bathtub in the kitchen. another had no windows. the search continues',
    tags: ['apartment', 'adulting', 'city life', 'frustration'],
  },
  {
    title: 'reconnected with an old friend',
    description:
      'grabbed lunch and talked for hours like no time had passed. some friendships really do pick up right where they left off',
    tags: ['friendship', 'nostalgia', 'connection', 'social'],
  },
  {
    title: 'first day at the new job',
    description:
      'everyone seems nice, got lost twice trying to find the bathroom, and already have impostor syndrome. typical first day vibes',
    tags: ['work', 'new job', 'nervous', 'career'],
  },
  {
    title: 'tried meditation for the first time',
    description:
      'spent 10 minutes thinking about my grocery list. apparently thats normal. going to keep at it',
    tags: ['meditation', 'wellness', 'mindfulness', 'self-care'],
  },
  {
    title: 'plant parent struggles',
    description:
      'my succulent is dying and its supposed to be impossible to kill. starting to question my nurturing abilities',
    tags: ['plants', 'home', 'struggle', 'humor'],
  },
  {
    title: 'concert last night was incredible',
    description:
      'ears still ringing but soul is full. live music hits different. already looking for the next show',
    tags: ['music', 'concert', 'nightlife', 'entertainment'],
  },
  {
    title: 'working from a cafe today',
    description:
      'change of scenery doing wonders for productivity. plus the background noise is oddly focusing',
    tags: ['remote work', 'cafe', 'productivity', 'work'],
  },
  {
    title: 'started reading again',
    description:
      'forgot how much i missed getting lost in a good book. already on chapter 5 and cant put it down',
    tags: ['reading', 'books', 'hobby', 'relaxation'],
  },
  {
    title: 'weekend road trip vibes',
    description:
      'no destination in mind, just good music and open roads. sometimes the journey really is the destination',
    tags: ['travel', 'road trip', 'adventure', 'spontaneous'],
  },
  {
    title: 'trying to adult but failing',
    description:
      'ate cereal for dinner three nights in a row. at least im consistent',
    tags: ['adulting', 'food', 'humor', 'relatable'],
  },
  {
    title: 'neighborhood cat adopted me',
    description:
      'shows up every morning for pets and treats. guess im a cat person now',
    tags: ['cats', 'pets', 'cute', 'daily life'],
  },
  {
    title: 'cleaned my entire apartment',
    description:
      'found things i forgot i owned. feeling like a whole new person in this organized space',
    tags: ['cleaning', 'organization', 'home', 'productivity'],
  },
  {
    title: 'sunset from my balcony tonight',
    description:
      'sky looked like a painting. moments like these make city living worth it',
    tags: ['sunset', 'nature', 'beauty', 'mindfulness'],
  },
  {
    title: 'group project flashbacks',
    description:
      'why do i always end up doing 90% of the work. some things never change',
    tags: ['work', 'teamwork', 'frustration', 'relatable'],
  },
  {
    title: 'discovered a new podcast',
    description: 'already 10 episodes deep. my commute just got so much better',
    tags: ['podcast', 'entertainment', 'discovery', 'commute'],
  },
  {
    title: 'meal prep sunday',
    description:
      'future me will thank current me. or get bored of chicken and rice by wednesday',
    tags: ['meal prep', 'healthy', 'planning', 'food'],
  },
  {
    title: 'vintage shopping finds',
    description:
      'scored the perfect denim jacket for $15. thrift stores are treasure troves',
    tags: ['shopping', 'vintage', 'fashion', 'deals'],
  },
  {
    title: 'morning yoga changed my day',
    description: 'actually touched my toes for the first time. small victories',
    tags: ['yoga', 'fitness', 'morning', 'wellness'],
  },
  {
    title: 'late night thoughts',
    description:
      'why did i say that awkward thing 5 years ago. brain please let me sleep',
    tags: ['anxiety', 'night', 'overthinking', 'relatable'],
  },
];

// Seed vibes mutation
export const seedVibes = internalMutation({
  args: { count: v.number() },
  handler: async (ctx, { count }) => {
    const users = await ctx.db.query('users').collect();
    if (users.length === 0) {
      throw new Error('No users found. Please seed users first.');
    }

    const vibesToCreate = vibeTemplates.slice(0, count);
    const createdVibes = [];

    for (const template of vibesToCreate) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const vibeId = nanoid();

      await ctx.db.insert('vibes', {
        id: vibeId,
        title: template.title,
        description: template.description,
        tags: template.tags,
        createdById: randomUser.externalId,
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
        ).toISOString(),
      });

      createdVibes.push({
        id: vibeId,
        ...template,
        createdById: randomUser.externalId,
      });
    }

    return { count: createdVibes.length, vibes: createdVibes };
  },
});

// Seed ratings mutation
export const seedRatings = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    const vibes = await ctx.db.query('vibes').collect();

    if (users.length === 0 || vibes.length === 0) {
      throw new Error('No users or vibes found. Please seed them first.');
    }

    const reviewTemplates = [
      'totally relate to this',
      'this is exactly how i feel',
      'been there, done that',
      'story of my life',
      'couldnt have said it better',
      'this speaks to my soul',
      'feeling seen right now',
      'why is this so accurate',
      'adding this to my daily mood',
      'this hit different today',
      'needed to see this',
      'perfectly captures the vibe',
      'living for this energy',
      'this is the mood',
      'same energy every day',
      'this is too real',
      'catching these vibes',
      'this is everything',
      'mood permanently set to this',
      'vibing with this heavy',
    ];

    const ratingEmojis = [
      '😊',
      '😂',
      '❤️',
      '🔥',
      '✨',
      '💯',
      '🙌',
      '👏',
      '💪',
      '🎯',
    ];
    let totalRatings = 0;

    for (const vibe of vibes) {
      // Create 3-8 ratings per vibe
      const ratingCount = Math.floor(Math.random() * 6) + 3;
      const raters = [...users]
        .filter((user) => user.externalId !== vibe.createdById)
        .sort(() => 0.5 - Math.random())
        .slice(0, ratingCount);

      for (const rater of raters) {
        const emoji =
          ratingEmojis[Math.floor(Math.random() * ratingEmojis.length)];
        const value = Math.floor(Math.random() * 2) + 4; // 4-5 stars mostly
        const review =
          reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];

        await ctx.db.insert('ratings', {
          vibeId: vibe.id,
          userId: rater.externalId,
          emoji: emoji,
          value: value,
          review: review,
          createdAt: new Date(
            Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
          ).toISOString(),
        });

        totalRatings++;
      }
    }

    return { count: totalRatings };
  },
});

// Seed tags mutation - creates tags from all vibes
export const seedTags = internalMutation({
  handler: async (ctx) => {
    const vibes = await ctx.db.query('vibes').collect();

    // Collect all unique tags from vibes
    const tagCounts = new Map<string, number>();

    for (const vibe of vibes) {
      if (vibe.tags && vibe.tags.length > 0) {
        for (const tag of vibe.tags) {
          const normalizedTag = tag.toLowerCase().trim();
          tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
        }
      }
    }

    // Create tag entries in the database
    const now = Date.now();
    let createdCount = 0;

    for (const [tagName, count] of tagCounts.entries()) {
      await ctx.db.insert('tags', {
        name: tagName,
        count: count,
        createdAt: now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in last 30 days
        lastUsed: now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
      });
      createdCount++;
    }

    return { count: createdCount };
  },
});

// Seed search data mutation
export const seedSearchData = internalMutation({
  handler: async (ctx) => {
    // Create trending searches
    const trendingTerms = [
      { term: 'coffee', category: 'tag', count: 145 },
      { term: 'work', category: 'tag', count: 132 },
      { term: 'weekend', category: 'tag', count: 128 },
      { term: 'food', category: 'tag', count: 115 },
      { term: 'relatable', category: 'tag', count: 108 },
      { term: 'morning vibes', category: 'vibe', count: 95 },
      { term: 'alex_chen', category: 'user', count: 87 },
      { term: 'productivity', category: 'tag', count: 82 },
      { term: 'self care', category: 'vibe', count: 78 },
      { term: 'fitness', category: 'tag', count: 71 },
      { term: 'cooking', category: 'tag', count: 68 },
      { term: 'city life', category: 'vibe', count: 64 },
      { term: 'wellness', category: 'tag', count: 59 },
      { term: 'friday mood', category: 'vibe', count: 54 },
      { term: 'mindfulness', category: 'tag', count: 48 },
    ];

    for (const trending of trendingTerms) {
      await ctx.db.insert('trendingSearches', {
        ...trending,
        lastUpdated:
          Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000),
      });
    }

    // Create search history
    const searchQueries = [
      'coffee shops',
      'morning routine',
      'work from home',
      'weekend vibes',
      'fitness motivation',
      'cooking tips',
      'self care sunday',
      'productivity hacks',
      'mental health',
      'creative inspiration',
    ];

    const users = await ctx.db.query('users').collect();
    const activeUsers = [...users]
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(10, users.length));
    let searchHistoryCount = 0;

    for (const user of activeUsers) {
      const userSearchCount = Math.floor(Math.random() * 5) + 1;
      const userSearches = [...searchQueries]
        .sort(() => 0.5 - Math.random())
        .slice(0, userSearchCount);

      for (const query of userSearches) {
        await ctx.db.insert('searchHistory', {
          userId: user.externalId,
          query: query,
          timestamp:
            Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
          resultCount: Math.floor(Math.random() * 20) + 5,
        });
        searchHistoryCount++;
      }
    }

    return {
      trending: trendingTerms.length,
      searchHistory: searchHistoryCount,
    };
  },
});

// Seed search metrics mutation
export const seedSearchMetrics = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    const vibes = await ctx.db.query('vibes').collect();

    let metricsCount = 0;
    const searchQueries = ['coffee', 'work', 'weekend', 'food', 'fitness'];

    // Create 50 search metrics
    for (let i = 0; i < 50; i++) {
      const query =
        searchQueries[Math.floor(Math.random() * searchQueries.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const timestamp =
        Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);

      // 80% search, 15% click, 5% error
      const rand = Math.random();
      let type: 'search' | 'click' | 'error';
      if (rand < 0.8) type = 'search';
      else if (rand < 0.95) type = 'click';
      else type = 'error';

      const metric: {
        timestamp: number;
        type: 'search' | 'click' | 'error';
        query: string;
        userId?: string;
        resultCount?: number;
        responseTime?: number;
        clickedResultId?: string;
        clickedResultType?: 'vibe' | 'user' | 'tag';
        clickPosition?: number;
        error?: string;
      } = {
        timestamp,
        type,
        query,
        userId: user?.externalId,
      };

      if (type === 'search') {
        metric.resultCount = Math.floor(Math.random() * 20) + 1;
        metric.responseTime = Math.floor(Math.random() * 500) + 100;
      } else if (type === 'click') {
        const vibe = vibes[Math.floor(Math.random() * vibes.length)];
        metric.clickedResultId = vibe?.id;
        metric.clickedResultType = 'vibe';
        metric.clickPosition = Math.floor(Math.random() * 10) + 1;
      } else {
        metric.error = 'Search timeout';
      }

      await ctx.db.insert('searchMetrics', metric);
      metricsCount++;
    }

    return { count: metricsCount };
  },
});

// Clear action - removes all data
export const clear = action({
  handler: async (ctx) => {
    await ctx.runMutation(internal.seed.clearAllData);
    return { success: true, message: 'All data cleared successfully' };
  },
});
