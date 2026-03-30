import { test, describe, beforeEach, vi, expect } from 'vitest';

// Override setInterval globally BEFORE any imports
const originalSetInterval = global.setInterval;
global.setInterval = ((fn: any, ms: any) => {
  return originalSetInterval(fn, ms).unref();
}) as any;

// Mock window and navigator for the node environment
(global as any).window = {
  matchMedia: () => ({ matches: false }),
  navigator: { standalone: false }
};

Object.defineProperty(global, 'navigator', {
  value: { userAgent: 'node' },
  writable: true
});

// Force NODE_ENV to test to allow _getEventQueue to work.
process.env.NODE_ENV = 'test';

import { TrackingEngine, _getEventQueue } from './engine';
import { useAuthStore } from '../../store/auth';

describe('TrackingEngine Privacy Filtering', () => {
  const defaultState = {
    privacyConsent: { telemetryEnabled: true },
    role: 'user',
    user: { uid: 'test-user' }
  };

  beforeEach(() => {
    _getEventQueue().length = 0;
    vi.restoreAllMocks();
  });

  test('should track normal events when telemetry is enabled', () => {
    vi.spyOn(useAuthStore, 'getState').mockReturnValue(defaultState as any);

    TrackingEngine.track('settings_open', 'settings', '/settings');

    const queue = _getEventQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].event_name).toBe('settings_open');
  });

  test('should NOT track normal events when telemetry is disabled', () => {
    vi.spyOn(useAuthStore, 'getState').mockReturnValue({
      ...defaultState,
      privacyConsent: { telemetryEnabled: false }
    } as any);

    TrackingEngine.track('settings_open', 'settings', '/settings');

    const queue = _getEventQueue();
    expect(queue.length).toBe(0);
  });

  test('should track critical events even when telemetry is disabled', () => {
    vi.spyOn(useAuthStore, 'getState').mockReturnValue({
      ...defaultState,
      privacyConsent: { telemetryEnabled: false }
    } as any);

    TrackingEngine.track('error_render', 'system', '/any');

    const queue = _getEventQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].event_name).toBe('error_render');
  });

  test('should identify all critical events', () => {
    vi.spyOn(useAuthStore, 'getState').mockReturnValue({
      ...defaultState,
      privacyConsent: { telemetryEnabled: false }
    } as any);

    const criticalEvents = ['consent_updated', 'error_render', 'error_action'];

    criticalEvents.forEach((name, i) => {
      TrackingEngine.track(name, 'module', 'route');
      expect(_getEventQueue().length).toBe(i + 1);
    });
  });
});
