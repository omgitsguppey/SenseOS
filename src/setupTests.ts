import { vi } from 'vitest';

// Mock `firebase-applet-config.json` module correctly for Vitest
vi.mock('../firebase-applet-config.json', () => ({
  default: {
    projectId: 'test-project',
    storageBucket: 'test-bucket.appspot.com',
  }
}));