import { action, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { nanoid } from 'nanoid';

// Main seed action - comprehensive development data
export const seed = action({
  handler: async (ctx): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log('Starting seed process...');

    try {
      // Step 1: Clear all existing data
      // eslint-disable-next-line no-console
      console.log('Step 1: Clearing existing data...');
      
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
      
      // Clear each table separately to avoid read limits
      for (const table of tables) {
        let hasMore = true;
        let totalDeleted = 0;
        
        while (hasMore) {
          const result = await (
            ctx as unknown as { runMutation: (fn: unknown, args: unknown) => Promise<unknown> }
          ).runMutation(internal.seed.clearTableBatch, { table });
          totalDeleted += (result as { deleted: number; hasMore: boolean }).deleted;
          hasMore = (result as { deleted: number; hasMore: boolean }).hasMore;
        }
        
        // eslint-disable-next-line no-console
        console.log(`Cleared ${totalDeleted} items from ${table}`);
      }

      // Step 2: Import emoji-mart data
      // eslint-disable-next-line no-console
      console.log('Step 2: Importing emoji-mart data...');
      const emojiResult = (await (
        ctx as unknown as { runMutation: (fn: unknown) => Promise<unknown> }
      ).runMutation(
        internal.migrations['import_emoji_mart_data'].importEmojiMartData
      )) as unknown as {
        imported: number;
        skipped: number;
        total: number;
      };
      // eslint-disable-next-line no-console
      console.log(
        `Imported ${emojiResult.imported} new emojis, skipped ${emojiResult.skipped} existing (${emojiResult.total} total)`
      );

      // Step 3: Create users (20 for good development data)
      // eslint-disable-next-line no-console
      console.log('Step 3: Creating users...');
      const userResult = (await (
        ctx as unknown as {
          runMutation: (fn: unknown, args: unknown) => Promise<unknown>;
        }
      ).runMutation(internal.seed.seedUsers, {
        count: 20,
      })) as unknown as { count: number };
      // eslint-disable-next-line no-console
      console.log(`Created ${userResult.count} users`);

      // Step 4: Create vibes (25 for variety)
      // eslint-disable-next-line no-console
      console.log('Step 4: Creating vibes...');
      const vibeResult = (await (
        ctx as unknown as {
          runMutation: (fn: unknown, args: unknown) => Promise<unknown>;
        }
      ).runMutation(internal.seed.seedVibes, {
        count: 100,
      })) as unknown as { count: number };
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
      const tagResult = (await (
        ctx as unknown as { runMutation: (fn: unknown) => Promise<unknown> }
      ).runMutation(internal.seed.seedTags)) as unknown as {
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
      
      // Step 9: Add images to vibes
      // eslint-disable-next-line no-console
      console.log('Step 9: Adding images to vibes...');
      const imageResult = await ctx.runAction(internal.seedImages.seedVibesWithImages);
      // eslint-disable-next-line no-console
      console.log(`Added images to ${(imageResult as { updated: number }).updated} vibes`);

      // eslint-disable-next-line no-console
      console.log('\n=== Seed Summary ===');
      // eslint-disable-next-line no-console
      console.log(
        `✅ Emojis: ${emojiResult.imported} imported, ${emojiResult.total} total`
      );
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
      console.log(`✅ Images: ${(imageResult as { updated: number }).updated} vibes with images`);
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
      // Process in smaller batches to avoid read limits
      const batchSize = 20; // Reduced batch size to avoid limits
      let totalDeleted = 0;
      let iterations = 0;
      const maxIterations = 200; // Safety limit to prevent infinite loops
      
      // Keep deleting until no more items
      while (iterations < maxIterations) {
        // Take a small batch
        const items = await ctx.db.query(table).take(batchSize);
        
        if (items.length === 0) {
          break;
        }
        
        // Delete this batch
        for (const item of items) {
          await ctx.db.delete(item._id);
        }
        totalDeleted += items.length;
        iterations++;
      }
      
      // eslint-disable-next-line no-console
      console.log(`Cleared ${totalDeleted} items from ${table}`);
    }
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
  {
    title: 'my wifi is down and im having an existential crisis',
    description:
      'been staring at the "no internet connection" dinosaur game for 20 minutes now. scored 847 points though so thats something. starting to wonder if this is what cavemen felt like. might actually have to... *gasp* ...read a physical book. or worse, talk to my roommate',
    tags: [
      'technology',
      'wifi',
      'crisis',
      'funny',
      'modern problems',
      'isolation',
    ],
  },
  {
    title: 'tried to be aesthetic and failed spectacularly',
    description:
      'spent 2 hours arranging my breakfast for the perfect instagram shot. by the time i was done, the avocado toast looked like baby food and my coffee was ice cold. ate it anyway while crying softly. the caption was going to be "morning bliss" but ended up being "why am i like this"',
    tags: [
      'social media',
      'aesthetic',
      'food photography',
      'reality check',
      'instagram vs reality',
      'millennial problems',
    ],
  },
  {
    title: 'discovered my neighbor is living my dream life',
    description:
      'they have a perfectly manicured garden, do yoga at sunrise, and their dog is better groomed than i am. meanwhile im over here eating cereal out of a mug because all my bowls are dirty. pretty sure they can see directly into my disaster of an apartment. time to invest in better curtains... and maybe vegetables',
    tags: [
      'neighbors',
      'comparison',
      'gardening envy',
      'life goals',
      'reality vs expectations',
      'self reflection',
    ],
  },
  {
    title: 'went down a wikipedia rabbit hole for 4 hours',
    description:
      'started researching how to fix my leaky faucet. somehow ended up reading about the mating habits of penguins, the history of shoelaces, and why bananas are berries but strawberries arent. my faucet is still leaking but i now know 47 useless facts. education is wild',
    tags: [
      'wikipedia',
      'procrastination',
      'random knowledge',
      'internet deep dive',
      'distraction',
      'learning',
    ],
  },
  {
    title: 'my houseplant collection has become sentient',
    description:
      'i swear they judge me when i walk by. the monstera definitely rolled its leaves when i forgot to water it tuesday. the snake plant has been giving me the silent treatment for weeks. starting to think they have a group chat where they discuss my inadequate plant parenting skills',
    tags: [
      'plants',
      'plant parent',
      'anthropomorphism',
      'guilt',
      'responsibility',
      'humor',
    ],
  },
  {
    title: 'tried meal prepping and created a science experiment',
    description:
      'what was supposed to be "healthy quinoa bowls" has evolved into something that could probably cure diseases or destroy civilizations. the tupperware is making sounds. pretty sure one container just moved on its own. next week im going back to buying lunch every day',
    tags: [
      'meal prep',
      'cooking fails',
      'food safety',
      'good intentions',
      'reality check',
      'science',
    ],
  },
  {
    title: 'got trapped in a youtube shorts vortex',
    description:
      'went to look up how to fold a fitted sheet. 3 hours later im watching a man rate different types of grass and wondering what happened to my life. still dont know how to fold the sheet. the algorithm has me exactly where it wants me',
    tags: [
      'youtube',
      'algorithm',
      'time wasting',
      'internet addiction',
      'procrastination',
      'modern life',
    ],
  },
  {
    title: 'my grocery store anxiety reached new heights',
    description:
      'spent 15 minutes in the cereal aisle having an existential crisis about whether to buy the healthy cereal that tastes like cardboard or the sugary one that will make me happy but kill me slowly. ended up buying both and a gallon of ice cream. self-care comes in many forms',
    tags: [
      'grocery shopping',
      'decision fatigue',
      'anxiety',
      'food choices',
      'adulting',
      'self care',
    ],
  },
  {
    title: 'discovered my spotify wrapped and questioned everything',
    description:
      'apparently i listened to the same taylor swift song 847 times this year. my top genre is "sad indie folk" which explains a lot about my mental state. spotify really said "we see you" and then proceeded to call me out in front of everyone',
    tags: [
      'spotify',
      'music',
      'self discovery',
      'data analysis',
      'personal habits',
      'music taste',
    ],
  },
  {
    title: 'tried to be productive and organized my desktop',
    description:
      'found files from 2019 that i "definitely needed to keep for later." screenshots of memes, 47 versions of the same document, and something called "untitled folder 3" that contained only a picture of a confused-looking cat. deleted nothing. renamed it all "important stuff 2.0"',
    tags: [
      'organization',
      'digital hoarding',
      'procrastination',
      'files',
      'productivity',
      'chaos',
    ],
  },
  {
    title: 'my delivery driver knows me too well',
    description:
      'they dont even check the address anymore, just drive straight to my building. yesterday they texted "the usual?" at 7pm. we nodded at each other knowingly. this relationship has more consistency than my last three romantic ones',
    tags: [
      'delivery',
      'food delivery',
      'relationships',
      'routine',
      'modern life',
      'connection',
    ],
  },
  {
    title: 'attempted to fix something myself like an adult',
    description:
      'watched 6 youtube tutorials, bought $50 worth of tools for a $10 problem, and somehow made it worse. now my cabinet door hangs at a jaunty angle and makes a sound like a dying whale when opened. calling it "rustic charm" and moving on',
    tags: [
      'diy',
      'home repair',
      'adulting fails',
      'tools',
      'youtube university',
      'acceptance',
    ],
  },
  {
    title: 'went to target for toilet paper',
    description:
      'came home with fairy lights, a succulent named gerald, seasonal candles i dont need, and a throw pillow that "spoke to me." forgot the toilet paper. this is why i cant have nice things or a savings account',
    tags: [
      'target',
      'impulse buying',
      'shopping',
      'budgeting fails',
      'consumerism',
      'decision making',
    ],
  },
  {
    title: 'my autocorrect has trust issues',
    description:
      'it changed "im having a great day" to "im having a grate day" and honestly its not wrong. feeling very cheese-adjacent today. my phone knows me better than i know myself and chooses violence every time i try to text professionally',
    tags: [
      'autocorrect',
      'technology',
      'texting',
      'communication fails',
      'humor',
      'modern problems',
    ],
  },
  {
    title: 'discovered my sleep paralysis demon has good taste',
    description:
      'woke up at 3am to find all my streaming services logged out and my netflix switched to korean rom-coms with 5-star ratings. either im being haunted by someone with excellent entertainment preferences or my subconscious is trying to tell me something about my love life',
    tags: [
      'sleep',
      'streaming',
      'supernatural',
      'entertainment',
      'mystery',
      'comedy',
    ],
  },
  {
    title: 'my google search history reads like a cry for help',
    description:
      '"how to adult," "is it normal to eat ice cream for breakfast," "why do i procrastinate," "can houseplants judge you," "what is the meaning of life," "cute animal videos." in that exact order. within the span of 20 minutes. perfectly balanced, as all things should be',
    tags: [
      'google search',
      'existential crisis',
      'adulting',
      'search history',
      'self awareness',
      'internet habits',
    ],
  },
  {
    title: 'became a parking lot philosopher',
    description:
      'spent 30 minutes in the grocery store parking lot contemplating whether the shopping cart return is a test of moral character. watched three people walk past it with their empty carts and had deep thoughts about society. returned my cart and felt morally superior for exactly 5 minutes',
    tags: [
      'philosophy',
      'moral dilemmas',
      'society',
      'shopping carts',
      'civic duty',
      'parking lots',
    ],
  },
  {
    title: 'my laundry pile achieved sentience',
    description:
      'its been growing in the corner for so long i think it filed for statehood. pretty sure i saw something move in there yesterday. might be time to either do laundry or just burn the whole pile and start fresh. leaning toward the latter honestly',
    tags: [
      'laundry',
      'procrastination',
      'chores',
      'adulting fails',
      'domestic chaos',
      'avoidance',
    ],
  },
  {
    title: 'got emotionally attached to my uber driver',
    description:
      'we had a 15-minute conversation about the meaning of life, shared snacks, and he gave me genuine life advice. rated 5 stars and wrote a novel in the comments. now i want to invite him to thanksgiving but that might cross some boundaries',
    tags: [
      'uber',
      'connection',
      'strangers',
      'life advice',
      'transportation',
      'human connection',
    ],
  },
  {
    title: 'my skincare routine has more steps than nasa launch',
    description:
      'cleanser, toner, serum, moisturizer, eye cream, face oil, and sacrificial offering to the acne gods. takes 45 minutes and costs more than my rent. still wake up looking like a troll but at least its an expensive, well-moisturized troll',
    tags: [
      'skincare',
      'beauty routine',
      'self care',
      'expensive habits',
      'vanity',
      'routine',
    ],
  },
  {
    title: 'discovered my internal monologue has multiple personalities',
    description:
      'theres responsible me who meal preps and goes to bed early, chaotic me who impulse buys vintage furniture at 2am, and philosophical me who questions the nature of existence while brushing teeth. theyre constantly arguing and i just live here',
    tags: [
      'internal monologue',
      'personality',
      'self awareness',
      'mental health',
      'psychology',
      'identity',
    ],
  },
  {
    title: 'my screen time report was a personal attack',
    description:
      'apparently i spent 8 hours a day on my phone this week. thats a full-time job of scrolling. my most used app was "clock" which feels like adding insult to injury. time to touch grass or at least look at it through my window',
    tags: [
      'screen time',
      'phone addiction',
      'digital wellness',
      'time management',
      'self reflection',
      'technology',
    ],
  },
  {
    title: 'became a conspiracy theorist about my washing machine',
    description:
      'it definitely eats socks. i put in 10 pairs and only get back 17 individual socks. where do they go? is there a sock dimension? am i feeding a laundry monster? started leaving offerings of fabric softener just in case',
    tags: [
      'laundry mysteries',
      'conspiracy theories',
      'missing socks',
      'domestic mysteries',
      'household chaos',
      'humor',
    ],
  },
  {
    title: 'my coffee shop barista is my unofficial therapist',
    description:
      'they know my order, my schedule, and somehow always ask "rough day?" at exactly the right moment. paid $6 for a latte and got a 10-minute therapy session. better roi than actual therapy and comes with caffeine',
    tags: [
      'coffee shop',
      'barista',
      'therapy',
      'routine',
      'human connection',
      'caffeine',
    ],
  },
  {
    title: 'tried to be spontaneous and planned it for 3 weeks',
    description:
      'researched "fun spontaneous activities," made a spreadsheet of options, checked weather forecasts, and scheduled calendar time for being spontaneous. realized the irony halfway through and had an existential crisis about my inability to just... be',
    tags: [
      'spontaneity',
      'planning',
      'overthinking',
      'irony',
      'personality quirks',
      'self awareness',
    ],
  },
  {
    title: 'my housekeeping strategy is geological',
    description:
      'organizing my apartment in layers like sedimentary rock. the bottom layer is "things from college," middle layer is "pandemic purchases i regret," and top layer is "current chaos." archaeologists will have a field day with this place',
    tags: [
      'organization',
      'procrastination',
      'archaeology humor',
      'apartment living',
      'clutter',
      'time capsule',
    ],
  },
  {
    title: 'discovered my true calling: professional overthinker',
    description:
      'spent 2 hours analyzing a text that said "k" for hidden meaning. created a presentation with charts and graphs about possible interpretations. conclusion: they probably just hit k instead of ok. but what if they didnt? the mystery continues',
    tags: [
      'overthinking',
      'texting',
      'analysis paralysis',
      'communication',
      'anxiety',
      'investigation',
    ],
  },
  {
    title: 'my amazon cart is a monument to poor impulse control',
    description:
      'currently contains: a banana slicer (for bananas i dont eat), a book about minimalism (ironically), 47 different phone chargers, and something called a "sock organizer" that costs more than actual socks. cart total: my entire paycheck',
    tags: [
      'online shopping',
      'impulse buying',
      'amazon',
      'consumerism',
      'irony',
      'financial decisions',
    ],
  },
  {
    title: 'became a weather app fortune teller',
    description:
      'check it 47 times a day hoping it will change. "oh look, now theres a 31% chance of rain instead of 30%." plan entire outfits around precipitation probabilities. have strong opinions about which weather app is most accurate. this is what adult conversation looks like',
    tags: [
      'weather',
      'apps',
      'routine',
      'adult conversations',
      'obsessive behavior',
      'prediction',
    ],
  },
  {
    title: 'my car became a mobile storage unit',
    description:
      'theres a gym bag from 2019, 47 reusable water bottles, enough napkins to supply a small restaurant, and something that might have been food once. the passenger seat is now just decorative. my car has evolved beyond transportation into pure chaos storage',
    tags: [
      'car',
      'organization',
      'chaos',
      'storage',
      'automotive lifestyle',
      'mess',
    ],
  },
  {
    title: 'discovered my true personality through takeout choices',
    description:
      'monday: healthy salad (optimistic me). tuesday: pizza (realistic me). wednesday: thai food (adventurous me). thursday: same pizza place (consistent me). friday: ice cream for dinner (honest me). the food diary reveals all my personalities',
    tags: [
      'food delivery',
      'personality',
      'self discovery',
      'eating habits',
      'psychology',
      'weekly routine',
    ],
  },
  {
    title: 'mastered the art of productive procrastination',
    description:
      'avoided writing my report by deep cleaning my entire apartment, organizing my photos from 2015, learning origami on youtube, and color-coding my sock drawer. technically accomplished a lot while accomplishing nothing. its a skill really',
    tags: [
      'procrastination',
      'productivity',
      'avoidance',
      'cleaning',
      'multitasking',
      'self deception',
    ],
  },
  {
    title: 'my sleep schedule is in a different timezone',
    description:
      'going to bed at 3am and waking up at 11am. living like im in california while physically being on the east coast. my circadian rhythm filed for divorce and moved out. currently accepting applications for a new biological clock',
    tags: [
      'sleep schedule',
      'night owl',
      'circadian rhythm',
      'late night',
      'sleep hygiene',
      'time zones',
    ],
  },
  {
    title: 'became a documentary narrator of my own life',
    description:
      '"here we see the homo sapiens in their natural habitat, approaching the refrigerator for the seventh time in an hour. they peer inside hopefully, as if new food might have magically appeared. fascinating." my internal monologue has gone full david attenborough',
    tags: [
      'internal monologue',
      'narration',
      'self observation',
      'humor',
      'documentary',
      'consciousness',
    ],
  },
  {
    title: 'my spotify algorithm thinks im having a mental breakdown',
    description:
      'went from taylor swift to death metal to sad indie folk to disney soundtracks all in one session. now its serving me "are you okay?" playlists and meditation music. even artificial intelligence is concerned about my emotional state',
    tags: [
      'spotify',
      'music algorithm',
      'emotional state',
      'mental health',
      'music taste',
      'ai concern',
    ],
  },
  {
    title: 'discovered the secret to happiness: low expectations',
    description:
      'planned to have a productive saturday. instead spent 6 hours watching tiktoks about cats. originally would have been disappointed, but lowered expectations mean this counts as a successful day. lifehack: expect nothing, appreciate everything',
    tags: [
      'happiness',
      'expectations',
      'life philosophy',
      'tiktok',
      'cats',
      'satisfaction',
    ],
  },
  {
    title: 'my houseplants started a union',
    description:
      'theyre demanding better working conditions, consistent watering schedules, and premium soil. the fern is acting as the spokesperson, the snake plant is the enforcer, and the monstera is documenting everything. thinking of hiring a plant lawyer',
    tags: [
      'houseplants',
      'plant care',
      'anthropomorphism',
      'labor unions',
      'responsibility',
      'humor',
    ],
  },
  {
    title: 'achieved enlightenment through grocery store organization',
    description:
      'spent an hour in the cereal aisle contemplating the meaning of life through breakfast choices. corn flakes represent conformity, granola is aspirational health, sugary cereals are pure joy. the grocery store is a metaphor for human existence',
    tags: [
      'grocery shopping',
      'philosophy',
      'existentialism',
      'cereal',
      'metaphors',
      'enlightenment',
    ],
  },
  {
    title: 'my password manager is judging my life choices',
    description:
      'it keeps suggesting "strongpassword123" while i continue using "password" for everything important. the security questions are getting personal too. "what is your biggest regret?" sir this is a banking app not therapy',
    tags: [
      'passwords',
      'cybersecurity',
      'technology',
      'security',
      'digital hygiene',
      'personal data',
    ],
  },
  {
    title: 'discovered im a different person in different lighting',
    description:
      'bathroom mirror: tragic goblin. car mirror: decent human. phone camera: potato. store fitting room: why do i even try. ring light: maybe im actually attractive? lighting is apparently the most important factor in my self esteem',
    tags: [
      'mirrors',
      'lighting',
      'self image',
      'confidence',
      'appearance',
      'photography',
    ],
  },
  {
    title: 'my food delivery apps know me better than my family',
    description:
      'they predict my cravings, remember my dietary restrictions, and send concerned notifications when i havent ordered in 3 days. "are you eating enough vegetables?" no doordash, but thanks for caring more than most humans in my life',
    tags: [
      'food delivery',
      'apps',
      'algorithms',
      'relationships',
      'care',
      'technology',
    ],
  },
  {
    title: 'became a professional meeting muter',
    description:
      'mastered the art of muting just before saying something dumb, unmuting for important points, and strategic nodding while internally screaming. my zoom persona is 47% more professional than real life me. its like being an actor but worse',
    tags: [
      'remote work',
      'zoom meetings',
      'professional persona',
      'communication',
      'work from home',
      'acting',
    ],
  },
  {
    title: 'my browser history tells a story of pure chaos',
    description:
      '"how to fold fitted sheets" followed by "do penguins have knees" followed by "can you die from eating too much cheese" followed by "jobs that dont require human interaction." its like a choose your own adventure book written by anxiety',
    tags: [
      'browser history',
      'internet searches',
      'random questions',
      'curiosity',
      'anxiety',
      'chaos',
    ],
  },
  {
    title: 'discovered i have main character syndrome in grocery stores',
    description:
      'walking down aisles like im in a music video, dramatically contemplating produce choices, having internal monologues about which pasta shape represents my current life phase. the fluorescent lighting is my spotlight, the muzak is my soundtrack',
    tags: [
      'grocery shopping',
      'main character',
      'drama',
      'internal monologue',
      'performance',
      'everyday theater',
    ],
  },
  {
    title: 'my autocorrect has become sentient and passive aggressive',
    description:
      'keeps changing "fine" to "wine" which honestly makes most of my texts more accurate. changed "meeting" to "mating" once and nearly caused an hr incident. its either becoming self-aware or trying to get me fired',
    tags: [
      'autocorrect',
      'technology',
      'ai',
      'communication fails',
      'workplace humor',
      'digital rebellion',
    ],
  },
  {
    title: 'achieved zen through waiting for pizza delivery',
    description:
      'entered a meditative state tracking the driver on the app. "pizza is 3 minutes away" became my mantra. reached spiritual enlightenment when it arrived exactly on time. food delivery apps are the new meditation teachers',
    tags: [
      'food delivery',
      'meditation',
      'waiting',
      'zen',
      'apps',
      'spiritual enlightenment',
    ],
  },
  {
    title: 'my screen time app staged an intervention',
    description:
      'sent me a notification: "you spent 9 hours on your phone yesterday." thanks for the personal attack, ios. followed by "here are some alternatives to screen time" like "go outside" and "read a book." the audacity of this technology',
    tags: [
      'screen time',
      'phone addiction',
      'digital wellness',
      'intervention',
      'technology irony',
      'self awareness',
    ],
  },
  {
    title: 'discovered the true meaning of adulting: pretending to like salad',
    description:
      'ordered a caesar salad at brunch to seem responsible. spent the entire meal thinking about pancakes. told everyone how "refreshing" it was while internally mourning my lost youth. being an adult is just elaborate theater',
    tags: [
      'adulting',
      'healthy eating',
      'salad',
      'pretending',
      'performance',
      'food choices',
    ],
  },
  {
    title: 'my netflix account became a time capsule of poor decisions',
    description:
      '"continue watching" section reveals every questionable late-night viewing choice. why did i start 17 different korean dramas? when did i watch a documentary about competitive dog grooming? my viewing history is more chaotic than my life',
    tags: [
      'netflix',
      'streaming',
      'viewing history',
      'poor decisions',
      'late night',
      'entertainment choices',
    ],
  },
  {
    title: 'achieved enlightenment through laundromat philosophy',
    description:
      'watching clothes spin in circles while contemplating the cyclical nature of existence. the dryer buzzer is the sound of impermanence. folding clothes became a meditation on order vs chaos. laundromats are just temples of temporal existence',
    tags: [
      'laundromat',
      'philosophy',
      'meditation',
      'laundry',
      'existence',
      'contemplation',
    ],
  },
  {
    title: 'my google maps has commitment issues',
    description:
      'keeps recalculating the route every 30 seconds like its having second thoughts. "in 500 feet turn left. actually wait, maybe go straight. you know what, lets try a completely different route." we both have trust issues now',
    tags: [
      'navigation',
      'google maps',
      'technology fails',
      'commitment issues',
      'driving',
      'relationships',
    ],
  },
  {
    title: 'discovered my superpower: finding the longest checkout line',
    description:
      'every single time. doesnt matter how carefully i analyze the options, i will pick the line with the person buying 47 lottery tickets and paying with a checkbook from 1987. its like a curse but more inconvenient',
    tags: [
      'grocery shopping',
      'checkout lines',
      'bad luck',
      'waiting',
      'superpower',
      'retail experience',
    ],
  },
  {
    title: 'my fitbit became my harshest critic',
    description:
      'passive aggressively buzzing when i havent moved in an hour. "only 847 steps today" it says, like its not trapped on my wrist witnessing my entire lifestyle. the step goal mockery is getting personal',
    tags: [
      'fitness tracker',
      'exercise',
      'health goals',
      'passive aggression',
      'technology judgment',
      'motivation',
    ],
  },
  {
    title: 'achieved inner peace through accepting my terrible parking',
    description:
      'stopped trying to park perfectly between the lines. embraced the crooked, slightly over the line aesthetic. my car expresses my inner chaos and thats beautiful. geometric perfection is overrated anyway',
    tags: [
      'parking',
      'acceptance',
      'inner peace',
      'imperfection',
      'driving skills',
      'self acceptance',
    ],
  },
  {
    title: 'my email inbox achieved consciousness and chose violence',
    description:
      'promotional emails multiplying faster than i can delete them. unsubscribe links lead to more subscriptions. pretty sure my email provider is running a psychological experiment. inbox zero is a myth perpetuated by big tech',
    tags: [
      'email',
      'inbox management',
      'spam',
      'digital overwhelm',
      'unsubscribe',
      'technology conspiracy',
    ],
  },
  {
    title: 'discovered the secret language of microwave beeps',
    description:
      'three beeps means "your sad desk lunch is ready." five beeps means "youve abandoned your food again." continuous beeping translates to "why do you do this to both of us." my microwave and i need couples therapy',
    tags: [
      'microwave',
      'food preparation',
      'kitchen appliances',
      'communication',
      'domestic life',
      'relationships',
    ],
  },
  {
    title: 'my social battery died and is refusing to charge',
    description:
      'tried plugging it in with coffee, netflix, and alone time but its still showing low power. might need to replace the whole system. currently running on emergency antisocial backup power until further notice',
    tags: [
      'social battery',
      'introversion',
      'social energy',
      'recharging',
      'alone time',
      'social anxiety',
    ],
  },
  {
    title: 'achieved peak procrastination: organized my procrastination',
    description:
      'made a color-coded spreadsheet of all the things im avoiding. categorized by urgency, difficulty, and how much guilt each task generates. spent 3 hours organizing my avoidance. this might be a new level of self-sabotage',
    tags: [
      'procrastination',
      'organization',
      'spreadsheets',
      'avoidance',
      'productivity paradox',
      'self sabotage',
    ],
  },
  {
    title: 'my brain decided to update its software at 3am',
    description:
      'lying in bed when suddenly it started processing every embarrassing moment from the past decade. "remember when you waved back at someone who wasnt waving at you in 2017?" thanks brain, really needed that firmware update right now',
    tags: [
      'insomnia',
      'embarrassing memories',
      'late night thoughts',
      'brain updates',
      'overthinking',
      'sleep disruption',
    ],
  },
  {
    title: 'discovered my true calling as a professional overthinker',
    description:
      'analyzed a "k" text for 45 minutes. created multiple theories about its meaning, consulted friends, googled "what does k mean in text." turns out they just hit the wrong key. my detective skills are unmatched and completely useless',
    tags: [
      'overthinking',
      'text analysis',
      'communication',
      'detective work',
      'anxiety',
      'mystery solving',
    ],
  },
  {
    title: 'my phone battery has boundary issues',
    description:
      'dies at 23% just to mess with me. claims to be charging but stays at the same percentage for hours. pretty sure its having an existential crisis about its purpose in life. we both need therapy',
    tags: [
      'phone battery',
      'technology problems',
      'boundary issues',
      'charging',
      'electronic devices',
      'relationships',
    ],
  },
  {
    title: 'achieved enlightenment through self-checkout machines',
    description:
      'learned patience through "unexpected item in bagging area." found zen in "please wait for assistance." discovered the meaning of suffering through "please scan your clubcard." self-checkout is just advanced meditation practice',
    tags: [
      'self checkout',
      'patience',
      'meditation',
      'retail technology',
      'frustration',
      'grocery shopping',
    ],
  },
  {
    title: 'my spotify discover weekly thinks im three different people',
    description:
      'serving me death metal, broadway showtunes, and lo-fi study beats in the same playlist. either my music taste is incredibly diverse or the algorithm is having an identity crisis. we both need to figure ourselves out',
    tags: [
      'spotify',
      'music algorithm',
      'identity crisis',
      'music taste',
      'diversity',
      'ai confusion',
    ],
  },
  {
    title: 'discovered i speak fluent passive aggressive',
    description:
      '"thats fine" (its not fine). "whatever you think is best" (your idea is terrible). "no its okay" (please read my mind). apparently ive been bilingual this whole time and my second language is emotional warfare',
    tags: [
      'passive aggressive',
      'communication',
      'emotional language',
      'relationships',
      'hidden meanings',
      'social skills',
    ],
  },
  {
    title: 'my amazon cart became a museum of regret',
    description:
      'items saved for later from 2019 that i definitely dont need now. "portable phone charger for nokia flip phone" and "dvd of a movie that traumatized me." my cart is archaeological evidence of past poor judgment',
    tags: [
      'amazon cart',
      'regret',
      'online shopping',
      'past decisions',
      'consumer culture',
      'digital archaeology',
    ],
  },
  {
    title: 'achieved peak adulting: got excited about a new sponge',
    description:
      'spent 20 minutes in the cleaning aisle comparing scrubbing power. felt genuine joy finding one with the perfect texture. told three people about my sponge discovery. this is what counts as entertainment now apparently',
    tags: [
      'adulting',
      'cleaning supplies',
      'sponges',
      'excitement',
      'domestic life',
      'simple pleasures',
    ],
  },
  {
    title: 'my internal gps has trust issues',
    description:
      'knows exactly where i am but still second-guesses every turn. "wait did we pass that street? should we have turned left? why does this neighborhood look familiar but also completely foreign?" my spatial awareness filed for divorce',
    tags: [
      'navigation',
      'spatial awareness',
      'trust issues',
      'geography',
      'direction sense',
      'internal gps',
    ],
  },
  {
    title: 'discovered the art of strategic vulnerability',
    description:
      'sharing just enough personal trauma to seem relatable but not enough to make people uncomfortable. "haha yeah my childhood was weird" while carefully omitting the actual weird parts. emotional intelligence or manipulation? discuss',
    tags: [
      'vulnerability',
      'social strategy',
      'emotional intelligence',
      'boundaries',
      'sharing',
      'relationships',
    ],
  },
  {
    title: 'my notification badges reached critical mass',
    description:
      '47 unread emails, 23 text messages, 156 instagram notifications, and something called "screen time summary" that i refuse to acknowledge. my phone is screaming for attention but im in denial about my digital responsibilities',
    tags: [
      'notifications',
      'digital overwhelm',
      'unread messages',
      'phone management',
      'avoidance',
      'technology stress',
    ],
  },
  {
    title: 'achieved transcendence through accepting my chaos',
    description:
      'stopped trying to be the person who meal preps and wakes up early. embraced the beautiful disaster energy. my life motto is now "functional dysfunction." found peace in the acceptance of perpetual improvisation',
    tags: [
      'self acceptance',
      'chaos',
      'life philosophy',
      'dysfunction',
      'peace',
      'authenticity',
    ],
  },
  {
    title: 'my autocorrect developed a sense of humor',
    description:
      'changed "ill be there soon" to "ill be there spoon" and honestly it made the conversation more interesting. started deliberately letting it make weird suggestions just to see what chaos unfolds. we make a good comedy team',
    tags: [
      'autocorrect',
      'humor',
      'technology partnership',
      'communication chaos',
      'digital comedy',
      'unexpected friendship',
    ],
  },
  {
    title: 'discovered im a different person on video calls',
    description:
      'video call me is punctual, professional, and has perfect lighting. real me is in pajama pants eating cereal at 3pm. video call me is my aspirational self that exists for 30-minute intervals',
    tags: [
      'video calls',
      'professional persona',
      'work from home',
      'dual identity',
      'performance',
      'zoom personality',
    ],
  },
  {
    title: 'my sleep schedule is performance art',
    description:
      'bedtime ranges from 9pm to 4am depending on the alignment of the planets and my emotional state. wake up time is equally abstract. my circadian rhythm is an avant-garde expression of temporal rebellion',
    tags: [
      'sleep schedule',
      'performance art',
      'circadian rhythm',
      'time rebellion',
      'abstract living',
      'chaos',
    ],
  },
  {
    title: 'achieved nirvana through embracing my basic tendencies',
    description:
      'yes i love pumpkin spice, wear uggs, and quote the office. stopped apologizing for liking popular things. basic is just efficient taste - why reinvent the wheel when the wheel is pumpkin flavored and delicious',
    tags: [
      'basic',
      'popular culture',
      'self acceptance',
      'trends',
      'authenticity',
      'unapologetic',
    ],
  },
  {
    title: 'my google search suggestions reveal my true self',
    description:
      '"how to be an adult" followed by "can dogs eat..." followed by "why am i like this" followed by "cute animal videos." google knows my soul better than my therapist. the search bar is my digital confessional',
    tags: [
      'google search',
      'search suggestions',
      'self discovery',
      'digital confession',
      'internet habits',
      'personal data',
    ],
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
        // Images should be uploaded to Convex storage, not as URLs
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

// Helper function to get contextually relevant reviews based on vibe content
function getContextualReviews(
  vibeTitle: string,
  vibeDescription: string,
  vibeTags: string[]
) {
  const content =
    `${vibeTitle} ${vibeDescription} ${vibeTags.join(' ')}`.toLowerCase();

  // Technology/digital life vibes
  if (
    content.includes('wifi') ||
    content.includes('phone') ||
    content.includes('app') ||
    content.includes('technology') ||
    content.includes('digital') ||
    content.includes('autocorrect') ||
    content.includes('spotify') ||
    content.includes('netflix') ||
    content.includes('algorithm')
  ) {
    return [
      'the algorithm knows me too well',
      'my phone is judging me',
      'technology really said no privacy',
      'ai becoming too relatable',
      'this is why i have trust issues with tech',
      'my data being used for good finally',
      'silicon valley reading my diary again',
      'caught in 4k by the internet',
    ];
  }

  // Food/eating vibes
  if (
    content.includes('food') ||
    content.includes('coffee') ||
    content.includes('cooking') ||
    content.includes('eating') ||
    content.includes('restaurant') ||
    content.includes('delivery') ||
    content.includes('meal') ||
    content.includes('kitchen')
  ) {
    return [
      'this is why i stress eat',
      'food is my love language',
      'my relationship with food > my relationship with humans',
      'eating my feelings and feeling seen',
      'chef kiss to this accuracy',
      'adding this to my food diary',
      'my taste buds are crying',
      'gordon ramsay could never capture this vibe',
    ];
  }

  // Work/productivity vibes
  if (
    content.includes('work') ||
    content.includes('job') ||
    content.includes('meeting') ||
    content.includes('productivity') ||
    content.includes('procrastination') ||
    content.includes('career')
  ) {
    return [
      'sending this to my boss anonymously',
      'this is why i work from home',
      'my productivity coach needs to see this',
      'capitalism has entered the chat',
      'this is going in my resignation letter',
      'hr department triggering intensifies',
      'my work life balance is crying',
      'adding this to my linkedin story',
    ];
  }

  // Sleep/time vibes
  if (
    content.includes('sleep') ||
    content.includes('bed') ||
    content.includes('morning') ||
    content.includes('night') ||
    content.includes('tired') ||
    content.includes('3am') ||
    content.includes('schedule')
  ) {
    return [
      'my circadian rhythm is sobbing',
      'why am i being called out at 3am',
      'this is why i need melatonin',
      'my sleep schedule has left the chat',
      'counting sheep but make it existential',
      'my pillow knows this struggle',
      'insomnia solidarity',
      'why does this hit different at night',
    ];
  }

  // Anxiety/overthinking vibes
  if (
    content.includes('anxiety') ||
    content.includes('overthinking') ||
    content.includes('worry') ||
    content.includes('panic') ||
    content.includes('stress') ||
    content.includes('mental')
  ) {
    return [
      'my therapist warned me about this',
      'anxiety has entered the chat',
      'overthinking olympics gold medal',
      'this is why i need therapy',
      'my brain at 3am energy',
      'calling me out should be illegal',
      'emotional damage but make it relatable',
      'why you gotta expose my inner monologue',
    ];
  }

  // Social/relationship vibes
  if (
    content.includes('friend') ||
    content.includes('social') ||
    content.includes('relationship') ||
    content.includes('dating') ||
    content.includes('people') ||
    content.includes('conversation')
  ) {
    return [
      'this is why im single',
      'my social battery died reading this',
      'sending this to my bestie immediately',
      'why is dating so complicated',
      'this belongs in the group chat',
      'my social skills have left the building',
      'relationship status: its complicated with life',
      'this is why i prefer my cat',
    ];
  }

  // Money/shopping vibes
  if (
    content.includes('money') ||
    content.includes('shopping') ||
    content.includes('buying') ||
    content.includes('amazon') ||
    content.includes('budget') ||
    content.includes('expensive')
  ) {
    return [
      'my bank account is crying',
      'this is why im broke',
      'capitalism really got me good',
      'my financial advisor needs to see this',
      'shopping addiction validation',
      'this is why i cant have nice things',
      'my credit card is shaking',
      'amazon really knows me too well',
    ];
  }

  // Cleaning/organization vibes
  if (
    content.includes('clean') ||
    content.includes('organization') ||
    content.includes('mess') ||
    content.includes('clutter') ||
    content.includes('laundry') ||
    content.includes('apartment')
  ) {
    return [
      'marie kondo could never',
      'my mess is organized chaos',
      'this is why i live in filth',
      'cleaning is just moving dirt around',
      'my apartment is a vibe',
      'organized people scare me',
      'this is modern art actually',
      'my cleaning lady needs hazard pay',
    ];
  }

  // General relatable/funny vibes
  return [
    'totally relate to this',
    'this is exactly how i feel',
    'been there, done that',
    'story of my life',
    'this speaks to my soul',
    'feeling seen right now',
    'why is this so accurate',
    'this hit different today',
    'im in this picture and i dont like it',
    'calling me out like this should be illegal',
    'stop reading my diary',
    'this is a personal attack',
    'finally someone gets it',
    'thought i was the only one',
    'this deserves a pulitzer prize',
    'crying laughing at how true this is',
    'deceased. literally dead',
    'the accuracy is unsettling',
    'main character energy',
    'big mood forever',
    'this unlocked a core memory',
    'emotional damage',
    'said what we were all thinking',
    'this is the gospel truth',
    'facts only',
    'no printer just fax',
  ];
}

// Seed ratings mutation
export const seedRatings = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    const vibes = await ctx.db.query('vibes').collect();

    if (users.length === 0 || vibes.length === 0) {
      throw new Error('No users or vibes found. Please seed them first.');
    }

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
      '😭',
      '💀',
      '🤌',
      '🫶',
      '👌',
      '🤝',
      '🫡',
      '🙃',
      '🤯',
      '🤡',
      '😩',
      '😅',
      '🥲',
      '😌',
      '🤔',
      '👀',
      '🫠',
      '😵‍💫',
      '🥴',
      '🤠',
      '🤓',
      '😎',
      '🥺',
      '😇',
      '🤗',
      '🫥',
      '😮‍💨',
      '🙄',
      '😈',
    ];
    let totalRatings = 0;

    for (const vibe of vibes) {
      // Create 3-8 ratings per vibe
      const ratingCount = Math.floor(Math.random() * 6) + 3;
      const raters = [...users]
        .filter((user) => user.externalId !== vibe.createdById)
        .sort(() => 0.5 - Math.random())
        .slice(0, ratingCount);

      // Get contextually relevant reviews for this vibe
      const contextualReviews = getContextualReviews(
        vibe.title,
        vibe.description,
        vibe.tags || []
      );

      for (const rater of raters) {
        const emoji =
          ratingEmojis[Math.floor(Math.random() * ratingEmojis.length)];
        const value = Math.floor(Math.random() * 2) + 4; // 4-5 stars mostly

        // Use contextual review with 70% probability, fallback to general reviews
        const useContextual = Math.random() < 0.7;
        const reviewPool = useContextual
          ? contextualReviews
          : [
              'totally relate to this',
              'this is exactly how i feel',
              'been there, done that',
              'story of my life',
              'this speaks to my soul',
              'feeling seen right now',
              'why is this so accurate',
              'this hit different today',
            ];

        const review =
          reviewPool[Math.floor(Math.random() * reviewPool.length)];

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

// Internal mutation for seeding production tags
export const seedProductionTagsInternal = internalMutation({
  args: { tagNames: v.array(v.string()) },
  handler: async (ctx, { tagNames }) => {
    const now = Date.now();
    let createdCount = 0;

    for (const tagName of tagNames) {
      const normalizedTag = tagName.toLowerCase().trim();

      // Check if tag already exists
      const existingTag = await ctx.db
        .query('tags')
        .withIndex('byName', (q) => q.eq('name', normalizedTag))
        .first();

      if (!existingTag) {
        await ctx.db.insert('tags', {
          name: normalizedTag,
          count: 0,
          createdAt: now,
          lastUsed: now,
        });
        createdCount++;
      }
    }

    return {
      totalTagsToSeed: tagNames.length,
      newTagsCreated: createdCount,
      message: `Seeded ${createdCount} new tags with 0 counts for production`,
    };
  },
});

// Seed production tags with zero counts
export const seedProductionTags = action({
  handler: async (
    ctx
  ): Promise<{
    totalTagsToSeed: number;
    newTagsCreated: number;
    message: string;
  }> => {
    // All tag names from development environment
    const tagNames = [
      'humor',
      'relationships',
      'procrastination',
      'technology',
      'adulting',
      'communication',
      'chaos',
      'grocery shopping',
      'overthinking',
      'anxiety',
      'organization',
      'avoidance',
      'self awareness',
      'routine',
      'food delivery',
      'productivity',
      'meditation',
      'food',
      'work',
      'self acceptance',
      'performance',
      'apps',
      'internal monologue',
      'philosophy',
      'autocorrect',
      'music taste',
      'self discovery',
      'spotify',
      'relatable',
      'entertainment',
      'connection',
      'frustration',
      'authenticity',
      'domestic life',
      'digital overwhelm',
      'navigation',
      'waiting',
      'work from home',
      'professional persona',
      'personal data',
      'life philosophy',
      'music algorithm',
      'late night',
      'circadian rhythm',
      'sleep schedule',
      'online shopping',
      'irony',
      'digital wellness',
      'phone addiction',
      'screen time',
      'personal habits',
      'data analysis',
      'music',
      'decision fatigue',
      'cereal',
      'existentialism',
      'metaphors',
      'enlightenment',
      'digital hoarding',
      'files',
      'delivery',
      'modern life',
      'diy',
      'home repair',
      'adulting fails',
      'tools',
      'youtube university',
      'acceptance',
      'target',
      'impulse buying',
      'shopping',
      'budgeting fails',
      'consumerism',
      'decision making',
      'texting',
      'communication fails',
      'modern problems',
      'sleep',
      'streaming',
      'supernatural',
      'mystery',
      'comedy',
      'google search',
      'existential crisis',
      'search history',
      'internet habits',
      'moral dilemmas',
      'society',
      'shopping carts',
      'civic duty',
      'parking lots',
      'laundry',
      'chores',
      'domestic chaos',
      'uber',
      'strangers',
      'life advice',
      'transportation',
      'human connection',
      'skincare',
      'beauty routine',
      'self care',
      'expensive habits',
      'vanity',
      'personality',
      'mental health',
      'psychology',
      'identity',
      'time management',
      'self reflection',
      'laundry mysteries',
      'conspiracy theories',
      'missing socks',
      'domestic mysteries',
      'household chaos',
      'coffee shop',
      'barista',
      'therapy',
      'caffeine',
      'spontaneity',
      'planning',
      'personality quirks',
      'archaeology humor',
      'apartment living',
      'clutter',
      'time capsule',
      'analysis paralysis',
      'investigation',
      'financial decisions',
      'weather',
      'prediction',
      'obsessive behavior',
      'car',
      'storage',
      'automotive lifestyle',
      'mess',
      'eating habits',
      'weekly routine',
      'multitasking',
      'self deception',
      'night owl',
      'sleep hygiene',
      'time zones',
      'narration',
      'self observation',
      'documentary',
      'consciousness',
      'emotional state',
      'ai concern',
      'happiness',
      'expectations',
      'tiktok',
      'cats',
      'satisfaction',
      'houseplants',
      'plant care',
      'anthropomorphism',
      'labor unions',
      'responsibility',
      'passwords',
      'cybersecurity',
      'security',
      'digital hygiene',
      'mirrors',
      'lighting',
      'self image',
      'confidence',
      'appearance',
      'photography',
      'algorithms',
      'care',
      'zoom meetings',
      'acting',
      'browser history',
      'internet searches',
      'random questions',
      'curiosity',
      'main character',
      'drama',
      'everyday theater',
      'ai',
      'workplace humor',
      'digital rebellion',
      'meditation',
      'zen',
      'apps',
      'spiritual enlightenment',
      'intervention',
      'technology irony',
      'healthy eating',
      'salad',
      'pretending',
      'food choices',
      'netflix',
      'viewing history',
      'poor decisions',
      'entertainment choices',
      'laundromat',
      'existence',
      'contemplation',
      'google maps',
      'technology fails',
      'commitment issues',
      'bad luck',
      'superpower',
      'retail experience',
      'fitness tracker',
      'exercise',
      'health goals',
      'passive aggression',
      'technology judgment',
      'motivation',
      'parking',
      'acceptance',
      'inner peace',
      'imperfection',
      'driving skills',
      'email',
      'inbox management',
      'spam',
      'unsubscribe',
      'technology conspiracy',
      'microwave',
      'food preparation',
      'kitchen appliances',
      'social battery',
      'introversion',
      'social energy',
      'recharging',
      'alone time',
      'social anxiety',
      'spreadsheets',
      'productivity paradox',
      'self sabotage',
      'insomnia',
      'embarrassing memories',
      'late night thoughts',
      'brain updates',
      'sleep disruption',
      'text analysis',
      'detective work',
      'mystery solving',
      'phone battery',
      'technology problems',
      'boundary issues',
      'charging',
      'electronic devices',
      'self checkout',
      'patience',
      'retail technology',
      'ai confusion',
      'diversity',
      'identity crisis',
      'music algorithm',
      'passive aggressive',
      'emotional language',
      'social skills',
      'hidden meanings',
      'amazon cart',
      'regret',
      'past decisions',
      'consumer culture',
      'digital archaeology',
      'simple pleasures',
      'excitement',
      'sponges',
      'cleaning supplies',
      'adulting',
      'navigation',
      'spatial awareness',
      'trust issues',
      'geography',
      'direction sense',
      'internal gps',
      'vulnerability',
      'social strategy',
      'emotional intelligence',
      'boundaries',
      'sharing',
      'notifications',
      'unread messages',
      'phone management',
      'technology stress',
      'chaos',
      'dysfunction',
      'peace',
      'authenticity',
      'technology partnership',
      'communication chaos',
      'digital comedy',
      'unexpected friendship',
      'video calls',
      'dual identity',
      'zoom personality',
      'performance art',
      'time rebellion',
      'abstract living',
      'basic',
      'popular culture',
      'trends',
      'unapologetic',
      'search suggestions',
      'digital confession',
      'internet habits',
      'personal data',
    ];

    return await ctx.runMutation(internal.seed.seedProductionTagsInternal, {
      tagNames,
    });
  },
});

// Seed production tags with zero counts using tag names array
export const seedProductionTagsFromArray = action({
  args: { tagNames: v.array(v.string()) },
  handler: async (
    ctx,
    { tagNames }
  ): Promise<{
    totalTagsToSeed: number;
    newTagsCreated: number;
    message: string;
  }> => {
    return await ctx.runMutation(internal.tags.seedTagsWithZeroCounts, {
      tagNames,
    });
  },
});

// Seed production tags with counts preserved from dev
export const seedProductionTagsWithCounts = action({
  args: {
    tags: v.array(
      v.object({
        name: v.string(),
        count: v.number(),
      })
    ),
  },
  handler: async (
    ctx,
    { tags }
  ): Promise<{
    totalTagsToSeed: number;
    newTagsCreated: number;
    tagsUpdated: number;
    message: string;
  }> => {
    return await ctx.runMutation(internal.tags.seedTagsWithCounts, { tags });
  },
});

// Clear action - removes all data
export const clear = action({
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
    
    // Clear each table separately to avoid read limits
    for (const table of tables) {
      let hasMore = true;
      let totalDeleted = 0;
      
      while (hasMore) {
        const result = await ctx.runMutation(internal.seed.clearTableBatch, { table });
        totalDeleted += result.deleted;
        hasMore = result.hasMore;
      }
      
      // eslint-disable-next-line no-console
      console.log(`Cleared ${totalDeleted} items from ${table}`);
    }
    
    return { success: true, message: 'All data cleared successfully' };
  },
});

// Internal mutation to clear a batch from a specific table
export const clearTableBatch = internalMutation({
  args: { table: v.string() },
  handler: async (ctx, { table }) => {
    const batchSize = 20;
    const items = await ctx.db.query(table as any).take(batchSize);
    
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    
    return { 
      deleted: items.length,
      hasMore: items.length === batchSize
    };
  },
});
