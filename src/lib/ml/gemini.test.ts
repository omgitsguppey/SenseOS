import test from 'node:test';
import assert from 'node:assert';

(global as any).requestIdleCallback = (cb: any) => {};

// Mock API key so it does not fallback to google application default credentials
process.env.GEMINI_API_KEY = 'test';

test('MLService tests', async (t) => {
  globalThis.fetch = t.mock.fn(async (url: any, init: any) => {
    let isError = false;
    try {
      const body = JSON.parse(init.body);
      if (body.contents[0].parts[0].text === 'ThrowError') isError = true;
    } catch(e) {}

    if (isError) {
      return {
        ok: false,
        status: 400,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ error: { message: 'Mocked AI Error', code: 400 } }),
      } as unknown as Response;
    }

    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({
        candidates: [
          {
            content: { parts: [{ text: 'Mocked AI Response' }] },
          },
        ],
      }),
    } as unknown as Response;
  });

  const { MLService } = await import('./gemini');
  const { useAuthStore } = await import('../../store/auth');
  const { TrackingEngine } = await import('../os/Biome');
  const { Intelligence } = await import('../os/Intelligence');

  const trackMock = t.mock.method(TrackingEngine, 'track');
  trackMock.mock.mockImplementation(() => {});

  const getContextMock = t.mock.method(Intelligence, 'generatePredictiveContext');
  getContextMock.mock.mockImplementation(() => ({
    predictive_context: 'mocked context',
  }));

  const getStateMock = t.mock.method(useAuthStore, 'getState');

  await t.test('successful generation', async () => {
    trackMock.mock.resetCalls();

    getStateMock.mock.mockImplementation(() => ({
      user: { displayName: 'TestUser', uid: '123' },
      privacyConsent: { mlTrainingEnabled: true, telemetryEnabled: true },
    }));

    const response = await MLService.generatePersonalizedIntelligence('Hello', 'Test context');

    assert.strictEqual(response, 'Mocked AI Response');
    assert.strictEqual(trackMock.mock.calls.length, 2);
    assert.strictEqual(trackMock.mock.calls[0].arguments[0], 'ml_inference_start');
    assert.strictEqual(trackMock.mock.calls[1].arguments[0], 'ml_inference_success');
  });

  await t.test('disabled privacy consent throws error', async () => {
    trackMock.mock.resetCalls();

    getStateMock.mock.mockImplementation(() => ({
      user: { displayName: 'TestUser', uid: '123' },
      privacyConsent: { mlTrainingEnabled: false, telemetryEnabled: true },
    }));

    await assert.rejects(
      () => MLService.generatePersonalizedIntelligence('Hello'),
      { message: 'Personalized intelligence is disabled in privacy settings.' }
    );
    assert.strictEqual(trackMock.mock.calls.length, 0);
  });

  await t.test('handles AI error and tracks it', async () => {
    trackMock.mock.resetCalls();

    getStateMock.mock.mockImplementation(() => ({
      user: { displayName: 'TestUser', uid: '123' },
      privacyConsent: { mlTrainingEnabled: true, telemetryEnabled: true },
    }));

    await assert.rejects(
      () => MLService.generatePersonalizedIntelligence('ThrowError'),
      /Mocked AI Error/
    );

    assert.strictEqual(trackMock.mock.calls.length, 2);
    assert.strictEqual(trackMock.mock.calls[0].arguments[0], 'ml_inference_start');
    assert.strictEqual(trackMock.mock.calls[1].arguments[0], 'error_action');
    assert.strictEqual(trackMock.mock.calls[1].arguments[2], 'intelligence');
    assert.ok(trackMock.mock.calls[1].arguments[3].error.includes('Mocked AI Error'));
  });

});

test('cleanup', () => {
  setTimeout(() => process.exit(0), 10);
});
