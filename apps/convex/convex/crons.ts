import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Reset daily limits at midnight UTC
crons.daily(
  'daily points reset',
  { hourUTC: 0, minuteUTC: 0 },
  internal.userPoints.internalDailyPointsReset
);

export default crons;