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
      await ctx.runMutation(internal.users.upsertFromClerk, {
        data: event.data,
      });

      // Track signup completion (privacy-compliant - no PII)
      await ctx.runMutation(internal.users.trackAuthEvent, {
        userId: event.data.id,
        eventType: 'signup_completed',
        method: 'clerk',
        timestamp: Date.now(),
        metadata: {
          // Only non-PII metadata
          hasImage: event.data.has_image || false,
          emailVerified:
            event.data.email_addresses?.[0]?.verification?.status ===
            'verified',
          phoneVerified:
            event.data.phone_numbers?.[0]?.verification?.status === 'verified',
          twoFactorEnabled: event.data.two_factor_enabled || false,
        },
      });
      break;

    case 'user.updated':
      await ctx.runMutation(internal.users.upsertFromClerk, {
        data: event.data,
      });
      break;

    case 'user.deleted': {
      const clerkUserId = event.data.id!;

      // Track account deletion (privacy-compliant)
      await ctx.runMutation(internal.users.trackAuthEvent, {
        userId: clerkUserId,
        eventType: 'account_deleted',
        method: 'clerk',
        timestamp: Date.now(),
        metadata: {
          deletedBy: 'user', // Assume user-initiated unless specified
        },
      });

      await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId });
      break;
    }
    default:
    // Ignored webhook event types
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
