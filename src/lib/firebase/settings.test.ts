import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest';
import { syncPrivacyConsent } from './settings';
import { auth } from './config';

describe('syncPrivacyConsent error paths', () => {
  let originalFetch: typeof globalThis.fetch;
  let originalCurrentUser: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    originalFetch = globalThis.fetch;
    originalCurrentUser = auth.currentUser;
    // Suppress console.error during tests to avoid noise
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    Object.defineProperty(auth, 'currentUser', { value: originalCurrentUser, configurable: true });
  });

  it('should throw an error if not authenticated', async () => {
    Object.defineProperty(auth, 'currentUser', { value: null, configurable: true });

    await expect(
      syncPrivacyConsent('test-uid')
    ).rejects.toThrow('Not authenticated');
  });

  it('should throw an error if fetch response is not ok', async () => {
    Object.defineProperty(auth, 'currentUser', {
      value: { getIdToken: async () => 'mock-token' },
      configurable: true
    });

    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      text: async () => 'Internal Server Error'
    })) as any;

    await expect(
      syncPrivacyConsent('test-uid')
    ).rejects.toThrow('Get privacy settings failed: Internal Server Error');
  });
});
