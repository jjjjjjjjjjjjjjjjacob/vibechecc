import { cronJobs } from 'convex/server';

const crons = cronJobs();

// Note: Cron jobs are temporarily disabled to avoid circular dependency issues.
// The daily points reset functionality should be implemented using a different approach,
// such as checking and resetting daily limits at the start of user operations.

export default crons;
