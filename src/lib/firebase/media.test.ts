import { test, vi, expect, beforeEach, describe } from 'vitest';

const mocks = vi.hoisted(() => ({
  uploadMediaFn: vi.fn(),
  mockAuth: { currentUser: { uid: 'user123' } }
}));

vi.mock('./config', () => ({
  auth: mocks.mockAuth,
  db: {},
  functions: {},
  storage: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  doc: vi.fn(),
  deleteDoc: vi.fn(),
  updateDoc: vi.fn(),
  addDoc: vi.fn(),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => mocks.uploadMediaFn)
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(),
}));

// Setup globals
global.File = class File {
  name: string;
  type: string;
  constructor(bits: any[], name: string, options?: any) {
    this.name = name;
    this.type = options?.type || '';
  }
} as any;

global.FileReader = class FileReader {
  onload: any;
  onerror: any;
  result: any;
  readAsDataURL(file: any) {
    this.result = 'data:image/png;base64,mocked';
    setTimeout(() => {
        if(this.onload) this.onload();
    }, 0);
  }
} as any;

import { uploadMedia } from './media';

describe('MediaUpload Tests', () => {
  beforeEach(() => {
    mocks.uploadMediaFn.mockResolvedValue({ data: { id: 'mocked-id' } });
    mocks.mockAuth.currentUser = { uid: 'user123' };
  });

  test('uploadMedia happy path', async () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    const progressUpdates: number[] = [];

    const id = await uploadMedia('user123', file, (progress) => {
        progressUpdates.push(progress);
    }, {});

    expect(id).toBe('mocked-id');
    expect(progressUpdates).toEqual([10, 30, 50, 100]);
  });

  test('uploadMedia throws error when user is not authenticated', async () => {
    mocks.mockAuth.currentUser = null as any;
    const file = new File([''], 'test.png', { type: 'image/png' });

    await expect(
        uploadMedia('user123', file, () => {}, {})
    ).rejects.toThrow('User is not authenticated');
  });

  test('uploadMedia throws error when cloud function fails', async () => {
    mocks.uploadMediaFn.mockRejectedValue(new Error('Cloud function failed'));
    const file = new File([''], 'test.png', { type: 'image/png' });

    await expect(
        uploadMedia('user123', file, () => {}, {})
    ).rejects.toThrow('Cloud function failed');
  });
});
