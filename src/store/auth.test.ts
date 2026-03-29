import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock config early to avoid any firebase init
vi.mock('../lib/firebase/config', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-123'
    }
  },
  app: {},
  db: {},
  storage: {},
  rtdb: {},
  functions: {}
}));

// Mock settings to avoid real network calls
const mockUpdatePrivacyConsent = vi.fn();
const mockUpdateAppPreferences = vi.fn();

vi.mock('../lib/firebase/settings', () => ({
  updatePrivacyConsent: (...args: any[]) => mockUpdatePrivacyConsent(...args),
  updateAppPreferences: (...args: any[]) => mockUpdateAppPreferences(...args),
  defaultConsent: { telemetryEnabled: true, mlTrainingEnabled: true, updatedAt: '123' },
  defaultPreferences: { theme: 'system', reducedMotion: false, updatedAt: '123' }
}));

import { useAuthStore } from './auth';

describe('Auth Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: { uid: 'test-user-123' },
      privacyConsent: { telemetryEnabled: true, mlTrainingEnabled: true, updatedAt: '123' },
    });
  });

  it('optimistic update updates state immediately and calls firebase', async () => {
    mockUpdatePrivacyConsent.mockResolvedValueOnce(undefined);

    const store = useAuthStore.getState();
    const promise = store.updateConsent({ telemetryEnabled: false });

    // Assert optimistic update (sync)
    expect(useAuthStore.getState().privacyConsent.telemetryEnabled).toBe(false);

    await promise;
    expect(mockUpdatePrivacyConsent).toHaveBeenCalledWith('test-user-123', { telemetryEnabled: false });
  });

  it('failure case reverts state', async () => {
    mockUpdatePrivacyConsent.mockRejectedValueOnce(new Error('Internal Server Error'));
    // Supress console.error for this specific test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const store = useAuthStore.getState();
    const promise = store.updateConsent({ telemetryEnabled: false });

    // Optimistically changed
    expect(useAuthStore.getState().privacyConsent.telemetryEnabled).toBe(false);

    await promise;

    // Reverted back to true
    expect(useAuthStore.getState().privacyConsent.telemetryEnabled).toBe(true);

    consoleSpy.mockRestore();
  });

  it('no user case does not call firebase', async () => {
    useAuthStore.setState({ user: null });

    const store = useAuthStore.getState();
    await store.updateConsent({ telemetryEnabled: false });

    // Optimistically changed
    expect(useAuthStore.getState().privacyConsent.telemetryEnabled).toBe(false);

    // Not called because no user
    expect(mockUpdatePrivacyConsent).not.toHaveBeenCalled();
  });
});
