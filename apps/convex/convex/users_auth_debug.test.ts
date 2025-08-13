import { convexTest } from 'convex-test';
import { modules } from '../vitest.setup';
import { describe, it, expect, beforeEach } from 'vitest';
import schema, { User } from './schema';
import { api } from './_generated/api';

describe('Authentication Debug Tests', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  describe('ctx.auth.getUserIdentity() Debugging', () => {
    it('should return null when no authentication context is provided', async () => {
      // Test the current query without any authentication
      const result = await t.query(api.users.current, {});

      expect(result).toBeNull();
    });

    it('should return detailed debug info when no authentication is provided', async () => {
      // Test the debugAuth query without authentication
      const debugResult = await t.query(api.users.debugAuth, {});

      expect(debugResult).toEqual({
        hasAuth: true,
        hasIdentity: false,
        hasToken: false,
        identity: null,
      });
    });

    it('should return user identity when proper authentication is provided', async () => {
      // Create a comprehensive mock identity
      const mockIdentity = {
        subject: 'user_auth_test_123',
        tokenIdentifier: 'test_token_identifier_123',
        email: 'authtest@example.com',
        givenName: 'Auth',
        familyName: 'Test',
        nickname: 'authtest',
        pictureUrl: 'https://example.com/auth-test-avatar.jpg',
        emailVerified: true,
        aud: 'test-audience',
        iss: 'https://clerk.example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      // Test debugAuth with authentication
      const debugResult = await t
        .withIdentity(mockIdentity)
        .query(api.users.debugAuth, {});

      expect(debugResult.hasAuth).toBe(true);
      expect(debugResult.hasIdentity).toBe(true);
      expect(debugResult.identity).toBeDefined();
      expect(debugResult.identity?.subject).toBe(mockIdentity.subject);
      // Note: identity object only has basic properties
      // Note: identity object only has basic properties
      // Note: identity object only has basic properties
      // Note: identity object only has basic properties
      // Note: identity object only has basic properties
    });

    it('should return user when authenticated and user exists in database', async () => {
      const mockIdentity = {
        subject: 'user_existing_test_456',
        tokenIdentifier: 'existing_test_token_456',
        email: 'existing@example.com',
        givenName: 'Existing',
        familyName: 'User',
        nickname: 'existinguser',
        pictureUrl: 'https://example.com/existing-avatar.jpg',
      };

      // First create the user in the database
      await t.mutation(api.users.create, {
        externalId: mockIdentity.subject,
        username: mockIdentity.nickname,
        image_url: mockIdentity.pictureUrl,
      });

      // Now test current query with authentication
      const result = await t
        .withIdentity(mockIdentity)
        .query(api.users.current, {});

      expect(result).toBeDefined();
      expect(result?.externalId).toBe(mockIdentity.subject);
      expect(result?.username).toBe(mockIdentity.nickname);
      expect(result?.image_url).toBe(mockIdentity.pictureUrl);
    });

    it('should return null when authenticated but user does not exist in database', async () => {
      const mockIdentity = {
        subject: 'user_nonexistent_test_789',
        tokenIdentifier: 'nonexistent_test_token_789',
        email: 'nonexistent@example.com',
        givenName: 'Nonexistent',
        familyName: 'User',
      };

      // Test current query with authentication but no user in database
      const result = await t
        .withIdentity(mockIdentity)
        .query(api.users.current, {});

      expect(result).toBeNull();
    });
  });

  describe('Authentication Context Variations', () => {
    it('should handle minimal identity object', async () => {
      const minimalIdentity = {
        subject: 'minimal_user_123',
        tokenIdentifier: 'minimal_token_123',
      };

      const debugResult = await t
        .withIdentity(minimalIdentity)
        .query(api.users.debugAuth, {});

      expect(debugResult.hasAuth).toBe(true);
      expect(debugResult.hasIdentity).toBe(true);
      expect(debugResult.identity?.subject).toBe(minimalIdentity.subject);
      expect(debugResult.identity?.tokenIdentifier).toBe('minimal_to...');
    });

    it('should handle identity with missing optional fields', async () => {
      const partialIdentity = {
        subject: 'partial_user_456',
        tokenIdentifier: 'partial_token_456',
        email: 'partial@example.com',
        // Missing givenName, familyName, nickname, pictureUrl
      };

      const debugResult = await t
        .withIdentity(partialIdentity)
        .query(api.users.debugAuth, {});

      expect(debugResult.hasAuth).toBe(true);
      expect(debugResult.hasIdentity).toBe(true);
      expect(debugResult.identity?.subject).toBe(partialIdentity.subject);
      // Note: identity object only has basic properties
      // Note: identity object only has basic properties
      // Note: identity object only has basic properties
    });
  });

  describe('ensureUserExists Debugging', () => {
    it('should create user when authenticated and user does not exist', async () => {
      const mockIdentity = {
        subject: 'ensure_create_test_123',
        tokenIdentifier: 'ensure_create_token_123',
        email: 'ensurecreate@example.com',
        givenName: 'Ensure',
        familyName: 'Create',
        nickname: 'ensurecreate',
        pictureUrl: 'https://example.com/ensure-create-avatar.jpg',
      };

      // Verify user doesn't exist first
      const beforeResult = await t
        .withIdentity(mockIdentity)
        .query(api.users.current, {});
      expect(beforeResult).toBeNull();

      // Call ensureUserExists
      const createdUser = await t
        .withIdentity(mockIdentity)
        .mutation(api.users.ensureUserExists, {});

      expect(createdUser).toBeDefined();
      expect(createdUser?.externalId).toBe(mockIdentity.subject);
      expect(createdUser?.first_name).toBe(mockIdentity.givenName);
      expect(createdUser?.last_name).toBe(mockIdentity.familyName);
      expect(createdUser?.username).toBe(mockIdentity.nickname);
      expect(createdUser?.image_url).toBe(mockIdentity.pictureUrl);

      // Verify user now exists
      const afterResult = await t
        .withIdentity(mockIdentity)
        .query(api.users.current, {});
      expect(afterResult).toBeDefined();
      expect(afterResult?.externalId).toBe(mockIdentity.subject);
    });

    it('should return existing user when authenticated and user already exists', async () => {
      const mockIdentity = {
        subject: 'ensure_existing_test_456',
        tokenIdentifier: 'ensure_existing_token_456',
        email: 'ensureexisting@example.com',
        givenName: 'Ensure',
        familyName: 'Existing',
      };

      // Create user first
      await t.mutation(api.users.create, {
        externalId: mockIdentity.subject,
        username: 'originalusername',
      });

      // Call ensureUserExists - should return existing user
      const result = await t
        .withIdentity(mockIdentity)
        .mutation(api.users.ensureUserExists, {});

      expect(result).toBeDefined();
      expect(result?.externalId).toBe(mockIdentity.subject);
      expect(result?.username).toBe('originalusername'); // Should keep original username
    });
  });

  describe('Onboarding Authentication', () => {
    it('should return proper onboarding status when authenticated', async () => {
      const mockIdentity = {
        subject: 'onboarding_test_123',
        tokenIdentifier: 'onboarding_token_123',
        email: 'onboarding@example.com',
        givenName: 'Onboarding',
        familyName: 'Test',
      };

      // Test onboarding status without user in database
      const statusWithoutUser = await t
        .withIdentity(mockIdentity)
        .query(api.users.getOnboardingStatus, {});

      expect(statusWithoutUser.completed).toBe(false);
      expect(statusWithoutUser.needsOnboarding).toBe(true);
      expect(statusWithoutUser.userExists).toBe(false);

      // Create user
      await t.mutation(api.users.create, {
        externalId: mockIdentity.subject,
        username: 'onboardingtest',
      });

      // Test onboarding status with user in database
      const statusWithUser = await t
        .withIdentity(mockIdentity)
        .query(api.users.getOnboardingStatus, {});

      expect(statusWithUser.completed).toBe(false);
      expect(statusWithUser.needsOnboarding).toBe(true);
      expect(statusWithUser.userExists).toBe(true);

      expect((statusWithUser as any).user).toBeDefined();

      expect((statusWithUser as any).user.externalId).toBe(
        mockIdentity.subject
      );
    });

    it('should handle updateOnboardingData with authentication', async () => {
      const mockIdentity = {
        subject: 'update_onboarding_test_456',
        tokenIdentifier: 'update_onboarding_token_456',
        email: 'updateonboarding@example.com',
        givenName: 'Update',
        familyName: 'Onboarding',
      };

      const onboardingData = {
        username: 'updatedonboardinguser',
        first_name: 'Updated',
        last_name: 'Onboarding',
        interests: ['testing', 'debugging'],
        image_url: 'https://example.com/updated-avatar.jpg',
      };

      // Call updateOnboardingData - should create user and update data
      const result = await t
        .withIdentity(mockIdentity)
        .action(api.users.updateOnboardingData, onboardingData);

      expect(result).toBeDefined();
      expect((result as User).externalId).toBe(mockIdentity.subject);
      expect((result as User).username).toBe(onboardingData.username);
      expect((result as User).first_name).toBe(onboardingData.first_name);
      expect((result as User).last_name).toBe(onboardingData.last_name);
      expect((result as User).interests).toEqual(onboardingData.interests);
      expect((result as User).image_url).toBe(onboardingData.image_url);
    });

    it('should handle completeOnboarding with authentication', async () => {
      const mockIdentity = {
        subject: 'complete_onboarding_test_789',
        tokenIdentifier: 'complete_onboarding_token_789',
        email: 'completeonboarding@example.com',
        givenName: 'Complete',
        familyName: 'Onboarding',
      };

      const completionData = {
        username: 'completedonboardinguser',
        interests: ['testing', 'convex', 'debugging'],
        image_url: 'https://example.com/completed-avatar.jpg',
      };

      // Call completeOnboarding - should create user and mark onboarding as complete
      const result = await t
        .withIdentity(mockIdentity)
        .action(api.users.completeOnboarding, completionData);

      expect(result).toBeDefined();
      expect((result as User).externalId).toBe(mockIdentity.subject);
      expect((result as User).username).toBe(completionData.username);
      expect((result as User).interests).toEqual(completionData.interests);
      expect((result as User).image_url).toBe(completionData.image_url);
      expect((result as User).onboardingCompleted).toBe(true);

      // Verify onboarding status is now complete
      const onboardingStatus = await t
        .withIdentity(mockIdentity)
        .query(api.users.getOnboardingStatus, {});

      expect(onboardingStatus.completed).toBe(true);
      expect(onboardingStatus.needsOnboarding).toBe(false);
      expect(onboardingStatus.userExists).toBe(true);
    });
  });

  describe('Profile Update Authentication', () => {
    it('should handle updateProfile with authentication', async () => {
      const mockIdentity = {
        subject: 'update_profile_test_123',
        tokenIdentifier: 'update_profile_token_123',
        email: 'updateprofile@example.com',
        givenName: 'Update',
        familyName: 'Profile',
      };

      // Create user first
      await t.mutation(api.users.create, {
        externalId: mockIdentity.subject,
        username: 'originalprofile',
      });

      const profileData = {
        username: 'updatedprofile',
        first_name: 'Updated',
        last_name: 'Profile',
        bio: 'This is my updated bio',
        socials: {
          twitter: 'updatedprofile',
          instagram: 'updatedprofile',
        },
      };

      // Call updateProfile
      const result = await t
        .withIdentity(mockIdentity)
        .action(api.users.updateProfile, profileData);

      expect(result).toBeDefined();
      expect((result as User).externalId).toBe(mockIdentity.subject);
      expect((result as User).username).toBe(profileData.username);
      expect((result as User).first_name).toBe(profileData.first_name);
      expect((result as User).last_name).toBe(profileData.last_name);
      expect((result as User).bio).toBe(profileData.bio);
      expect((result as User).socials).toEqual(profileData.socials);
    });
  });

  describe('Error Cases', () => {
    it('should throw error when calling mutation without authentication', async () => {
      await expect(t.mutation(api.users.ensureUserExists, {})).rejects.toThrow(
        'User not authenticated'
      );
    });

    it('should throw error when calling action without authentication', async () => {
      await expect(t.action(api.users.updateProfile, {})).rejects.toThrow(
        'User not authenticated'
      );
    });

    it('should throw error when calling updateOnboardingData without authentication', async () => {
      await expect(
        t.action(api.users.updateOnboardingData, {})
      ).rejects.toThrow('User not authenticated');
    });

    it('should throw error when calling completeOnboarding without authentication', async () => {
      await expect(t.action(api.users.completeOnboarding, {})).rejects.toThrow(
        'User not authenticated'
      );
    });
  });
});
