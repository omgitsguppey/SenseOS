import { vi } from 'vitest';
globalThis.requestIdleCallback = vi.fn((cb) => setTimeout(cb, 1) as unknown as number);
process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = 'test-key';

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models: any;
      constructor() {
        this.models = {
          generateContent: vi.fn().mockImplementation(async (args) => {
            if (args.contents === 'fail prompt') {
              throw new Error('API Error');
            }
            return { text: 'Mocked response' };
          })
        };
      }
    }
  };
});
