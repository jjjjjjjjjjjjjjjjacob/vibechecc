# Clerk OAuth Provider Setup Guide

This guide covers the complete setup process for configuring OAuth providers (Twitter, Instagram, TikTok) with Clerk for the vibechecc social sharing feature.

## Overview

The vibechecc social sharing system integrates with Clerk's OAuth system to automatically sync social media connections when users authenticate with external providers. This enables seamless social sharing functionality without requiring separate OAuth flows.

## Prerequisites

- Clerk account with appropriate plan (OAuth providers may require paid plans)
- Developer accounts with each social platform
- ngrok for local webhook testing
- Production domains configured for production deployment

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Clerk Configuration
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
CLERK_WEBHOOK_SECRET_ALT=whsec_your_alt_webhook_secret_here  # Optional, for multi-instance setups

# Social Platform OAuth (if using custom OAuth apps)
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

## Platform-Specific Setup

### 1. Twitter/X OAuth Setup

#### Development Setup

1. **Create Twitter Developer Account**
   - Visit [developer.twitter.com](https://developer.twitter.com)
   - Apply for a developer account
   - Create a new project and app

2. **Configure OAuth 2.0 Settings**

   ```
   App Type: Web App
   Callback URLs:
     - Development: https://your-ngrok-url.ngrok.io/v1/oauth_callback
     - Production: https://your-domain.com/v1/oauth_callback
   Website URL: https://vibechecc.com
   Terms of Service: https://vibechecc.com/terms
   Privacy Policy: https://vibechecc.com/privacy
   ```

3. **Required OAuth Scopes**

   ```
   tweet.read
   tweet.write
   users.read
   offline.access  # For refresh tokens
   ```

4. **Clerk Configuration**
   - Go to Clerk Dashboard → Authentication → Social connections
   - Add Twitter provider
   - Enter Client ID and Client Secret
   - Configure redirect URLs to match your app

#### Production Setup

- Use your own Twitter OAuth app credentials
- Update callback URLs to production domains
- Ensure proper HTTPS configuration

### 2. Instagram OAuth Setup

#### Development Setup

1. **Create Instagram Basic Display App**
   - Visit [developers.facebook.com](https://developers.facebook.com)
   - Create new app → Consumer type
   - Add Instagram Basic Display product

2. **Configure OAuth Settings**

   ```
   Valid OAuth Redirect URIs:
     - Development: https://your-ngrok-url.ngrok.io/v1/oauth_callback
     - Production: https://your-domain.com/v1/oauth_callback
   Deauthorize Callback URL: https://your-domain.com/auth/deauthorize
   Data Deletion Request URL: https://your-domain.com/auth/delete
   ```

3. **Required Permissions**

   ```
   user_profile
   user_media
   ```

4. **Clerk Configuration**
   - Add Instagram provider in Clerk Dashboard
   - Enter App ID and App Secret
   - Configure redirect URLs

#### Production Setup

- Submit app for Instagram Review if accessing other users' data
- Configure proper webhook endpoints for deauthorization
- Implement data deletion callbacks as required by Instagram

### 3. TikTok OAuth Setup

#### Development Setup

1. **Create TikTok Developer Account**
   - Visit [developers.tiktok.com](https://developers.tiktok.com)
   - Create developer account
   - Create new app

2. **Configure OAuth Settings**

   ```
   Redirect URI:
     - Development: https://your-ngrok-url.ngrok.io/v1/oauth_callback
     - Production: https://your-domain.com/v1/oauth_callback
   Scope: user.info.basic, video.list
   ```

3. **Required Scopes**

   ```
   user.info.basic  # Basic user information
   video.list       # Access to user's videos (if needed)
   ```

4. **Clerk Configuration**
   - Add custom OAuth provider for TikTok
   - Use OpenID Connect configuration
   - Enter Client ID and Client Secret

#### Production Setup

- Submit app for TikTok review process
- Comply with TikTok's data usage policies
- Implement proper rate limiting

## Clerk Dashboard Configuration

### 1. Enable Social Providers

1. **Navigate to Clerk Dashboard**
   - Go to Authentication → Social connections
   - Enable desired providers (Twitter, Instagram, TikTok)

2. **Configure Each Provider**

   ```
   Twitter:
   ✅ Enable Twitter OAuth 2.0
   ✅ Client ID: [your_twitter_client_id]
   ✅ Client Secret: [your_twitter_client_secret]
   ✅ Scopes: tweet.read, tweet.write, users.read, offline.access

   Instagram:
   ✅ Enable Instagram Basic Display
   ✅ Client ID: [your_instagram_app_id]
   ✅ Client Secret: [your_instagram_app_secret]
   ✅ Scopes: user_profile, user_media

   TikTok (Custom OAuth):
   ✅ Enable Custom OAuth Provider
   ✅ Name: TikTok
   ✅ Client ID: [your_tiktok_client_id]
   ✅ Client Secret: [your_tiktok_client_secret]
   ✅ Authorization URL: https://www.tiktok.com/auth/authorize/
   ✅ Token URL: https://open-api.tiktok.com/oauth/access_token/
   ✅ User Info URL: https://open-api.tiktok.com/oauth/userinfo/
   ✅ Scopes: user.info.basic
   ```

### 2. Configure Webhooks

1. **Enable Webhook Endpoint**

   ```
   Development: https://your-ngrok-url.ngrok.io/clerk
   Production: https://your-domain.com/clerk
   ```

2. **Subscribe to Events**

   ```
   ✅ user.created
   ✅ user.updated
   ✅ user.deleted
   ```

3. **Webhook Security**
   - Copy webhook signing secret to environment variables
   - Test webhook delivery with ngrok during development

## Local Development Setup

### 1. Install ngrok

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from ngrok.com

# Authenticate with your ngrok account
ngrok authtoken YOUR_NGROK_AUTH_TOKEN
```

### 2. Start Development Environment

```bash
# Terminal 1: Start your development server
bun run dev

# Terminal 2: Start ngrok tunnel
ngrok http 3000

# Note the HTTPS URL provided by ngrok (e.g., https://abc123.ngrok.io)
```

### 3. Update OAuth Callback URLs

- Update callback URLs in each social platform's developer console
- Update webhook endpoint in Clerk Dashboard
- Test OAuth flows to ensure proper integration

## Testing OAuth Integration

### 1. Test User Registration Flow

1. Start development environment with ngrok
2. Navigate to your app's sign-up page
3. Click "Continue with Twitter" (or other provider)
4. Complete OAuth flow
5. Verify user creation in Clerk Dashboard
6. Check webhook logs for OAuth connection sync

### 2. Verify Webhook Processing

```bash
# Check Convex logs for webhook processing
bun run dev:backend

# Look for log messages like:
# "Syncing OAuth connections for user clerk_user_123, found 1 external accounts"
# "Successfully synced twitter connection for user clerk_user_123"
```

### 3. Test Social Connection Storage

```bash
# Use Convex dashboard to query social connections
# Query: social.connections.getSocialConnections
# Should return connected accounts for authenticated users
```

## Production Deployment

### 1. Environment Configuration

```bash
# Production environment variables
CLERK_WEBHOOK_SECRET=whsec_production_secret
CLERK_PUBLISHABLE_KEY=pk_live_production_key
CLERK_SECRET_KEY=sk_live_production_key

# Social platform OAuth (if using custom apps)
TWITTER_CLIENT_ID=production_twitter_client_id
TWITTER_CLIENT_SECRET=production_twitter_secret
# ... other platform credentials
```

### 2. Update OAuth Applications

- Change callback URLs from ngrok to production domains
- Update webhook endpoints to production URLs
- Test OAuth flows in production environment

### 3. SSL/HTTPS Configuration

- Ensure all OAuth callback URLs use HTTPS
- Configure proper SSL certificates
- Test webhook delivery with production SSL

## Security Considerations

### 1. Webhook Security

- Always verify webhook signatures using Clerk's verification
- Use HTTPS for all webhook endpoints
- Implement proper error handling and logging
- Rate limit webhook endpoints to prevent abuse

### 2. OAuth Token Storage

- OAuth tokens are not stored in webhooks for security
- Tokens should be stored during client-side OAuth flow
- Use proper encryption for sensitive OAuth data
- Implement token refresh mechanisms

### 3. Data Privacy

- Follow platform-specific data usage policies
- Implement proper data deletion workflows
- Provide clear privacy policies to users
- Allow users to disconnect social accounts

## Troubleshooting

### Common Issues

#### 1. Webhook Not Receiving Events

```bash
# Check webhook URL configuration
curl -X POST https://your-domain.com/clerk \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'

# Verify ngrok tunnel is active
ngrok inspect http://localhost:4040
```

#### 2. OAuth Callback Errors

- Verify callback URLs match exactly in platform settings
- Check for HTTPS requirements in production
- Ensure proper scopes are configured
- Test with minimal scopes first

#### 3. Social Connection Not Syncing

```bash
# Check Convex logs for errors
# Look for: "Failed to sync twitter connection for user..."

# Verify webhook events are being received
# Check Clerk Dashboard → Webhooks → Event logs
```

#### 4. Platform-Specific Issues

**Twitter:**

- Ensure OAuth 2.0 is enabled (not OAuth 1.0a)
- Verify all required scopes are granted
- Check Twitter app is not in restricted mode

**Instagram:**

- Ensure using Instagram Basic Display (not Instagram Graph API)
- Verify app is in Live mode for production
- Check redirect URIs match exactly

**TikTok:**

- Verify custom OAuth provider configuration
- Check authorization and token URLs are correct
- Ensure app has been approved for production

## Monitoring and Analytics

### 1. Webhook Monitoring

- Monitor webhook delivery success rates
- Track OAuth connection sync success/failure
- Set up alerts for connection errors

### 2. User Connection Analytics

```bash
# Query connection statistics
# Use: social.connections.getConnectionStats

# Monitor connection health
# Check error counts and failure rates
```

### 3. Platform-Specific Metrics

- Track OAuth flow completion rates
- Monitor token refresh success rates
- Analyze user engagement with social features

## Additional Resources

- [Clerk OAuth Documentation](https://clerk.com/docs/authentication/social-connections/overview)
- [Twitter OAuth 2.0 Guide](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [TikTok OAuth Documentation](https://developers.tiktok.com/doc/oauth-2-0/)
- [ngrok Documentation](https://ngrok.com/docs)

## Support Contacts

For platform-specific issues:

- **Twitter**: Twitter Developer Support
- **Instagram**: Facebook Developer Support
- **TikTok**: TikTok Developer Support
- **Clerk**: Clerk Support (support@clerk.dev)
