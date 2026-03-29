import test, { mock } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'node:events';

// Create a mock auth object
const mockAuth = {
  currentUser: { uid: 'user123' }
};

const mockFunctions = {};

// Mock config module completely to avoid initializing Firebase
mock.module('./config', {
  namedExports: {
    auth: mockAuth,
    db: {},
    functions: mockFunctions,
    storage: {}
  }
});

mock.module('firebase/firestore', {
  namedExports: {
    collection: mock.fn(),
    query: mock.fn(),
    where: mock.fn(),
    onSnapshot: mock.fn(),
    doc: mock.fn(),
    deleteDoc: mock.fn(),
    updateDoc: mock.fn(),
    addDoc: mock.fn(),
  }
});

let _mockUploadMediaFunction = mock.fn(() => Promise.resolve({ data: { id: 'mocked-id' } }));
mock.module('firebase/functions', {
  namedExports: {
    httpsCallable: mock.fn(() => _mockUploadMediaFunction)
  }
});

mock.module('firebase/storage', {
    namedExports: {
        ref: mock.fn(),
        uploadBytesResumable: mock.fn(),
        getDownloadURL: mock.fn(),
    }
});

// Setup globals for File and FileReader
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


test('uploadMedia happy path', async () => {
    // reset for this test
    _mockUploadMediaFunction = mock.fn(() => Promise.resolve({ data: { id: 'mocked-id' } }));

    const { uploadMedia } = await import('./media.ts');

    const file = new File([''], 'test.png', { type: 'image/png' });
    const progressUpdates: number[] = [];

    const id = await uploadMedia('user123', file, (progress) => {
        progressUpdates.push(progress);
    }, {});

    assert.strictEqual(id, 'mocked-id');
    assert.deepStrictEqual(progressUpdates, [10, 30, 50, 100]);
});

test('uploadMedia throws error when user is not authenticated', async () => {
    // Temporarily unset currentUser
    const originalUser = mockAuth.currentUser;
    mockAuth.currentUser = null as any;

    const { uploadMedia } = await import('./media.ts');
    const file = new File([''], 'test.png', { type: 'image/png' });

    await assert.rejects(
        async () => await uploadMedia('user123', file, () => {}, {}),
        (err: Error) => err.message === 'User is not authenticated'
    );

    // Restore
    mockAuth.currentUser = originalUser;
});

test('uploadMedia throws error when cloud function fails', async () => {
    const { uploadMedia } = await import('./media.ts');

    // Override the mock implementation for this test
    _mockUploadMediaFunction = mock.fn(() => Promise.reject(new Error('Cloud function failed')));

    const file = new File([''], 'test.png', { type: 'image/png' });

    await assert.rejects(
        async () => await uploadMedia('user123', file, () => {}, {}),
        (err: Error) => err.message === 'Cloud function failed'
    );
});
