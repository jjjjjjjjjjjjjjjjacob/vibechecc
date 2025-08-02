import { convexTest } from 'convex-test';
import { describe, test, expect, beforeEach } from 'vitest';
import { api } from '../_generated/api';
import schema from '../schema';
import { modules } from '../../vitest.setup';

describe('files', () => {
  let t: any;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  test('should generate upload URL for authenticated user', async () => {
    // Mock authenticated user
    const asUser = t.withIdentity({
      subject: 'user123',
      nickname: 'testuser',
    });

    const uploadUrl = await asUser.mutation(api.files.generateUploadUrl, {});

    expect(uploadUrl).toBeDefined();
    expect(typeof uploadUrl).toBe('string');
    expect(uploadUrl).toMatch(/^https?:\/\//);
  });

  test('should throw error when generating upload URL without authentication', async () => {
    await expect(t.mutation(api.files.generateUploadUrl, {})).rejects.toThrow(
      'You must be logged in to upload files'
    );
  });

  test.skip('should delete file for authenticated user', async () => {
    // NOTE: This test is skipped because convex-test requires actual storage IDs
    // The validation happens before the handler, making it difficult to test with mock IDs
    // TODO: Implement integration test that actually uploads a file first
    console.log(
      'Delete file test skipped - requires actual storage ID from upload'
    );
  });

  test.skip('should throw error when deleting file without authentication', async () => {
    // NOTE: This test is skipped because convex-test requires actual storage IDs
    // The validation happens before the handler, so auth error is never reached with invalid ID
    // TODO: Implement integration test with actual storage ID
    console.log(
      'Delete auth test skipped - validation occurs before auth check'
    );
  });
});
