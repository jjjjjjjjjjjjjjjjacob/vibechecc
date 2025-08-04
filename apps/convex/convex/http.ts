import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import type { WebhookEvent } from '@clerk/backend';
import { Webhook } from 'svix';

const http = httpRouter();

const handleClerkWebhook = httpAction(async (ctx, request) => {
  const event = await validateRequest(request);
  if (!event) {
    return new Response('Error occured', { status: 400 });
  }
  switch (event.type) {
    case 'user.created':
      // Create user in database
      await ctx.runMutation(internal.users.upsertFromClerk, {
        data: event.data,
      });

      // Track signup to PostHog
      await ctx.runAction(internal.users.trackUserSignup, {
        userId: event.data.id,
        email: event.data.email_addresses?.[0]?.email_address,
        username: event.data.username || undefined,
        firstName: event.data.first_name || undefined,
        lastName: event.data.last_name || undefined,
        signupMethod: 'clerk',
        createdAt: event.data.created_at,
      });

      console.log(
        `New user created: ${event.data.id} (${event.data.email_addresses?.[0]?.email_address})`
      );
      break;
    case 'user.updated':
      await ctx.runMutation(internal.users.upsertFromClerk, {
        data: event.data,
      });
      break;

    case 'user.deleted': {
      const clerkUserId = event.data.id!;
      // console.log('Deleting user', clerkUserId);
      await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId });
      break;
    }
    default:
    // console.log('Ignored Clerk webhook event', event.type);
  }

  return new Response(null, { status: 200 });
});

http.route({
  path: '/webhooks/clerk',
  method: 'POST',
  handler: handleClerkWebhook,
});

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    'svix-id': req.headers.get('svix-id')!,
    'svix-timestamp': req.headers.get('svix-timestamp')!,
    'svix-signature': req.headers.get('svix-signature')!,
  };
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SIGNING_SECRET!);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error verifying webhook event', error);
    return null;
  }
}
export default http;
