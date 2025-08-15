import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import type {
  WebhookEvent,
  UserJSON,
  OrganizationMembershipJSON,
} from '@clerk/backend';
import { Webhook } from 'svix';

const http = httpRouter();

// Type for extended webhook event types (including organization membership events)
type ExtendedWebhookEventType =
  | WebhookEvent['type']
  | 'organizationMembership.created'
  | 'organizationMembership.updated'
  | 'organizationMembership.deleted';

const handleClerkWebhook = httpAction(async (ctx, request) => {
  // SECURITY: Rate limiting and basic request validation
  const userAgent = request.headers.get('user-agent');
  const contentType = request.headers.get('content-type');

  // SECURITY: Validate content type
  if (!contentType || !contentType.includes('application/json')) {
    // eslint-disable-next-line no-console
    console.error('Invalid content type:', contentType);
    return new Response('Invalid content type', { status: 400 });
  }

  // SECURITY: Validate User-Agent (Svix webhooks should have identifiable UA)
  if (!userAgent || !userAgent.includes('Svix')) {
    // eslint-disable-next-line no-console
    console.error('Invalid or missing user agent:', userAgent);
    return new Response('Invalid request', { status: 400 });
  }

  const event = await validateRequest(request);
  if (!event) {
    return new Response('Webhook validation failed', { status: 400 });
  }

  switch (event.type as ExtendedWebhookEventType) {
    case 'user.created': {
      const userData = event.data as UserJSON;
      // Create user in database
      await ctx.runMutation(internal.users.upsertFromClerk, {
        data: userData,
      });

      // Track signup to PostHog
      await ctx.runAction(internal.users.trackUserSignup, {
        userId: userData.id,
        email: userData.email_addresses?.[0]?.email_address,
        username: userData.username || undefined,
        firstName: userData.first_name || undefined,
        lastName: userData.last_name || undefined,
        signupMethod: 'clerk',
        createdAt: userData.created_at,
      });

      // eslint-disable-next-line no-console
      console.log(
        `New user created: ${userData.id} (${userData.email_addresses?.[0]?.email_address})`
      );
      break;
    }

    case 'user.updated': {
      const userData = event.data as UserJSON;
      await ctx.runMutation(internal.users.upsertFromClerk, {
        data: userData,
      });

      // Check if user has admin role in organizations
      const organizationMemberships = (
        userData as UserJSON & {
          organization_memberships?: Array<{ role: string }>;
        }
      ).organization_memberships;
      if (organizationMemberships) {
        const hasAdminRole = organizationMemberships.some((membership) => {
          return membership.role === 'org:admin' || membership.role === 'admin';
        });

        await ctx.runMutation(internal.users.admin.updateAdminStatus, {
          externalId: userData.id,
          isAdmin: hasAdminRole,
        });
      }
      break;
    }

    case 'user.deleted': {
      const userData = event.data as UserJSON;
      const clerkUserId = userData.id;
      // console.log('Deleting user', clerkUserId);
      await ctx.runMutation(internal.users.deleteFromClerk, {
        clerkUserId,
      });
      break;
    }

    case 'organizationMembership.created':
    case 'organizationMembership.updated': {
      const membershipData = event.data as OrganizationMembershipJSON;
      const publicUserData = (
        membershipData as OrganizationMembershipJSON & {
          public_user_data?: { user_id?: string };
        }
      ).public_user_data;
      const userId = publicUserData?.user_id;
      const role = membershipData.role;

      if (userId) {
        const isAdmin = role === 'org:admin' || role === 'admin';
        // eslint-disable-next-line no-console
        console.log(
          `Updating admin status for user ${userId}: role=${role}, isAdmin=${isAdmin}`
        );

        await ctx.runMutation(internal.users.admin.updateAdminStatus, {
          externalId: userId,
          isAdmin,
        });
      }
      break;
    }

    case 'organizationMembership.deleted': {
      const membershipData = event.data as OrganizationMembershipJSON;
      const publicUserData = (
        membershipData as OrganizationMembershipJSON & {
          public_user_data?: { user_id?: string };
        }
      ).public_user_data;
      const userId = publicUserData?.user_id;

      if (userId) {
        // eslint-disable-next-line no-console
        console.log(`Removing admin status for user ${userId}`);
        await ctx.runMutation(internal.users.admin.updateAdminStatus, {
          externalId: userId,
          isAdmin: false,
        });
      }
      break;
    }

    default:
      // console.log('Unhandled event type:', event.type);
      break;
  }

  return new Response(null, { status: 200 });
});

/**
 * Validate webhook request from Clerk
 *
 * This function supports multiple webhook signing secrets to allow the same
 * backend to handle webhooks from different Clerk instances (e.g., main and main-alt).
 * It will try the main secret first, and if that fails and an alternative secret
 * is configured, it will try that one.
 */
async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const mainWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  const mainAltWebhookSecret = process.env.CLERK_WEBHOOK_SECRET_ALT;

  if (!mainWebhookSecret) {
    // eslint-disable-next-line no-console
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return null;
  }

  const svix_id = req.headers.get('svix-id') ?? '';
  const svix_timestamp = req.headers.get('svix-timestamp') ?? '';
  const svix_signature = req.headers.get('svix-signature') ?? '';

  if (!svix_id || !svix_timestamp || !svix_signature) {
    // eslint-disable-next-line no-console
    console.error('Missing svix headers');
    return null;
  }

  const body = await req.text();

  const svixHeaders = {
    'svix-id': svix_id,
    'svix-timestamp': svix_timestamp,
    'svix-signature': svix_signature,
  };

  // Try main webhook secret first
  try {
    const wh = new Webhook(mainWebhookSecret);
    const event = wh.verify(body, svixHeaders) as WebhookEvent;
    // eslint-disable-next-line no-console
    console.log('Webhook validated with main secret');
    return event;
  } catch (error) {
    // If main secret fails and we have an alt secret, try that
    if (mainAltWebhookSecret) {
      try {
        const whAlt = new Webhook(mainAltWebhookSecret);
        const event = whAlt.verify(body, svixHeaders) as WebhookEvent;
        // eslint-disable-next-line no-console
        console.log('Webhook validated with main-alt secret');
        return event;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_altError) {
        // eslint-disable-next-line no-console
        console.error('Webhook verification failed with both secrets');
        return null;
      }
    }

    // eslint-disable-next-line no-console
    console.error('Webhook verification failed:', error);
    return null;
  }
}

http.route({
  path: '/clerk',
  method: 'POST',
  handler: handleClerkWebhook,
});

export default http;
