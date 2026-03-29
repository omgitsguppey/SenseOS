import { GoogleGenAI } from '@google/genai';
import { useAuthStore } from '../../store/auth';
import { TrackingEngine } from '../os/Biome';
import { Intelligence } from '../os/Intelligence';

// Initialize the Gemini client
// Note: In a production app, you might want to proxy this through a backend
// to keep the API key completely hidden, but for this preview environment,
// we use the provided environment variable.
const apiKey = typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined'
  ? import.meta.env.VITE_GEMINI_API_KEY
  : process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey });

export const MLService = {
  /**
   * Generates a personalized response based on user context and telemetry.
   */
  async generatePersonalizedIntelligence(prompt: string, context?: string): Promise<string> {
    const { privacyConsent, user } = useAuthStore.getState();

    // Privacy check: Ensure personalized intelligence is enabled
    if (!privacyConsent.mlTrainingEnabled) {
      throw new Error('Personalized intelligence is disabled in privacy settings.');
    }

    TrackingEngine.track('ml_inference_start', 'ml_service', 'intelligence');

    try {
      // Phase 10: AI Intelligence Node (App-to-App memory injection)
      const biometrics = Intelligence.generatePredictiveContext();

      const systemInstruction = `You are the core intelligence engine of SenseOS. 
You provide personalized, concise, and helpful responses.
User Name: ${user?.displayName || 'Anonymous'}
Explicit User Context: ${context || 'General OS interaction'}
Pattern of Life (Recent App Transitions): ${biometrics.predictive_context}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      TrackingEngine.track('ml_inference_success', 'ml_service', 'intelligence');
      return response.text || 'I was unable to process that request.';
    } catch (error) {
      console.error('ML Inference failed:', error);
      TrackingEngine.track('error_action', 'ml_service', 'intelligence', { error: String(error) });
      throw error;
    }
  }
};
