import { test, describe, beforeEach, afterEach, vi, expect } from 'vitest';
import { useAuthStore } from '../../store/auth';
import { TrackingEngine } from '../os/Biome';
import { Intelligence } from '../os/Intelligence';
import { MLService } from './gemini';
import { GoogleGenAI } from '@google/genai';

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

    expect(result).toBe('Mocked response');
    expect(trackMock).toHaveBeenCalledTimes(2);
    expect(trackMock.mock.calls[0]).toEqual(['ml_inference_start', 'ml_service', 'intelligence']);
    expect(trackMock.mock.calls[1]).toEqual(['ml_inference_success', 'ml_service', 'intelligence']);

    // We can't directly check the mock calls on the generated class inside the module
    // without mocking it completely. Oh wait, we just set `models.generateContent` to a vi.fn().
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
      MLService.generatePersonalizedIntelligence('fail prompt')
    ).rejects.toThrow('API Error');

    expect(trackMock).toHaveBeenCalledTimes(2);
    expect(trackMock.mock.calls[0]).toEqual(['ml_inference_start', 'ml_service', 'intelligence']);
    expect(trackMock.mock.calls[1][0]).toBe('error_action');
    expect(trackMock.mock.calls[1][1]).toBe('ml_service');
    expect(trackMock.mock.calls[1][2]).toBe('intelligence');
  });
});
