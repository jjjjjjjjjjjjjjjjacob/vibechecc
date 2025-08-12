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
    case 'user.created':
      // Create user in database
      await (ctx as any).runMutation(internal.users.upsertFromClerk, {
        data: event.data,
      });

      // Track signup to PostHog
      await (ctx as any).runAction(internal.users.trackUserSignup, {
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

    case 'user.updated': {
      await (ctx as any).runMutation(internal.users.upsertFromClerk, {
        data: event.data,
      });

      // Check if user has admin role in organizations
      const organizationMemberships = (event.data as any)
        .organization_memberships;
      if (organizationMemberships) {
        const hasAdminRole = organizationMemberships.some(
          (membership: any) =>
            membership.role === 'org:admin' || membership.role === 'admin'
        );

        await (ctx as any).runMutation(internal.users.admin.updateAdminStatus, {
          externalId: event.data.id,
          isAdmin: hasAdminRole,
        });
      }
      break;
    }

    case 'user.deleted': {
      const clerkUserId = event.data.id!;
      // console.log('Deleting user', clerkUserId);
      await (ctx as any).runMutation(internal.users.deleteFromClerk, {
        clerkUserId,
      });
      break;
    }

    case 'organizationMembership.created' as any:
    case 'organizationMembership.updated' as any: {
      const membershipData = event.data as any;
      const userId = membershipData.public_user_data?.user_id;
      const role = membershipData.role;

      if (userId) {
        const isAdmin = role === 'org:admin' || role === 'admin';
        console.log(
          `Updating admin status for user ${userId}: role=${role}, isAdmin=${isAdmin}`
        );

        await (ctx as any).runMutation(internal.users.admin.updateAdminStatus, {
          externalId: userId,
          isAdmin,
        });
      }
      break;
    }

    case 'organizationMembership.deleted' as any: {
      const membershipData = event.data as any;
      const userId = membershipData.public_user_data?.user_id;

      if (userId) {
        console.log(
          `Removing admin status for user ${userId} (membership deleted)`
        );

        await (ctx as any).runMutation(internal.users.admin.updateAdminStatus, {
          externalId: userId,
          isAdmin: false,
        });
      }
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
