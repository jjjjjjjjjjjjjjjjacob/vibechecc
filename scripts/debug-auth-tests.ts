#!/usr/bin/env bun

import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api } from '../convex/_generated/api';

// Modules for convex-test
const modules = {
  'convex/users.ts': () => import('../convex/users'),
  'convex/vibes.ts': () => import('../convex/vibes'),
  'convex/seed.ts': () => import('../convex/seed'),
  'convex/_generated/api.js': () => import('../convex/_generated/api'),
  'convex/_generated/server.js': () => import('../convex/_generated/server'),
};

// ANSI color codes for better output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message: string, _color: string = colors.white) {
  // console.log(`${_color}${message}${colors.reset}`);
}

function logHeader(message: string) {
  log(`\n${colors.bold}${colors.cyan}=== ${message} ===${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function runAuthenticationDebugTests() {
  logHeader('Starting Authentication Debug Tests');

  const t = convexTest(schema, modules);
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: No Authentication Context
  logHeader('Test 1: No Authentication Context');
  try {
    const result = await t.query(api.users.current, {});
    if (result === null) {
      logSuccess('✓ current() returns null when no authentication context');
      testsPassed++;
    } else {
      logError('✗ current() should return null when no authentication context');
      logError(`  Actual result: ${JSON.stringify(result, null, 2)}`);
      testsFailed++;
    }
  } catch (error) {
    logError(
      `✗ current() threw error when no authentication context: ${error}`
    );
    testsFailed++;
  }

  // Test 2: Debug Auth Without Context
  logHeader('Test 2: Debug Auth Without Context');
  try {
    const debugResult = await t.query(api.users.debugAuth, {});
    logInfo(`Debug result: ${JSON.stringify(debugResult, null, 2)}`);

    if (
      debugResult.hasAuth &&
      !debugResult.hasIdentity &&
      debugResult.identity === null
    ) {
      logSuccess(
        '✓ debugAuth() shows correct state when no authentication context'
      );
      testsPassed++;
    } else {
      logError(
        '✗ debugAuth() shows incorrect state when no authentication context'
      );
      testsFailed++;
    }
  } catch (error) {
    logError(
      `✗ debugAuth() threw error when no authentication context: ${error}`
    );
    testsFailed++;
  }

  // Test 3: With Authentication Context
  logHeader('Test 3: With Authentication Context');
  const mockIdentity = {
    subject: 'debug_test_user_12345',
    tokenIdentifier: 'debug_test_token_12345',
    email: 'debug@example.com',
    givenName: 'Debug',
    familyName: 'User',
    nickname: 'debuguser',
    pictureUrl: 'https://example.com/debug-avatar.jpg',
  };

  try {
    const debugResult = await t
      .withIdentity(mockIdentity)
      .query(api.users.debugAuth, {});

    logInfo(`Debug result with auth: ${JSON.stringify(debugResult, null, 2)}`);

    if (
      debugResult.hasAuth &&
      debugResult.hasIdentity &&
      debugResult.identity
    ) {
      logSuccess('✓ debugAuth() shows authenticated state');

      if (debugResult.identity.subject === mockIdentity.subject) {
        logSuccess('✓ Identity subject matches');
      } else {
        logError(
          `✗ Identity subject mismatch. Expected: ${mockIdentity.subject}, Got: ${debugResult.identity.subject}`
        );
        testsFailed++;
      }

      if (debugResult.identity.email === mockIdentity.email) {
        logSuccess('✓ Identity email matches');
      } else {
        logError(
          `✗ Identity email mismatch. Expected: ${mockIdentity.email}, Got: ${debugResult.identity.email}`
        );
        testsFailed++;
      }

      testsPassed++;
    } else {
      logError('✗ debugAuth() does not show authenticated state');
      testsFailed++;
    }
  } catch (error) {
    logError(`✗ debugAuth() threw error with authentication context: ${error}`);
    testsFailed++;
  }

  // Test 4: Current User Without Database Record
  logHeader('Test 4: Current User Without Database Record');
  try {
    const currentResult = await t
      .withIdentity(mockIdentity)
      .query(api.users.current, {});

    if (currentResult === null) {
      logSuccess('✓ current() returns null when user not in database');
      testsPassed++;
    } else {
      logError('✗ current() should return null when user not in database');
      logError(`  Actual result: ${JSON.stringify(currentResult, null, 2)}`);
      testsFailed++;
    }
  } catch (error) {
    logError(
      `✗ current() threw error with authentication but no database record: ${error}`
    );
    testsFailed++;
  }

  // Test 5: Create User and Test Current
  logHeader('Test 5: Create User and Test Current');
  try {
    // Create user in database
    const userId = await t.mutation(api.users.create, {
      externalId: mockIdentity.subject,
      username: mockIdentity.nickname,
      image_url: mockIdentity.pictureUrl,
    });

    logInfo(`Created user with ID: ${userId}`);

    // Now test current() with user in database
    const currentResult = await t
      .withIdentity(mockIdentity)
      .query(api.users.current, {});

    if (currentResult && currentResult.externalId === mockIdentity.subject) {
      logSuccess(
        '✓ current() returns user when authenticated and user exists in database'
      );
      logInfo(`User data: ${JSON.stringify(currentResult, null, 2)}`);
      testsPassed++;
    } else {
      logError(
        '✗ current() does not return correct user when authenticated and user exists'
      );
      logError(`  Expected externalId: ${mockIdentity.subject}`);
      logError(`  Actual result: ${JSON.stringify(currentResult, null, 2)}`);
      testsFailed++;
    }
  } catch (error) {
    logError(`✗ Error in create user and test current: ${error}`);
    testsFailed++;
  }

  // Test 6: Ensure User Exists
  logHeader('Test 6: Ensure User Exists');
  const newMockIdentity = {
    subject: 'ensure_test_user_67890',
    tokenIdentifier: 'ensure_test_token_67890',
    email: 'ensure@example.com',
    givenName: 'Ensure',
    familyName: 'Test',
    nickname: 'ensuretest',
    pictureUrl: 'https://example.com/ensure-avatar.jpg',
  };

  try {
    // First verify user doesn't exist
    const beforeResult = await t
      .withIdentity(newMockIdentity)
      .query(api.users.current, {});

    if (beforeResult === null) {
      logInfo('✓ User does not exist before ensureUserExists');
    } else {
      logWarning('User already exists before ensureUserExists test');
    }

    // Call ensureUserExists
    const ensureResult = await t
      .withIdentity(newMockIdentity)
      .mutation(api.users.ensureUserExists, {});

    if (ensureResult && ensureResult.externalId === newMockIdentity.subject) {
      logSuccess('✓ ensureUserExists creates user successfully');
      logInfo(`Created user: ${JSON.stringify(ensureResult, null, 2)}`);
      testsPassed++;
    } else {
      logError('✗ ensureUserExists did not create user correctly');
      logError(`  Expected externalId: ${newMockIdentity.subject}`);
      logError(`  Actual result: ${JSON.stringify(ensureResult, null, 2)}`);
      testsFailed++;
    }

    // Verify user now exists via current()
    const afterResult = await t
      .withIdentity(newMockIdentity)
      .query(api.users.current, {});

    if (afterResult && afterResult.externalId === newMockIdentity.subject) {
      logSuccess('✓ current() now returns user after ensureUserExists');
      testsPassed++;
    } else {
      logError('✗ current() does not return user after ensureUserExists');
      testsFailed++;
    }
  } catch (error) {
    logError(`✗ Error in ensure user exists test: ${error}`);
    testsFailed++;
  }

  // Test 7: Onboarding Status
  logHeader('Test 7: Onboarding Status');
  try {
    const onboardingStatus = await t
      .withIdentity(newMockIdentity)
      .query(api.users.getOnboardingStatus, {});

    logInfo(`Onboarding status: ${JSON.stringify(onboardingStatus, null, 2)}`);

    if (onboardingStatus.userExists && !onboardingStatus.completed) {
      logSuccess('✓ Onboarding status shows user exists but not completed');
      testsPassed++;
    } else {
      logError('✗ Onboarding status incorrect');
      testsFailed++;
    }
  } catch (error) {
    logError(`✗ Error in onboarding status test: ${error}`);
    testsFailed++;
  }

  // Test 8: Authentication Errors
  logHeader('Test 8: Authentication Errors');
  try {
    // Test mutation without auth
    try {
      await t.mutation(api.users.ensureUserExists, {});
      logError('✗ ensureUserExists should throw error without authentication');
      testsFailed++;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('User not authenticated')
      ) {
        logSuccess(
          '✓ ensureUserExists throws correct error without authentication'
        );
        testsPassed++;
      } else {
        logError(`✗ ensureUserExists throws wrong error: ${error}`);
        testsFailed++;
      }
    }

    // Test action without auth
    try {
      await t.action(api.users.updateProfile, {});
      logError('✗ updateProfile should throw error without authentication');
      testsFailed++;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('User not authenticated')
      ) {
        logSuccess(
          '✓ updateProfile throws correct error without authentication'
        );
        testsPassed++;
      } else {
        logError(`✗ updateProfile throws wrong error: ${error}`);
        testsFailed++;
      }
    }
  } catch (error) {
    logError(`✗ Error in authentication errors test: ${error}`);
    testsFailed++;
  }

  // Summary
  logHeader('Test Summary');
  log(`${colors.bold}Total Tests: ${testsPassed + testsFailed}${colors.reset}`);
  logSuccess(`Passed: ${testsPassed}`);
  if (testsFailed > 0) {
    logError(`Failed: ${testsFailed}`);
  } else {
    logSuccess(`Failed: ${testsFailed}`);
  }

  if (testsFailed === 0) {
    logSuccess(
      `\n${colors.bold}🎉 All authentication tests passed!${colors.reset}`
    );
  } else {
    logError(
      `\n${colors.bold}💥 ${testsFailed} authentication test(s) failed${colors.reset}`
    );
  }

  // Return exit code
  return testsFailed === 0 ? 0 : 1;
}

// Run the tests if this script is executed directly
if (import.meta.main) {
  runAuthenticationDebugTests()
    .then((exitCode) => {
      process.exit(exitCode);
    })
    .catch((error) => {
      logError(`Fatal error running tests: ${error}`);
      process.exit(1);
    });
}

export { runAuthenticationDebugTests };
