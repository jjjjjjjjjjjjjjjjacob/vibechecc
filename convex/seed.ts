import { action } from './_generated/server';
import { api } from './_generated/api';

export const seed = action({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx: any): Promise<any> => {
    // We'll use the seedDemoUser mutation from our users file
    return await ctx.runMutation(api.users.seedDemoUser);
  },
});
