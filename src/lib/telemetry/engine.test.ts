import test from 'node:test';
import assert from 'node:assert';

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

test('TrackingEngine Privacy Filtering', async (t) => {
  const defaultState = {
    privacyConsent: { telemetryEnabled: true },
    role: 'user',
    user: { uid: 'test-user' }
  };

  t.beforeEach(() => {
    _getEventQueue().length = 0;
  });

  await t.test('should track normal events when telemetry is enabled', (t) => {
    t.mock.method(useAuthStore, 'getState', () => defaultState);

    TrackingEngine.track('settings_open', 'settings', '/settings');

    const queue = _getEventQueue();
    assert.strictEqual(queue.length, 1, 'Event should be queued');
    assert.strictEqual(queue[0].event_name, 'settings_open');
  });

  await t.test('should NOT track normal events when telemetry is disabled', (t) => {
    t.mock.method(useAuthStore, 'getState', () => ({
      ...defaultState,
      privacyConsent: { telemetryEnabled: false }
    }));

    TrackingEngine.track('settings_open', 'settings', '/settings');

    const queue = _getEventQueue();
    assert.strictEqual(queue.length, 0, 'Event should NOT be queued');
  });

  await t.test('should track critical events even when telemetry is disabled', (t) => {
    t.mock.method(useAuthStore, 'getState', () => ({
      ...defaultState,
      privacyConsent: { telemetryEnabled: false }
    }));

    TrackingEngine.track('error_render', 'system', '/any');

    const queue = _getEventQueue();
    assert.strictEqual(queue.length, 1, 'Critical event should be queued');
    assert.strictEqual(queue[0].event_name, 'error_render');
  });

  await t.test('should identify all critical events', (t) => {
    t.mock.method(useAuthStore, 'getState', () => ({
      ...defaultState,
      privacyConsent: { telemetryEnabled: false }
    }));

    const criticalEvents = ['consent_updated', 'error_render', 'error_action'];

    criticalEvents.forEach((name, i) => {
      TrackingEngine.track(name, 'module', 'route');
      assert.strictEqual(_getEventQueue().length, i + 1, `${name} should be tracked`);
    });
  });
});
