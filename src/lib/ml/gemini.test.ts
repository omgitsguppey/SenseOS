import { test, describe, beforeEach, vi, expect } from 'vitest';
import { useAuthStore } from '../../store/auth';
import { TrackingEngine } from '../os/Biome';
import { Intelligence } from '../os/Intelligence';
import { MLService } from './gemini';

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: vi.fn(async ({ contents }) => {
        if (contents === 'ThrowError') {
          throw new Error('Mocked AI Error');
        }
        return { text: 'Mocked AI Response' };
      })
    };
  }
}));

describe('MLService.generatePersonalizedIntelligence', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('throws error if mlTrainingEnabled is false', async () => {
    vi.spyOn(useAuthStore, 'getState').mockReturnValue({
      privacyConsent: { mlTrainingEnabled: false },
      user: null
    } as any);

    const trackMock = vi.spyOn(TrackingEngine, 'track').mockImplementation(() => {});

    await expect(
      MLService.generatePersonalizedIntelligence('test prompt')
    ).rejects.toThrow('Personalized intelligence is disabled in privacy settings.');

    expect(trackMock).not.toHaveBeenCalled();
  });

  test('returns response and tracks success on happy path', async () => {
    vi.spyOn(useAuthStore, 'getState').mockReturnValue({
      privacyConsent: { mlTrainingEnabled: true },
      user: { displayName: 'TestUser' }
    } as any);

    vi.spyOn(Intelligence, 'generatePredictiveContext').mockReturnValue({
      predictive_context: 'Test Context'
    } as any);

    const trackMock = vi.spyOn(TrackingEngine, 'track').mockImplementation(() => {});

    const result = await MLService.generatePersonalizedIntelligence('test prompt', 'explicit context');

    expect(result).toBe('Mocked AI Response');
    expect(trackMock).toHaveBeenCalledTimes(2);
    expect(trackMock.mock.calls[0]).toEqual(['ml_inference_start', 'ml_service', 'intelligence']);
    expect(trackMock.mock.calls[1]).toEqual(['ml_inference_success', 'ml_service', 'intelligence']);
  });

  test('tracks error and throws if generateContent fails', async () => {
    vi.spyOn(useAuthStore, 'getState').mockReturnValue({
      privacyConsent: { mlTrainingEnabled: true },
      user: null
    } as any);

    vi.spyOn(Intelligence, 'generatePredictiveContext').mockReturnValue({
      predictive_context: 'Test Context'
    } as any);

    const trackMock = vi.spyOn(TrackingEngine, 'track').mockImplementation(() => {});

    await expect(
      MLService.generatePersonalizedIntelligence('ThrowError')
    ).rejects.toThrow('Mocked AI Error');

    expect(trackMock).toHaveBeenCalledTimes(2);
    expect(trackMock.mock.calls[0]).toEqual(['ml_inference_start', 'ml_service', 'intelligence']);
    expect(trackMock.mock.calls[1][0]).toBe('error_action');
    expect(trackMock.mock.calls[1][1]).toBe('ml_service');
    expect(trackMock.mock.calls[1][2]).toBe('intelligence');
  });
});
