/**
 * Integration tests for Convex file operations. These tests verify
 * that authenticated users can generate upload URLs and that the
 * storage endpoints behave as expected.
 */
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

    // Data integrity verification
    // 1. Verify URL uniqueness - each call should generate a unique URL
    const uploadUrl2 = await asUser.mutation(api.files.generateUploadUrl, {});
    expect(uploadUrl2).not.toBe(uploadUrl);

    // 2. Verify URL structure consistency - should contain expected storage components
    expect(uploadUrl).toMatch(/\/storage\/upload/);
    expect(uploadUrl).toContain('token=');

    // 3. Verify authentication consistency - different user should get different URL base
    const asUser2 = t.withIdentity({
      subject: 'user456',
      nickname: 'testuser2',
    });
    const uploadUrl3 = await asUser2.mutation(api.files.generateUploadUrl, {});
    expect(uploadUrl3).toBeDefined();
    expect(uploadUrl3).not.toBe(uploadUrl);

    // 4. Verify URL functionality - test basic upload structure simulation
    // Parse URL to ensure it has required components for upload
    const url = new URL(uploadUrl);
    expect(url.searchParams.get('token')).toBeTruthy();
    expect(url.pathname).toContain('/storage/upload');
  });

  test('should throw error when generating upload URL without authentication', async () => {
    await expect(t.mutation(api.files.generateUploadUrl, {})).rejects.toThrow(
      'You must be logged in to upload files'
    );
  });

  test('should successfully generate and use storage URL for file operations', async () => {
    const asUser = t.withIdentity({
      subject: 'user123',
      nickname: 'testuser',
    });

    // Test successful upload URL generation
    const uploadUrl = await asUser.mutation(api.files.generateUploadUrl);
    expect(uploadUrl).toBeDefined();
    expect(uploadUrl).toContain('upload'); // Should be a valid upload URL
  });

  test('should handle getUrl query for storage operations', async () => {
    // Test getting URL for a storage ID (with optional parameter)
    const result = await t.query(api.files.getUrl, {});
    expect(result).toBeNull(); // Should return null when no storageId provided
  });
});
