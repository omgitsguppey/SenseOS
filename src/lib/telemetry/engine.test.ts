
import test from 'node:test';
import assert from 'node:assert';
import { TrackingEngine, _getEventQueue } from './engine.ts';
import { useAuthStore } from '../../store/auth.ts';
import * as firebaseAnalytics from 'firebase/analytics';

test('TrackingEngine Privacy Filtering', async (t) => {
  // Use Node.js built-in mocking for more robust tests
  const getStateMock = t.mock.method(useAuthStore, 'getState');
  const logEventMock = t.mock.method(firebaseAnalytics, 'logEvent');

  const defaultState = {
    privacyConsent: { telemetryEnabled: true },
    role: 'user',
    user: { uid: 'test-user' }
  };

  t.beforeEach(() => {
    getStateMock.mock.resetCalls();
    logEventMock.mock.resetCalls();
    _getEventQueue().length = 0;

    // Set default return value
    getStateMock.mock.mockImplementation(() => defaultState);
  });

  await t.test('should track normal events when telemetry is enabled', () => {
    TrackingEngine.track('settings_open', 'settings', '/settings');

    const queue = _getEventQueue();
    assert.strictEqual(queue.length, 1, 'Event should be queued');
    assert.strictEqual(queue[0].event_name, 'settings_open');
    assert.strictEqual(logEventMock.mock.callCount(), 1, 'Should log to Firebase Analytics');
  });

  await t.test('should NOT track normal events when telemetry is disabled', () => {
    getStateMock.mock.mockImplementation(() => ({
      ...defaultState,
      privacyConsent: { telemetryEnabled: false }
    }));

    TrackingEngine.track('settings_open', 'settings', '/settings');

    const queue = _getEventQueue();
    assert.strictEqual(queue.length, 0, 'Event should NOT be queued');
    assert.strictEqual(logEventMock.mock.callCount(), 0, 'Should NOT log to Firebase Analytics');
  });

  await t.test('should track critical events even when telemetry is disabled', () => {
    getStateMock.mock.mockImplementation(() => ({
      ...defaultState,
      privacyConsent: { telemetryEnabled: false }
    }));

    TrackingEngine.track('error_render', 'system', '/any');

    const queue = _getEventQueue();
    assert.strictEqual(queue.length, 1, 'Critical event should be queued');
    assert.strictEqual(queue[0].event_name, 'error_render');
    assert.strictEqual(logEventMock.mock.callCount(), 0, 'Should NOT log to Firebase Analytics when consent is false');
  });

  await t.test('should identify all critical events', () => {
    getStateMock.mock.mockImplementation(() => ({
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
