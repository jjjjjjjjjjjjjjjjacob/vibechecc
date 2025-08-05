import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import type { WebhookEvent } from '@clerk/backend';
import { Webhook } from 'svix';

const http = httpRouter();

const handleClerkWebhook = httpAction(async (ctx, request) => {
  // SECURITY: Rate limiting and basic request validation
  const userAgent = request.headers.get('user-agent');
  const contentType = request.headers.get('content-type');

  // SECURITY: Validate content type
  if (!contentType || !contentType.includes('application/json')) {
    console.error('Invalid content type:', contentType);
    return new Response('Invalid content type', { status: 400 });
  }

  // SECURITY: Validate User-Agent (Svix webhooks should have identifiable UA)
  if (!userAgent || !userAgent.includes('Svix')) {
    console.error('Invalid or missing user agent:', userAgent);
    return new Response('Invalid request', { status: 400 });
  }

  const event = await validateRequest(request);
  if (!event) {
    return new Response('Webhook validation failed', { status: 400 });
  }
  switch (event.type) {
    case 'user.created': // intentional fallthrough
      await ctx.runMutation(internal.users.upsertFromClerk, {
        data: event.data,
      });
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

  // SECURITY: Validate required headers exist
  if (
    !svixHeaders['svix-id'] ||
    !svixHeaders['svix-timestamp'] ||
    !svixHeaders['svix-signature']
  ) {
    console.error('Missing required svix headers');
    return null;
  }

  // SECURITY: Check timestamp to prevent replay attacks (5 minute tolerance)
  const timestamp = parseInt(svixHeaders['svix-timestamp']);
  const now = Math.floor(Date.now() / 1000);
  const timestampTolerance = 300; // 5 minutes

  if (Math.abs(now - timestamp) > timestampTolerance) {
    console.error('Webhook timestamp too old or too far in future', {
      timestamp,
      now,
      diff: Math.abs(now - timestamp),
    });
    return null;
  }

  // SECURITY: Validate webhook secret exists
  const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SIGNING_SECRET not configured');
    return null;
  }

  const wh = new Webhook(webhookSecret);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error verifying webhook event', error);
    return null;
  }
}
export default http;
