import test from 'node:test';
import assert from 'node:assert';
import { Biome, TrackingEngine } from './Biome.ts';
import { MetricKit } from './MetricKit.ts';
import { useAuthStore } from '../../store/auth.ts';

test('TrackingEngine Privacy Filtering', async (t) => {
  const getStateMock = t.mock.method(useAuthStore, 'getState');
  const logDiagnosticMock = t.mock.method(MetricKit, 'logDiagnostic');

  const defaultState = {
    privacyConsent: { telemetryEnabled: true },
    user: { uid: 'test-user' }
  };

  t.beforeEach(() => {
    getStateMock.mock.resetCalls();
    logDiagnosticMock.mock.resetCalls();
    getStateMock.mock.mockImplementation(() => defaultState);
  });

  await t.test('should track normal events when telemetry is enabled', () => {
    const streamsBefore = Biome.getRecentStreams().length;
    TrackingEngine.track('settings_open', 'settings', '/settings');
    const streamsAfter = Biome.getRecentStreams().length;

    assert.strictEqual(streamsAfter, streamsBefore + 1, 'Event should be queued to Biome streams');

    const recent = Biome.getRecentStreams(1)[0];
    assert.strictEqual(recent.stream_type, 'IntentStream');
    assert.strictEqual(recent.payload.action, 'settings_open');
    assert.strictEqual(logDiagnosticMock.mock.callCount(), 0, 'Should not call MetricKit for non-critical event');
  });

  await t.test('should NOT track normal events when telemetry is disabled', () => {
    getStateMock.mock.mockImplementation(() => ({
      ...defaultState,
      privacyConsent: { telemetryEnabled: false }
    }));

    const streamsBefore = Biome.getRecentStreams().length;
    TrackingEngine.track('settings_open_disabled', 'settings', '/settings');
    const streamsAfter = Biome.getRecentStreams().length;

    assert.strictEqual(streamsAfter, streamsBefore, 'Event should NOT be queued when telemetry is disabled');
    assert.strictEqual(logDiagnosticMock.mock.callCount(), 0, 'Should not call MetricKit');
  });

  await t.test('should track critical events (e.g. error_) regardless of telemetry setting', () => {
    getStateMock.mock.mockImplementation(() => ({
      ...defaultState,
      privacyConsent: { telemetryEnabled: false }
    }));

    TrackingEngine.track('error_render', 'system', '/any');

    assert.strictEqual(logDiagnosticMock.mock.callCount(), 1, 'Should call MetricKit for error_ events');

    const callArgs = logDiagnosticMock.mock.calls[0].arguments;
    assert.strictEqual(callArgs[0], 'crash');
    assert.strictEqual(callArgs[1].errorAction, 'error_render');
  });

  await t.test('should track crash_ events to MetricKit', () => {
    TrackingEngine.track('crash_startup', 'system', '/start');
    assert.strictEqual(logDiagnosticMock.mock.callCount(), 1, 'Should route crash_ to MetricKit');
  });

  await t.test('should track memory_ events to MetricKit', () => {
    TrackingEngine.track('memory_warning', 'system', '/start');
    assert.strictEqual(logDiagnosticMock.mock.callCount(), 1, 'Should route memory_ to MetricKit');
  });

  t.after(async () => {
    // 1. Clean up Firebase connections. Firebase Auth keeps the node process alive if an app exists.
    const firebase = await import('firebase/app');
    for (const app of firebase.getApps()) {
      await firebase.deleteApp(app);
    }
  });
});
