import {
  query,
  mutation,
  internalMutation,
  type MutationCtx,
} from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';

// Constants for the points system
const BASE_VIBE_POINTS = 10;
const BASE_REVIEW_POINTS = 5;
const BASE_RECEIVE_REVIEW_POINTS = 2;
const DAILY_EARN_CAP = 50;
const DAILY_POST_CAP = 3;
const DAILY_REVIEW_CAP = 10;
const LEVEL_UP_BONUS = 20;
const DAILY_STREAK_BONUS = 5;

// Constants for point transfer system
const RATING_BOOST_TRANSFER = 2; // Points transferred when boosting a rating
const RATING_DAMPEN_PENALTY = 1; // Points deducted when dampening a rating
const MAX_DAMPEN_PER_DAY = 10; // Maximum dampens per user per day
const MIN_PROTECTED_POINTS = 20; // Minimum points that can't be dampened
const MAX_DAMPEN_PENALTY = 5; // Maximum points that can be deducted per dampen
const NEW_USER_PROTECTED_DAYS = 7; // Days of protection for new users

// Helper function to get current date string (YYYY-MM-DD)
function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Calculate user level based on total points earned
function calculateLevel(totalPoints: number): number {
  return Math.floor(totalPoints / 100) + 1;
}

// Calculate multiplier - logarithmic scaling that decreases as points increase
function calculateMultiplier(totalPoints: number): number {
  // Starts at 1.0, approaches 0.1 as points increase
  return Math.max(0.1, 1 / (1 + Math.log10(totalPoints / 100 + 1)));
}

// Calculate dynamic cost for boosting/dampening content
function calculateBoostCost(currentBoostScore: number = 0): number {
  // Base cost of 5 points, increases with existing boost score
  return Math.ceil(5 * (1 + Math.abs(currentBoostScore) / 10));
}

// Calculate boost transfer amount based on voter and target levels
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculateBoostTransfer(
  voterLevel: number,
  targetLevel: number
): number {
  // Base transfer amount, slightly higher for lower-level targets
  const levelDifference = Math.max(1, targetLevel - voterLevel);
  const multiplier = levelDifference > 0 ? 1 : 1.2; // Boost for helping newer users
  return Math.ceil(RATING_BOOST_TRANSFER * multiplier);
}

// Calculate dampen penalty with protections
function calculateDampenPenalty(
  targetBalance: number,
  protectedPoints: number = 0,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dampenCount: number = 0,
  karmaScore: number = 0
): number {
  // Calculate effective balance (excluding protected points)
  const effectiveBalance = Math.max(0, targetBalance - protectedPoints);

  // Reduce penalty if user has low effective balance
  const balanceMultiplier =
    effectiveBalance > 50 ? 1 : Math.max(0.2, effectiveBalance / 50);

  // Reduce penalty for users with good karma
  const karmaMultiplier =
    karmaScore > 0 ? Math.max(0.5, 1 - karmaScore / 100) : 1;

  // Increase penalty for users with bad karma
  const badKarmaMultiplier =
    karmaScore < 0 ? Math.min(2, 1 + Math.abs(karmaScore / 50)) : 1;

  let penalty =
    RATING_DAMPEN_PENALTY *
    balanceMultiplier *
    karmaMultiplier *
    badKarmaMultiplier;

  // Cap the penalty
  penalty = Math.min(penalty, MAX_DAMPEN_PENALTY);
  penalty = Math.min(penalty, effectiveBalance); // Can't take more than available

  return Math.ceil(penalty);
}

// Check if user is protected from dampening
function isUserProtected(userPoints: Doc<'userPoints'>): boolean {
  const accountAge = Date.now() - (userPoints._creationTime || 0);
  const daysOld = accountAge / (1000 * 60 * 60 * 24);

  // Protect new users for specified days
  if (daysOld < NEW_USER_PROTECTED_DAYS) {
    return true;
  }

  // Protect users with very low balance
  const effectiveBalance = Math.max(
    0,
    userPoints.currentBalance - (userPoints.protectedPoints || 0)
  );
  return effectiveBalance <= MIN_PROTECTED_POINTS;
}

// Process point transfer between users
async function processPointTransfer(
  ctx: MutationCtx,
  fromUserId: string,
  toUserId: string,
  amount: number,
  transferType: 'boost' | 'dampen',
  targetId: string,
  metadata: Record<string, unknown> = {}
): Promise<{
  success: boolean;
  fromBalance: number;
  toBalance: number;
  error?: string;
}> {
  // Get both users' points
  const fromUserPoints = await ctx.db
    .query('userPoints')
    .withIndex('byUserId', (q) => q.eq('userId', fromUserId))
    .first();

  const toUserPoints = await ctx.db
    .query('userPoints')
    .withIndex('byUserId', (q) => q.eq('userId', toUserId))
    .first();

  if (!fromUserPoints || !toUserPoints) {
    return {
      success: false,
      fromBalance: 0,
      toBalance: 0,
      error: 'User points not found',
    };
  }

  if (transferType === 'boost') {
    // For boost: transfer points from voter to content creator
    if (fromUserPoints.currentBalance < amount) {
      return {
        success: false,
        fromBalance: fromUserPoints.currentBalance,
        toBalance: toUserPoints.currentBalance,
        error: 'Insufficient points for transfer',
      };
    }

    const newFromBalance = fromUserPoints.currentBalance - amount;
    const newToBalance = toUserPoints.currentBalance + amount;

    // Update balances
    await ctx.db.patch(fromUserPoints._id, { currentBalance: newFromBalance });
    await ctx.db.patch(toUserPoints._id, { currentBalance: newToBalance });

    // Record transactions
    await ctx.db.insert('pointTransactions', {
      userId: fromUserId,
      type: 'transfer',
      action: 'transfer_boost',
      targetId,
      fromUserId,
      toUserId,
      amount: -amount,
      multiplier: fromUserPoints.multiplier,
      balanceAfter: newFromBalance,
      timestamp: Date.now(),
      metadata: { transferType: 'boost', ...metadata },
    });

    await ctx.db.insert('pointTransactions', {
      userId: toUserId,
      type: 'transfer',
      action: 'receive_boost',
      targetId,
      fromUserId,
      toUserId,
      amount: amount,
      multiplier: toUserPoints.multiplier,
      balanceAfter: newToBalance,
      timestamp: Date.now(),
      metadata: { transferType: 'boost', ...metadata },
    });

    return {
      success: true,
      fromBalance: newFromBalance,
      toBalance: newToBalance,
    };
  } else {
    // For dampen: deduct points from content creator
    const protectedPoints = toUserPoints.protectedPoints || 0;
    const effectiveBalance = Math.max(
      0,
      toUserPoints.currentBalance - protectedPoints
    );

    if (effectiveBalance <= 0) {
      return {
        success: false,
        fromBalance: fromUserPoints.currentBalance,
        toBalance: toUserPoints.currentBalance,
        error: 'Target user has no points available for dampening',
      };
    }

    const actualPenalty = Math.min(amount, effectiveBalance);
    const newToBalance = toUserPoints.currentBalance - actualPenalty;

    // Update balance
    await ctx.db.patch(toUserPoints._id, { currentBalance: newToBalance });

    // Record transactions
    await ctx.db.insert('pointTransactions', {
      userId: fromUserId,
      type: 'transfer',
      action: 'transfer_dampen',
      targetId,
      fromUserId,
      toUserId,
      amount: 0, // Dampener doesn't spend points, just causes penalty
      multiplier: fromUserPoints.multiplier,
      balanceAfter: fromUserPoints.currentBalance,
      timestamp: Date.now(),
      metadata: {
        transferType: 'dampen',
        penaltyAmount: actualPenalty,
        ...metadata,
      },
    });

    await ctx.db.insert('pointTransactions', {
      userId: toUserId,
      type: 'transfer',
      action: 'receive_dampen',
      targetId,
      fromUserId,
      toUserId,
      amount: -actualPenalty,
      multiplier: toUserPoints.multiplier,
      balanceAfter: newToBalance,
      timestamp: Date.now(),
      metadata: {
        transferType: 'dampen',
        penaltyAmount: actualPenalty,
        ...metadata,
      },
    });

    return {
      success: true,
      fromBalance: fromUserPoints.currentBalance,
      toBalance: newToBalance,
    };
  }
}

// Get or create user points record
export const getUserPointsStats = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity && !args.userId) {
      return null;
    }

    const userId = args.userId || identity?.subject;
    if (!userId) {
      return null;
    }

    const userPoints = await ctx.db
      .query('userPoints')
      .withIndex('byUserId', (q) => q.eq('userId', userId))
      .first();

    if (!userPoints) {
      // Return default values for new users
      const defaultStats = {
        userId,
        totalPointsEarned: 0,
        currentBalance: 0,
        protectedPoints: MIN_PROTECTED_POINTS,
        dailyEarnedPoints: 0,
        dailyPostCount: 0,
        dailyReviewCount: 0,
        dailyDampenCount: 0,
        lastResetDate: getCurrentDateString(),
        level: 1,
        multiplier: 1.0,
        streakDays: 0,
        lastActivityDate: getCurrentDateString(),
        karmaScore: 0,
      };
      return {
        ...defaultStats,
        availablePoints: defaultStats.currentBalance, // Alias for compatibility
      };
    }

    return {
      ...userPoints,
      availablePoints: userPoints.currentBalance, // Alias for compatibility
    };
  },
});

// Initialize user points record for new users
export const initializeUserPoints = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Check if user already has points record
    const existing = await ctx.db
      .query('userPoints')
      .withIndex('byUserId', (q) => q.eq('userId', args.userId))
      .first();

    if (existing) {
      return existing;
    }

    const today = getCurrentDateString();

    // New users get starter points and protection
    const starterPoints = 50; // Give new users 50 points to start
    const protectedPoints = MIN_PROTECTED_POINTS + 30; // Extra protection for new users

    // Create new user points record
    const userPointsId = await ctx.db.insert('userPoints', {
      userId: args.userId,
      totalPointsEarned: starterPoints,
      currentBalance: starterPoints,
      protectedPoints,
      dailyEarnedPoints: 0,
      dailyPostCount: 0,
      dailyReviewCount: 0,
      dailyDampenCount: 0,
      lastResetDate: today,
      level: 1,
      multiplier: 1.0,
      streakDays: 0,
      lastActivityDate: today,
      karmaScore: 0,
    });

    // Record the starter bonus transaction
    await ctx.db.insert('pointTransactions', {
      userId: args.userId,
      type: 'earned',
      action: 'daily_bonus', // Reuse this for starter bonus
      amount: starterPoints,
      multiplier: 1.0,
      balanceAfter: starterPoints,
      timestamp: Date.now(),
      metadata: {
        type: 'starter_bonus',
        protectedPoints,
      },
    });

    return await ctx.db.get(userPointsId);
  },
});

// Award points for posting a vibe
export const awardPointsForVibe = internalMutation({
  args: {
    userId: v.string(),
    vibeId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get or create user points record
    let userPoints = await ctx.db
      .query('userPoints')
      .withIndex('byUserId', (q) => q.eq('userId', args.userId))
      .first();

    if (!userPoints) {
      // Initialize user points inline
      const today = getCurrentDateString();
      const userPointsId = await ctx.db.insert('userPoints', {
        userId: args.userId,
        totalPointsEarned: 0,
        currentBalance: 0,
        protectedPoints: MIN_PROTECTED_POINTS,
        dailyEarnedPoints: 0,
        dailyPostCount: 0,
        dailyReviewCount: 0,
        dailyDampenCount: 0,
        lastResetDate: today,
        level: 1,
        multiplier: 1.0,
        streakDays: 0,
        lastActivityDate: today,
        karmaScore: 0,
      });
      userPoints = await ctx.db.get(userPointsId);

      if (!userPoints) {
        throw new Error('Failed to initialize user points');
      }
    }

    const today = getCurrentDateString();

    // Check if daily reset is needed (inline for simplicity)
    if (userPoints.lastResetDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      let newStreakDays = userPoints.streakDays;
      if (userPoints.lastActivityDate === yesterdayString) {
        // Streak continues if user was active yesterday
      } else if (userPoints.lastActivityDate !== today) {
        // Reset streak if gap in activity (more than 1 day)
        newStreakDays = 0;
      }

      // Reset daily counters
      await ctx.db.patch(userPoints._id, {
        dailyEarnedPoints: 0,
        dailyPostCount: 0,
        dailyReviewCount: 0,
        dailyDampenCount: 0,
        lastResetDate: today,
        streakDays: newStreakDays,
      });

      // Update local userPoints object
      userPoints.dailyEarnedPoints = 0;
      userPoints.dailyPostCount = 0;
      userPoints.dailyReviewCount = 0;
      userPoints.dailyDampenCount = 0;
      userPoints.lastResetDate = today;
      userPoints.streakDays = newStreakDays;
    }

    // Check daily posting cap
    if (userPoints.dailyPostCount >= DAILY_POST_CAP) {
      return {
        success: false,
        reason: 'daily_post_cap_reached',
        pointsAwarded: 0,
        newBalance: userPoints.currentBalance,
      };
    }

    // Check daily earning cap
    if (userPoints.dailyEarnedPoints >= DAILY_EARN_CAP) {
      return {
        success: false,
        reason: 'daily_earn_cap_reached',
        pointsAwarded: 0,
        newBalance: userPoints.currentBalance,
      };
    }

    // Calculate points to award
    const basePoints = BASE_VIBE_POINTS;
    const multiplier = userPoints.multiplier;
    const pointsAwarded = Math.floor(basePoints * multiplier);

    // Update user points
    const newBalance = userPoints.currentBalance + pointsAwarded;
    const newTotalEarned = userPoints.totalPointsEarned + pointsAwarded;
    const newDailyEarned = userPoints.dailyEarnedPoints + pointsAwarded;
    const newDailyPostCount = userPoints.dailyPostCount + 1;
    const newLevel = calculateLevel(newTotalEarned);
    const newMultiplier = calculateMultiplier(newTotalEarned);

    // Update streak if activity today
    let newStreakDays = userPoints.streakDays;
    if (userPoints.lastActivityDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      if (userPoints.lastActivityDate === yesterdayString) {
        newStreakDays += 1;
      } else {
        newStreakDays = 1; // Reset streak if gap in activity
      }
    }

    await ctx.db.patch(userPoints._id, {
      currentBalance: newBalance,
      totalPointsEarned: newTotalEarned,
      dailyEarnedPoints: newDailyEarned,
      dailyPostCount: newDailyPostCount,
      level: newLevel,
      multiplier: newMultiplier,
      streakDays: newStreakDays,
      lastActivityDate: today,
    });

    // Record transaction
    await ctx.db.insert('pointTransactions', {
      userId: args.userId,
      type: 'earned',
      action: 'post_vibe',
      targetId: args.vibeId,
      amount: pointsAwarded,
      multiplier: multiplier,
      balanceAfter: newBalance,
      timestamp: Date.now(),
      metadata: {
        basePoints,
        dailyPostCount: newDailyPostCount,
        dailyEarnedPoints: newDailyEarned,
      },
    });

    // Check for level up and award bonus (inline)
    if (newLevel > userPoints.level) {
      const levelsGained = newLevel - userPoints.level;
      const bonusPoints = LEVEL_UP_BONUS * levelsGained;
      const protectedBonus = Math.ceil(bonusPoints * 0.5); // Half of level-up bonus becomes protected

      // Update balance with bonus and protected points
      const balanceAfterBonus = newBalance + bonusPoints;
      const newProtectedPoints =
        (userPoints.protectedPoints || 0) + protectedBonus;

      await ctx.db.patch(userPoints._id, {
        currentBalance: balanceAfterBonus,
        totalPointsEarned: newTotalEarned + bonusPoints,
        protectedPoints: newProtectedPoints,
      });

      // Record level up transaction
      await ctx.db.insert('pointTransactions', {
        userId: args.userId,
        type: 'earned',
        action: 'level_up',
        amount: bonusPoints,
        multiplier: multiplier,
        balanceAfter: balanceAfterBonus,
        timestamp: Date.now(),
        metadata: {
          newLevel,
          oldLevel: userPoints.level,
          levelsGained,
          bonusPerLevel: LEVEL_UP_BONUS,
          protectedBonus,
          newProtectedPoints,
        },
      });
    }

    return {
      success: true,
      pointsAwarded,
      newBalance,
      newLevel,
      levelUp: newLevel > userPoints.level,
      dailyPostCount: newDailyPostCount,
      dailyEarnedPoints: newDailyEarned,
    };
  },
});

// Award points for writing a review
export const awardPointsForReview = internalMutation({
  args: {
    userId: v.string(),
    ratingId: v.string(),
    vibeId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get or create user points record
    let userPoints = await ctx.db
      .query('userPoints')
      .withIndex('byUserId', (q) => q.eq('userId', args.userId))
      .first();

    if (!userPoints) {
      // Initialize user points inline
      const today = getCurrentDateString();
      const userPointsId = await ctx.db.insert('userPoints', {
        userId: args.userId,
        totalPointsEarned: 0,
        currentBalance: 0,
        protectedPoints: MIN_PROTECTED_POINTS,
        dailyEarnedPoints: 0,
        dailyPostCount: 0,
        dailyReviewCount: 0,
        dailyDampenCount: 0,
        lastResetDate: today,
        level: 1,
        multiplier: 1.0,
        streakDays: 0,
        lastActivityDate: today,
        karmaScore: 0,
      });
      userPoints = await ctx.db.get(userPointsId);

      if (!userPoints) {
        throw new Error('Failed to initialize user points');
      }
    }

    const today = getCurrentDateString();

    // Check if daily reset is needed (inline for simplicity)
    if (userPoints.lastResetDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      let newStreakDays = userPoints.streakDays;
      if (userPoints.lastActivityDate === yesterdayString) {
        // Streak continues if user was active yesterday
      } else if (userPoints.lastActivityDate !== today) {
        // Reset streak if gap in activity (more than 1 day)
        newStreakDays = 0;
      }

      // Reset daily counters
      await ctx.db.patch(userPoints._id, {
        dailyEarnedPoints: 0,
        dailyPostCount: 0,
        dailyReviewCount: 0,
        dailyDampenCount: 0,
        lastResetDate: today,
        streakDays: newStreakDays,
      });

      // Update local userPoints object
      userPoints.dailyEarnedPoints = 0;
      userPoints.dailyPostCount = 0;
      userPoints.dailyReviewCount = 0;
      userPoints.dailyDampenCount = 0;
      userPoints.lastResetDate = today;
      userPoints.streakDays = newStreakDays;
    }

    // Check daily review cap
    if (userPoints.dailyReviewCount >= DAILY_REVIEW_CAP) {
      return {
        success: false,
        reason: 'daily_review_cap_reached',
        pointsAwarded: 0,
        newBalance: userPoints.currentBalance,
      };
    }

    // Check daily earning cap
    if (userPoints.dailyEarnedPoints >= DAILY_EARN_CAP) {
      return {
        success: false,
        reason: 'daily_earn_cap_reached',
        pointsAwarded: 0,
        newBalance: userPoints.currentBalance,
      };
    }

    // Calculate points to award
    const basePoints = BASE_REVIEW_POINTS;
    const multiplier = userPoints.multiplier;
    const pointsAwarded = Math.floor(basePoints * multiplier);

    // Update user points
    const newBalance = userPoints.currentBalance + pointsAwarded;
    const newTotalEarned = userPoints.totalPointsEarned + pointsAwarded;
    const newDailyEarned = userPoints.dailyEarnedPoints + pointsAwarded;
    const newDailyReviewCount = userPoints.dailyReviewCount + 1;
    const newLevel = calculateLevel(newTotalEarned);
    const newMultiplier = calculateMultiplier(newTotalEarned);

    // Update streak if activity today
    let newStreakDays = userPoints.streakDays;
    if (userPoints.lastActivityDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      if (userPoints.lastActivityDate === yesterdayString) {
        newStreakDays += 1;
      } else {
        newStreakDays = 1; // Reset streak if gap in activity
      }
    }

    await ctx.db.patch(userPoints._id, {
      currentBalance: newBalance,
      totalPointsEarned: newTotalEarned,
      dailyEarnedPoints: newDailyEarned,
      dailyReviewCount: newDailyReviewCount,
      level: newLevel,
      multiplier: newMultiplier,
      streakDays: newStreakDays,
      lastActivityDate: today,
    });

    // Record transaction
    await ctx.db.insert('pointTransactions', {
      userId: args.userId,
      type: 'earned',
      action: 'write_review',
      targetId: args.ratingId,
      amount: pointsAwarded,
      multiplier: multiplier,
      balanceAfter: newBalance,
      timestamp: Date.now(),
      metadata: {
        basePoints,
        vibeId: args.vibeId,
        dailyReviewCount: newDailyReviewCount,
        dailyEarnedPoints: newDailyEarned,
      },
    });

    // Check for level up and award bonus (inline)
    if (newLevel > userPoints.level) {
      const levelsGained = newLevel - userPoints.level;
      const bonusPoints = LEVEL_UP_BONUS * levelsGained;
      const protectedBonus = Math.ceil(bonusPoints * 0.5); // Half of level-up bonus becomes protected

      // Update balance with bonus and protected points
      const balanceAfterBonus = newBalance + bonusPoints;
      const newProtectedPoints =
        (userPoints.protectedPoints || 0) + protectedBonus;

      await ctx.db.patch(userPoints._id, {
        currentBalance: balanceAfterBonus,
        totalPointsEarned: newTotalEarned + bonusPoints,
        protectedPoints: newProtectedPoints,
      });

      // Record level up transaction
      await ctx.db.insert('pointTransactions', {
        userId: args.userId,
        type: 'earned',
        action: 'level_up',
        amount: bonusPoints,
        multiplier: multiplier,
        balanceAfter: balanceAfterBonus,
        timestamp: Date.now(),
        metadata: {
          newLevel,
          oldLevel: userPoints.level,
          levelsGained,
          bonusPerLevel: LEVEL_UP_BONUS,
          protectedBonus,
          newProtectedPoints,
        },
      });
    }

    // Award points to vibe creator for receiving review
    const vibe = await ctx.db
      .query('vibes')
      .withIndex('id', (q) => q.eq('id', args.vibeId))
      .first();

    if (vibe && vibe.createdById !== args.userId) {
      await ctx.scheduler.runAfter(
        0,
        internal.userPoints.awardPointsForReceivingReview,
        {
          userId: vibe.createdById,
          vibeId: args.vibeId,
          ratingId: args.ratingId,
          reviewerUserId: args.userId,
        }
      );
    }

    return {
      success: true,
      pointsAwarded,
      newBalance,
      newLevel,
      levelUp: newLevel > userPoints.level,
      dailyReviewCount: newDailyReviewCount,
      dailyEarnedPoints: newDailyEarned,
    };
  },
});

// Award points for receiving a review (internal mutation)
export const awardPointsForReceivingReview = internalMutation({
  args: {
    userId: v.string(),
    vibeId: v.string(),
    ratingId: v.string(),
    reviewerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get or create user points record
    let userPoints = await ctx.db
      .query('userPoints')
      .withIndex('byUserId', (q) => q.eq('userId', args.userId))
      .first();

    if (!userPoints) {
      // Initialize user points inline
      const today = getCurrentDateString();
      const userPointsId = await ctx.db.insert('userPoints', {
        userId: args.userId,
        totalPointsEarned: 0,
        currentBalance: 0,
        protectedPoints: MIN_PROTECTED_POINTS,
        dailyEarnedPoints: 0,
        dailyPostCount: 0,
        dailyReviewCount: 0,
        dailyDampenCount: 0,
        lastResetDate: today,
        level: 1,
        multiplier: 1.0,
        streakDays: 0,
        lastActivityDate: today,
        karmaScore: 0,
      });
      userPoints = await ctx.db.get(userPointsId);

      if (!userPoints) {
        throw new Error('Failed to initialize user points');
      }
    }

    const today = getCurrentDateString();

    // Check if daily reset is needed (inline for simplicity)
    if (userPoints.lastResetDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      let newStreakDays = userPoints.streakDays;
      if (userPoints.lastActivityDate === yesterdayString) {
        // Streak continues if user was active yesterday
      } else if (userPoints.lastActivityDate !== today) {
        // Reset streak if gap in activity (more than 1 day)
        newStreakDays = 0;
      }

      // Reset daily counters
      await ctx.db.patch(userPoints._id, {
        dailyEarnedPoints: 0,
        dailyPostCount: 0,
        dailyReviewCount: 0,
        dailyDampenCount: 0,
        lastResetDate: today,
        streakDays: newStreakDays,
      });

      // Update local userPoints object
      userPoints.dailyEarnedPoints = 0;
      userPoints.dailyPostCount = 0;
      userPoints.dailyReviewCount = 0;
      userPoints.dailyDampenCount = 0;
      userPoints.lastResetDate = today;
      userPoints.streakDays = newStreakDays;
    }

    // Calculate points to award (small amount for receiving reviews)
    const basePoints = BASE_RECEIVE_REVIEW_POINTS;
    const multiplier = userPoints.multiplier;
    const pointsAwarded = Math.floor(basePoints * multiplier);

    // Update user points
    const newBalance = userPoints.currentBalance + pointsAwarded;
    const newTotalEarned = userPoints.totalPointsEarned + pointsAwarded;
    const newLevel = calculateLevel(newTotalEarned);
    const newMultiplier = calculateMultiplier(newTotalEarned);

    await ctx.db.patch(userPoints._id, {
      currentBalance: newBalance,
      totalPointsEarned: newTotalEarned,
      level: newLevel,
      multiplier: newMultiplier,
    });

    // Record transaction
    await ctx.db.insert('pointTransactions', {
      userId: args.userId,
      type: 'earned',
      action: 'receive_review',
      targetId: args.ratingId,
      amount: pointsAwarded,
      multiplier: multiplier,
      balanceAfter: newBalance,
      timestamp: Date.now(),
      metadata: {
        basePoints,
        vibeId: args.vibeId,
        reviewerUserId: args.reviewerUserId,
      },
    });

    // Check for level up and award bonus (inline)
    if (newLevel > userPoints.level) {
      const levelsGained = newLevel - userPoints.level;
      const bonusPoints = LEVEL_UP_BONUS * levelsGained;
      const protectedBonus = Math.ceil(bonusPoints * 0.5); // Half of level-up bonus becomes protected

      // Update balance with bonus and protected points
      const balanceAfterBonus = newBalance + bonusPoints;
      const newProtectedPoints =
        (userPoints.protectedPoints || 0) + protectedBonus;

      await ctx.db.patch(userPoints._id, {
        currentBalance: balanceAfterBonus,
        totalPointsEarned: newTotalEarned + bonusPoints,
        protectedPoints: newProtectedPoints,
      });

      // Record level up transaction
      await ctx.db.insert('pointTransactions', {
        userId: args.userId,
        type: 'earned',
        action: 'level_up',
        amount: bonusPoints,
        multiplier: multiplier,
        balanceAfter: balanceAfterBonus,
        timestamp: Date.now(),
        metadata: {
          newLevel,
          oldLevel: userPoints.level,
          levelsGained,
          bonusPerLevel: LEVEL_UP_BONUS,
          protectedBonus,
          newProtectedPoints,
        },
      });
    }
  },
});

// Get boost cost for content
export const getBoostCost = query({
  args: {
    contentType: v.union(v.literal('vibe'), v.literal('rating')),
    contentId: v.string(),
  },
  handler: async (ctx, args) => {
    let currentBoostScore = 0;

    if (args.contentType === 'vibe') {
      const vibe = await ctx.db
        .query('vibes')
        .withIndex('id', (q) => q.eq('id', args.contentId))
        .first();
      currentBoostScore = vibe?.boostScore || 0;
    } else {
      const rating = await ctx.db.get(args.contentId as Id<'ratings'>);
      currentBoostScore = rating?.netScore || 0;
    }

    return {
      boostCost: calculateBoostCost(currentBoostScore),
      dampenCost: calculateBoostCost(currentBoostScore),
      currentBoostScore,
    };
  },
});

// Boost content - Now includes point transfers to content creator
export const boostContent = mutation({
  args: {
    contentType: v.union(v.literal('vibe'), v.literal('rating')),
    contentId: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    pointsSpent: number;
    pointsTransferred: number;
    newBalance: number;
    newBoostScore: number;
    nextBoostCost: number;
    message: string;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to boost content');
    }

    // Get user points
    const userPoints = await ctx.db
      .query('userPoints')
      .withIndex('byUserId', (q) => q.eq('userId', identity.subject))
      .first();

    if (!userPoints) {
      throw new Error('User points not found. Please try again.');
    }

    // Get current boost score and calculate cost
    let currentBoostScore = 0;
    let content: Doc<'vibes'> | Doc<'ratings'> | null = null;
    let contentCreatorId = '';

    if (args.contentType === 'vibe') {
      const vibe = await ctx.db
        .query('vibes')
        .withIndex('id', (q) => q.eq('id', args.contentId))
        .first();
      content = vibe as Doc<'vibes'> | null;
      currentBoostScore = vibe?.boostScore || 0;
      contentCreatorId = vibe?.createdById || '';
    } else {
      const rating = await ctx.db.get(args.contentId as Id<'ratings'>);
      content = rating as Doc<'ratings'> | null;
      currentBoostScore = (rating as Doc<'ratings'> | null)?.netScore || 0;
      contentCreatorId = (rating as Doc<'ratings'> | null)?.userId || '';
    }

    if (!content) {
      throw new Error('Content not found');
    }

    // Prevent users from boosting their own content
    if (contentCreatorId === identity.subject) {
      throw new Error('You cannot boost your own content');
    }

    const cost = calculateBoostCost(currentBoostScore);

    // Calculate transfer amount (portion of the boost cost goes to creator)
    const transferAmount = Math.ceil(cost * 0.5); // 50% of boost cost goes to creator
    const actualCost = cost; // User still pays full cost

    // Check if user has enough points
    if (userPoints.currentBalance < actualCost) {
      throw new Error(
        `Insufficient points. You need ${actualCost} points but only have ${userPoints.currentBalance}.`
      );
    }

    // Deduct points from user
    const newBalance = userPoints.currentBalance - actualCost;
    const newBoostScore = currentBoostScore + 1;
    let newTotalBoosts: number;
    if (args.contentType === 'vibe') {
      newTotalBoosts = ((content as Doc<'vibes'> | null)?.totalBoosts || 0) + 1;
    } else {
      newTotalBoosts =
        ((content as Doc<'ratings'> | null)?.boostCount || 0) + 1;
    }

    // Update user points
    await ctx.db.patch(userPoints._id, {
      currentBalance: newBalance,
    });

    // Update content
    if (args.contentType === 'vibe') {
      await ctx.db.patch(content._id, {
        boostScore: newBoostScore,
        totalBoosts: newTotalBoosts,
      });
    } else {
      await ctx.db.patch(content._id, {
        netScore: newBoostScore,
        boostCount: newTotalBoosts,
      });
    }

    // Record boost transaction for the user
    await ctx.db.insert('pointTransactions', {
      userId: identity.subject,
      type: 'spent',
      action: 'boost',
      targetId: args.contentId,
      fromUserId: identity.subject,
      toUserId: contentCreatorId,
      amount: -actualCost,
      multiplier: userPoints.multiplier,
      balanceAfter: newBalance,
      timestamp: Date.now(),
      metadata: {
        contentType: args.contentType,
        oldBoostScore: currentBoostScore,
        newBoostScore,
        cost: actualCost,
        transferAmount,
      },
    });

    // Transfer points to content creator
    const pointTransferResult = await ctx.runMutation(
      internal.userPoints.internalProcessPointTransfer,
      {
        fromUserId: identity.subject, // from (voter)
        toUserId: contentCreatorId, // to (creator)
        amount: transferAmount,
        transferType: 'boost',
        targetId: args.contentId,
        metadata: {
          action: 'boost_content',
          contentType: args.contentType,
          contentId: args.contentId,
        },
      }
    );

    // Update karma for both users
    if (pointTransferResult.success) {
      // Boost voter gets positive karma for helpful behavior
      await ctx.runMutation(internal.userPoints.updateUserKarma, {
        userId: identity.subject,
        action: 'helpful_boost',
      });

      // Content creator gets positive karma for having content boosted
      await ctx.runMutation(internal.userPoints.updateUserKarma, {
        userId: contentCreatorId,
        action: 'content_boosted',
      });
    }

    let message = `Boosted! Spent ${actualCost} VP`;
    if (pointTransferResult.success) {
      message += ` (${transferAmount} VP sent to creator)`;
    }

    return {
      success: true,
      pointsSpent: actualCost,
      pointsTransferred: pointTransferResult.success ? transferAmount : 0,
      newBalance,
      newBoostScore,
      nextBoostCost: calculateBoostCost(newBoostScore),
      message,
    };
  },
});

// Dampen content - Now includes point penalties for content creator
export const dampenContent = mutation({
  args: {
    contentType: v.union(v.literal('vibe'), v.literal('rating')),
    contentId: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    pointsSpent: number;
    pointsPenalized: number;
    newBalance: number;
    newBoostScore: number;
    nextDampenCost: number;
    message: string;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to dampen content');
    }

    // Get user points
    const userPoints = await ctx.db
      .query('userPoints')
      .withIndex('byUserId', (q) => q.eq('userId', identity.subject))
      .first();

    if (!userPoints) {
      throw new Error('User points not found. Please try again.');
    }

    // Check daily dampen limit
    const currentDampenCount = userPoints.dailyDampenCount || 0;
    if (currentDampenCount >= MAX_DAMPEN_PER_DAY) {
      throw new Error(
        `You have reached your daily dampen limit (${MAX_DAMPEN_PER_DAY} per day).`
      );
    }

    // Get current boost score and calculate cost
    let currentBoostScore = 0;
    let content: Doc<'vibes'> | Doc<'ratings'> | null = null;
    let contentCreatorId = '';

    if (args.contentType === 'vibe') {
      const vibe = await ctx.db
        .query('vibes')
        .withIndex('id', (q) => q.eq('id', args.contentId))
        .first();
      content = vibe as Doc<'vibes'> | null;
      currentBoostScore = vibe?.boostScore || 0;
      contentCreatorId = vibe?.createdById || '';
    } else {
      const rating = await ctx.db.get(args.contentId as Id<'ratings'>);
      content = rating as Doc<'ratings'> | null;
      currentBoostScore = (rating as Doc<'ratings'> | null)?.netScore || 0;
      contentCreatorId = (rating as Doc<'ratings'> | null)?.userId || '';
    }

    if (!content) {
      throw new Error('Content not found');
    }

    // Prevent users from dampening their own content
    if (contentCreatorId === identity.subject) {
      throw new Error('You cannot dampen your own content');
    }

    // Get content creator's points for protection check
    const creatorPoints = await ctx.db
      .query('userPoints')
      .withIndex('byUserId', (q) => q.eq('userId', contentCreatorId))
      .first();

    if (!creatorPoints) {
      throw new Error('Content creator points not found.');
    }

    // Check if creator is protected
    if (isUserProtected(creatorPoints)) {
      throw new Error(
        'This user is protected from dampening (new user or low balance).'
      );
    }

    const cost = calculateBoostCost(currentBoostScore);

    // Check if user has enough points
    if (userPoints.currentBalance < cost) {
      throw new Error(
        `Insufficient points. You need ${cost} points but only have ${userPoints.currentBalance}.`
      );
    }

    // Calculate penalty for content creator
    const penalty = calculateDampenPenalty(
      creatorPoints.currentBalance,
      creatorPoints.protectedPoints || 0,
      currentDampenCount,
      creatorPoints.karmaScore || 0
    );

    // Deduct points from user
    const newBalance = userPoints.currentBalance - cost;
    const newBoostScore = currentBoostScore - 1;
    let newTotalDampens: number;
    if (args.contentType === 'vibe') {
      newTotalDampens =
        ((content as Doc<'vibes'> | null)?.totalDampens || 0) + 1;
    } else {
      newTotalDampens =
        ((content as Doc<'ratings'> | null)?.dampenCount || 0) + 1;
    }

    // Update user points and daily dampen count
    await ctx.db.patch(userPoints._id, {
      currentBalance: newBalance,
      dailyDampenCount: currentDampenCount + 1,
    });

    // Update content
    if (args.contentType === 'vibe') {
      await ctx.db.patch(content._id, {
        boostScore: newBoostScore,
        totalDampens: newTotalDampens,
      });
    } else {
      await ctx.db.patch(content._id, {
        netScore: newBoostScore,
        dampenCount: newTotalDampens,
      });
    }

    // Record dampen transaction for the user
    await ctx.db.insert('pointTransactions', {
      userId: identity.subject,
      type: 'spent',
      action: 'dampen',
      targetId: args.contentId,
      fromUserId: identity.subject,
      toUserId: contentCreatorId,
      amount: -cost,
      multiplier: userPoints.multiplier,
      balanceAfter: newBalance,
      timestamp: Date.now(),
      metadata: {
        contentType: args.contentType,
        oldBoostScore: currentBoostScore,
        newBoostScore,
        cost,
        penalty,
      },
    });

    // Apply penalty to content creator
    let pointTransferResult = null;
    if (penalty > 0) {
      pointTransferResult = await ctx.runMutation(
        internal.userPoints.internalProcessPointTransfer,
        {
          fromUserId: identity.subject, // doesn't spend dampener's points
          toUserId: contentCreatorId, // to (creator) - will lose points
          amount: penalty,
          transferType: 'dampen',
          targetId: args.contentId,
          metadata: {
            action: 'dampen_content',
            contentType: args.contentType,
            contentId: args.contentId,
          },
        }
      );

      // Update karma - dampening hurts both users
      if (pointTransferResult.success) {
        // Check if this is excessive dampening (more than 5 per day)
        const isExcessive = currentDampenCount >= 5;

        await ctx.runMutation(internal.userPoints.updateUserKarma, {
          userId: identity.subject,
          action: isExcessive ? 'excessive_dampen' : 'helpful_boost', // Negative if excessive
        });

        await ctx.runMutation(internal.userPoints.updateUserKarma, {
          userId: contentCreatorId,
          action: 'content_dampened',
        });
      }
    }

    let message = `Dampened! Spent ${cost} VP`;
    if (pointTransferResult?.success) {
      message += ` (${penalty} VP penalty to creator)`;
    }

    return {
      success: true,
      pointsSpent: cost,
      pointsPenalized: pointTransferResult?.success ? penalty : 0,
      newBalance,
      newBoostScore,
      nextDampenCost: calculateBoostCost(newBoostScore),
      message,
    };
  },
});

// Get points history for a user
export const getPointsHistory = query({
  args: {
    userId: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity && !args.userId) {
      return [];
    }

    const userId = args.userId || identity?.subject;
    if (!userId) {
      return [];
    }

    const days = args.days || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const startDateString = startDate.toISOString().split('T')[0];

    return await ctx.db
      .query('pointsHistory')
      .withIndex('byUserAndDate', (q) =>
        q.eq('userId', userId).gte('date', startDateString)
      )
      .order('asc')
      .collect();
  },
});

// Get leaderboard
export const getLeaderboard = query({
  args: {
    type: v.optional(
      v.union(v.literal('points'), v.literal('level'), v.literal('streak'))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const type = args.type || 'points';
    const limit = args.limit || 10;

    let leaderboard;

    if (type === 'points') {
      leaderboard = await ctx.db
        .query('userPoints')
        .withIndex('byTotalPoints', (q) => q.gt('totalPointsEarned', 0))
        .order('desc')
        .take(limit);
    } else if (type === 'level') {
      leaderboard = await ctx.db
        .query('userPoints')
        .withIndex('byLevel', (q) => q.gt('level', 1))
        .order('desc')
        .take(limit);
    } else {
      leaderboard = await ctx.db
        .query('userPoints')
        .withIndex('byStreak', (q) => q.gt('streakDays', 0))
        .order('desc')
        .take(limit);
    }

    // Get user data for each entry
    const leaderboardWithUsers = await Promise.all(
      leaderboard.map(async (points) => {
        const user = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', points.userId))
          .first();

        return {
          ...points,
          user: user
            ? {
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                image_url: user.image_url,
              }
            : null,
        };
      })
    );

    return leaderboardWithUsers;
  },
});

// Internal mutation to reset daily limits
export const internalResetDailyLimits = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userPoints = await ctx.db
      .query('userPoints')
      .withIndex('byUserId', (q) => q.eq('userId', args.userId))
      .first();

    if (!userPoints) {
      return;
    }

    const today = getCurrentDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    // Check if we need to update streak
    let newStreakDays = userPoints.streakDays;
    if (userPoints.lastActivityDate === yesterdayString) {
      // Streak continues if user was active yesterday
      // Do nothing - streak will be incremented when they do activity today
    } else if (userPoints.lastActivityDate !== today) {
      // Reset streak if gap in activity (more than 1 day)
      newStreakDays = 0;
    }

    // Award daily streak bonus if applicable
    if (newStreakDays >= 7 && userPoints.lastActivityDate === yesterdayString) {
      const streakBonus = DAILY_STREAK_BONUS * Math.floor(newStreakDays / 7);
      const newBalance = userPoints.currentBalance + streakBonus;
      const newTotalEarned = userPoints.totalPointsEarned + streakBonus;

      await ctx.db.patch(userPoints._id, {
        currentBalance: newBalance,
        totalPointsEarned: newTotalEarned,
        dailyEarnedPoints: 0,
        dailyPostCount: 0,
        dailyReviewCount: 0,
        dailyDampenCount: 0,
        lastResetDate: today,
        streakDays: newStreakDays,
      });

      // Record streak bonus transaction
      await ctx.db.insert('pointTransactions', {
        userId: args.userId,
        type: 'earned',
        action: 'daily_bonus',
        amount: streakBonus,
        multiplier: userPoints.multiplier,
        balanceAfter: newBalance,
        timestamp: Date.now(),
        metadata: {
          streakDays: newStreakDays,
          bonusMultiplier: Math.floor(newStreakDays / 7),
        },
      });
    } else {
      // Just reset daily counters
      await ctx.db.patch(userPoints._id, {
        dailyEarnedPoints: 0,
        dailyPostCount: 0,
        dailyReviewCount: 0,
        dailyDampenCount: 0,
        lastResetDate: today,
        streakDays: newStreakDays,
      });
    }

    // Create points history entry for previous day
    if (userPoints.lastResetDate !== today) {
      const previousDate = userPoints.lastResetDate;

      // Get all transactions for the previous day
      const startOfDay = new Date(`${previousDate}T00:00:00.000Z`).getTime();
      const endOfDay = new Date(`${previousDate}T23:59:59.999Z`).getTime();

      const dayTransactions = await ctx.db
        .query('pointTransactions')
        .withIndex('byUser', (q) =>
          q
            .eq('userId', args.userId)
            .gte('timestamp', startOfDay)
            .lte('timestamp', endOfDay)
        )
        .collect();

      const pointsEarned = dayTransactions
        .filter((t) => t.type === 'earned')
        .reduce((sum, t) => sum + t.amount, 0);

      const pointsSpent = Math.abs(
        dayTransactions
          .filter((t) => t.type === 'spent')
          .reduce((sum, t) => sum + t.amount, 0)
      );

      const netChange = pointsEarned - pointsSpent;
      const activityCount = dayTransactions.filter(
        (t) => t.action === 'post_vibe' || t.action === 'write_review'
      ).length;

      // Check if history entry already exists
      const existingHistory = await ctx.db
        .query('pointsHistory')
        .withIndex('byUserAndDate', (q) =>
          q.eq('userId', args.userId).eq('date', previousDate)
        )
        .first();

      if (!existingHistory) {
        await ctx.db.insert('pointsHistory', {
          userId: args.userId,
          date: previousDate,
          pointsEarned,
          pointsSpent,
          netChange,
          endingBalance: userPoints.currentBalance,
          activityCount,
        });
      }
    }
  },
});

// Internal mutation to award level up bonus
export const awardLevelUpBonus = internalMutation({
  args: {
    userId: v.string(),
    newLevel: v.number(),
    oldLevel: v.number(),
  },
  handler: async (ctx, args) => {
    const userPoints = await ctx.db
      .query('userPoints')
      .withIndex('byUserId', (q) => q.eq('userId', args.userId))
      .first();

    if (!userPoints) {
      return;
    }

    const levelsGained = args.newLevel - args.oldLevel;
    const bonusPoints = LEVEL_UP_BONUS * levelsGained;

    // Award bonus points
    const newBalance = userPoints.currentBalance + bonusPoints;
    const newTotalEarned = userPoints.totalPointsEarned + bonusPoints;

    await ctx.db.patch(userPoints._id, {
      currentBalance: newBalance,
      totalPointsEarned: newTotalEarned,
    });

    // Record level up transaction
    await ctx.db.insert('pointTransactions', {
      userId: args.userId,
      type: 'earned',
      action: 'level_up',
      amount: bonusPoints,
      multiplier: userPoints.multiplier,
      balanceAfter: newBalance,
      timestamp: Date.now(),
      metadata: {
        newLevel: args.newLevel,
        oldLevel: args.oldLevel,
        levelsGained,
        bonusPerLevel: LEVEL_UP_BONUS,
      },
    });
  },
});

// Update user karma score based on behavior
export const updateUserKarma = internalMutation({
  args: {
    userId: v.string(),
    action: v.union(
      v.literal('positive_rating'),
      v.literal('negative_rating'),
      v.literal('helpful_boost'),
      v.literal('excessive_dampen'),
      v.literal('content_boosted'),
      v.literal('content_dampened')
    ),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userPoints = await ctx.db
      .query('userPoints')
      .withIndex('byUserId', (q) => q.eq('userId', args.userId))
      .first();

    if (!userPoints) {
      return;
    }

    let karmaChange = 0;

    switch (args.action) {
      case 'positive_rating':
        karmaChange = 1; // Good reviews increase karma
        break;
      case 'negative_rating':
        karmaChange = -0.5; // Overly negative reviews decrease karma slightly
        break;
      case 'helpful_boost':
        karmaChange = 2; // Boosting good content increases karma
        break;
      case 'excessive_dampen':
        karmaChange = -3; // Excessive dampening decreases karma significantly
        break;
      case 'content_boosted':
        karmaChange = 1; // Having your content boosted is good karma
        break;
      case 'content_dampened':
        karmaChange = -1; // Having content dampened is negative karma
        break;
    }

    if (args.amount) {
      karmaChange *= args.amount; // Allow scaling the karma change
    }

    const newKarmaScore = (userPoints.karmaScore || 0) + karmaChange;

    // Cap karma between -100 and +100
    const cappedKarma = Math.max(-100, Math.min(100, newKarmaScore));

    await ctx.db.patch(userPoints._id, {
      karmaScore: cappedKarma,
    });

    return cappedKarma;
  },
});

// Internal mutation for processing point transfers between users
export const internalProcessPointTransfer = internalMutation({
  args: {
    fromUserId: v.string(),
    toUserId: v.string(),
    amount: v.number(),
    transferType: v.union(v.literal('boost'), v.literal('dampen')),
    targetId: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await processPointTransfer(
      ctx,
      args.fromUserId,
      args.toUserId,
      args.amount,
      args.transferType,
      args.targetId,
      args.metadata || {}
    );
  },
});

// Daily points reset cron job (to be called by scheduled function)
export const internalDailyPointsReset = internalMutation({
  handler: async (ctx) => {
    const today = getCurrentDateString();

    // Get all users who need daily reset
    const usersToReset = await ctx.db
      .query('userPoints')
      .filter((q) => q.neq(q.field('lastResetDate'), today))
      .collect();

    // Reset each user's daily limits directly without circular call
    for (const userPoints of usersToReset) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      // Check if we need to update streak
      let newStreakDays = userPoints.streakDays;
      if (userPoints.lastActivityDate === yesterdayString) {
        // Streak continues if user was active yesterday
      } else if (userPoints.lastActivityDate !== today) {
        // Reset streak if gap in activity (more than 1 day)
        newStreakDays = 0;
      }

      // Award daily streak bonus if applicable
      if (
        newStreakDays >= 7 &&
        userPoints.lastActivityDate === yesterdayString
      ) {
        const streakBonus = DAILY_STREAK_BONUS * Math.floor(newStreakDays / 7);
        const newBalance = userPoints.currentBalance + streakBonus;
        const newTotalEarned = userPoints.totalPointsEarned + streakBonus;

        await ctx.db.patch(userPoints._id, {
          currentBalance: newBalance,
          totalPointsEarned: newTotalEarned,
          dailyEarnedPoints: 0,
          dailyPostCount: 0,
          dailyReviewCount: 0,
          dailyDampenCount: 0,
          lastResetDate: today,
          streakDays: newStreakDays,
        });

        // Record streak bonus transaction
        await ctx.db.insert('pointTransactions', {
          userId: userPoints.userId,
          type: 'earned',
          action: 'daily_bonus',
          amount: streakBonus,
          multiplier: userPoints.multiplier,
          balanceAfter: newBalance,
          timestamp: Date.now(),
          metadata: {
            description: `Daily streak bonus (${newStreakDays} days)`,
          },
        });
      } else {
        // Reset daily counters without bonus
        await ctx.db.patch(userPoints._id, {
          dailyEarnedPoints: 0,
          dailyPostCount: 0,
          dailyReviewCount: 0,
          dailyDampenCount: 0,
          lastResetDate: today,
          streakDays: newStreakDays,
        });
      }
    }

    return {
      usersReset: usersToReset.length,
      resetDate: today,
    };
  },
});
