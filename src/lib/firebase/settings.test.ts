import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { syncPrivacyConsent } from './settings';
import { auth } from './config';

describe('syncPrivacyConsent error paths', () => {
  let originalFetch: typeof globalThis.fetch;
  let originalCurrentUser: any;

  beforeEach(() => {
    mock.restoreAll();
    originalFetch = globalThis.fetch;
    originalCurrentUser = auth.currentUser;
    // Suppress console.error during tests to avoid noise
    mock.method(console, 'error', () => {});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    Object.defineProperty(auth, 'currentUser', { value: originalCurrentUser, configurable: true });
  });

  it('should throw an error if not authenticated', async () => {
    Object.defineProperty(auth, 'currentUser', { value: null, configurable: true });

    await assert.rejects(
      async () => await syncPrivacyConsent('test-uid'),
      { message: 'Not authenticated' }
    );
  });

  it('should throw an error if fetch response is not ok', async () => {
    Object.defineProperty(auth, 'currentUser', {
      value: { getIdToken: async () => 'mock-token' },
      configurable: true
    });

    globalThis.fetch = mock.fn(async () => ({
      ok: false,
      text: async () => 'Internal Server Error'
    })) as any;

    await assert.rejects(
      async () => await syncPrivacyConsent('test-uid'),
      { message: 'Get privacy settings failed: Internal Server Error' }
    );
  });
});
