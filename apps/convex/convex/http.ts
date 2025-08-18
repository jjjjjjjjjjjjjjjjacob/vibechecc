import { httpRouter } from 'convex/server';
import { httpAction, type ActionCtx } from './_generated/server';
import { internal } from './_generated/api';
import type {
  WebhookEvent,
  UserJSON,
  OrganizationMembershipJSON,
} from '@clerk/backend';
import { Webhook } from 'svix';

const http = httpRouter();

// Type for extended webhook event types (including organization membership and session events)
type ExtendedWebhookEventType =
  | WebhookEvent['type']
  | 'organizationMembership.created'
  | 'organizationMembership.updated'
  | 'organizationMembership.deleted'
  | 'session.created'
  | 'session.ended';

// Helper function to sync OAuth connections from Clerk user data
async function syncUserOAuthConnections(
  ctx: ActionCtx,
  userData: UserJSON
): Promise<void> {
  try {
    // Extract external accounts (OAuth connections) from user data
    const externalAccounts = userData.external_accounts || [];

    // eslint-disable-next-line no-console
    console.log(
      `Syncing OAuth connections for user ${userData.id}, found ${externalAccounts.length} external accounts`
    );

    for (const account of externalAccounts) {
      // Map Clerk provider names to our platform types
      const platformMapping: Record<
        string,
        'twitter' | 'instagram' | 'tiktok' | null
      > = {
        oauth_twitter: 'twitter',
        oauth_x: 'twitter', // X (formerly Twitter)
        oauth_instagram: 'instagram',
        oauth_tiktok: 'tiktok',
        twitter: 'twitter',
        x: 'twitter',
        instagram: 'instagram',
        tiktok: 'tiktok',
      };

      const platform = platformMapping[account.provider] || null;

      // Skip unsupported platforms (like Apple sign-in) or accounts without user IDs
      if (!platform) {
        // Only log for truly unsupported providers, not Apple
        if (!account.provider.includes('apple')) {
          // eslint-disable-next-line no-console
          console.log(
            `Skipping unsupported OAuth provider: ${account.provider}`
          );
        }
        continue;
      }

      // Skip if no provider user ID (some OAuth connections might not have one yet)
      if (!account.provider_user_id || account.provider_user_id.trim() === '') {
        // eslint-disable-next-line no-console
        console.log(
          `Skipping ${account.provider} - no provider user ID available`
        );
        continue;
      }

      // Store or update the social connection
      try {
        await ctx.runMutation(
          internal.social.connections.internalConnectSocialAccount,
          {
            userId: userData.id,
            platform,
            platformUserId: account.provider_user_id,
            platformUsername:
              account.username || account.email_address || undefined,
            // Note: We don't have access to OAuth tokens through webhooks for security
            // These would need to be stored during the OAuth flow on the client side
            accessToken: undefined,
            refreshToken: undefined,
            tokenExpiresAt: undefined,
            metadata: {
              email: account.email_address,
              firstName: account.first_name,
              lastName: account.last_name,
              imageUrl: account.image_url,
              provider: account.provider,
              clerkAccountId: account.id,
              verificationStatus: account.verification?.status,
              approvedScopes: account.approved_scopes,
            },
          }
        );

        // eslint-disable-next-line no-console
        console.log(
          `Successfully synced ${platform} connection for user ${userData.id}`
        );
      } catch (connectionError) {
        // eslint-disable-next-line no-console
        console.error(
          `Failed to sync ${platform} connection for user ${userData.id}:`,
          connectionError
        );

        // Try to mark the connection as having an error
        try {
          await ctx.runMutation(
            internal.social.connections.internalMarkConnectionError,
            {
              userId: userData.id,
              platform,
              errorMessage: `Webhook sync failed: ${connectionError instanceof Error ? connectionError.message : 'Unknown error'}`,
            }
          );
        } catch (markErrorFailure) {
          // eslint-disable-next-line no-console
          console.error(
            `Failed to mark connection error for ${platform}:`,
            markErrorFailure
          );
        }
      }
    }
  } catch (syncError) {
    // eslint-disable-next-line no-console
    console.error(
      `Failed to sync OAuth connections for user ${userData.id}:`,
      syncError
    );
  }
}

// Helper function to clean up OAuth connections when user is deleted
async function cleanupUserOAuthConnections(
  ctx: ActionCtx,
  clerkUserId: string
): Promise<void> {
  try {
    const result = await ctx.runMutation(
      internal.social.connections.cleanupUserConnections,
      {
        clerkUserId,
      }
    );

    // eslint-disable-next-line no-console
    console.log(
      `Cleaned up ${result.cleaned} OAuth connections for deleted user ${clerkUserId}`
    );
  } catch (cleanupError) {
    // eslint-disable-next-line no-console
    console.error(
      `Failed to cleanup OAuth connections for deleted user ${clerkUserId}:`,
      cleanupError
    );
  }
}

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

      // Sync OAuth connections if present
      await syncUserOAuthConnections(ctx, userData);

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

      // Sync OAuth connections if present
      await syncUserOAuthConnections(ctx, userData);

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

      // Clean up OAuth connections before deleting user
      await cleanupUserOAuthConnections(ctx, clerkUserId);

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

    case 'session.created': {
      // Session created - track social connections that are active
      const sessionData = event.data as unknown as Record<string, unknown>; // Session type not exported by Clerk
      const userId = sessionData.user_id as string;

      if (userId) {
        // eslint-disable-next-line no-console
        console.log(`Session created for user ${userId}`);

        // Fetch the user data to sync OAuth connections
        // This ensures we capture any new OAuth connections made during sign-in
        try {
          // Note: We might need to fetch full user data from Clerk API here
          // For now, we'll just log the event for monitoring
          await ctx.runAction(internal.users.trackSessionEvent, {
            userId,
            eventType: 'session_created',
            timestamp: (sessionData.created_at as number) || Date.now(),
            metadata: {
              sessionId: sessionData.id as string,
              clientId: sessionData.client_id as string,
              status: sessionData.status as string,
            },
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(
            `Failed to track session creation for user ${userId}:`,
            error
          );
        }
      }
      break;
    }

    case 'session.ended': {
      // Session ended - track when users sign out
      const sessionData = event.data as unknown as Record<string, unknown>; // Session type not exported by Clerk
      const userId = sessionData.user_id as string;

      if (userId) {
        // eslint-disable-next-line no-console
        console.log(`Session ended for user ${userId}`);

        try {
          await ctx.runAction(internal.users.trackSessionEvent, {
            userId,
            eventType: 'session_ended',
            timestamp: (sessionData.updated_at as number) || Date.now(),
            metadata: {
              sessionId: sessionData.id as string,
              abandonedAt: sessionData.abandoned_at as number | undefined,
              endedAt: sessionData.ended_at as number | undefined,
            },
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(
            `Failed to track session end for user ${userId}:`,
            error
          );
        }
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
export async function validateRequest(
  req: Request
): Promise<WebhookEvent | null> {
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
  path: '/webhooks/clerk',
  method: 'POST',
  handler: handleClerkWebhook,
});

export default http;
